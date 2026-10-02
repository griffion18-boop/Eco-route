import React, { useState } from 'react';
import { PickupRequest, RequestStatus } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityBreakdownModal } from '../common/PriorityBreakdownModal';
import {
  X,
  MapPin,
  Clock,
  Weight,
  User,
  ShieldAlert,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Truck,
  Edit2,
  ExternalLink,
  Maximize2,
  Info,
} from 'lucide-react';

interface RequestDetailsModalProps {
  request: PickupRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (request: PickupRequest) => void;
  onFocusOnMap?: (lat: number, lng: number, id: string) => void;
  onStatusChange?: (id: string, newStatus: RequestStatus) => void;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
  request,
  isOpen,
  onClose,
  onEdit,
  onFocusOnMap,
  onStatusChange,
}) => {
  const [activePhotoPreview, setActivePhotoPreview] = useState<string | null>(null);
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  if (!isOpen || !request) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-emerald-400">{request.id}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      request.status === 'Completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : request.status === 'In Progress'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : request.status === 'Assigned'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {request.status}
                  </span>
                </div>
                <h3 className="font-semibold text-base text-white truncate max-w-md">
                  {request.locationName}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Requester Profile Banner */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm shadow-xs ring-2 ring-emerald-200">
                  {request.requesterName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    Citizen Requester
                  </span>
                  <span className="text-sm font-bold text-slate-900">{request.requesterName}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Priority Rating
                </span>
                <PriorityBadge
                  score={request.priorityScore}
                  level={request.priorityLevel}
                  onClick={() => setShowFormulaModal(true)}
                />
              </div>
            </div>

            {/* Address & Geographic Coordinates */}
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Mumbai Street Address:</span>
              <p className="text-xs sm:text-sm text-slate-800 font-medium bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                {request.address}
              </p>
              <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500 pt-1">
                <span>Lat: {request.latitude.toFixed(4)}° N</span>
                <span>Long: {request.longitude.toFixed(4)}° E</span>
                {request.sensitiveProximity !== 'None' && (
                  <span className="text-amber-700 font-sans font-semibold">
                    Sensitive Proximity: {request.sensitiveProximity}
                  </span>
                )}
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block font-semibold">Waste Category</span>
                <span className="font-bold text-slate-800">{request.category}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block font-semibold">Severity</span>
                <span className="font-bold text-slate-800">{request.severity} (40% wt)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block font-semibold">Estimated Load</span>
                <span className="font-mono font-bold text-slate-800">{request.quantityKg} kg</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                <span className="text-[10px] text-slate-400 block font-semibold">Waiting Time</span>
                <span className="font-mono font-bold text-slate-800">{request.waitingHours} hours</span>
              </div>
            </div>

            {/* Field Notes */}
            {request.notes && (
              <div>
                <span className="text-xs font-semibold text-slate-500 block mb-1">
                  Requester Description & Notes:
                </span>
                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed">
                  {request.notes}
                </div>
              </div>
            )}

            {/* Uploaded Garbage Photographs Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Uploaded Garbage Photographs ({request.photos?.length || 0})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Click any photo for enlarged inspection
                </span>
              </div>

              {/* Informational note: Evidence reference only, no AI claim */}
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 text-[11px] text-emerald-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                <span>
                  <strong>Field Reference Notice:</strong> Photos serve as visual reference submitted by the resident for collection crew situational awareness prior to arrival. (Categories & quantities are verified on site).
                </span>
              </div>

              {request.photos && request.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {request.photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActivePhotoPreview(photoUrl)}
                      className="group relative aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:border-emerald-500 hover:shadow-md transition-all"
                    >
                      <img
                        src={photoUrl}
                        alt={`Garbage evidence #${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5 drop-shadow-md" />
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 text-[10px] font-mono text-white">
                        Photo #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No photographic evidence uploaded with this request.
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {/* Status changer */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={request.status}
                onChange={(e) => onStatusChange?.(request.id, e.target.value as RequestStatus)}
                className="text-xs font-semibold rounded-lg px-2.5 py-1.5 bg-white border border-slate-200 text-slate-700 outline-none cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {onFocusOnMap && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFocusOnMap(request.latitude, request.longitude, request.id);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Locate on Map</span>
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(request);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Details</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Photo Lightbox Modal */}
      {activePhotoPreview && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setActivePhotoPreview(null)}
        >
          <div
            className="relative max-w-4xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs">
              <span className="font-semibold">
                Garbage Evidence Inspection • {request.locationName}
              </span>
              <button
                onClick={() => setActivePhotoPreview(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/60">
              <img
                src={activePhotoPreview}
                alt="Enlarged waste evidence"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Priority Breakdown Modal */}
      <PriorityBreakdownModal
        request={showFormulaModal ? request : null}
        onClose={() => setShowFormulaModal(false)}
      />
    </>
  );
};
