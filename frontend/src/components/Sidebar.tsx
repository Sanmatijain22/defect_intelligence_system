import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  History,
  Settings,
  Cpu,
  Factory,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

export type PageId = 'overview' | 'new-inspection' | 'results' | 'history' | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  hasActiveResult: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  hasActiveResult,
}) => {
  const navItems = [
    {
      id: 'overview' as PageId,
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'new-inspection' as PageId,
      label: 'New Inspection',
      icon: ScanEye,
      badge: 'Live',
    },
    {
      id: 'results' as PageId,
      label: 'Inspection Results',
      icon: ShieldCheck,
      badge: hasActiveResult ? 'Active' : null,
      disabled: !hasActiveResult,
    },
    {
      id: 'history' as PageId,
      label: 'Inspection History',
      icon: History,
      badge: null,
    },
    {
      id: 'settings' as PageId,
      label: 'System Settings',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 select-none">
      <div>
        {/* Brand / Platform Identity */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/40 border border-blue-400/20">
              <Cpu className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wider text-white uppercase font-mono">
                SmartMfg <span className="text-blue-400">AI</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">
                Defect Intelligence Suite
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400">
            <Factory size={13} className="text-blue-400 shrink-0" />
            <span className="truncate">Tractor Quality Unit 4</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Quality Assurance
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => !item.disabled && onNavigate(item.id)}
                disabled={item.disabled}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : item.disabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-blue-800 text-blue-200'
                        : 'bg-slate-800 text-blue-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-slate-300">CV Vision Engine</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            v2.4 ONLINE
          </span>
        </div>
        <p className="text-[10px] leading-relaxed text-slate-400">
          Automated SSIM registration & defect classification for industrial tractor parts.
        </p>
      </div>
    </aside>
  );
};

