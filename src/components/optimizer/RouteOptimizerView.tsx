import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { DepotLocation, OptimizedRoute, PickupRequest } from '../../types';
import { generateOptimizedRoute } from '../../utils/routing';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Route,
  Navigation,
  Sliders,
  CheckCircle,
  Truck,
  RotateCcw,
  Clock,
  Sparkles,
  MapPin,
  ChevronRight,
  TrendingDown,
  Layers,
  ArrowRight,
  AlertCircle,
  Fuel,
} from 'lucide-react';

export const RouteOptimizerView: React.FC = () => {
  const { requests, depots, teams, assignRequestsToTeam, setActiveTab } = useApp();

  // Pending and eligible requests
  const eligibleRequests = useMemo(() => {
    return requests.filter((r) => r.status === 'Pending' || r.status === 'Assigned');
  }, [requests]);

  // Selected request IDs for route generation
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    // By default, select all pending or top 6 urgent
    const topPending = requests
      .filter((r) => r.status === 'Pending')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 6)
      .map((r) => r.id);
    return topPending.length > 0 ? topPending : requests.slice(0, 5).map((r) => r.id);
  });

  // Optimizer parameters
  const [selectedDepotId, setSelectedDepotId] = useState<string>(depots[0].id);
  const [roadMultiplier, setRoadMultiplier] = useState<number>(1.35);
  const [truckSpeedKmH, setTruckSpeedKmH] = useState<number>(25);
  const [serviceMinutes, setServiceMinutes] = useState<number>(8);
  const [prioritizeUrgent, setPrioritizeUrgent] = useState<boolean>(true);
  const [returnToDepot, setReturnToDepot] = useState<boolean>(true);

  // Selected team to dispatch route to
  const [dispatchTeamId, setDispatchTeamId] = useState<string>(teams[0]?.id || '');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Calculated route result
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null);

  // Leaflet map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const selectedDepot = depots.find((d) => d.id === selectedDepotId) || depots[0];

  // Helper to re-generate route
  const handleCalculateRoute = () => {
    const targetRequests = requests.filter((r) => selectedIds.includes(r.id));
    const result = generateOptimizedRoute({
      depot: selectedDepot,
      requests: targetRequests,
      roadMultiplier,
      truckAvgSpeedKmH: truckSpeedKmH,
      serviceMinutesPerStop: serviceMinutes,
      prioritizeUrgent,
      returnToDepot,
    });
    setOptimizedRoute(result);
  };

  // Run on mount or when key dependencies change if no route yet
  useEffect(() => {
    handleCalculateRoute();
  }, [selectedDepotId, roadMultiplier, truckSpeedKmH, serviceMinutes, prioritizeUrgent, returnToDepot, selectedIds]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [selectedDepot.latitude, selectedDepot.longitude],
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update map polyline and markers when optimizedRoute changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = routeLayerGroupRef.current;
    if (!map || !layerGroup || !optimizedRoute) return;

    layerGroup.clearLayers();

    const polylineCoords: [number, number][] = [];

    // Add depot start
    polylineCoords.push([optimizedRoute.depot.latitude, optimizedRoute.depot.longitude]);

    const depotIcon = L.divIcon({
      className: 'route-depot-pin',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: #0f172a;
          color: #38bdf8;
          border: 3px solid #38bdf8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-weight: 800;
          font-size: 16px;
        ">
          🏭
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    L.marker([optimizedRoute.depot.latitude, optimizedRoute.depot.longitude], { icon: depotIcon })
      .bindPopup(`<strong>Start / Finish:</strong> ${optimizedRoute.depot.name}`)
      .addTo(layerGroup);

    // Add each stop marker
    optimizedRoute.stops.forEach((stop) => {
      polylineCoords.push([stop.latitude, stop.longitude]);

      const stopIcon = L.divIcon({
        className: 'route-stop-pin',
        html: `
          <div style="
            width: 28px;
            height: 28px;
            background: #059669;
            color: #ffffff;
            border: 2px solid #ffffff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            font-weight: 800;
            font-size: 13px;
            font-family: monospace;
          ">
            ${stop.stopNumber}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([stop.latitude, stop.longitude], { icon: stopIcon })
        .bindPopup(`
          <div style="padding: 8px; font-family: inherit;">
            <div style="font-weight: 800; color: #059669;">Stop #${stop.stopNumber}: ${stop.requestId}</div>
            <div style="font-size: 12px; font-weight: 600; margin-top: 2px;">${stop.locationName}</div>
            <div style="font-size: 11px; color: #64748b;">${stop.quantityKg} kg • Priority: ${stop.priorityScore}</div>
            <div style="font-size: 11px; color: #0284c7; margin-top: 4px;">Leg: +${stop.distanceFromPrevKm} km (~${stop.travelMinutesFromPrev} mins)</div>
          </div>
        `)
        .addTo(layerGroup);
    });

    // If return to depot
    if (optimizedRoute.roundTripToDepot && optimizedRoute.stops.length > 0) {
      polylineCoords.push([optimizedRoute.depot.latitude, optimizedRoute.depot.longitude]);
    }

    // Draw Polyline
    if (polylineCoords.length > 1) {
      const polyline = L.polyline(polylineCoords, {
        color: '#059669', // Emerald line
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(layerGroup);

      // Fit bounds with padding
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [optimizedRoute]);

  // Selection toggles
  const handleSelectAllPending = () => {
    setSelectedIds(eligibleRequests.map((r) => r.id));
  };

  const handleSelectHighPriority = () => {
    setSelectedIds(eligibleRequests.filter((r) => r.priorityScore >= 60).map((r) => r.id));
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const toggleSelectRequest = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Dispatch route to team
  const handleDispatch = () => {
    if (!dispatchTeamId || !optimizedRoute || optimizedRoute.stops.length === 0) return;
    const stopIds = optimizedRoute.stops.map((s) => s.requestId);
    assignRequestsToTeam(dispatchTeamId, stopIds);
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchSuccess(false);
      setActiveTab('teams');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Route className="w-6 h-6 text-emerald-600" />
            Route Optimizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Priority-biased Nearest-Neighbor heuristic multi-stop routing engine.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCalculateRoute}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recalculate Route</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Parameters / Request Selector (Left) & Map + Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration Controls & Request Selector (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Controls Card */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                Routing Configuration
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Active Heuristic
              </span>
            </div>

            {/* Depot Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Depot / Dispatch Origin
              </label>
              <select
                value={selectedDepotId}
                onChange={(e) => setSelectedDepotId(e.target.value)}
                className="w-full text-xs font-medium rounded-xl px-3 py-2 bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
              >
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.isMain ? '(Main)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Road Multiplier Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700">Road Curvature Multiplier</span>
                <span className="font-mono font-bold text-emerald-600">{roadMultiplier.toFixed(2)}×</span>
              </div>
              <input
                type="range"
                min="1.1"
                max="1.6"
                step="0.05"
                value={roadMultiplier}
                onChange={(e) => setRoadMultiplier(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1.10× (Direct Grid)</span>
                <span>1.35× (Standard Urban)</span>
                <span>1.60× (Winding / Hill)</span>
              </div>
            </div>

            {/* Options Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={prioritizeUrgent}
                  onChange={(e) => setPrioritizeUrgent(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 leading-tight">
                  Prioritize High Urgency First
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={returnToDepot}
                  onChange={(e) => setReturnToDepot(e.target.checked)}
                  className="rounded text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700 leading-tight">
                  Return to Depot at Finish
                </span>
              </label>
            </div>
          </div>

          {/* Request Selector Card */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Select Candidate Stops
                </span>
                <p className="text-[11px] text-slate-400">
                  {selectedIds.length} of {eligibleRequests.length} requests selected for routing
                </p>
              </div>

              {/* Quick preset buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleSelectAllPending}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                >
                  All
                </button>
                <button
                  onClick={handleSelectHighPriority}
                  className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                >
                  Urgent Only
                </button>
                <button
                  onClick={handleClearSelection}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-md transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* List of eligible requests with checkboxes */}
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-200/60 rounded-xl">
              {eligibleRequests.map((req) => {
                const isSelected = selectedIds.includes(req.id);
                return (
                  <div
                    key={req.id}
                    onClick={() => toggleSelectRequest(req.id)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by parent div
                        className="rounded text-emerald-600 accent-emerald-600 pointer-events-none"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {req.id}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 truncate">{req.locationName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-slate-500">{req.quantityKg}kg</span>
                      <PriorityBadge
                        score={req.priorityScore}
                        level={req.priorityLevel}
                        showDetailsButton={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Route Map + Ordered Sequence (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Key Metrics Summary Bar */}
          {optimizedRoute && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Est. Route Distance
                </span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {optimizedRoute.totalDistanceKm} km
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({roadMultiplier}× road curvature)
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Est. Collection Time
                </span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {Math.floor(optimizedRoute.totalTimeMinutes / 60)}h {optimizedRoute.totalTimeMinutes % 60}m
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Transit + {serviceMinutes}m/stop
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Total Payload
                </span>
                <span className="text-lg font-extrabold text-slate-900 font-mono">
                  {optimizedRoute.totalWeightKg} kg
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Across {optimizedRoute.stops.length} stops
                </span>
              </div>

              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200 shadow-xs">
                <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-emerald-600" />
                  Est. Distance Saved
                </span>
                <span className="text-lg font-extrabold text-emerald-700 font-mono">
                  +{optimizedRoute.estimatedDistanceSavedKm} km
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">
                  vs unoptimized direct trips
                </span>
              </div>
            </div>
          )}

          {/* Leaflet Map for Route */}
          <div className="relative h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-3 right-3 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-semibold text-slate-600 border border-slate-200 pointer-events-none">
              Green line represents calculated heuristic collection sequence
            </div>
          </div>

          {/* Ordered Stops Manifest & Dispatch action */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Ordered Collection Stops Manifest
                </span>
                <p className="text-[11px] text-slate-400">
                  Sequence calculated using Priority-biased Nearest-Neighbor heuristic
                </p>
              </div>

              {/* Dispatch to Team action */}
              <div className="flex items-center gap-2">
                <select
                  value={dispatchTeamId}
                  onChange={(e) => setDispatchTeamId(e.target.value)}
                  className="text-xs font-medium rounded-lg px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-800 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      Dispatch to: {t.name.split('–')[0].trim()}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleDispatch}
                  disabled={!optimizedRoute || optimizedRoute.stops.length === 0}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>{dispatchSuccess ? 'Dispatched!' : 'Dispatch Route'}</span>
                </button>
              </div>
            </div>

            {/* Stops Table / List */}
            {optimizedRoute && optimizedRoute.stops.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {/* Depot Start Item */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-xs">
                      🏭
                    </span>
                    <div>
                      <span className="font-semibold text-slate-800">
                        Start Departure: {optimizedRoute.depot.name}
                      </span>
                      <p className="text-[11px] text-slate-400">{optimizedRoute.depot.address}</p>
                    </div>
                  </div>
                  <span className="font-mono text-slate-500 text-[11px]">0.0 km • 0 min</span>
                </div>

                {/* Stops */}
                {optimizedRoute.stops.map((stop) => (
                  <div
                    key={stop.requestId}
                    className="p-2.5 rounded-xl border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono shrink-0">
                        {stop.stopNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {stop.requestId}
                          </span>
                          <span className="font-semibold text-slate-700 truncate">
                            {stop.locationName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{stop.address}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px]">
                      <div className="font-semibold text-slate-800">
                        +{stop.distanceFromPrevKm} km (~{stop.travelMinutesFromPrev}m)
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cum: {stop.cumulativeDistanceKm} km • Load: {stop.cumulativeWeightKg} kg
                      </div>
                    </div>
                  </div>
                ))}

                {/* Return to Depot if enabled */}
                {optimizedRoute.roundTripToDepot && (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-sky-400 flex items-center justify-center font-bold text-xs">
                        🏁
                      </span>
                      <div>
                        <span className="font-semibold text-slate-800">
                          End Return: {optimizedRoute.depot.name}
                        </span>
                        <p className="text-[11px] text-slate-400">Return to depot base for offloading</p>
                      </div>
                    </div>
                    <span className="font-mono text-emerald-700 font-bold text-[11px]">
                      Total: {optimizedRoute.totalDistanceKm} km
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No stops selected. Check candidate requests in the left panel to generate a route.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
