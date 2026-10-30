import React, { useState } from 'react';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { NewInspectionPage } from './pages/NewInspectionPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { InspectionDetail } from './types';
import { getInspectionDetail } from './api/client';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [activeInspection, setActiveInspection] = useState<InspectionDetail | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  // Navigate to view a specific inspection by ID
  const handleViewInspection = async (id: string) => {
    try {
      setLoadingInspection(true);
      const detail = await getInspectionDetail(id);
      setActiveInspection(detail);
      setCurrentPage('results');
    } catch (err) {
      console.error('Failed to load inspection details', err);
    } finally {
      setLoadingInspection(false);
    }
  };

  const handleInspectionComplete = (result: InspectionDetail) => {
    setActiveInspection(result);
    setCurrentPage('results');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      {/* Dark Navy Industrial Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        hasActiveResult={activeInspection !== null}
      />

      {/* Main Workspace */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentPage={currentPage}
          onNewInspection={() => setCurrentPage('new-inspection')}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {loadingInspection ? (
            <div className="flex h-96 items-center justify-center">
              <div className="text-center space-y-2">
                <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium">Retrieving inspection record...</p>
              </div>
            </div>
          ) : (
            <>
              {currentPage === 'overview' && (
                <OverviewPage
                  onStartInspection={() => setCurrentPage('new-inspection')}
                  onViewInspection={handleViewInspection}
                />
              )}

              {currentPage === 'new-inspection' && (
                <NewInspectionPage
                  onInspectionComplete={handleInspectionComplete}
                />
              )}

              {currentPage === 'results' && activeInspection && (
                <ResultsPage
                  inspection={activeInspection}
                  onNewInspection={() => setCurrentPage('new-inspection')}
                  onBackToHistory={() => setCurrentPage('history')}
                />
              )}

              {currentPage === 'history' && (
                <HistoryPage onSelectInspection={handleViewInspection} />
              )}

              {currentPage === 'settings' && <SettingsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
