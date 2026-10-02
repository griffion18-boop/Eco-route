import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { PickupRequest, RequestStatus } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { PriorityBreakdownModal } from '../common/PriorityBreakdownModal';
import { RequestModal } from '../requests/RequestModal';
import {
  RotateCcw,
  Layers,
  MapPin,
  Clock,
  Weight,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Filter,
  Eye,
  Edit2,
  X,
  Camera,
  User,
  Maximize2,
} from 'lucide-react';

// Centered on Mumbai, Maharashtra, India
const DEFAULT_CENTER: [number, number] = [19.0760, 72.8777];
const DEFAULT_ZOOM = 12;

export const LiveMapView: React.FC = () => {
  const {
    requests,
    depots,
    teams,
    focusMapCoords,
    setFocusMapCoords,
    selectedRequestId,
    setSelectedRequestId,
    updateRequestStatus,
    updateRequest,
  } = useApp();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [activeFilter, setActiveFilter] = useState<'All' | 'Pending' | 'Urgent' | 'Completed'>('All');
  const [breakdownRequest, setBreakdownRequest] = useState<PickupRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<PickupRequest | null>(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null);

  // Selected request for sidebar card
  const activeSelectedRequest = requests.find((r) => r.id === selectedRequestId) || null;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    // Add zoom control top right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers on filter / requests change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    markerMapRef.current.clear();

    // 1. Add Depots
    depots.forEach((depot) => {
      const depotIcon = L.divIcon({
        className: 'custom-depot-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 34px;
            height: 34px;
            background: #0f172a;
            color: #38bdf8;
            border: 2px solid #38bdf8;
            border-radius: 50%;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 16px;
          " title="${depot.name}">
            🏭
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const depotMarker = L.marker([depot.latitude, depot.longitude], { icon: depotIcon })
        .bindPopup(`
          <div style="font-family: inherit; padding: 12px; min-width: 200px;">
            <div style="font-size: 10px; font-weight: 700; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">
              ${depot.isMain ? 'Main Municipal Facility' : 'Secondary Transfer Hub'}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${depot.name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
              ${depot.address}
            </div>
            <div style="margin-top: 8px; font-size: 11px; color: #047857; font-weight: 600;">
              Active Dispatch Staging Base
            </div>
          </div>
        `)
        .addTo(layerGroup);
    });

    // 2. Add Pickup Requests based on filter
    const visibleRequests = requests.filter((req) => {
      if (activeFilter === 'Pending') return req.status === 'Pending';
      if (activeFilter === 'Urgent') return req.priorityScore >= 60 && req.status !== 'Completed';
      if (activeFilter === 'Completed') return req.status === 'Completed';
      return true;
    });

    visibleRequests.forEach((req) => {
      const isCompleted = req.status === 'Completed';
      let pinColor = '#10b981'; // emerald for low
      let borderColor = '#059669';

      if (isCompleted) {
        pinColor = '#64748b'; // slate
        borderColor = '#475569';
      } else if (req.priorityLevel === 'Critical') {
        pinColor = '#e11d48'; // rose
        borderColor = '#9f1239';
      } else if (req.priorityLevel === 'High') {
        pinColor = '#f59e0b'; // amber
        borderColor = '#b45309';
      } else if (req.priorityLevel === 'Medium') {
        pinColor = '#3b82f6'; // blue
        borderColor = '#1d4ed8';
      }

      const isSelected = req.id === selectedRequestId;

      const markerHtml = `
        <div style="
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: ${isSelected ? '36px' : '30px'};
          height: ${isSelected ? '36px' : '30px'};
          background-color: ${pinColor};
          border: 2px solid ${isSelected ? '#ffffff' : borderColor};
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) ${isSelected ? ', 0 0 0 4px rgba(16,185,129,0.5)' : ''};
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <div style="
            transform: rotate(45deg);
            color: #ffffff;
            font-size: ${isSelected ? '12px' : '11px'};
            font-weight: 800;
            font-family: monospace;
          ">
            ${isCompleted ? '✓' : req.priorityScore}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-request-pin',
        html: markerHtml,
        iconSize: [isSelected ? 36 : 30, isSelected ? 36 : 30],
        iconAnchor: [isSelected ? 18 : 15, isSelected ? 36 : 30],
        popupAnchor: [0, isSelected ? -36 : -30],
      });

      const marker = L.marker([req.latitude, req.longitude], { icon: customIcon });

      // Popup content
      const popupHtml = `
        <div style="font-family: inherit; padding: 12px; min-width: 220px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-family: monospace; font-weight: 700; font-size: 13px; color: #0f172a;">${req.id}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 9999px; background: ${pinColor}20; color: ${pinColor};">
              Score: ${req.priorityScore} (${req.priorityLevel})
            </span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: #1e293b; margin-top: 4px;">
            ${req.locationName}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
            ${req.address}
          </div>
          <div style="margin-top: 8px; font-size: 11px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            <div><strong style="color: #475569;">Category:</strong> ${req.category}</div>
            <div><strong style="color: #475569;">Severity:</strong> ${req.severity}</div>
            <div><strong style="color: #475569;">Quantity:</strong> ${req.quantityKg} kg</div>
            <div><strong style="color: #475569;">Waiting:</strong> ${req.waitingHours}h</div>
          </div>
          <div style="margin-top: 6px; font-size: 11px; color: #475569;">
            <strong>Status:</strong> <span style="font-weight: 600;">${req.status}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on('click', () => {
        setSelectedRequestId(req.id);
      });

      marker.addTo(layerGroup);
      markerMapRef.current.set(req.id, marker);
    });
  }, [requests, depots, activeFilter, selectedRequestId]);

  // Handle focusMapCoords triggers
  useEffect(() => {
    if (!focusMapCoords || !mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(
      [focusMapCoords.lat, focusMapCoords.lng],
      focusMapCoords.zoom || 16,
      { duration: 1.2 }
    );

    if (selectedRequestId && markerMapRef.current.has(selectedRequestId)) {
      const m = markerMapRef.current.get(selectedRequestId);
      m?.openPopup();
    }
  }, [focusMapCoords, selectedRequestId]);

  const handleResetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 });
    }
    setFocusMapCoords(null);
  };

  return (
    <div className="relative h-[calc(100vh-130px)] min-h-[550px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
      {/* Top Map Controls Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Filter buttons */}
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200/80 flex items-center gap-1">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Markers ({requests.length})
          </button>
          <button
            onClick={() => setActiveFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'Pending'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pending Only
          </button>
          <button
            onClick={() => setActiveFilter('Urgent')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'Urgent'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Urgent (Score ≥ 60)
          </button>
          <button
            onClick={() => setActiveFilter('Completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeFilter === 'Completed'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Completed
          </button>
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          title="Reset map to default city center"
          className="bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset View</span>
        </button>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-xl shadow-lg border border-slate-200/80 max-w-xs sm:max-w-md pointer-events-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5" />
          <span>Map Priority & Symbol Legend</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 ring-2 ring-rose-200 shrink-0" />
            <span className="text-slate-700 font-medium">Critical (80–100)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0" />
            <span className="text-slate-700 font-medium">High (60–79)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-200 shrink-0" />
            <span className="text-slate-700 font-medium">Medium (35–59)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 shrink-0" />
            <span className="text-slate-700 font-medium">Low (0–34)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500 ring-2 ring-slate-200 shrink-0" />
            <span className="text-slate-700 font-medium">Completed (✓)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400 text-[10px] flex items-center justify-center shrink-0">
              🏭
            </span>
            <span className="text-slate-700 font-medium">Municipal Depot</span>
          </div>
        </div>
      </div>

      {/* Selected Request Inspector Drawer (Slide-out right) */}
      {activeSelectedRequest && (
        <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden pointer-events-auto animate-in slide-in-from-right duration-200">
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-sm">{activeSelectedRequest.id}</span>
              <PriorityBadge
                score={activeSelectedRequest.priorityScore}
                level={activeSelectedRequest.priorityLevel}
                onClick={() => setBreakdownRequest(activeSelectedRequest)}
              />
            </div>
            <button
              onClick={() => setSelectedRequestId(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Requester & Location */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-slate-700">{activeSelectedRequest.requesterName}</span>
                <span className="text-[10px] text-slate-400">• Citizen Complaint</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {activeSelectedRequest.locationName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{activeSelectedRequest.address}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Category</span>
                <span className="font-semibold text-slate-800">{activeSelectedRequest.category}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Severity</span>
                <span className="font-semibold text-slate-800">{activeSelectedRequest.severity}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Waiting Time</span>
                <span className="font-mono font-semibold text-slate-800">{activeSelectedRequest.waitingHours} hours</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-medium">Quantity</span>
                <span className="font-mono font-semibold text-slate-800">{activeSelectedRequest.quantityKg} kg</span>
              </div>
            </div>

            {/* Uploaded Garbage Photos Gallery */}
            {activeSelectedRequest.photos && activeSelectedRequest.photos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Evidence Photos ({activeSelectedRequest.photos.length})</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Click to enlarge</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {activeSelectedRequest.photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setEnlargedPhoto(photoUrl)}
                      className="group relative aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:border-emerald-500 transition-all"
                    >
                      <img
                        src={photoUrl}
                        alt={`Evidence #${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sensitive proximity & Notes */}
            {activeSelectedRequest.sensitiveProximity !== 'None' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Sensitive Zone:</strong> {activeSelectedRequest.sensitiveProximity} proximity
              </div>
            )}

            {activeSelectedRequest.notes && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                {activeSelectedRequest.notes}
              </div>
            )}

            {/* Quick Status Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispatch Status
              </label>
              <select
                value={activeSelectedRequest.status}
                onChange={(e) =>
                  updateRequestStatus(
                    activeSelectedRequest.id,
                    e.target.value as RequestStatus,
                    activeSelectedRequest.assignedTeamId
                  )
                }
                className="w-full text-xs font-semibold rounded-xl px-3 py-2 border border-slate-200 bg-white focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value="Pending">Pending</option>
                <option value="Assigned">Assigned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBreakdownRequest(activeSelectedRequest)}
                className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer text-center"
              >
                View Formula
              </button>
              <button
                onClick={() => setEditingRequest(activeSelectedRequest)}
                className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Info</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <PriorityBreakdownModal
        request={breakdownRequest}
        onClose={() => setBreakdownRequest(null)}
      />

      <RequestModal
        isOpen={Boolean(editingRequest)}
        onClose={() => setEditingRequest(null)}
        onSubmit={(data) => {
          if (editingRequest) {
            updateRequest(editingRequest.id, data);
            setEditingRequest(null);
          }
        }}
        initialData={editingRequest}
      />

      {/* Enlarged Photo Lightbox Modal */}
      {enlargedPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setEnlargedPhoto(null)}
        >
          <div
            className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs">
              <span className="font-semibold">
                Garbage Evidence Inspection • {activeSelectedRequest?.locationName}
              </span>
              <button
                onClick={() => setEnlargedPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/60">
              <img
                src={enlargedPhoto}
                alt="Enlarged waste evidence"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
