import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../../types';
import {
  LayoutDashboard,
  ClipboardList,
  Map,
  Route,
  Truck,
  BarChart3,
  RotateCcw,
  Recycle,
  Sparkles,
  Layers,
  X,
  AlertCircle,
  Smartphone,
  Building,
} from 'lucide-react';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeTab,
    setActiveTab,
    requests,
    teams,
    resetDemoData,
    viewMode,
    setViewMode,
  } = useApp();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const criticalCount = requests.filter((r) => r.priorityScore >= 80 && r.status === 'Pending').length;
  const activeTeamsCount = teams.filter((t) => t.status === 'On Route').length;

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'requests',
      label: 'Pickup Requests',
      icon: ClipboardList,
      badge: pendingCount > 0 ? pendingCount : undefined,
      badgeColor: criticalCount > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white',
    },
    {
      id: 'map',
      label: 'Live Map',
      icon: Map,
    },
    {
      id: 'optimizer',
      label: 'Route Optimizer',
      icon: Route,
    },
    {
      id: 'teams',
      label: 'Collection Teams',
      icon: Truck,
      badge: `${activeTeamsCount}/${teams.length}`,
      badgeColor: 'bg-slate-700 text-slate-200',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  const handleNavClick = (tab: ActiveTab) => {
    setViewMode('operations');
    setActiveTab(tab);
    setMobileOpen(false);
  };

  const handleConfirmReset = () => {
    resetDemoData();
    setShowResetConfirm(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-[#0a1124] text-slate-300 flex flex-col transition-transform duration-300 ease-in-out border-r border-slate-800 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Recycle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg text-white tracking-tight">EcoRoute</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  MUMBAI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Smarter Routes. Cleaner Cities.</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {/* Citizen Mode Switcher Banner */}
          <div className="px-1 pb-3">
            <button
              onClick={() => {
                setViewMode(viewMode === 'citizen' ? 'operations' : 'citizen');
                setMobileOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                viewMode === 'citizen'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                  : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-bold block leading-tight">
                    {viewMode === 'citizen' ? 'Citizen Portal Active' : 'Citizen Grievance Portal'}
                  </span>
                  <span className="text-[10px] text-emerald-300/80 block">
                    {viewMode === 'citizen' ? 'Click for Operations' : 'Report & Track Complaints'}
                  </span>
                </div>
              </div>
              <span className="text-xs">→</span>
            </button>
          </div>

          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Operations Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = viewMode === 'operations' && activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      item.badgeColor || 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions & Demo Status */}
        <div className="p-4 border-t border-slate-800/80 bg-[#070d1c] space-y-3">
          {/* Fictional Data Notice */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mumbai Demo Portal</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Fictional Mumbai municipal demonstration data with live localStorage state.
            </p>
          </div>

          {/* Reset Demo Button */}
          {showResetConfirm ? (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/50 space-y-2">
              <div className="flex items-center gap-1.5 text-rose-300 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Reset all sample data?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleConfirmReset}
                  className="flex-1 py-1 px-2 text-[11px] font-bold rounded bg-rose-600 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-1 px-2 text-[11px] font-semibold rounded bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Demo Data</span>
            </button>
          )}

          {/* System status pill */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium text-slate-400">Engine Active</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  );
};
