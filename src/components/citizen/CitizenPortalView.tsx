import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PickupRequest, SensitiveProximity, SeverityLevel, WasteCategory } from '../../types';
import { calculatePriorityBreakdown } from '../../utils/priority';
import { compressImageFile, SAMPLE_GARBAGE_PHOTOS } from '../../utils/imageCompressor';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Clock,
  Truck,
  ArrowRight,
  UploadCloud,
  Trash2,
  Sparkles,
  Search,
  AlertTriangle,
  ShieldCheck,
  Building,
  User,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

const MUMBAI_DISTRICT_PRESETS = [
  { name: 'Dadar West', address: 'Near Senapati Bapat Marg, Dadar West, Mumbai 400028', lat: 19.0185, lng: 72.8430 },
  { name: 'Bandra West', address: 'Hill Road Shopping Area, Bandra West, Mumbai 400050', lat: 19.0560, lng: 72.8315 },
  { name: 'Andheri West', address: 'Lokhandwala Complex Market Lane, Andheri West, Mumbai 400053', lat: 19.1415, lng: 72.8265 },
  { name: 'Kurla West', address: 'Station Road Auto Stand, Kurla West, Mumbai 400070', lat: 19.0688, lng: 72.8792 },
  { name: 'Powai Lake', address: 'Central Avenue, Hiranandani Gardens, Powai, Mumbai 400076', lat: 19.1172, lng: 72.9095 },
  { name: 'Lower Parel', address: 'Senapati Bapat Marg, Lower Parel, Mumbai 400013', lat: 18.9960, lng: 72.8305 },
  { name: 'Colaba Causeway', address: 'Sassoon Dock Gate, Colaba, Mumbai 400005', lat: 18.9135, lng: 72.8230 },
];

