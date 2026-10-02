import React from 'react';
import { PickupRequest } from '../../types';

interface PriorityBadgeProps {
  score: number;
  level: 'Critical' | 'High' | 'Medium' | 'Low';
  onClick?: () => void;
  showDetailsButton?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  score,
  level,
  onClick,
  showDetailsButton = true,
}) => {
  const getColors = () => {
    switch (level) {
      case 'Critical':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
          dot: 'bg-rose-500',
          tag: 'bg-rose-600 text-white',
        };
      case 'High':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
          dot: 'bg-amber-500',
          tag: 'bg-amber-500 text-white',
        };
      case 'Medium':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
          dot: 'bg-blue-500',
          tag: 'bg-blue-500 text-white',
        };
      case 'Low':
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
          dot: 'bg-emerald-500',
          tag: 'bg-emerald-500 text-white',
        };
    }
  };

  const colors = getColors();

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title="Click to view transparent priority score calculation breakdown"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${colors.bg} ${
        onClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.dot} animate-pulse`} />
      <span>{score}</span>
      <span className="font-medium text-[11px] opacity-80">({level})</span>
      {showDetailsButton && onClick && (
        <span className="text-[10px] ml-0.5 text-slate-400 hover:text-slate-700 underline font-normal">
          formula
        </span>
      )}
    </button>
  );
};
