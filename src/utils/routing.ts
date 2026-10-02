import { DepotLocation, OptimizedRoute, OptimizedRouteStop, PickupRequest } from '../types';

/**
 * Calculates straight-line distance between two coordinates in kilometers using Haversine formula
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface RouteOptimizerOptions {
  depot: DepotLocation;
  requests: PickupRequest[];
  roadMultiplier?: number; // default 1.35
  truckAvgSpeedKmH?: number; // default 25 km/h in urban
  serviceMinutesPerStop?: number; // default 8 minutes
  prioritizeUrgent?: boolean; // whether priority score influences selection order
  returnToDepot?: boolean; // whether the truck returns to the depot at the end
}

/**
 * Generates an optimized sequence of collection stops using a Priority-biased Nearest-Neighbor heuristic
 */
export function generateOptimizedRoute(options: RouteOptimizerOptions): OptimizedRoute {
  const {
    depot,
    requests,
    roadMultiplier = 1.35,
    truckAvgSpeedKmH = 25,
    serviceMinutesPerStop = 8,
    prioritizeUrgent = true,
    returnToDepot = true,
  } = options;

  if (requests.length === 0) {
    return {
      depot,
      stops: [],
      totalDistanceKm: 0,
      totalTimeMinutes: 0,
      totalWeightKg: 0,
      estimatedDistanceSavedKm: 0,
      roadMultiplier,
      roundTripToDepot: returnToDepot,
    };
  }

  // Clone requests to work with
  const remaining = [...requests];
  const orderedStops: OptimizedRouteStop[] = [];

  let currentLat = depot.latitude;
  let currentLon = depot.longitude;
  let cumulativeDist = 0;
  let cumulativeMins = 0;
  let cumulativeWeight = 0;

  let stopNumber = 1;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let lowestCost = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const straightDist = haversineDistanceKm(currentLat, currentLon, candidate.latitude, candidate.longitude);
      const roadDist = straightDist * roadMultiplier;

      // Priority bias: if prioritizeUrgent is true, discount distance cost by up to 40% for critical score 100
      let cost = roadDist;
      if (prioritizeUrgent) {
        const priorityWeight = candidate.priorityScore / 100; // 0 to 1
        const discountFactor = 1 - priorityWeight * 0.4; // between 0.6 and 1.0
        cost = roadDist * discountFactor;
      }

      if (cost < lowestCost) {
        lowestCost = cost;
        bestIndex = i;
      }
    }

    const [selected] = remaining.splice(bestIndex, 1);
    const straightDist = haversineDistanceKm(currentLat, currentLon, selected.latitude, selected.longitude);
    const legDistanceKm = straightDist * roadMultiplier;
    const legDriveMinutes = (legDistanceKm / truckAvgSpeedKmH) * 60;
    const legTotalMinutes = legDriveMinutes + serviceMinutesPerStop;

    cumulativeDist += legDistanceKm;
    cumulativeMins += legTotalMinutes;
    cumulativeWeight += selected.quantityKg;

    orderedStops.push({
      stopNumber,
      requestId: selected.id,
      requesterName: selected.requesterName || 'Citizen Resident',
      locationName: selected.locationName,
      address: selected.address,
      latitude: selected.latitude,
      longitude: selected.longitude,
      wasteCategory: selected.category,
      quantityKg: selected.quantityKg,
      priorityScore: selected.priorityScore,
      severity: selected.severity,
      distanceFromPrevKm: Number(legDistanceKm.toFixed(2)),
      travelMinutesFromPrev: Math.round(legTotalMinutes),
      cumulativeDistanceKm: Number(cumulativeDist.toFixed(2)),
      cumulativeMinutes: Math.round(cumulativeMins),
      cumulativeWeightKg: cumulativeWeight,
    });

    currentLat = selected.latitude;
    currentLon = selected.longitude;
    stopNumber++;
  }

  // If returning to depot at end
  let returnLegKm = 0;
  let returnLegMins = 0;
  if (returnToDepot && orderedStops.length > 0) {
    const lastStop = orderedStops[orderedStops.length - 1];
    const returnStraight = haversineDistanceKm(lastStop.latitude, lastStop.longitude, depot.latitude, depot.longitude);
    returnLegKm = returnStraight * roadMultiplier;
    returnLegMins = (returnLegKm / truckAvgSpeedKmH) * 60;
    cumulativeDist += returnLegKm;
    cumulativeMins += returnLegMins;
  }

  // Baseline naive distance: separate direct return trips to each pickup from depot
  const naiveTotalDistKm = requests.reduce((acc, req) => {
    const distToDepot = haversineDistanceKm(depot.latitude, depot.longitude, req.latitude, req.longitude) * roadMultiplier;
    return acc + distToDepot * 2; // outbound and inbound
  }, 0);

  const estimatedDistanceSavedKm = Math.max(0, Number((naiveTotalDistKm - cumulativeDist).toFixed(1)));

  return {
    depot,
    stops: orderedStops,
    totalDistanceKm: Number(cumulativeDist.toFixed(1)),
    totalTimeMinutes: Math.round(cumulativeMins),
    totalWeightKg: cumulativeWeight,
    estimatedDistanceSavedKm,
    roadMultiplier,
    roundTripToDepot: returnToDepot,
  };
}
