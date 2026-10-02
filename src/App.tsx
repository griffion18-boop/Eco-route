/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/overview/OverviewView';
import { RequestsView } from './components/requests/RequestsView';
import { LiveMapView } from './components/map/LiveMapView';
import { RouteOptimizerView } from './components/optimizer/RouteOptimizerView';
import { TeamsView } from './components/teams/TeamsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { RequestModal } from './components/requests/RequestModal';
import { CitizenPortalView } from './components/citizen/CitizenPortalView';

const AppContent: React.FC = () => {
  const { activeTab, addRequest, viewMode } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGlobalCreateModalOpen, setIsGlobalCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Navigation Sidebar */}
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar */}
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          onOpenCreateModal={() => setIsGlobalCreateModalOpen(true)}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {viewMode === 'citizen' ? (
            <CitizenPortalView />
          ) : (
            <>
              {activeTab === 'overview' && (
                <OverviewView onOpenCreateModal={() => setIsGlobalCreateModalOpen(true)} />
              )}
              {activeTab === 'requests' && <RequestsView />}
              {activeTab === 'map' && <LiveMapView />}
              {activeTab === 'optimizer' && <RouteOptimizerView />}
              {activeTab === 'teams' && <TeamsView />}
              {activeTab === 'analytics' && <AnalyticsView />}
            </>
          )}
        </main>
      </div>

      {/* Global Quick Create Request Modal */}
      <RequestModal
        isOpen={isGlobalCreateModalOpen}
        onClose={() => setIsGlobalCreateModalOpen(false)}
        onSubmit={(data) => {
          addRequest(data);
          setIsGlobalCreateModalOpen(false);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
