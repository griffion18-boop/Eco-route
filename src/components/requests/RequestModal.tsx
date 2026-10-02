import React, { useState, useEffect, useRef } from 'react';
import { PickupRequest, SensitiveProximity, SeverityLevel, WasteCategory } from '../../types';
import { calculatePriorityBreakdown } from '../../utils/priority';
import { compressImageFile, SAMPLE_GARBAGE_PHOTOS } from '../../utils/imageCompressor';
import { PriorityBadge } from '../common/PriorityBadge';
import {
  X,
  MapPin,
  AlertTriangle,
  Scale,
  Clock,
  Building,
  FileText,
  Navigation,
  CheckCircle,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Sparkles,
  Info,
  User,
} from 'lucide-react';

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
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
    notes: string;
    photos: string[];
  }) => void;
  initialData?: PickupRequest | null;
}

const MUMBAI_DISTRICT_PRESETS = [
  { name: 'Dadar West', lat: 19.0185, lng: 72.8430 },
  { name: 'Bandra West', lat: 19.0560, lng: 72.8315 },
  { name: 'Andheri West', lat: 19.1415, lng: 72.8265 },
  { name: 'Andheri East (MIDC)', lat: 19.1220, lng: 72.8710 },
  { name: 'Kurla West', lat: 19.0688, lng: 72.8792 },
  { name: 'Powai (Hiranandani)', lat: 19.1172, lng: 72.9095 },
  { name: 'Lower Parel', lat: 18.9960, lng: 72.8305 },
  { name: 'Colaba Causeway', lat: 18.9135, lng: 72.8230 },
  { name: 'Borivali East', lat: 19.2275, lng: 72.8625 },
  { name: 'Goregaon West', lat: 19.1685, lng: 72.8360 },
];

