import React, { useEffect, useState } from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Percent,
  ScanEye,
  FileText,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Layers
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { ResultBadge } from '../components/DefectBadge';
import { DashboardStats, InspectionSummary } from '../types';
import { getDashboardStats, getReportDownloadUrl } from '../api/client';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface OverviewPageProps {
  onStartInspection: () => void;
  onViewInspection: (id: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onStartInspection,
  onViewInspection,
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-500">Loading shop-floor quality telemetry...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-medium text-rose-800">{error || 'Failed to load telemetry'}</p>
        <button
          onClick={fetchStats}
          className="mt-3 px-4 py-2 rounded bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Bar chart data for defect categories
  const categoryData = Object.entries(stats.category_distribution || {}).map(([name, count]) => ({
    name,
    count,
  }));

  const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#64748B'];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
              Station Operational
            </span>
            <span className="text-xs text-slate-400 font-mono">ID: QA-STATION-04-TRACTOR</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Automated Quality Inspection & Defect Intelligence
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Dual-image computer vision platform executing high-precision SSIM structural comparison, 
            ORB registration alignment, and automated defect classification on manufactured tractor components.
          </p>
        </div>
        <button
          onClick={onStartInspection}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 shrink-0 cursor-pointer"
        >
          <ScanEye size={18} />
          <span>Launch New Inspection</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Audits"
          value={stats.total_inspections}
          subtitle="Persistent SQLite ledger"
          icon={ClipboardCheck}
          colorScheme="slate"
        />
        <StatCard
          title="Passed (OK)"
          value={stats.passed_inspections}
          subtitle={`${stats.total_inspections ? Math.round((stats.passed_inspections / stats.total_inspections) * 100) : 0}% compliance`}
          icon={CheckCircle2}
          colorScheme="emerald"
        />
        <StatCard
          title="Defective (Fail)"
          value={stats.failed_inspections}
          subtitle="Defects exceeded tolerance"
          icon={XCircle}
          colorScheme="rose"
        />
        <StatCard
          title="Review Required"
          value={stats.review_required_inspections}
          subtitle="Inconclusive / borderline"
          icon={AlertTriangle}
          colorScheme="amber"
        />
        <StatCard
          title="Defect Rate"
          value={`${stats.defect_rate_pct}%`}
          subtitle={`Avg SSIM: ${(stats.avg_similarity_score * 100).toFixed(1)}%`}
          icon={Percent}
          colorScheme={stats.defect_rate_pct > 20 ? 'rose' : 'blue'}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inspection Trends Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                Inspection Volume & Decision Trends
              </h3>
              <p className="text-xs text-slate-500">Daily pass vs. fail production distribution</p>
            </div>
            <button
              onClick={fetchStats}
              title="Refresh Telemetry"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="h-64 w-full">
            {stats.daily_trends && stats.daily_trends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.daily_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="passed" stroke="#10B981" fillOpacity={1} fill="url(#colorPassed)" name="Passed" />
                  <Area type="monotone" dataKey="failed" stroke="#EF4444" fillOpacity={1} fill="url(#colorFailed)" name="Failed" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No trend telemetry available yet.
              </div>
            )}
          </div>
        </div>

        {/* Defect Category Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Layers size={16} className="text-indigo-600" />
                Defect Category Breakdown
              </h3>
              <p className="text-xs text-slate-500">Distribution by classified flaw type</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={80} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">
                No defects logged in the system.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Inspections Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Recent Component Quality Audits</h3>
            <p className="text-xs text-slate-500">Real-time inspection records loaded directly from SQLite</p>
          </div>
          <button
            onClick={() => onStartInspection()}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>+ New Inspection</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Inspection ID</th>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Component Name</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3 text-right">SSIM Score</th>
                <th className="px-5 py-3 text-right">Defects</th>
                <th className="px-5 py-3 text-right">Affected Area</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_inspections.length > 0 ? (
                stats.recent_inspections.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition font-medium">
                    <td className="px-5 py-3 font-mono font-semibold text-slate-800">{row.id}</td>
                    <td className="px-5 py-3 text-slate-500">{row.timestamp}</td>
                    <td className="px-5 py-3 text-slate-900 font-semibold">{row.component_name}</td>
                    <td className="px-5 py-3">
                      <ResultBadge status={row.result} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-700">
                      {(row.similarity_score * 100).toFixed(1)}%
                    </td>
                    <td className="px-5 py-3 text-right">
                      {row.defect_count > 0 ? (
                        <span className="font-bold text-rose-600 font-mono">{row.defect_count}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium">0 (Clean)</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">
                      {row.total_affected_area_pct.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewInspection(row.id)}
                          className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition cursor-pointer"
                        >
                          View Diagnosis
                        </button>
                        <a
                          href={getReportDownloadUrl(row.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          title="Download PDF Quality Report"
                        >
                          <FileText size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                    No inspections recorded yet. Start your first inspection!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

