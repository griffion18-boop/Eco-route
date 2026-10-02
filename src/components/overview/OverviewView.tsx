import React from 'react';
import { useApp } from '../../context/AppContext';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Plus,
  Route,
  MapPin,
  Truck,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldAlert,
  ChevronRight,
  Lightbulb,
} from 'lucide-react';

interface OverviewViewProps {
  onOpenCreateModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onOpenCreateModal }) => {
  const {
    requests,
    teams,
    stats,
    notifications,
    recommendations,
    setActiveTab,
    focusOnMap,
    setSelectedRequestId,
  } = useApp();

  // Top pending requests ordered by priority score
  const topPending = requests
    .filter((r) => r.status === 'Pending')
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  const activeTeamsCount = teams.filter((t) => t.status === 'On Route').length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0B1528] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle background graphic glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Brihanmumbai Solid Waste Management Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Mumbai Waste Collection Optimizer
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Monitoring citizen garbage reports, photographic evidence, algorithmic priority scores, and routing municipal collection fleets across Mumbai wards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onOpenCreateModal}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Request</span>
            </button>
            <button
              onClick={() => setActiveTab('optimizer')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-xs border border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <Route className="w-4 h-4 text-emerald-400" />
              <span>Launch Optimizer</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Dynamic from actual live state */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Requests */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Total Requests</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
            {stats.totalRequests}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across 5 municipal districts
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Pending Pickups</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
            {stats.pendingRequests}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.totalPendingWasteKg.toLocaleString()} kg queued
          </div>
        </div>

        {/* Urgent Requests (Score >= 60) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Urgent Pickups</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono">
            {stats.urgentRequests}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Critical (80+) & High (60–79)
          </div>
        </div>

        {/* Completed Pickups */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Completed Pickups</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
            {stats.completedRequests}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {stats.totalWasteCollectedKg.toLocaleString()} kg safely disposed
          </div>
        </div>

        {/* Est. Distance Saved */}
        <div className="col-span-2 sm:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Distance Saved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">
            ~{stats.estimatedDistanceSavedKm} <span className="text-xs font-normal">km</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Cluster routing efficiency
          </div>
        </div>
      </div>

      {/* Middle Section: Urgent Priority Queue & Data-based Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 cols): Top Priority Queue */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Urgent Priority Dispatch Queue
              </h2>
              <p className="text-xs text-slate-400">
                Sorted strictly by transparent 4-factor priority score
              </p>
            </div>
            <button
              onClick={() => setActiveTab('requests')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topPending.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No pending requests. All pickups are currently assigned or completed!
              </div>
            ) : (
              topPending.map((req) => (
                <div
                  key={req.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        req.priorityLevel === 'Critical'
                          ? 'bg-rose-500 animate-pulse'
                          : req.priorityLevel === 'High'
                          ? 'bg-amber-500'
                          : 'bg-blue-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-slate-900">{req.id}</span>
                        <span className="font-semibold text-xs text-slate-800 truncate">
                          {req.locationName}
                        </span>
                        {req.photos && req.photos.length > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                            📷 {req.photos.length}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        By {req.requesterName} • {req.category} • {req.quantityKg} kg • {req.waitingHours}h wait
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <PriorityBadge score={req.priorityScore} level={req.priorityLevel} />
                    <button
                      onClick={() => focusOnMap(req.latitude, req.longitude, req.id)}
                      title="View on Map"
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <MapPin className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right (5 cols): Live Rule-based Recommendations */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                Data-Based Recommendations
              </h2>
              <p className="text-xs text-slate-400">
                Deterministic suggestions generated from current workload
              </p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Rule-Based
            </span>
          </div>

          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                All collection flows optimal. No action recommendations at this time.
              </div>
            ) : (
              recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900">{rec.title}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        rec.urgency === 'high'
                          ? 'bg-rose-100 text-rose-700'
                          : rec.urgency === 'medium'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {rec.metric}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {rec.description}
                  </p>
                  <button
                    onClick={() => {
                      if (rec.actionTab) {
                        setActiveTab(rec.actionTab);
                      }
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Fleet & System Status Strip */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">
              Active Fleet Status: {activeTeamsCount} of {teams.length} Vehicles On Route
            </div>
            <p className="text-[11px] text-slate-400">
              Total collective vehicle capacity: {teams.reduce((s, t) => s + t.maxCapacityKg, 0).toLocaleString()} kg
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('teams')}
          className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
        >
          Manage Fleet Rosters
        </button>
      </div>
    </div>
  );
};