export const RequestModal: React.FC<RequestModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [requesterName, setRequesterName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(19.0185);
  const [longitude, setLongitude] = useState(72.8430);
  const [category, setCategory] = useState<WasteCategory>('General');
  const [severity, setSeverity] = useState<SeverityLevel>('Medium');
  const [waitingHours, setWaitingHours] = useState(12);
  const [quantityKg, setQuantityKg] = useState(300);
  const [sensitiveProximity, setSensitiveProximity] = useState<SensitiveProximity>('None');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setRequesterName(initialData.requesterName || 'Citizen Resident');
      setLocationName(initialData.locationName);
      setAddress(initialData.address);
      setLatitude(initialData.latitude);
      setLongitude(initialData.longitude);
      setCategory(initialData.category);
      setSeverity(initialData.severity);
      setWaitingHours(initialData.waitingHours);
      setQuantityKg(initialData.quantityKg);
      setSensitiveProximity(initialData.sensitiveProximity);
      setNotes(initialData.notes);
      setPhotos(initialData.photos || []);
    } else {
      // Default initial form
      setRequesterName('Priya Sharma');
      setLocationName('');
      setAddress('');
      setLatitude(19.0185);
      setLongitude(72.8430);
      setCategory('General');
      setSeverity('Medium');
      setWaitingHours(12);
      setQuantityKg(300);
      setSensitiveProximity('None');
      setNotes('');
      setPhotos([]);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Live priority score preview
  const liveBreakdown = calculatePriorityBreakdown({
    severity,
    waitingHours,
    quantityKg,
    sensitiveProximity,
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/i)) {
        alert(`File ${file.name} is not a supported format (JPG, PNG, WebP).`);
        continue;
      }
      try {
        const compressed = await compressImageFile(file);
        newPhotos.push(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5)); // Cap at 5 photos
    setIsCompressing(false);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddSamplePhoto = (dataUrl: string) => {
    if (photos.includes(dataUrl)) return;
    setPhotos((prev) => [...prev, dataUrl].slice(0, 5));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!requesterName.trim()) newErrors.requesterName = 'Requester name is required';
    if (!locationName.trim()) newErrors.locationName = 'Location name is required';
    if (!address.trim()) newErrors.address = 'Street address is required';
    if (isNaN(latitude) || latitude < 18.8 || latitude > 19.4) {
      newErrors.latitude = 'Latitude must be within Mumbai area (~19.0)';
    }
    if (isNaN(longitude) || longitude < 72.7 || longitude > 73.1) {
      newErrors.longitude = 'Longitude must be within Mumbai area (~72.8)';
    }
    if (isNaN(quantityKg) || quantityKg <= 0) {
      newErrors.quantityKg = 'Quantity must be greater than 0 kg';
    }
    if (isNaN(waitingHours) || waitingHours < 0) {
      newErrors.waitingHours = 'Waiting hours must be 0 or more';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      requesterName: requesterName.trim(),
      locationName: locationName.trim(),
      address: address.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      category,
      severity,
      waitingHours: Number(waitingHours),
      quantityKg: Number(quantityKg),
      sensitiveProximity,
      notes: notes.trim(),
      photos,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white">
                {initialData ? `Edit Pickup Request (${initialData.id})` : 'New Mumbai Pickup Request'}
              </h3>
              <p className="text-xs text-slate-400">
                Log municipal waste location, citizen evidence photo, and calculate priority
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Score Preview Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Calculated Priority:</span>
            <PriorityBadge
              score={liveBreakdown.totalScore}
              level={liveBreakdown.priorityLevel}
              showDetailsButton={false}
            />
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Deterministic formula: 40% Severity + 25% Wait + 20% Load + 15% Proximity
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Requester Name & Location Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Citizen / Requester Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="e.g. Priya Sharma or Aarav Patil"
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border ${
                    errors.requesterName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none`}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.requesterName && (
                <span className="text-[11px] text-rose-500 mt-1 block">{errors.requesterName}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Location Name / Landmark <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Lokhandwala Market Lane"
                className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                  errors.locationName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none`}
              />
              {errors.locationName && (
                <span className="text-[11px] text-rose-500 mt-1 block">{errors.locationName}</span>
              )}
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mumbai Street Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Opp. St. Joseph Convent, Hill Road, Bandra West, Mumbai 400050"
              className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                errors.address ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
              } focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none`}
            />
            {errors.address && (
              <span className="text-[11px] text-rose-500 mt-1 block">{errors.address}</span>
            )}
          </div>

          {/* Mumbai District Quick Presets & Coordinates */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                Mumbai District Coordinate Presets
              </span>
              <span className="text-[10px] text-slate-400">Click to autofill coordinates</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {MUMBAI_DISTRICT_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => {
                    setLatitude(preset.lat);
                    setLongitude(preset.lng);
                    if (!locationName) setLocationName(`${preset.name} Junction`);
                    if (!address) setAddress(`Station Area, ${preset.name}, Mumbai`);
                  }}
                  className="px-2 py-1 rounded-md text-[11px] font-medium bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Latitude (°N)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-0.5">Longitude (°E)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:border-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Waste Category & Severity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Waste Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as WasteCategory)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
              >
                <option value="General">General / Mixed Municipal Solid Waste</option>
                <option value="Plastic">Plastic & Dry Packaging</option>
                <option value="Organic">Organic / Market Wet Waste (Compost)</option>
                <option value="Electronic">Electronic & Battery Waste (E-Waste)</option>
                <option value="Hazardous">Hazardous & Biomedical Debris</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Severity Level (40% Weight)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
              >
                <option value="Low">Low (Base: 20 pts)</option>
                <option value="Medium">Medium (Base: 45 pts)</option>
                <option value="High">High (Base: 75 pts)</option>
                <option value="Critical">Critical (Base: 100 pts)</option>
              </select>
            </div>
          </div>

          {/* Quantity & Waiting Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity in Kilograms (20% Weight)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(parseFloat(e.target.value))}
                  className="w-full pl-3.5 pr-12 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  kg
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Elapsed Waiting Time (25% Weight)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="168"
                  value={waitingHours}
                  onChange={(e) => setWaitingHours(parseFloat(e.target.value))}
                  className="w-full pl-3.5 pr-14 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  hours
                </span>
              </div>
            </div>
          </div>

          {/* Sensitive Location Proximity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sensitive Location Proximity (15% Weight)
            </label>
            <select
              value={sensitiveProximity}
              onChange={(e) => setSensitiveProximity(e.target.value as SensitiveProximity)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none cursor-pointer"
            >
              <option value="None">None (Standard commercial or industrial roadside - 0 pts)</option>
              <option value="Moderate">Moderate (Public promenade or local garden - 35 pts)</option>
              <option value="Close">Close (Within 200m of schools, dense chawls, or coastline - 70 pts)</option>
              <option value="Adjacent">Adjacent (Directly borders hospital, pediatric clinic, or water line - 100 pts)</option>
            </select>
          </div>

          {/* REQUIRED PHOTO UPLOAD SECTION */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📷 Upload Photos of the Garbage</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Evidence Reference
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Add photos of the waste location to help collection teams understand the situation before pickup.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500">
                {photos.length}/5 Photos
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                isDragOver
                  ? 'border-emerald-500 bg-emerald-100/50'
                  : 'border-slate-300 hover:border-emerald-400 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center gap-1.5">
                <UploadCloud className="w-8 h-8 text-emerald-600 animate-bounce" />
                <span className="text-xs font-semibold text-slate-800">
                  {isCompressing ? 'Processing & Compressing Images...' : 'Click or Drag & Drop Garbage Photos Here'}
                </span>
                <span className="text-[11px] text-slate-400">
                  Supported formats: JPG, JPEG, PNG, WebP (Max 10MB per file)
                </span>
              </div>
            </div>

            {/* Quick 1-Click Sample Photos (For Hackathon Demonstration) */}
            <div className="pt-1">
              <span className="text-[11px] font-semibold text-slate-500 block mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>1-Click Mumbai Garbage Presets (Demo Shortcut):</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_GARBAGE_PHOTOS.map((sample) => (
                  <button
                    key={sample.name}
                    type="button"
                    onClick={() => handleAddSamplePhoto(sample.dataUrl)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  >
                    + {sample.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Uploaded Photos Preview Grid */}
            {photos.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-xs font-semibold text-slate-600 block">
                  Attached Photographs ({photos.length}):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                  {photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                    >
                      <img
                        src={photoUrl}
                        alt={`Garbage photo #${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemovePhoto(idx);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                        title="Remove photo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <span className="absolute bottom-1 left-1 px-1 py-0.2 rounded bg-black/60 text-[9px] font-mono text-white">
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Field Dispatch & Access Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Near public chawl tap, narrow lane. Vehicle must access via main market lane before 10 AM."
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{initialData ? 'Save Changes' : 'Submit Pickup Request'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
