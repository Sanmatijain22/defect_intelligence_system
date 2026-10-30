import React from 'react';
import { PageId } from './Sidebar';
import { Cpu, ShieldCheck, Activity, User, Bell } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  onNewInspection: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNewInspection }) => {
  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'overview':
        return 'Executive Quality Overview & Shop-Floor Metrics';
      case 'new-inspection':
        return 'Visual Inspection Workstation – Component Analysis';
      case 'results':
        return 'Inspection Diagnosis & Automated Defect Report';
      case 'history':
        return 'Inspection History & Compliance Audit Ledger';
      case 'settings':
        return 'Inspection Engine Configuration & Quality Tolerances';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {getPageTitle(currentPage)}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>PLANT: ESCORTS-KUBOTA-HQ</span>
            <span>•</span>
            <span className="text-slate-600 font-sans font-medium">SHIFT A (06:00 - 14:30)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time System Status Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <Activity size={14} className="text-emerald-600 animate-pulse" />
          <span>Edge CV Node Active</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
        </div>

        {/* Quick New Inspection Button */}
        {currentPage !== 'new-inspection' && (
          <button
            onClick={onNewInspection}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <ShieldCheck size={15} />
            <span>+ Inspect Component</span>
          </button>
        )}

        {/* Operator Profile */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
            QA
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">Senior Auditor</p>
            <p className="text-[10px] text-slate-400 font-medium">Station #04</p>
          </div>
        </div>
      </div>
    </header>
  );
};

