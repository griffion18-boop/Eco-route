import { PriorityBreakdown, SensitiveProximity, SeverityLevel } from '../types';

export const SEVERITY_SCORES: Record<SeverityLevel, number> = {
  Low: 20,
  Medium: 45,
  High: 75,
  Critical: 100,
};

export const SENSITIVE_PROXIMITY_SCORES: Record<SensitiveProximity, number> = {
  None: 0,
  Moderate: 35,
  Close: 70,
  Adjacent: 100,
};

// Max reference for 100% normalization
export const MAX_WAITING_HOURS_CAP = 72; // 3 days max saturation
export const MAX_QUANTITY_KG_CAP = 800; // 800kg standard bin saturation

export function normalizeWaitingHours(hours: number): number {
  if (hours <= 0) return 0;
  return Math.min(100, Math.round((hours / MAX_WAITING_HOURS_CAP) * 100));
}

export function normalizeQuantityKg(kg: number): number {
  if (kg <= 0) return 0;
  return Math.min(100, Math.round((kg / MAX_QUANTITY_KG_CAP) * 100));
}

export function getPriorityLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

export function calculatePriorityBreakdown(params: {
  severity: SeverityLevel;
  waitingHours: number;
  quantityKg: number;
  sensitiveProximity: SensitiveProximity;
}): PriorityBreakdown {
  const severityValue = SEVERITY_SCORES[params.severity] || 20;
  const severityWeighted = severityValue * 0.4;

  const waitingNormalized = normalizeWaitingHours(params.waitingHours);
  const waitingWeighted = waitingNormalized * 0.25;

  const quantityNormalized = normalizeQuantityKg(params.quantityKg);
  const quantityWeighted = quantityNormalized * 0.2;

  const sensitiveNormalized = SENSITIVE_PROXIMITY_SCORES[params.sensitiveProximity] ?? 0;
  const sensitiveWeighted = sensitiveNormalized * 0.15;

  const rawTotal = severityWeighted + waitingWeighted + quantityWeighted + sensitiveWeighted;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawTotal)));
  const priorityLevel = getPriorityLevel(totalScore);

  return {
    severityValue,
    severityWeighted: Number(severityWeighted.toFixed(2)),
    waitingNormalized,
    waitingWeighted: Number(waitingWeighted.toFixed(2)),
    quantityNormalized,
    quantityWeighted: Number(quantityWeighted.toFixed(2)),
    sensitiveNormalized,
    sensitiveWeighted: Number(sensitiveWeighted.toFixed(2)),
    totalScore,
    priorityLevel,
  };
}

export function calculatePriorityScore(params: {
  severity: SeverityLevel;
  waitingHours: number;
  quantityKg: number;
  sensitiveProximity: SensitiveProximity;
}): { score: number; level: 'Critical' | 'High' | 'Medium' | 'Low' } {
  const breakdown = calculatePriorityBreakdown(params);
  return {
    score: breakdown.totalScore,
    level: breakdown.priorityLevel,
  };
}
