import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { WasteCategory } from '../../types';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Recycle,
  Scale,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
} from 'lucide-react';

const CATEGORY_HEX: Record<WasteCategory, string> = {
  General: '#64748b',
  Plastic: '#06b6d4',
  Organic: '#10b981',
  Electronic: '#6366f1',
  Hazardous: '#f43f5e',
};

export const AnalyticsView: React.FC = () => {
  const { requests, stats, teams } = useApp();

  // 1. Requests and weight by category
  const categoryData = useMemo(() => {
    const counts: Record<WasteCategory, number> = {
      General: 0,
      Plastic: 0,
      Organic: 0,
      Electronic: 0,
      Hazardous: 0,
    };
    const weights: Record<WasteCategory, number> = {
      General: 0,
      Plastic: 0,
      Organic: 0,
      Electronic: 0,
      Hazardous: 0,
    };

    requests.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
      weights[r.category] = (weights[r.category] || 0) + r.quantityKg;
    });

    const categories: WasteCategory[] = ['General', 'Plastic', 'Organic', 'Electronic', 'Hazardous'];
    const maxCount = Math.max(...Object.values(counts), 1);

    return categories.map((cat) => ({
      category: cat,
      count: counts[cat],
      weightKg: weights[cat],
      color: CATEGORY_HEX[cat],
      percentOfTotal: requests.length > 0 ? Math.round((counts[cat] / requests.length) * 100) : 0,
      barPercent: Math.round((counts[cat] / maxCount) * 100),
    }));
  }, [requests]);

  // 2. Status Breakdown
  const statusData = useMemo(() => {
    const counts = {
      Pending: 0,
      Assigned: 0,
      'In Progress': 0,
      Completed: 0,
    };
    requests.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });

    return [
      { label: 'Pending', count: counts.Pending, color: '#f59e0b' },
      { label: 'Assigned', count: counts.Assigned, color: '#3b82f6' },
      { label: 'In Progress', count: counts['In Progress'], color: '#8b5cf6' },
      { label: 'Completed', count: counts.Completed, color: '#10b981' },
    ];
  }, [requests]);

  // 3. Priority tier distribution
  const priorityTierData = useMemo(() => {
    const tiers = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };
    requests.forEach((r) => {
      tiers[r.priorityLevel] = (tiers[r.priorityLevel] || 0) + 1;
    });
    return [
      { label: 'Critical (80–100)', count: tiers.Critical, color: '#f43f5e' },
      { label: 'High (60–79)', count: tiers.High, color: '#f59e0b' },
      { label: 'Medium (35–59)', count: tiers.Medium, color: '#3b82f6' },
      { label: 'Low (0–34)', count: tiers.Low, color: '#10b981' },
    ];
  }, [requests]);

  // 4. Average wait time by severity
  const waitTimeBySeverity = useMemo(() => {
    const severities = ['Low', 'Medium', 'High', 'Critical'] as const;
    return severities.map((sev) => {
      const match = requests.filter((r) => r.severity === sev);
      const avg = match.length > 0 ? Math.round(match.reduce((s, r) => s + r.waitingHours, 0) / match.length) : 0;
      return {
        severity: sev,
        count: match.length,
        avgHours: avg,
      };
    });
  }, [requests]);

  // Export CSV handler for hackathon demo
  const handleExportCSV = () => {
    const headers = ['Request ID', 'Location', 'Category', 'Severity', 'Quantity (kg)', 'Wait Time (hrs)', 'Priority Score', 'Status', 'Assigned Team'];
    const rows = requests.map((r) => [
      r.id,
      `"${r.locationName.replace(/"/g, '""')}"`,
      r.category,
      r.severity,
      r.quantityKg,
      r.waitingHours,
      r.priorityScore,
      r.status,
      r.assignedTeamId || 'Unassigned',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ecoroute_waste_manifest_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Operational Analytics & Environmental Impact
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time analytics and performance metrics derived dynamically from current database records.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Manifest (CSV)</span>
        </button>
      </div>

      {/* Top Impact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Collected Waste</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Recycle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats.totalWasteCollectedKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            From {stats.completedRequests} completed collection stops
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Average Priority</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {stats.averagePriorityScore} <span className="text-sm font-normal text-slate-500">/ 100</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Overall workload urgency rating
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Est. Distance Saved</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 font-mono">
            ~{stats.estimatedDistanceSavedKm} <span className="text-sm font-normal text-emerald-700">km</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Calculated via multi-stop clustering
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Est. CO₂ Averted</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">
            ~{Math.round(stats.estimatedDistanceSavedKm * 0.48)} <span className="text-sm font-normal text-slate-500">kg</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Based on ~480g CO₂/km fleet average
          </p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Requests & Weight by Waste Category */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Distribution by Waste Category</h3>
              <p className="text-xs text-slate-400">Total requests and cumulative kilograms per waste stream</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
              Live Data
            </span>
          </div>

          <div className="space-y-3.5 pt-2">
            {categoryData.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.category}
                  </span>
                  <div className="font-mono text-slate-600">
                    <strong className="text-slate-900">{item.count}</strong> reqs ({item.weightKg.toLocaleString()} kg)
                  </div>
                </div>
                {/* Visual Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.barPercent}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 2: Collection Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Collection Status Pipeline</h3>
              <p className="text-xs text-slate-400">Lifecycle breakdown from submission to completion</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
              {requests.length} Total
            </span>
          </div>

          {/* Stacked Progress Bar */}
          <div className="pt-2">
            <div className="w-full h-4 rounded-xl bg-slate-100 overflow-hidden flex shadow-inner">
              {statusData.map((st) => {
                const percent = requests.length > 0 ? (st.count / requests.length) * 100 : 0;
                return (
                  <div
                    key={st.label}
                    title={`${st.label}: ${st.count}`}
                    style={{
                      width: `${percent}%`,
                      backgroundColor: st.color,
                    }}
                    className="h-full transition-all duration-500 first:rounded-l-xl last:rounded-r-xl"
                  />
                );
              })}
            </div>

            {/* Status Legend & Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              {statusData.map((st) => {
                const percent = requests.length > 0 ? Math.round((st.count / requests.length) * 100) : 0;
                return (
                  <div key={st.label} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: st.color }} />
                      <span>{st.label}</span>
                    </div>
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-lg font-extrabold text-slate-900">{st.count}</span>
                      <span className="text-[11px] text-slate-400">({percent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart 3: Priority Tiers Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Priority Tier Distribution</h3>
              <p className="text-xs text-slate-400">Calculated via 4-factor scoring algorithm</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              0–100 Scale
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {priorityTierData.map((tier) => {
              const maxP = Math.max(...priorityTierData.map((t) => t.count), 1);
              const barW = Math.round((tier.count / maxP) * 100);
              return (
                <div key={tier.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                      {tier.label}
                    </span>
                    <span className="font-mono font-bold text-slate-900">{tier.count} requests</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${barW}%`, backgroundColor: tier.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Average Waiting Hours by Severity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Average Wait Time by Severity</h3>
              <p className="text-xs text-slate-400">Hours elapsed before collection completion</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
              SLA Metrics
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {waitTimeBySeverity.map((item) => (
              <div key={item.severity} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {item.severity} Severity
                </span>
                <div className="text-xl font-extrabold text-slate-900 font-mono mt-1">
                  {item.avgHours} <span className="text-xs font-normal text-slate-500">hrs</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {item.count} total items
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>All estimates calculated directly from timestamp differentials in localStorage.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
