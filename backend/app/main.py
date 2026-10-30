import os
import io
import csv
import json
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .config import STORAGE_DIR, REPORTS_DIR, SAMPLES_DIR
from .database import (
    init_db, save_inspection, get_inspection, get_all_inspections, 
    get_dashboard_stats, get_settings, update_settings
)
from .cv.pipeline import run_inspection_pipeline
from .reports.pdf_generator import generate_pdf_report
from .models import (
    InspectionSummary, InspectionDetail, DashboardStats, SettingsUpdate
)

app = FastAPI(
    title="Smart Manufacturing AI - Visual Quality Inspection API",
    description="Automated Visual Quality Inspection & Defect Intelligence System for Automotive & Tractor Manufacturing",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded images and reports
app.mount("/uploads", StaticFiles(directory=str(STORAGE_DIR)), name="uploads")
app.mount("/samples", StaticFiles(directory=str(SAMPLES_DIR)), name="samples")

@app.on_event("startup")
def on_startup():
    init_db()
    # Check if DB has any records; if empty, run initial demo inspections
    stats = get_dashboard_stats()
    if stats["total_inspections"] == 0:
        seed_initial_demo_inspections()

def seed_initial_demo_inspections():
    """Seeds initial real-world demo inspections from generated sample pairs."""
    sample_pairs = [
        ("gearbox_casing_good.png", "gearbox_casing_defective.png", "Gearbox casing"),
        ("engine_housing_good.png", "engine_housing_defective.png", "Tractor engine housing"),
        ("hydraulic_bracket_good.png", "hydraulic_bracket_defective.png", "Hydraulic component"),
        ("engine_housing_pass_good.png", "engine_housing_pass_insp.png", "Tractor engine housing")
    ]
    settings = get_settings()
    for ref_name, insp_name, comp_name in sample_pairs:
        ref_path = SAMPLES_DIR / ref_name
        insp_path = SAMPLES_DIR / insp_name
        if ref_path.exists() and insp_path.exists():
            with open(ref_path, "rb") as rf, open(insp_path, "rb") as inf:
                res = run_inspection_pipeline(
                    ref_image_bytes=rf.read(),
                    insp_image_bytes=inf.read(),
                    component_name=comp_name,
                    output_dir=STORAGE_DIR,
                    settings=settings
                )
                save_inspection(res, res["defects"])
                # Generate PDF
                try:
                    generate_pdf_report(res)
                except Exception as e:
                    print(f"Error generating seed PDF: {e}")

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Smart Manufacturing AI Inspection Engine",
        "version": "1.0.0"
    }

@app.get("/api/dashboard/stats", response_model=DashboardStats)
def get_stats():
    return get_dashboard_stats()

@app.get("/api/inspections", response_model=List[InspectionSummary])
def list_inspections(
    component_name: Optional[str] = Query(None),
    result: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500)
):
    return get_all_inspections(component_name=component_name, result=result, search=search, limit=limit)

