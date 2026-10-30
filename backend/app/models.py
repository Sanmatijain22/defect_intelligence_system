from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int

class DetectedDefect(BaseModel):
    id: str
    category: str
    bbox: BoundingBox
    area_px: int
    area_percentage: float
    confidence_score: float  # Anomaly confidence score (0.0 to 1.0)
    severity: str            # "LOW", "MEDIUM", "CRITICAL"
    description: str

class InspectionSummary(BaseModel):
    id: str
    timestamp: str
    component_name: str
    result: str              # "PASS", "FAIL", "REVIEW REQUIRED"
    similarity_score: float  # 0.0 to 1.0
    defect_count: int
    high_severity_count: int
    total_affected_area_pct: float
    reference_image_url: str
    inspection_image_url: str
    annotated_image_url: str
    difference_map_url: str
    aligned: bool
    processing_time_ms: float

class InspectionDetail(InspectionSummary):
    defects: List[DetectedDefect]
    recommendations: List[str]
    metadata: Dict[str, Any] = {}

class DashboardStats(BaseModel):
    total_inspections: int
    passed_inspections: int
    failed_inspections: int
    review_required_inspections: int
    defect_rate_pct: float
    avg_similarity_score: float
    category_distribution: Dict[str, int]
    daily_trends: List[Dict[str, Any]]
    recent_inspections: List[InspectionSummary]

class SettingsUpdate(BaseModel):
    sensitivity: Optional[str] = None
    ssim_pass_threshold: Optional[float] = None
    ssim_review_threshold: Optional[float] = None
    min_defect_area_px: Optional[int] = None
    max_allowed_defect_area_pct: Optional[float] = None
    enable_alignment: Optional[bool] = None
    blur_kernel_size: Optional[int] = None
    clahe_contrast_enhancement: Optional[bool] = None
    inspector_name: Optional[str] = None
    facility_name: Optional[str] = None

