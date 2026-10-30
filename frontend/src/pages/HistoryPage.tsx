import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { ResultBadge } from '../components/DefectBadge';
import { InspectionSummary } from '../types';
import { getInspections, getReportDownloadUrl, getExportUrl } from '../api/client';

interface HistoryPageProps {
  onSelectInspection: (id: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onSelectInspection }) => {
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComponent, setSelectedComponent] = useState('All');
  const [selectedResult, setSelectedResult] = useState('All');

  const fetchInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInspections({
        component_name: selectedComponent !== 'All' ? selectedComponent : undefined,
        result: selectedResult !== 'All' ? selectedResult : undefined,
        search: searchTerm.trim() || undefined,
      });
      setInspections(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [selectedComponent, selectedResult]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInspections();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Inspection Ledger &amp; Quality Audit Records
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical component quality inspections persistently archived in local SQLite database
          </p>
        </div>

        <button
          onClick={fetchInspections}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or component..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Result Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Result:</span>
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Results</option>
              <option value="PASS">PASS (Conforming)</option>
              <option value="FAIL">FAIL (Defective)</option>
              <option value="REVIEW REQUIRED">REVIEW REQUIRED</option>
            </select>
          </div>

          {/* Component Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Component:</span>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="All">All Components</option>
              <option value="Tractor engine housing">Tractor engine housing</option>
              <option value="Gearbox casing">Gearbox casing</option>
              <option value="Metal bracket">Metal bracket</option>
              <option value="Hydraulic component">Hydraulic component</option>
              <option value="Gear assembly">Gear assembly</option>
              <option value="Bearing housing">Bearing housing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inspections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
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
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                    <span>Loading inspection history...</span>
                  </td>
                </tr>
              ) : inspections.length > 0 ? (
                inspections.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition font-medium">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">{row.id}</td>
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
                        <span className="text-emerald-600 font-medium">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-slate-600">
                      {row.total_affected_area_pct.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onSelectInspection(row.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] transition cursor-pointer"
                          title="View complete diagnosis & visual evidence"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        <a
                          href={getReportDownloadUrl(row.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-slate-100 transition"
                          title="Download PDF Quality Report"
                        >
                          <FileText size={15} />
                        </a>

                        <a
                          href={getExportUrl(row.id, 'csv')}
                          download
                          className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition"
                          title="Export CSV"
                        >
                          <FileSpreadsheet size={15} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                    No matching inspection records found in the ledger.
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

