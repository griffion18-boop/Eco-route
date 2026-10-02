import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Bell,
  Menu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  User,
  ShieldCheck,
  ChevronDown,
  X,
  ExternalLink,
  Building,
  Smartphone,
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenCreateModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onOpenCreateModal }) => {
  const {
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveTab,
    setSelectedRequestId,
    focusOnMap,
    requests,
    currentUser,
    signInWithGoogle,
    signOutUser,
  } = useApp();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Format today's date
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (notifId: string, relatedReqId?: string) => {
    markNotificationRead(notifId);
    if (relatedReqId) {
      const targetReq = requests.find((r) => r.id === relatedReqId);
      if (targetReq) {
        focusOnMap(targetReq.latitude, targetReq.longitude, targetReq.id);
      } else {
        setActiveTab('requests');
      }
    }
    setNotificationsOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left side: Hamburger button + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search complaint (REQ-MUM-101), Priya Sharma, Dadar, Kurla, Bandra..."
            className="w-full pl-9 pr-8 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 rounded-xl border border-transparent focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right side: Date, Notifications, New Request, Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Portal Mode Switcher Button */}
        <button
          onClick={() => setViewMode(viewMode === 'operations' ? 'citizen' : 'operations')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
            viewMode === 'operations'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
          }`}
          title="Toggle between Municipal Staff View and Citizen Requester Portal"
        >
          {viewMode === 'operations' ? (
            <>
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>Citizen Portal View</span>
            </>
          ) : (
            <>
              <Building className="w-3.5 h-3.5 text-emerald-400" />
              <span>Operations View</span>
            </>
          )}
        </button>

        {/* Date Display */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs font-medium text-slate-600">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className={`relative p-2 rounded-xl border transition-colors cursor-pointer ${
              notificationsOpen
                ? 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
            }`}
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Panel */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold">Rule-Based Alerts</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {notifications.length}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No active alert notifications.
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isCrit = notif.type === 'critical';
                    const isWarn = notif.type === 'warning';
                    const isSucc = notif.type === 'success';

                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id, notif.relatedRequestId)}
                        className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start gap-3 ${
                          !notif.read ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isCrit
                              ? 'bg-rose-100 text-rose-600'
                              : isWarn
                              ? 'bg-amber-100 text-amber-600'
                              : isSucc
                              ? 'bg-emerald-100 text-emerald-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {isCrit ? (
                            <AlertTriangle className="w-3.5 h-3.5" />
                          ) : isSucc ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <Info className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {notif.message}
                          </p>
                          {notif.relatedRequestId && (
                            <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center gap-1 mt-1">
                              View on Map <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card / Firebase Auth */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
                  {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                </div>
              )}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                  {currentUser.displayName || currentUser.email}
                </div>
                <button
                  type="button"
                  onClick={() => signOutUser()}
                  className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer block"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-bold text-xs shadow-xs ring-2 ring-emerald-500/20">
                VS
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">
                  Vikram Salunkhe
                </div>
                <button
                  type="button"
                  onClick={() => signInWithGoogle().catch((e) => console.log('Auth cancelled or error', e))}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <span>Google Sign In</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
