import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CollectionTeam, PickupRequest, RequestStatus } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  Truck,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Weight,
  MapPin,
  AlertTriangle,
  UserCheck,
  Plus,
  ArrowRight,
  Info,
  Calendar,
} from 'lucide-react';

export const TeamsView: React.FC = () => {
  const { requests, teams, updateRequestStatus, assignRequestsToTeam, focusOnMap } = useApp();

  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequestIdsToAssign, setSelectedRequestIdsToAssign] = useState<string[]>([]);

  // Eligible unassigned pending requests
  const unassignedPending = requests.filter(
    (r) => (r.status === 'Pending' || !r.assignedTeamId) && r.status !== 'Completed'
  );

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  // Calculate current payload and active pickups for a team
  const getTeamStats = (team: CollectionTeam) => {
    const activeRequests = requests.filter(
      (r) => r.assignedTeamId === team.id && (r.status === 'Assigned' || r.status === 'In Progress')
    );
    const completedRequests = requests.filter(
      (r) => r.assignedTeamId === team.id && r.status === 'Completed'
    );

    const currentLoadKg = activeRequests.reduce((sum, r) => sum + r.quantityKg, 0);
    const capacityPercent = Math.min(100, Math.round((currentLoadKg / team.maxCapacityKg) * 100));

    return {
      activeRequests,
      completedRequests,
      currentLoadKg,
      capacityPercent,
    };
  };

  const handleOpenAssignModal = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSelectedRequestIdsToAssign([]);
    setAssignModalOpen(true);
  };

  const handleConfirmAssignment = () => {
    if (selectedRequestIdsToAssign.length > 0) {
      assignRequestsToTeam(selectedTeam.id, selectedRequestIdsToAssign);
      setAssignModalOpen(false);
    }
  };

  const toggleSelectRequest = (id: string) => {
    setSelectedRequestIdsToAssign((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-emerald-600" />
            Collection Teams & Fleet Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage municipal collection vehicles, payload capacity allocations, and route assignments.
          </p>
        </div>

        {/* Dispatch notice banner */}
        <div className="p-2.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Fleet scheduling via dispatch manifests (Vehicles are not real-time GPS tracked).</span>
        </div>
      </div>

      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {teams.map((team) => {
          const stats = getTeamStats(team);
          const isSelected = team.id === selectedTeamId;

          return (
            <div
              key={team.id}
              onClick={() => setSelectedTeamId(team.id)}
              className={`bg-white rounded-2xl p-5 border transition-all cursor-pointer shadow-xs ${
                isSelected
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-500">{team.vehicleNumber}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    team.status === 'On Route'
                      ? 'bg-blue-100 text-blue-700'
                      : team.status === 'Available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : team.status === 'Standby'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {team.status}
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 truncate" title={team.name}>
                {team.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{team.vehicleType}</p>

              {/* Payload Gauge */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-slate-500 text-[11px]">Payload Load</span>
                  <span className="font-bold text-slate-800">
                    {stats.currentLoadKg} / {team.maxCapacityKg} kg ({stats.capacityPercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stats.capacityPercent >= 85
                        ? 'bg-rose-500'
                        : stats.capacityPercent >= 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${stats.capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Assigned vs Completed Stats */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Active Stops</span>
                  <span className="font-mono font-bold text-slate-800">
                    {stats.activeRequests.length}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Completed</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {stats.completedRequests.length}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Team Detailed Manifest Panel */}
      {selectedTeam && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{selectedTeam.name}</h2>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {selectedTeam.vehicleNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Crew Members: {selectedTeam.crew.join(', ')} • Type: {selectedTeam.vehicleType}
              </p>
            </div>

            <button
              onClick={() => handleOpenAssignModal(selectedTeam.id)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Pickups to this Team</span>
            </button>
          </div>

          {/* Active Assigned Stops Manifest */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Assigned Pickups Manifest (
              {getTeamStats(selectedTeam).activeRequests.length} stops)
            </h3>

            {getTeamStats(selectedTeam).activeRequests.length === 0 ? (
              <div className="p-8 rounded-xl bg-slate-50 text-center text-slate-400 text-xs">
                No active pickups currently assigned to this team. Click "Assign Pickups" to schedule stops.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden">
                {getTeamStats(selectedTeam).activeRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold font-mono shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{req.id}</span>
                          <span className="font-semibold text-slate-800 truncate">
                            {req.locationName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {req.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">{req.address}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-medium text-slate-700">{req.quantityKg} kg</span>
                      <PriorityBadge
                        score={req.priorityScore}
                        level={req.priorityLevel}
                        showDetailsButton={false}
                      />

                      {/* Status quick toggle */}
                      <select
                        value={req.status}
                        onChange={(e) =>
                          updateRequestStatus(req.id, e.target.value as RequestStatus, selectedTeam.id)
                        }
                        className="text-xs font-semibold rounded-lg px-2 py-1 bg-slate-50 border border-slate-200 text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="Assigned">Assigned</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Mark Completed</option>
                      </select>

                      <button
                        onClick={() => focusOnMap(req.latitude, req.longitude, req.id)}
                        title="Locate on Map"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed History by this Team */}
          {getTeamStats(selectedTeam).completedRequests.length > 0 && (
            <div className="space-y-3 pt-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pickups Completed Today by {selectedTeam.name}
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
                {getTeamStats(selectedTeam).completedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 flex items-center justify-between text-xs text-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-mono font-bold">{req.id}</span>
                      <span>{req.locationName}</span>
                      <span className="text-[10px] text-slate-400">({req.category})</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500">{req.quantityKg} kg collected</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for Assigning Requests to Team */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-base">Assign Pickups to {selectedTeam.name}</h3>
                <p className="text-xs text-slate-400">
                  Select candidate requests to add to this vehicle manifest
                </p>
              </div>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-3">
              {unassignedPending.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No unassigned pending requests available. All requests are currently assigned.
                </div>
              ) : (
                unassignedPending.map((req) => {
                  const isChecked = selectedRequestIdsToAssign.includes(req.id);
                  return (
                    <div
                      key={req.id}
                      onClick={() => toggleSelectRequest(req.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-colors flex items-center justify-between ${
                        isChecked
                          ? 'border-emerald-500 bg-emerald-50/40'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-600 accent-emerald-600 pointer-events-none"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {req.id}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              {req.locationName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {req.category} • {req.quantityKg} kg • {req.waitingHours}h wait
                          </p>
                        </div>
                      </div>
                      <PriorityBadge
                        score={req.priorityScore}
                        level={req.priorityLevel}
                        showDetailsButton={false}
                      />
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedRequestIdsToAssign.length} request(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={selectedRequestIdsToAssign.length === 0}
                  onClick={handleConfirmAssignment}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
