import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
STORAGE_DIR = BASE_DIR / "uploads"
DATA_DIR = BASE_DIR / "data"
REPORTS_DIR = STORAGE_DIR / "reports"
SAMPLES_DIR = Path(__file__).resolve().parent / "sample_data"

# Ensure directories exist
for p in [STORAGE_DIR, DATA_DIR, REPORTS_DIR, SAMPLES_DIR]:
    p.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "inspections.db"

# Default Quality & Inspection Thresholds
DEFAULT_SETTINGS = {
    "sensitivity": "Medium",           # "Low", "Medium", "High"
    "ssim_pass_threshold": 0.88,       # SSIM score below this triggers FAIL / REVIEW
    "ssim_review_threshold": 0.80,     # Below this is definitely FAIL, between review and pass is REVIEW
    "min_defect_area_px": 80,          # Filter out tiny camera sensor noise
    "max_allowed_defect_area_pct": 1.5,# > 1.5% area affected fails component
    "enable_alignment": True,          # Align images using ORB feature matching
    "blur_kernel_size": 5,             # Bilateral/Gaussian smoothing parameter
    "clahe_contrast_enhancement": True,# Adaptively balance lighting variations
    "inspector_name": "Shift A Quality Auditor",
    "facility_name": "Tractor Assembly Plant - Quality Unit 4"
}
