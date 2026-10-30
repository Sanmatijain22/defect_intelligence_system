import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  ScanEye,
  Layers,
  Sparkles,
  RefreshCw,
  X,
  Play,
  ArrowRight
} from 'lucide-react';
import { runInspection, getSamples, resolveAssetUrl } from '../api/client';
import { InspectionDetail, DemoSample } from '../types';

interface NewInspectionPageProps {
  onInspectionComplete: (result: InspectionDetail) => void;
}

const PRESET_COMPONENTS = [
  'Tractor engine housing',
  'Gearbox casing',
  'Metal bracket',
  'Hydraulic component',
  'Gear assembly',
  'Bearing housing',
  'Custom component',
];

export const NewInspectionPage: React.FC<NewInspectionPageProps> = ({
  onInspectionComplete,
}) => {
  const [selectedComponent, setSelectedComponent] = useState(PRESET_COMPONENTS[0]);
  const [customComponentName, setCustomComponentName] = useState('');

  const [refFile, setRefFile] = useState<File | Blob | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);

  const [inspFile, setInspFile] = useState<File | Blob | null>(null);
  const [inspPreview, setInspPreview] = useState<string | null>(null);

  const [samples, setSamples] = useState<DemoSample[]>([]);
  const [loadingSamples, setLoadingSamples] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refInputRef = useRef<HTMLInputElement>(null);
  const inspInputRef = useRef<HTMLInputElement>(null);

  // Fetch samples on mount
  useEffect(() => {
    async function loadSampleCatalog() {
      try {
        setLoadingSamples(true);
        const data = await getSamples();
        setSamples(data);
      } catch (err) {
        console.error('Failed to load sample items', err);
      } finally {
        setLoadingSamples(false);
      }
    }
    loadSampleCatalog();
  }, []);

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRefFile(file);
      setRefPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  const handleInspUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInspFile(file);
      setInspPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  // 1-Click Load Sample Demo Item
  const handleLoadSample = async (sample: DemoSample) => {
    try {
      setErrorMessage(null);
      setSelectedComponent(sample.component);

      // Fetch sample good & defective images as blobs from backend
      const [resGood, resDef] = await Promise.all([
        fetch(resolveAssetUrl(sample.good_url)),
        fetch(resolveAssetUrl(sample.defective_url)),
      ]);

      if (!resGood.ok || !resDef.ok) {
        throw new Error(
          `Unable to retrieve sample images from backend (${!resGood.ok ? resGood.status : resDef.status})`
        );
      }

      const blobGood = await resGood.blob();
      const blobDef = await resDef.blob();

      setRefFile(blobGood);
      setRefPreview(URL.createObjectURL(blobGood));

      setInspFile(blobDef);
      setInspPreview(URL.createObjectURL(blobDef));
    } catch (err: any) {
      setErrorMessage('Failed to load demo sample images: ' + err.message);
    }
  };

  const clearRef = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRefFile(null);
    setRefPreview(null);
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const clearInsp = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInspFile(null);
    setInspPreview(null);
    if (inspInputRef.current) inspInputRef.current.value = '';
  };

  const effectiveComponentName =
    selectedComponent === 'Custom component'
      ? customComponentName.trim() || 'Custom tractor component'
      : selectedComponent;

  const canInspect = refFile !== null && inspFile !== null && !isProcessing;

  const inspectionSteps = [
    'Validating image formats and resolution dimensions...',
    'Performing bilateral noise reduction & CLAHE contrast enhancement...',
    'Executing ORB feature matching and Homography image alignment...',
    'Computing Structural Similarity Index (SSIM) difference matrix...',
    'Thresholding difference map & extracting candidate defect contours...',
    'Classifying defect geometries (Scratches, Cracks, Dents, Corrosion)...',
    'Generating annotated evidence & certified quality PDF inspection report...',
  ];

  const handleRunInspection = async () => {
    if (!canInspect) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setCurrentStep(0);

      // Animate progress steps for realistic industrial feel
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev < inspectionSteps.length - 1 ? prev + 1 : prev));
      }, 500);

      const result = await runInspection(refFile!, inspFile!, effectiveComponentName);

      clearInterval(interval);
      setCurrentStep(inspectionSteps.length - 1);

      // Slight delay to showcase completion before navigating to results
      setTimeout(() => {
        setIsProcessing(false);
        onInspectionComplete(result);
      }, 600);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Inspection pipeline failed. Please retry.');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Workflow Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Inspection Workflow
            </span>
            <span className="text-xs text-slate-500 font-mono">ISO-9001 / IATF-16949 Auditing</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Select Component & Upload Inspection Image Pair
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare a golden reference image with a fabricated tractor component to detect flaws automatically.
          </p>
        </div>

        {/* 1-Click Demo Samples Quick Bar */}
        {samples.length > 0 && (
          <div className="w-full md:w-auto bg-slate-50 border border-slate-200/80 rounded-xl p-3 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles size={14} className="text-amber-500" />
              <span>1-Click Test Scenarios (Sample Datasets):</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samples.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleLoadSample(s)}
                  disabled={isProcessing}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg text-slate-700 transition shadow-2xs cursor-pointer"
                >
                  {s.id === 'gearbox' && '⚙️ Gearbox (Scratch/Dent)'}
                  {s.id === 'engine_crack' && '⚡ Engine (Crack)'}
                  {s.id === 'hydraulic_corrosion' && '🔩 Hydraulic (Corrosion)'}
                  {s.id === 'engine_pass' && '✅ Conforming (PASS)'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: Component Selection */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            STEP 1: Component Specification
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Tractor Component Type:
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {PRESET_COMPONENTS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {selectedComponent === 'Custom component' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Enter Custom Component Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Front Axle Hub Casting"
                value={customComponentName}
                onChange={(e) => setCustomComponentName(e.target.value)}
                disabled={isProcessing}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: Upload Reference & Inspection Image Panels */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            2
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              STEP 2: Upload Reference & Inspection Images
            </h3>
            <p className="text-xs text-slate-500">
              Provide both the golden standard image and the fabricated component image to inspect.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel A: GOOD COMPONENT - Reference Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" />
                Panel A: Good Component (Reference)
              </span>
              {refPreview && (
                <button
                  onClick={clearRef}
                  disabled={isProcessing}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <X size={13} /> Clear
                </button>
              )}
            </div>

            <div
              onClick={() => !isProcessing && refInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-72 flex flex-col items-center justify-center text-center p-4 transition cursor-pointer overflow-hidden ${
                refPreview
                  ? 'border-emerald-400 bg-slate-900'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={refInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleRefUpload}
                disabled={isProcessing}
                className="hidden"
              />

              {refPreview ? (
                <>
                  <img
                    src={refPreview}
                    alt="Good Reference Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold tracking-wider uppercase">
                    Golden Reference
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload Good Reference Image
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports JPG, JPEG, PNG (Max 15MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel B: INSPECTION COMPONENT - Image to Inspect */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <ScanEye size={14} className="text-blue-600" />
                Panel B: Inspection Component (To Inspect)
              </span>
              {inspPreview && (
                <button
                  onClick={clearInsp}
                  disabled={isProcessing}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <X size={13} /> Clear
                </button>
              )}
            </div>

            <div
              onClick={() => !isProcessing && inspInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-72 flex flex-col items-center justify-center text-center p-4 transition cursor-pointer overflow-hidden ${
                inspPreview
                  ? 'border-blue-400 bg-slate-900'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={inspInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleInspUpload}
                disabled={isProcessing}
                className="hidden"
              />

              {inspPreview ? (
                <>
                  <img
                    src={inspPreview}
                    alt="Inspection Image Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-blue-600/90 text-white text-[10px] font-bold tracking-wider uppercase">
                    Inspected Part
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Click to upload Inspection Image
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Supports JPG, JPEG, PNG (Max 15MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Feedback */}
      {errorMessage && (
        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress & Processing Stepper */}
      {isProcessing && (
        <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-sm font-bold">Executing Automated Computer Vision Pipeline</span>
            </div>
            <span className="text-xs font-mono text-blue-300">
              Stage {currentStep + 1} of {inspectionSteps.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
              style={{
                width: `${Math.round(((currentStep + 1) / inspectionSteps.length) * 100)}%`,
              }}
            ></div>
          </div>

          <p className="text-xs font-mono text-slate-300">
            &gt; {inspectionSteps[currentStep]}
          </p>
        </div>
      )}

      {/* Action Execution Button */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="text-xs text-slate-500">
          {!refFile || !inspFile ? (
            <span className="text-amber-600 font-medium flex items-center gap-1.5">
              <AlertCircle size={14} /> Please upload both reference and inspection images to enable analysis.
            </span>
          ) : (
            <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Ready: Component specified and image pair loaded.
            </span>
          )}
        </div>

        <button
          onClick={handleRunInspection}
          disabled={!canInspect}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition shadow-md cursor-pointer ${
            canInspect
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {isProcessing ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />
              <span>Execute AI Inspection</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