@app.get("/api/inspections/{inspection_id}", response_model=InspectionDetail)
def get_inspection_detail(inspection_id: str):
    inspection = get_inspection(inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection

@app.post("/api/inspect")
async def run_inspection(
    reference_image: UploadFile = File(...),
    inspection_image: UploadFile = File(...),
    component_name: str = Form(...)
):
    # Validation
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}
    ref_ext = Path(reference_image.filename).suffix.lower()
    insp_ext = Path(inspection_image.filename).suffix.lower()

    if ref_ext not in allowed_extensions or insp_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail="Invalid image format. Supported formats: JPG, JPEG, PNG, WEBP, BMP"
        )

    ref_bytes = await reference_image.read()
    insp_bytes = await inspection_image.read()

    if len(ref_bytes) == 0 or len(insp_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    settings = get_settings()

    try:
        inspection_result = run_inspection_pipeline(
            ref_image_bytes=ref_bytes,
            insp_image_bytes=insp_bytes,
            component_name=component_name.strip(),
            output_dir=STORAGE_DIR,
            settings=settings
        )

        # Save to SQLite database
        save_inspection(inspection_result, inspection_result["defects"])

        # Generate PDF report automatically
        try:
            generate_pdf_report(inspection_result)
        except Exception as pdf_err:
            print(f"Warning: PDF generation failed: {pdf_err}")

        return inspection_result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inspection pipeline failure: {str(e)}")

@app.get("/api/inspections/{inspection_id}/report")
def download_inspection_report(inspection_id: str):
    inspection = get_inspection(inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    pdf_path = REPORTS_DIR / f"{inspection_id}_report.pdf"
    if not pdf_path.exists():
        # Generate on the fly if not already generated
        generate_pdf_report(inspection)

    if not pdf_path.exists():
        raise HTTPException(status_code=500, detail="Failed to locate or generate PDF report.")

    return FileResponse(
        path=str(pdf_path),
        filename=f"{inspection_id}_Quality_Report.pdf",
        media_type="application/pdf"
    )

@app.get("/api/inspections/{inspection_id}/export")
def export_inspection_data(inspection_id: str, format: str = Query("json", pattern="^(json|csv)$")):
    inspection = get_inspection(inspection_id)
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    if format == "json":
        return JSONResponse(
            content=inspection,
            headers={"Content-Disposition": f'attachment; filename="{inspection_id}_export.json"'}
        )
    else:
        # CSV Export
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Inspection ID", "Timestamp", "Component", "Result", "SSIM Score", "Defect Count", "Total Area %"])
        writer.writerow([
            inspection["id"], inspection["timestamp"], inspection["component_name"],
            inspection["result"], inspection["similarity_score"], inspection["defect_count"],
            inspection["total_affected_area_pct"]
        ])
        writer.writerow([])
        writer.writerow(["Defect ID", "Category", "Severity", "Score", "BBox X", "BBox Y", "BBox W", "BBox H", "Area (px)", "Area (%)", "Description"])
        for d in inspection.get("defects", []):
            b = d["bbox"]
            writer.writerow([
                d["id"], d["category"], d["severity"], d["confidence_score"],
                b["x"], b["y"], b["width"], b["height"], d["area_px"], d["area_percentage"], d.get("description", "")
            ])
        output.seek(0)
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{inspection_id}_defects.csv"'}
        )

@app.get("/api/settings")
def read_settings():
    return get_settings()

@app.post("/api/settings")
def save_app_settings(updates: SettingsUpdate):
    updated = update_settings(updates.model_dump(exclude_unset=True))
    return updated

@app.get("/api/samples")
def list_demo_samples():
    """Returns catalog of pre-generated sample pairs for 1-click test inspection."""
    return [
        {
            "id": "gearbox",
            "name": "Tractor Gearbox Casing (Scratch & Dent)",
            "component": "Gearbox casing",
            "expected_result": "FAIL",
            "good_url": "/samples/gearbox_casing_good.png",
            "defective_url": "/samples/gearbox_casing_defective.png",
            "description": "Machined cast iron gearbox casing exhibiting a surface scratch and plastic impact dent."
        },
        {
            "id": "engine_crack",
            "name": "Tractor Engine Housing (Structural Crack)",
            "component": "Tractor engine housing",
            "expected_result": "FAIL",
            "good_url": "/samples/engine_housing_good.png",
            "defective_url": "/samples/engine_housing_defective.png",
            "description": "Cast engine cylinder block exhibiting an upper structural propagating crack."
        },
        {
            "id": "hydraulic_corrosion",
            "name": "Hydraulic Component (Oxidation & Surface Damage)",
            "component": "Hydraulic component",
            "expected_result": "FAIL",
            "good_url": "/samples/hydraulic_bracket_good.png",
            "defective_url": "/samples/hydraulic_bracket_defective.png",
            "description": "Hydraulic mounting bracket exhibiting localized surface corrosion and oxidation bloom."
        },
        {
            "id": "engine_pass",
            "name": "Tractor Engine Housing (Conforming Part - PASS)",
            "component": "Tractor engine housing",
            "expected_result": "PASS",
            "good_url": "/samples/engine_housing_pass_good.png",
            "defective_url": "/samples/engine_housing_pass_insp.png",
            "description": "Conforming manufacturing run component complying with all quality tolerances."
        }
    ]

# Serve built frontend if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")
