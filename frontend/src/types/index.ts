export type InspectionResultStatus = 'PASS' | 'FAIL' | 'REVIEW REQUIRED';
export type DefectSeverity = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedDefect {
  id: string;
  category: string;
  bbox: BoundingBox;
  area_px: number;
  area_percentage: number;
  confidence_score: number;
  severity: DefectSeverity;
  description: string;
}

export interface InspectionSummary {
  id: string;
  timestamp: string;
  component_name: string;
  result: InspectionResultStatus;
  similarity_score: number;
  defect_count: number;
  high_severity_count: number;
  total_affected_area_pct: number;
  reference_image_url: string;
  inspection_image_url: string;
  annotated_image_url: string;
  difference_map_url: string;
  aligned: boolean;
  processing_time_ms: number;
}

export interface InspectionDetail extends InspectionSummary {
  defects: DetectedDefect[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface DashboardStats {
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  review_required_inspections: number;
  defect_rate_pct: number;
  avg_similarity_score: number;
  category_distribution: Record<string, number>;
  daily_trends: Array<{
    date: string;
    total: number;
    passed: number;
    failed: number;
    review: number;
  }>;
  recent_inspections: InspectionSummary[];
}

export interface AppSettings {
  sensitivity: 'Low' | 'Medium' | 'High';
  ssim_pass_threshold: number;
  ssim_review_threshold: number;
  min_defect_area_px: number;
  max_allowed_defect_area_pct: number;
  enable_alignment: boolean;
  blur_kernel_size: number;
  clahe_contrast_enhancement: boolean;
  inspector_name: string;
  facility_name: string;
}

export interface DemoSample {
  id: string;
  name: string;
  component: string;
  expected_result: string;
  good_url: string;
  defective_url: string;
  description: string;
}