export const CitizenPortalView: React.FC = () => {
  const { requests, teams, addRequest, setViewMode } = useApp();

  const [citizenTab, setCitizenTab] = useState<'report' | 'track' | 'history'>('report');
  const [trackingId, setTrackingId] = useState<string>('REQ-MUM-101');
  const [searchTrackingInput, setSearchTrackingInput] = useState<string>('');

  // Report Form State
  const [requesterName, setRequesterName] = useState('Priya Sharma');
  const [locationName, setLocationName] = useState('Bandra West Promenade');
  const [address, setAddress] = useState('Hill Road Shopping Area, Bandra West, Mumbai 400050');
  const [latitude, setLatitude] = useState(19.0560);
  const [longitude, setLongitude] = useState(72.8315);
  const [category, setCategory] = useState<WasteCategory>('Plastic');
  const [severity, setSeverity] = useState<SeverityLevel>('High');
  const [quantityKg, setQuantityKg] = useState(350);
  const [sensitiveProximity, setSensitiveProximity] = useState<SensitiveProximity>('Close');
  const [notes, setNotes] = useState('Market plastic wrapping and overflowing curbside litter near school gate.');
  const [photos, setPhotos] = useState<string[]>([SAMPLE_GARBAGE_PHOTOS[1].dataUrl]);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Active tracked request
  const currentTrackedRequest = requests.find(
    (r) => r.id.toLowerCase() === trackingId.toLowerCase()
  ) || requests[0];

  const handleDistrictSelect = (district: typeof MUMBAI_DISTRICT_PRESETS[0]) => {
    setLocationName(`${district.name} Waste Point`);
    setAddress(district.address);
    setLatitude(district.lat);
    setLongitude(district.lng);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    const newPhotos: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const compressed = await compressImageFile(files[i]);
        newPhotos.push(compressed);
      } catch (e) {
        console.error('File compression failed', e);
      }
    }
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !address.trim() || !requesterName.trim()) {
      alert('Please fill out your name, location, and address.');
      return;
    }

    const created = addRequest({
      requesterName,
      locationName,
      address,
      latitude,
      longitude,
      category,
      severity,
      waitingHours: 1,
      quantityKg,
      sensitiveProximity,
      notes,
      photos,
    });

    setNewlyCreatedId(created.id);
    setTrackingId(created.id);
    setIsSubmittedSuccess(true);
  };

  const handleTrackCreated = () => {
    setIsSubmittedSuccess(false);
    setCitizenTab('track');
  };

  const handleSearchTracking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTrackingInput.trim()) return;
    const match = requests.find((r) =>
      r.id.toLowerCase().includes(searchTrackingInput.trim().toLowerCase())
    );
    if (match) {
      setTrackingId(match.id);
      setCitizenTab('track');
    } else {
      alert(`No complaint found matching ID "${searchTrackingInput}". Try REQ-MUM-101`);
    }
  };

  // Assigned team info for tracked request
  const assignedTeam = currentTrackedRequest
    ? teams.find((t) => t.id === currentTrackedRequest.assignedTeamId)
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Citizen Portal Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Swachh Mumbai Citizen Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Report Garbage & Track Pickup
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              Empowering Mumbai citizens to report overflowing waste spots, submit photo evidence, and track municipal ward response in real time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setViewMode('operations')}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Building className="w-4 h-4 text-emerald-400" />
              <span>Switch to Operations Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Citizen Portal Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => {
            setIsSubmittedSuccess(false);
            setCitizenTab('report');
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            citizenTab === 'report'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Report Garbage Spot</span>
        </button>

        <button
          onClick={() => setCitizenTab('track')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            citizenTab === 'track'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Track Complaint Status</span>
        </button>

        <button
          onClick={() => setCitizenTab('history')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            citizenTab === 'history'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Ward Complaints ({requests.length})</span>
        </button>
      </div>

      {/* TAB 1: Report Garbage Spot */}
      {citizenTab === 'report' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          {isSubmittedSuccess ? (
            <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Grievance Registered Successfully!
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Tracking Token ID:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{newlyCreatedId}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Location:</span>
                  <span className="font-semibold text-slate-800">{locationName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-amber-600">Pending Ward Assignment</span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Your photograph and location have been forwarded to the Brihanmumbai Municipal Solid Waste Operations center.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleTrackCreated}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Track This Complaint Live</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsSubmittedSuccess(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
                >
                  Submit Another
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitReport} className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Citizen Waste Reporting Form
                </h2>
                <p className="text-xs text-slate-500">
                  Fill in the location details and upload a photo of the garbage accumulation.
                </p>
              </div>

              {/* Citizen Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={requesterName}
                      onChange={(e) => setRequesterName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Area / Landmark <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g. Dadar Flower Market / Bandra Promenade"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                  />
                </div>
              </div>

              {/* Mumbai Quick Neighborhood Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-xs font-semibold text-slate-700 block">
                  Select Mumbai Neighborhood:
                </span>
                <div className="flex flex-wrap gap-2">
                  {MUMBAI_DISTRICT_PRESETS.map((d) => (
                    <button
                      key={d.name}
                      type="button"
                      onClick={() => handleDistrictSelect(d)}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-700 transition-colors cursor-pointer"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exact Street Address in Mumbai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near St. Joseph Convent, Hill Road, Bandra West, Mumbai 400050"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              {/* Waste Type & Severity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Garbage Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as WasteCategory)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="Plastic">Plastic & Dry Packaging Litter</option>
                    <option value="Organic">Organic Food / Market Vegetable Waste</option>
                    <option value="General">General Municipal Waste / Overflowing Bin</option>
                    <option value="Electronic">Electronic / Battery Scrap</option>
                    <option value="Hazardous">Chemical / Biomedical Hazard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Urgency / Impact Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="Critical">Critical (Immediate public health risk)</option>
                    <option value="High">High (Blocking sidewalk or roadside)</option>
                    <option value="Medium">Medium (Accumulated bins)</option>
                    <option value="Low">Low (Minor scheduled cleanup)</option>
                  </select>
                </div>
              </div>

              {/* 📷 UPLOAD PHOTOS OF THE GARBAGE */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>📷 Upload Photos of the Garbage</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Add photos of the waste location to help collection teams understand the situation before pickup.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">{photos.length}/5</span>
                </div>

                {/* Upload box */}
                <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-white rounded-xl p-5 text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors block">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <UploadCloud className="w-7 h-7 text-emerald-600" />
                  <span className="text-xs font-semibold text-slate-800">
                    Click to take or upload a garbage photo from your phone or device
                  </span>
                  <span className="text-[10px] text-slate-400">JPG, PNG, WebP supported</span>
                </label>

                {/* Quick 1-click sample photos */}
                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Quick demo photos (1-click):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_GARBAGE_PHOTOS.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => {
                          if (!photos.includes(p.dataUrl)) setPhotos((prev) => [...prev, p.dataUrl]);
                        }}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                      >
                        + {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview thumbnails */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {photos.map((p, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
                      >
                        <img src={p} alt="Garbage preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Additional Details / Landmark Directions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Near corner tea stall, opposite bank ATM."
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer text-sm flex items-center justify-center gap-2"
              >
                <span>Submit Grievance to Municipal Ward</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: Track Complaint Status */}
      {citizenTab === 'track' && (
        <div className="space-y-6">
          {/* Tracking Search Input */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <form onSubmit={handleSearchTracking} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTrackingInput}
                  onChange={(e) => setSearchTrackingInput(e.target.value)}
                  placeholder="Enter Complaint Tracking ID (e.g. REQ-MUM-101 or REQ-MUM-103)..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 text-white font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Track Status
              </button>
            </form>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="font-semibold">Quick Track Demo IDs:</span>
              {['REQ-MUM-101', 'REQ-MUM-103', 'REQ-MUM-104', 'REQ-MUM-111'].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTrackingId(id)}
                  className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border transition-colors cursor-pointer ${
                    trackingId === id
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>

          {/* Tracked Request Card */}
          {currentTrackedRequest && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Card Header */}
              <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {currentTrackedRequest.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentTrackedRequest.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : currentTrackedRequest.status === 'In Progress'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : currentTrackedRequest.status === 'Assigned'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {currentTrackedRequest.status}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-white mt-1">
                    {currentTrackedRequest.locationName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{currentTrackedRequest.address}</p>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Reported By
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {currentTrackedRequest.requesterName}
                  </span>
                </div>
              </div>

              {/* 4-Step Visual Progress Stepper */}
              <div className="p-6 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-4">
                  Resolution Progress Workflow
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
                  {/* Step 1 */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>1. Logged</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Citizen evidence submitted</p>
                    <span className="text-[10px] text-slate-400 block">Verified on portal</span>
                  </div>

                  {/* Step 2 */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>2. Priority Evaluated</span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      Score: {currentTrackedRequest.priorityScore} ({currentTrackedRequest.priorityLevel})
                    </p>
                    <span className="text-[10px] text-slate-400 block">SLA Target active</span>
                  </div>

                  {/* Step 3 */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-1 ${
                      currentTrackedRequest.status === 'Assigned' ||
                      currentTrackedRequest.status === 'In Progress' ||
                      currentTrackedRequest.status === 'Completed'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-xs ${
                        currentTrackedRequest.status !== 'Pending' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {currentTrackedRequest.status !== 'Pending' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                      <span>3. Vehicle Assigned</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {assignedTeam ? assignedTeam.name.split('–')[0].trim() : 'Queued for dispatch'}
                    </p>
                    {assignedTeam && (
                      <span className="text-[10px] text-slate-500 font-mono block">
                        Plate: {assignedTeam.vehicleNumber}
                      </span>
                    )}
                  </div>

                  {/* Step 4 */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-1 ${
                      currentTrackedRequest.status === 'Completed'
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div
                      className={`flex items-center gap-2 font-bold text-xs ${
                        currentTrackedRequest.status === 'Completed' ? 'text-emerald-700' : 'text-slate-500'
                      }`}
                    >
                      {currentTrackedRequest.status === 'Completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                      <span>4. Cleaned & Resolved</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      {currentTrackedRequest.status === 'Completed' ? 'Site cleared' : 'Awaiting arrival'}
                    </p>
                    <span className="text-[10px] text-slate-400 block">
                      {currentTrackedRequest.completedAt ? 'Disposed at municipal facility' : 'Estimated same shift'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Photo & Details Section */}
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Your Submitted Photo Evidence</span>
                  </h4>
                  {currentTrackedRequest.photos && currentTrackedRequest.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {currentTrackedRequest.photos.map((p, idx) => (
                        <div
                          key={idx}
                          className="aspect-4/3 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                        >
                          <img src={p} alt="Garbage evidence" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl border border-dashed text-center text-xs text-slate-400">
                      No photographic evidence attached.
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Municipal Complaint Metrics
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Category</span>
                      <span className="font-bold text-slate-800">{currentTrackedRequest.category}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Estimated Weight</span>
                      <span className="font-bold text-slate-800">{currentTrackedRequest.quantityKg} kg</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Severity</span>
                      <span className="font-bold text-slate-800">{currentTrackedRequest.severity}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-400 block">Waiting Elapsed</span>
                      <span className="font-bold text-slate-800">{currentTrackedRequest.waitingHours} hours</span>
                    </div>
                  </div>

                  {currentTrackedRequest.notes && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                      <span className="font-semibold text-slate-800 block mb-0.5">Citizen Notes:</span>
                      {currentTrackedRequest.notes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Ward Complaints List */}
      {citizenTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Community Waste Complaints Feed
            </h3>
            <p className="text-xs text-slate-500">
              All grievances logged across Mumbai municipal wards. Click "Track" to view real-time resolution.
            </p>
          </div>

          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {requests.map((req) => (
              <div
                key={req.id}
                className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{req.id}</span>
                      <span className="font-semibold text-slate-800 truncate">{req.locationName}</span>
                      {req.photos && req.photos.length > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          📷 {req.photos.length}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      Reported by {req.requesterName} • {req.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      req.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : req.status === 'In Progress'
                        ? 'bg-blue-100 text-blue-700'
                        : req.status === 'Assigned'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {req.status}
                  </span>

                  <button
                    onClick={() => {
                      setTrackingId(req.id);
                      setCitizenTab('track');
                    }}
                    className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
