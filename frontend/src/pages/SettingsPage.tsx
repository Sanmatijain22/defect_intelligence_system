import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Shield,
  Eye,
  Building,
  Save,
  CheckCircle2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { AppSettings } from '../types';
import { getSettings, saveSettings } from '../api/client';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAppSettings() {
      try {
        setLoading(true);
        const data = await getSettings();
        setSettings(data);
      } catch (err: any) {
        setErrorMsg('Failed to load settings: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAppSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setSuccessMsg(null);
      setErrorMsg(null);
      const updated = await saveSettings(settings);
      setSettings(updated);
      setSuccessMsg('Configuration parameters successfully persisted to system database.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Failed to save settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 tracking-tight">
          System Quality Parameters &amp; Vision Configuration
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune computer vision algorithms, detection sensitivity thresholds, and shop-floor audit metadata.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Anomaly Sensitivity & Decision Thresholds */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={18} className="text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Anomaly Sensitivity &amp; Decision Criteria
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sensitivity Preset */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Defect Detection Sensitivity:
              </label>
              <select
                value={settings.sensitivity}
                onChange={(e) =>
                  setSettings({ ...settings, sensitivity: e.target.value as any })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              >
                <option value="Low">Low (Tolerant – filters minor lighting variations)</option>
                <option value="Medium">Medium (Balanced standard industrial baseline)</option>
                <option value="High">High (Strict – flags hairline micro-scratches)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Modulates the difference threshold and morphological opening kernel.
              </p>
            </div>

            {/* SSIM Pass Threshold */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                <span>SSIM Pass Threshold:</span>
                <span className="font-mono text-blue-700 font-bold">
                  {(settings.ssim_pass_threshold * 100).toFixed(0)}%
                </span>
              </label>
              <input
                type="range"
                min="0.70"
                max="0.98"
                step="0.01"
                value={settings.ssim_pass_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ssim_pass_threshold: parseFloat(e.target.value),
                  })
                }
                className="w-full cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Inspections scoring above this value with 0 anomalies are graded as PASS.
              </p>
            </div>

            {/* Min Defect Area */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Minimum Defect Area (Pixels):
              </label>
              <input
                type="number"
                min="20"
                max="1000"
                step="10"
                value={settings.min_defect_area_px}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    min_defect_area_px: parseInt(e.target.value) || 50,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Filters out camera sensor speckles smaller than this pixel area.
              </p>
            </div>

            {/* Max Allowed Defect Area % */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex justify-between">
                <span>Max Allowed Defect Surface Area:</span>
                <span className="font-mono text-blue-700 font-bold">
                  {settings.max_allowed_defect_area_pct}%
                </span>
              </label>
              <input
                type="range"
                min="0.2"
                max="5.0"
                step="0.1"
                value={settings.max_allowed_defect_area_pct}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    max_allowed_defect_area_pct: parseFloat(e.target.value),
                  })
                }
                className="w-full cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Any component with aggregate flaw area exceeding this percentage is marked FAIL.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Image Preprocessing Options */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Eye size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Computer Vision Preprocessing Pipeline
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enable_alignment}
                onChange={(e) =>
                  setSettings({ ...settings, enable_alignment: e.target.checked })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Feature-Based ORB Image Alignment
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Compensates for camera tilt, rotation, and translation vibration on the line.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.clahe_contrast_enhancement}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    clahe_contrast_enhancement: e.target.checked,
                  })
                }
                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <div>
                <p className="text-xs font-bold text-slate-800">
                  CLAHE Adaptive Contrast Equalization
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Balances non-uniform factory illumination and localized shadows.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Inspection Metadata & Audit Sign-off */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building size={18} className="text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">
              Plant Quality Metadata &amp; Inspector Sign-Off
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Designated Quality Auditor:
              </label>
              <input
                type="text"
                value={settings.inspector_name}
                onChange={(e) =>
                  setSettings({ ...settings, inspector_name: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Manufacturing Facility / Assembly Unit:
              </label>
              <input
                type="text"
                value={settings.facility_name}
                onChange={(e) =>
                  setSettings({ ...settings, facility_name: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 cursor-pointer"
          >
            {saving ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Persisting...</span>
              </>
            ) : (
              <>
                <Save size={15} />
                <span>Save Quality Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

