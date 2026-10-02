import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PickupRequest,
  RequestStatus,
  SeverityLevel,
  WasteCategory,
} from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityBreakdownModal } from '../common/PriorityBreakdownModal';
import { RequestModal } from './RequestModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { RequestDetailsModal } from './RequestDetailsModal';
import {
  Plus,
  Filter,
  Search,
  MapPin,
  Trash2,
  Edit2,
  Clock,
  ArrowUpDown,
  AlertCircle,
  CheckCircle2,
  Truck,
  Eye,
  Layers,
  Sparkles,
  Camera,
  User,
} from 'lucide-react';

const CATEGORY_COLORS: Record<WasteCategory, { bg: string; text: string; border: string }> = {
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  Plastic: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Organic: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Electronic: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Hazardous: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
};

const SEVERITY_COLORS: Record<SeverityLevel, { bg: string; text: string }> = {
  Low: { bg: 'bg-slate-100', text: 'text-slate-700' },
  Medium: { bg: 'bg-blue-100', text: 'text-blue-700' },
  High: { bg: 'bg-amber-100', text: 'text-amber-800' },
  Critical: { bg: 'bg-rose-100', text: 'text-rose-800' },
};

export const RequestsView: React.FC = () => {
  const {
    requests,
    teams,
    searchQuery,
    setSearchQuery,
    addRequest,
    updateRequest,
    deleteRequest,
    updateRequestStatus,
    focusOnMap,
  } = useApp();

  // Filters state
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priority-desc' | 'priority-asc' | 'waiting-desc' | 'quantity-desc'>('priority-desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<PickupRequest | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<PickupRequest | null>(null);
  const [breakdownRequest, setBreakdownRequest] = useState<PickupRequest | null>(null);
  const [viewingDetailRequest, setViewingDetailRequest] = useState<PickupRequest | null>(null);

  // Filtered and sorted requests
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        // Search query
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchId = req.id.toLowerCase().includes(q);
          const matchLoc = req.locationName.toLowerCase().includes(q);
          const matchAddr = req.address.toLowerCase().includes(q);
          const matchCat = req.category.toLowerCase().includes(q);
          const matchNotes = req.notes.toLowerCase().includes(q);
          const matchReqName = req.requesterName?.toLowerCase().includes(q);
          if (!matchId && !matchLoc && !matchAddr && !matchCat && !matchNotes && !matchReqName) return false;
        }

        // Status filter
        if (statusFilter !== 'All' && req.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'All' && req.category !== categoryFilter) return false;

        // Severity filter
        if (severityFilter !== 'All' && req.severity !== severityFilter) return false;

        // Priority tier filter
        if (priorityFilter !== 'All' && req.priorityLevel !== priorityFilter) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority-desc') return b.priorityScore - a.priorityScore;
        if (sortBy === 'priority-asc') return a.priorityScore - b.priorityScore;
        if (sortBy === 'waiting-desc') return b.waitingHours - a.waitingHours;
        if (sortBy === 'quantity-desc') return b.quantityKg - a.quantityKg;
        return 0;
      });
  }, [requests, searchQuery, statusFilter, categoryFilter, severityFilter, priorityFilter, sortBy]);

  const handleCreateSubmit = (data: any) => {
    addRequest(data);
  };

  const handleEditSubmit = (data: any) => {
    if (editingRequest) {
      updateRequest(editingRequest.id, data);
      setEditingRequest(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingRequest) {
      deleteRequest(deletingRequest.id);
      setDeletingRequest(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Mumbai Pickup Requests
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Citizen Portal & Ward Dispatch
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage citizen-submitted garbage complaints, inspect photo evidence, and track SLA resolution.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Mumbai Request</span>
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="General">General</option>
              <option value="Plastic">Plastic</option>
              <option value="Organic">Organic</option>
              <option value="Electronic">Electronic</option>
              <option value="Hazardous">Hazardous</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical (100)</option>
              <option value="High">High (75)</option>
              <option value="Medium">Medium (45)</option>
              <option value="Low">Low (20)</option>
            </select>
          </div>

          {/* Priority Tier Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">Priority Tier:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Tiers</option>
              <option value="Critical">Critical (80–100)</option>
              <option value="High">High (60–79)</option>
              <option value="Medium">Medium (35–59)</option>
              <option value="Low">Low (0–34)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="priority-desc">Sort: Priority Score (High → Low)</option>
              <option value="priority-asc">Sort: Priority Score (Low → High)</option>
              <option value="waiting-desc">Sort: Waiting Hours (Longest First)</option>
              <option value="quantity-desc">Sort: Waste Quantity (Largest First)</option>
            </select>
          </div>
        </div>

        {/* Count summary bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-700">{filteredRequests.length}</strong> of{' '}
            <strong className="text-slate-700">{requests.length}</strong> total Mumbai requests
          </span>
          {(statusFilter !== 'All' || categoryFilter !== 'All' || severityFilter !== 'All' || priorityFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setStatusFilter('All');
                setCategoryFilter('All');
                setSeverityFilter('All');
                setPriorityFilter('All');
                setSearchQuery('');
              }}
              className="text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Requests Data Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Request ID</th>
                <th className="py-3.5 px-4">Location & Citizen</th>
                <th className="py-3.5 px-4">Photo Evidence</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Severity</th>
                <th className="py-3.5 px-4">Waiting</th>
                <th className="py-3.5 px-4">Load (kg)</th>
                <th className="py-3.5 px-4">Priority Score</th>
                <th className="py-3.5 px-4">Status & Fleet</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600">No pickup requests found</p>
                      <p className="text-xs text-slate-400">
                        Try modifying your filters or create a new Mumbai request.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const catStyle = CATEGORY_COLORS[req.category] || CATEGORY_COLORS.General;
                  const sevStyle = SEVERITY_COLORS[req.severity] || SEVERITY_COLORS.Medium;
                  const assignedTeam = teams.find((t) => t.id === req.assignedTeamId);
                  const hasPhotos = req.photos && req.photos.length > 0;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Request ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{req.id}</span>
                          {req.priorityScore >= 80 && req.status === 'Pending' && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Urgent pending attention" />
                          )}
                        </div>
                      </td>

                      {/* Location & Citizen Requester */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 truncate" title={req.locationName}>
                          {req.locationName}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-600">{req.requesterName}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400 truncate">{req.address}</span>
                        </div>
                      </td>

                      {/* Photo Evidence Column */}
                      <td className="py-3.5 px-4">
                        {hasPhotos ? (
                          <button
                            type="button"
                            onClick={() => setViewingDetailRequest(req)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                            title="Click to inspect uploaded evidence photos"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{req.photos?.length} {req.photos?.length === 1 ? 'Photo' : 'Photos'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No photo</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                        >
                          {req.category}
                        </span>
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${sevStyle.bg} ${sevStyle.text}`}
                        >
                          {req.severity}
                        </span>
                      </td>

                      {/* Waiting Time */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span
                            className={
                              req.waitingHours >= 40 && req.status === 'Pending'
                                ? 'text-rose-600 font-bold'
                                : ''
                            }
                          >
                            {req.waitingHours}h
                          </span>
                        </div>
                      </td>

                      {/* Quantity (kg) */}
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {req.quantityKg} kg
                      </td>

                      {/* Priority Score */}
                      <td className="py-3.5 px-4">
                        <PriorityBadge
                          score={req.priorityScore}
                          level={req.priorityLevel}
                          onClick={() => setBreakdownRequest(req)}
                        />
                      </td>

                      {/* Status & Assignment */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <select
                            value={req.status}
                            onChange={(e) =>
                              updateRequestStatus(req.id, e.target.value as RequestStatus, req.assignedTeamId)
                            }
                            className={`text-xs font-semibold rounded-lg px-2 py-1 outline-none border cursor-pointer ${
                              req.status === 'Completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : req.status === 'In Progress'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : req.status === 'Assigned'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Assigned">Assigned</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                          </select>

                          {/* Team assignment dropdown */}
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <Truck className="w-3 h-3 text-slate-400" />
                            <select
                              value={req.assignedTeamId || ''}
                              onChange={(e) => {
                                const newTeamId = e.target.value;
                                if (newTeamId) {
                                  updateRequestStatus(
                                    req.id,
                                    req.status === 'Pending' ? 'Assigned' : req.status,
                                    newTeamId
                                  );
                                } else {
                                  updateRequest(req.id, { assignedTeamId: undefined });
                                }
                              }}
                              className="text-[11px] bg-transparent border-none text-slate-600 hover:text-slate-900 cursor-pointer outline-none font-medium truncate max-w-[130px]"
                            >
                              <option value="">Unassigned</option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name.split('–')[0].trim()}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setViewingDetailRequest(req)}
                            title="View Full Details & Photos"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => focusOnMap(req.latitude, req.longitude, req.id)}
                            title="Focus on Mumbai Map"
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <MapPin className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingRequest(req)}
                            title="Edit request details"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingRequest(req)}
                            title="Delete request"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <RequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <RequestModal
        isOpen={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        onSubmit={handleEditSubmit}
        initialData={editingRequest}
      />

      <DeleteConfirmModal
        request={deletingRequest}
        isOpen={Boolean(deletingRequest)}
        onClose={() => setDeletingRequest(null)}
        onConfirm={handleDeleteConfirm}
      />

      <PriorityBreakdownModal
        request={breakdownRequest}
        onClose={() => setBreakdownRequest(null)}
      />

      <RequestDetailsModal
        request={viewingDetailRequest}
        isOpen={Boolean(viewingDetailRequest)}
        onClose={() => setViewingDetailRequest(null)}
        onEdit={(req) => setEditingRequest(req)}
        onFocusOnMap={(lat, lng, id) => focusOnMap(lat, lng, id)}
        onStatusChange={(id, newStatus) => updateRequestStatus(id, newStatus)}
      />
    </div>
  );
};
