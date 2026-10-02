import React from 'react';
import { PickupRequest } from '../../types';
import { calculatePriorityBreakdown } from '../../utils/priority';
import { Calculator, X, ShieldAlert, Clock, Weight, MapPin, CheckCircle2 } from 'lucide-react';

interface PriorityBreakdownModalProps {
  request: PickupRequest | null;
  onClose: () => void;
}

export const PriorityBreakdownModal: React.FC<PriorityBreakdownModalProps> = ({
  request,
  onClose,
}) => {
  if (!request) return null;

  const breakdown = calculatePriorityBreakdown({
    severity: request.severity,
    waitingHours: request.waitingHours,
    quantityKg: request.quantityKg,
    sensitiveProximity: request.sensitiveProximity,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-white flex items-center gap-2">
                Priority Score Breakdown
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {request.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Transparent 4-factor scoring algorithm (0–100 scale)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Total Score Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                Final Priority Score
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {breakdown.totalScore}
                </span>
                <span className="text-sm font-semibold text-slate-500">/ 100</span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ml-2 ${
                    breakdown.priorityLevel === 'Critical'
                      ? 'bg-rose-100 text-rose-700'
                      : breakdown.priorityLevel === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : breakdown.priorityLevel === 'Medium'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {breakdown.priorityLevel} Tier
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Target Dispatch</span>
              <span className="text-sm font-medium text-slate-700">
                {breakdown.priorityLevel === 'Critical'
                  ? 'Immediate (< 2 hrs)'
                  : breakdown.priorityLevel === 'High'
                  ? 'Same Day (< 6 hrs)'
                  : breakdown.priorityLevel === 'Medium'
                  ? 'Next Regular Shift'
                  : 'Standard Route Cycle'}
              </span>
            </div>
          </div>

          {/* Mathematical Formula Preview */}
          <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-3.5 text-xs text-emerald-900">
            <span className="font-semibold block text-emerald-800 mb-1">Municipal Priority Formula:</span>
            <code className="font-mono text-emerald-700 block bg-white/70 p-2 rounded border border-emerald-200/50">
              Priority = (Severity × 40%) + (Wait Time × 25%) + (Quantity × 20%) + (Proximity × 15%)
            </code>
          </div>

          {/* Factor Breakdown Rows */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Factor Contributions
            </h4>

            {/* Factor 1: Severity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Waste Hazard & Severity
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">Weight: 40%</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-slate-900">
                    +{breakdown.severityWeighted.toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  Value: <strong className="text-slate-700">{request.severity}</strong> (Base: {breakdown.severityValue} / 100)
                </span>
                <span className="font-mono text-slate-400">{breakdown.severityValue} × 0.40 = {breakdown.severityWeighted}</span>
              </div>
            </div>

            {/* Factor 2: Waiting Time */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Waiting Time
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">Weight: 25%</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-slate-900">
                    +{breakdown.waitingWeighted.toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  Elapsed: <strong className="text-slate-700">{request.waitingHours} hours</strong> (Norm: {breakdown.waitingNormalized}% of 72h max)
                </span>
                <span className="font-mono text-slate-400">{breakdown.waitingNormalized} × 0.25 = {breakdown.waitingWeighted}</span>
              </div>
            </div>

            {/* Factor 3: Quantity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Weight className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Quantity / Volume
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">Weight: 20%</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-slate-900">
                    +{breakdown.quantityWeighted.toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  Load: <strong className="text-slate-700">{request.quantityKg} kg</strong> (Norm: {breakdown.quantityNormalized}% of 800kg standard bin cap)
                </span>
                <span className="font-mono text-slate-400">{breakdown.quantityNormalized} × 0.20 = {breakdown.quantityWeighted}</span>
              </div>
            </div>

            {/* Factor 4: Sensitive Proximity */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-800">
                      Sensitive Zone Proximity
                    </span>
                    <span className="text-xs text-slate-400 ml-2 font-mono">Weight: 15%</span>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold text-slate-900">
                    +{breakdown.sensitiveWeighted.toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                <span>
                  Zone: <strong className="text-slate-700">{request.sensitiveProximity}</strong> (Score: {breakdown.sensitiveNormalized} / 100)
                </span>
                <span className="font-mono text-slate-400">{breakdown.sensitiveNormalized} × 0.15 = {breakdown.sensitiveWeighted}</span>
              </div>
            </div>
          </div>

          {/* Summation check */}
          <div className="text-xs text-slate-400 text-center font-mono pt-2">
            {breakdown.severityWeighted} + {breakdown.waitingWeighted} + {breakdown.quantityWeighted} + {breakdown.sensitiveWeighted} = {breakdown.totalScore}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
};
