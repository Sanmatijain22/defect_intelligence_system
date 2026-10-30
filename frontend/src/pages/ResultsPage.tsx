import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  Maximize2,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  Scan,
  Compass
} from 'lucide-react';
import { ResultBadge, SeverityBadge, CategoryTag } from '../components/DefectBadge';
import { InspectionDetail } from '../types';
import { getReportDownloadUrl, getExportUrl } from '../api/client';

interface ResultsPageProps {
  inspection: InspectionDetail;
  onNewInspection: () => void;
  onBackToHistory: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  inspection,
  onNewInspection,
  onBackToHistory,
}) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'annotated' | 'difference' | 'compare'>('grid');
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);

  const pdfUrl = getReportDownloadUrl(inspection.id);
  const jsonUrl = getExportUrl(inspection.id, 'json');
  const csvUrl = getExportUrl(inspection.id, 'csv');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action & Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToHistory}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="Back to Inspection Ledger"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">{inspection.id}</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">{inspection.timestamp}</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">
              Quality Audit: <span className="text-blue-700">{inspection.component_name}</span>
            </h1>
          </div>
        </div>

        {/* Action Buttons: PDF Download & Exports */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Download PDF Report</span>
          </a>

          <a
            href={csvUrl}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>Export CSV</span>
          </a>

          <a
            href={jsonUrl}
            download
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <FileCode size={14} className="text-blue-600" />
            <span>Export JSON</span>
          </a>

          <button
            onClick={onNewInspection}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer ml-1"
          >
            <RotateCcw size={14} />
            <span>New Inspection</span>
          </button>
        </div>
      </div>

      {/* Primary Result Banner & Scorecard */}
      <div
        className={`rounded-2xl p-6 border transition shadow-sm ${
          inspection.result === 'PASS'
            ? 'bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 border-emerald-700/50 text-white'
            : inspection.result === 'FAIL'
            ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-slate-900 border-rose-700/50 text-white'
            : 'bg-gradient-to-r from-amber-950 via-amber-900 to-slate-900 border-amber-700/50 text-white'
        }`}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Automated Decision
              </span>
              <ResultBadge status={inspection.result} size="lg" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">
              {inspection.result === 'PASS' && 'Component Approved for Downstream Assembly'}
              {inspection.result === 'FAIL' && 'Quality Deviation Detected – Component Rejected'}
              {inspection.result === 'REVIEW REQUIRED' && 'Inconclusive Metric – Manual Review Required'}
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              {inspection.result === 'PASS' &&
                'Image analysis confirms the manufactured component conforms with engineering tolerances and structural specification.'}
              {inspection.result === 'FAIL' &&
                `Automated CV detection flagged ${inspection.defect_count} defect region(s) encompassing ${inspection.total_affected_area_pct}% of surface area exceeding quality tolerances.`}
              {inspection.result === 'REVIEW REQUIRED' &&
                'Marginal structural variance or lighting disparity detected. Auditor visual confirmation recommended under calibrated illumination.'}
            </p>
          </div>

          {/* Quick Metrics Capsule */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0 font-mono">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-sans">
                Similarity (SSIM)
              </span>
              <span className="text-lg font-bold text-white">
                {(inspection.similarity_score * 100).toFixed(2)}%
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-sans">
                Defect Regions
              </span>
              <span
                className={`text-lg font-bold ${
                  inspection.defect_count > 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {inspection.defect_count}
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-sans">
                Affected Area
              </span>
              <span className="text-lg font-bold text-white">
                {inspection.total_affected_area_pct.toFixed(2)}%
              </span>
            </div>

            <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/10">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-sans">
                Compute Time
              </span>
              <span className="text-lg font-bold text-slate-200">
                {inspection.processing_time_ms.toFixed(0)} ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Evidence Showcase: 4-Pane Comparative Quad View */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers size={16} className="text-blue-600" />
              Comparative Computer Vision Evidence
            </h3>
            <p className="text-xs text-slate-500">
              Inspect original reference, test item, structural heatmap, and bounded defect regions
            </p>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              4-Pane Quad View
            </button>
            <button
              onClick={() => setActiveTab('annotated')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'annotated' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Annotated Defects
            </button>
            <button
              onClick={() => setActiveTab('difference')}
              className={`px-3 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'difference' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
              }`}
            >
              Difference Heatmap
            </button>
          </div>
        </div>

        {/* Dynamic Display Mode */}
        {activeTab === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Golden Reference */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex flex-col">
              <div className="bg-slate-800/90 px-3.5 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-white">
                <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 size={13} /> Golden Reference (Good Part)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Figure A</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 bg-black/40 min-h-[300px]">
                <img
                  src={inspection.reference_image_url}
                  alt="Reference Good Part"
                  className="max-h-72 max-w-full object-contain rounded"
                />
              </div>
            </div>

            {/* 2. Inspected Component */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex flex-col">
              <div className="bg-slate-800/90 px-3.5 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-white">
                <span className="font-bold flex items-center gap-1.5 text-blue-400">
                  <Scan size={13} /> Inspected Component (Raw Capture)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Figure B</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 bg-black/40 min-h-[300px]">
                <img
                  src={inspection.inspection_image_url}
                  alt="Inspected Part Raw"
                  className="max-h-72 max-w-full object-contain rounded"
                />
              </div>
            </div>

            {/* 3. SSIM Difference Heatmap */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex flex-col">
              <div className="bg-slate-800/90 px-3.5 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-white">
                <span className="font-bold flex items-center gap-1.5 text-amber-400">
                  <Compass size={13} /> SSIM Difference Heatmap
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Figure C (JET Colormap)</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 bg-black/40 min-h-[300px]">
                <img
                  src={inspection.difference_map_url}
                  alt="Difference Heatmap"
                  className="max-h-72 max-w-full object-contain rounded"
                />
              </div>
            </div>

            {/* 4. Annotated Defect Image */}
            <div className="rounded-xl border border-slate-200 bg-slate-900 overflow-hidden flex flex-col">
              <div className="bg-slate-800/90 px-3.5 py-2 border-b border-slate-700/80 flex items-center justify-between text-xs text-white">
                <span className="font-bold flex items-center gap-1.5 text-rose-400">
                  <Sparkles size={13} /> Defect Highlighted &amp; Bounded
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Figure D (CV Output)</span>
              </div>
              <div className="p-2 flex items-center justify-center flex-1 bg-black/40 min-h-[300px]">
                <img
                  src={inspection.annotated_image_url}
                  alt="Annotated Defects"
                  className="max-h-72 max-w-full object-contain rounded"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'annotated' && (
          <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 flex items-center justify-center min-h-[460px]">
            <img
              src={inspection.annotated_image_url}
              alt="Annotated Defects Large"
              className="max-h-[500px] max-w-full object-contain rounded shadow-lg"
            />
          </div>
        )}

        {activeTab === 'difference' && (
          <div className="rounded-xl border border-slate-200 bg-slate-950 p-4 flex items-center justify-center min-h-[460px]">
            <img
              src={inspection.difference_map_url}
              alt="Difference Map Large"
              className="max-h-[500px] max-w-full object-contain rounded shadow-lg"
            />
          </div>
        )}
      </div>

      {/* Defect Registry Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Detected Anomalies &amp; Defect Registry
            </h3>
            <p className="text-xs text-slate-500">
              Granular geometric, spatial, and severity parameters identified by the CV pipeline
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
            Total Defects: {inspection.defects.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-3">Defect ID</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3 text-right">Confidence Score</th>
                <th className="px-5 py-3">Bounding Box (X, Y, W, H)</th>
                <th className="px-5 py-3 text-right">Affected Area</th>
                <th className="px-5 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspection.defects.length > 0 ? (
                inspection.defects.map((defect) => {
                  const b = defect.bbox;
                  return (
                    <tr
                      key={defect.id}
                      onClick={() => setSelectedDefectId(defect.id)}
                      className="hover:bg-slate-50/80 transition cursor-pointer font-medium"
                    >
                      <td className="px-5 py-3 font-mono font-bold text-slate-900">{defect.id}</td>
                      <td className="px-5 py-3">
                        <CategoryTag category={defect.category} />
                      </td>
                      <td className="px-5 py-3">
                        <SeverityBadge severity={defect.severity} />
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-semibold text-slate-700">
                        {(defect.confidence_score * 100).toFixed(0)}%
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-600">
                        [{b.x}, {b.y}, {b.width}, {b.height}]
                      </td>
                      <td className="px-5 py-3 text-right font-mono">
                        <span className="font-bold text-slate-800">{defect.area_percentage.toFixed(2)}%</span>
                        <span className="text-slate-400 text-[10px] ml-1">({defect.area_px} px)</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 max-w-xs">{defect.description}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-emerald-700 bg-emerald-50/40">
                    <CheckCircle2 size={24} className="mx-auto mb-1 text-emerald-600" />
                    <p className="font-semibold text-sm">No anomalous defects detected.</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Component matches golden reference profile and satisfies standard tolerances.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Quality Engineering Recommendations */}
      <div className="bg-blue-50/60 rounded-xl border border-blue-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-blue-700" />
          <h3 className="text-sm font-bold text-blue-950 tracking-tight">
            Quality Engineering Action Recommendations
          </h3>
        </div>

        <ul className="space-y-2">
          {inspection.recommendations && inspection.recommendations.length > 0 ? (
            inspection.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-blue-900 leading-relaxed font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0"></span>
                <span>{rec}</span>
              </li>
            ))
          ) : (
            <li className="text-xs text-slate-600">No specific rework actions required.</li>
          )}
        </ul>
      </div>
    </div>
  );
};

