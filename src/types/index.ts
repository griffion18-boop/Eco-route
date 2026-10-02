export type WasteCategory = 'General' | 'Plastic' | 'Organic' | 'Electronic' | 'Hazardous';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export type SensitiveProximity = 'None' | 'Moderate' | 'Close' | 'Adjacent';

export type RequestStatus = 'Pending' | 'Assigned' | 'In Progress' | 'Completed';

export interface PriorityBreakdown {
  severityValue: number;
  severityWeighted: number;
  waitingNormalized: number;
  waitingWeighted: number;
  quantityNormalized: number;
  quantityWeighted: number;
  sensitiveNormalized: number;
  sensitiveWeighted: number;
  totalScore: number;
  priorityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface PickupRequest {
  id: string;
  requesterName: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  category: WasteCategory;
  severity: SeverityLevel;
  waitingHours: number;
  quantityKg: number;
  sensitiveProximity: SensitiveProximity;
  sensitiveProximityScore: number;
  priorityScore: number;
  priorityLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  status: RequestStatus;
  assignedTeamId?: string;
  notes: string;
  photos?: string[]; // Evidence photographs uploaded by requester
  createdAt: string;
  completedAt?: string;
}

export interface CollectionTeam {
  id: string;
  name: string;
  vehicleNumber: string;
  vehicleType: string;
  maxCapacityKg: number;
  crew: string[];
  status: 'Available' | 'On Route' | 'Standby' | 'Maintenance';
  assignedRequestIds: string[];
  completedRequestIds: string[];
  activeRouteSummary?: {
    totalDistanceKm: number;
    estimatedMinutes: number;
    stopCount: number;
    depotId: string;
  };
}

export interface DepotLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  isMain: boolean;
}

export interface OptimizedRouteStop {
  stopNumber: number;
  requestId: string;
  requesterName: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  wasteCategory: WasteCategory;
  quantityKg: number;
  priorityScore: number;
  severity: SeverityLevel;
  distanceFromPrevKm: number;
  travelMinutesFromPrev: number;
  cumulativeDistanceKm: number;
  cumulativeMinutes: number;
  cumulativeWeightKg: number;
}

export interface OptimizedRoute {
  depot: DepotLocation;
  stops: OptimizedRouteStop[];
  totalDistanceKm: number;
  totalTimeMinutes: number;
  totalWeightKg: number;
  estimatedDistanceSavedKm: number;
  roadMultiplier: number;
  roundTripToDepot: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  timestamp: string;
  relatedRequestId?: string;
  read: boolean;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  metric: string;
  actionLabel: string;
  actionTab?: 'requests' | 'map' | 'optimizer' | 'teams';
  actionFilter?: string;
}

export type ActiveTab = 'overview' | 'requests' | 'map' | 'optimizer' | 'teams' | 'analytics';

export type AppViewMode = 'operations' | 'citizen';
