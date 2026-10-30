import cv2
import numpy as np
import uuid
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple

from .preprocessor import preprocess_for_inspection, TARGET_WIDTH, TARGET_HEIGHT
from .aligner import align_images
from .ssim_analyzer import compute_ssim_and_diff
from .classifier import extract_region_features, classify_defect

# Colors for bounding boxes and labels (BGR format)
COLOR_CRITICAL = (0, 0, 220)    # Crimson Red
COLOR_MEDIUM = (0, 140, 255)    # Orange
COLOR_LOW = (0, 215, 255)       # Amber / Yellow
COLOR_UNCLASSIFIED = (180, 105, 255) # Pink / Magenta

def run_inspection_pipeline(
    ref_image_bytes: bytes,
    insp_image_bytes: bytes,
    component_name: str,
    output_dir: Path,
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Executes the end-to-end computer vision inspection pipeline.
    """
    start_time = time.time()
    inspection_id = f"INSP-{int(time.time())}-{uuid.uuid4().hex[:6].upper()}"

    # 1. Decode Images
    ref_arr = np.frombuffer(ref_image_bytes, np.uint8)
    insp_arr = np.frombuffer(insp_image_bytes, np.uint8)

    ref_orig = cv2.imdecode(ref_arr, cv2.IMREAD_COLOR)
    insp_orig = cv2.imdecode(insp_arr, cv2.IMREAD_COLOR)

    if ref_orig is None or insp_orig is None:
        raise ValueError("Failed to decode uploaded image files. Please verify valid JPG, JPEG, or PNG format.")

    # 2. Preprocess Images
    enable_clahe = settings.get("clahe_contrast_enhancement", True)
    blur_kernel = settings.get("blur_kernel_size", 5)

    ref_prep = preprocess_for_inspection(ref_orig, enable_clahe=enable_clahe, blur_kernel=blur_kernel)
    insp_prep = preprocess_for_inspection(insp_orig, enable_clahe=enable_clahe, blur_kernel=blur_kernel)

    ref_color = ref_prep["resized_color"]
    insp_color = insp_prep["resized_color"]
    ref_gray = ref_prep["enhanced_gray"]
    insp_gray = insp_prep["enhanced_gray"]

    # 3. Image Alignment (ORB + Homography)
    aligned_status = True
    enable_alignment = settings.get("enable_alignment", True)

    if enable_alignment:
        aligned_insp_color, success, align_score = align_images(ref_color, insp_color)
        if success:
            insp_color = aligned_insp_color
            insp_prep = preprocess_for_inspection(insp_color, enable_clahe=enable_clahe, blur_kernel=blur_kernel)
            insp_gray = insp_prep["enhanced_gray"]
        else:
            aligned_status = False
    else:
        aligned_status = False

    # 4. Structural Similarity & Difference Map
    ssim_score, diff_gray, diff_heatmap = compute_ssim_and_diff(ref_gray, insp_gray)

    # 5. Sensitivity Thresholding & Noise Suppression
    sensitivity = settings.get("sensitivity", "Medium")
    if sensitivity == "High":
        thresh_val = 26
    elif sensitivity == "Low":
        thresh_val = 48
    else:
        thresh_val = 36  # Medium

    # Binary thresholding on difference map
    _, binary_mask = cv2.threshold(diff_gray, thresh_val, 255, cv2.THRESH_BINARY)

    # Morphological closing to bridge close fractured defects (e.g. cracks or scratch gaps)
    close_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, close_kernel)

    # Suppress outer border margin to prevent camera frame/warping edge artifacts
    border_margin = 8
    cleaned_mask[:border_margin, :] = 0
    cleaned_mask[-border_margin:, :] = 0
    cleaned_mask[:, :border_margin] = 0
    cleaned_mask[:, -border_margin:] = 0

    # 6. Anomaly Region Detection (Contour Extraction)
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    min_area_px = settings.get("min_defect_area_px", 80)
    total_img_area = TARGET_WIDTH * TARGET_HEIGHT

    defects: List[Dict[str, Any]] = []
    annotated_img = insp_color.copy()

    defect_idx = 1
    total_defect_area_px = 0
    high_severity_count = 0

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_area_px:
            continue  # Ignore negligible camera sensor or ambient lighting noise

        x_b, y_b, w_b, h_b = cv2.boundingRect(cnt)
        # Filter out whole-canvas frame edge artifacts
        if w_b >= TARGET_WIDTH - 20 and h_b >= TARGET_HEIGHT - 20:
            continue

        features = extract_region_features(
            contour=cnt,
            ref_color=ref_color,
            insp_color=insp_color,
            ref_gray=ref_gray,
            insp_gray=insp_gray,
            diff_gray=diff_gray
        )

        category, severity, confidence, desc = classify_defect(features, total_img_area)

        x, y, w, h = features["bbox"]
        area_pct = round((area / total_img_area) * 100, 3)
        total_defect_area_px += area

        if severity == "CRITICAL":
            high_severity_count += 1
            box_color = COLOR_CRITICAL
        elif severity == "MEDIUM":
            box_color = COLOR_MEDIUM
        else:
            box_color = COLOR_LOW

        if category == "Unclassified anomaly":
            box_color = COLOR_UNCLASSIFIED

        defect_id = f"DEF-{defect_idx:02d}"

        # Draw visual bounding box and label badge
        # Bounding box
        cv2.rectangle(annotated_img, (x, y), (x + w, y + h), box_color, 2)
        # Draw contour line inside box for exact shape visualization
        cv2.drawContours(annotated_img, [cnt], -1, box_color, 1)

        # Label tag background
        label_text = f"{defect_id}: {category} ({int(confidence * 100)}%)"
        (txt_w, txt_h), baseline = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        tag_y1 = max(0, y - txt_h - 6)
        tag_y2 = y
        cv2.rectangle(annotated_img, (x, tag_y1), (x + txt_w + 8, tag_y2), box_color, -1)
        cv2.putText(
            annotated_img,
            label_text,
            (x + 4, y - 4),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            (255, 255, 255),
            1,
            cv2.LINE_AA
        )

        defects.append({
            "id": defect_id,
            "category": category,
            "bbox": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "area_px": int(area),
            "area_percentage": area_pct,
            "confidence_score": confidence,
            "severity": severity,
            "description": desc
        })
        defect_idx += 1

    total_affected_area_pct = round((total_defect_area_px / total_img_area) * 100, 3)

    # 7. Quality Analysis & Overall Result Assessment
    ssim_pass = settings.get("ssim_pass_threshold", 0.88)
    ssim_review = settings.get("ssim_review_threshold", 0.80)
    max_area_allowed = settings.get("max_allowed_defect_area_pct", 1.5)

    medium_severity_count = sum(1 for d in defects if d["severity"] == "MEDIUM")

    if len(defects) == 0 and ssim_score >= ssim_pass and aligned_status:
        overall_result = "PASS"
    elif (
        high_severity_count > 0 
        or medium_severity_count >= 1 
        or total_affected_area_pct >= max_area_allowed 
        or ssim_score < ssim_review
    ):
        overall_result = "FAIL"
    else:
        # Inconclusive, borderline similarity, alignment failed, or minor unclassified anomaly
        overall_result = "REVIEW REQUIRED"

    # 8. Automated Recommendations
    recommendations = generate_recommendations(overall_result, defects, component_name, ssim_score)

    # 9. Save Image Artifacts
    insp_folder = output_dir / inspection_id
    insp_folder.mkdir(parents=True, exist_ok=True)

    ref_path = insp_folder / "reference.jpg"
    insp_path = insp_folder / "inspection.jpg"
    annotated_path = insp_folder / "annotated.jpg"
    diff_path = insp_folder / "difference_map.jpg"

    cv2.imwrite(str(ref_path), ref_color)
    cv2.imwrite(str(insp_path), insp_color)
    cv2.imwrite(str(annotated_path), annotated_img)
    cv2.imwrite(str(diff_path), diff_heatmap)

    proc_time_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "id": inspection_id,
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "component_name": component_name,
        "result": overall_result,
        "similarity_score": round(ssim_score, 4),
        "defect_count": len(defects),
        "high_severity_count": high_severity_count,
        "total_affected_area_pct": total_affected_area_pct,
        "reference_image_url": f"/uploads/{inspection_id}/reference.jpg",
        "inspection_image_url": f"/uploads/{inspection_id}/inspection.jpg",
        "annotated_image_url": f"/uploads/{inspection_id}/annotated.jpg",
        "difference_map_url": f"/uploads/{inspection_id}/difference_map.jpg",
        "aligned": aligned_status,
        "processing_time_ms": proc_time_ms,
        "defects": defects,
        "recommendations": recommendations,
        "metadata": {
            "image_resolution": f"{TARGET_WIDTH}x{TARGET_HEIGHT}",
            "sensitivity": sensitivity,
            "ssim_pass_threshold": ssim_pass,
            "ssim_review_threshold": ssim_review
        }
    }

def generate_recommendations(
    result: str, 
    defects: List[Dict[str, Any]], 
    component_name: str,
    ssim_score: float
) -> List[str]:
    """
    Generates actionable manufacturing engineering recommendations for human quality auditors.
    """
    recs = []
    if result == "PASS":
        recs.append("Component conforms with engineering dimensional and cosmetic tolerances.")
        recs.append(f"Clear {component_name} for downstream assembly line transport.")
        recs.append("Log component serial number to batch quality ledger.")
        return recs

    categories = {d["category"] for d in defects}

    if "Crack" in categories:
        recs.append("CRITICAL DEFECT: Structural integrity compromised. Quarantine component immediately to prevent field failure.")
        recs.append("Conduct non-destructive ultrasonic or magnetic particle inspection on adjacent lot items.")
        recs.append("Verify stamping/casting die pressures and cooling cycles on the manufacturing line.")

    if "Missing material" in categories:
        recs.append("CRITICAL DEFECT: Missing material or unmachined geometry detected. Reject part from production line.")
        recs.append("Audit CNC toolpath offsets and check for broken milling cutters or drill bits.")

    if "Dent" in categories:
        recs.append("Verify whether surface dent impacts critical mating face sealing or bolt seat flatness.")
        recs.append("Check material handling conveyors and robotic gripper pad pressure to prevent impact indentation.")

    if "Scratch" in categories:
        recs.append("Inspect if scratch depth exceeds allowable paint/protective primer specification (e.g., > 25 microns).")
        recs.append("Route to rework station for deburring, light polishing, and primer re-touch.")

    if "Corrosion" in categories:
        recs.append("Oxidation detected. Check wash line rinse tank pH levels and rust preventative oil applicator.")
        recs.append("Ensure component humidity packaging barrier is intact before storage.")

    if "Discolouration" in categories:
        recs.append("Inspect heat-treatment furnace atmosphere and quenching oil temperature for discoloration root cause.")

    if "Unclassified anomaly" in categories:
        recs.append("Manual inspection recommended: Examine highlighted anomaly area under uniform 1000-lux inspection lighting.")

    if not recs:
        recs.append("Inspect component manually to verify borderline structural similarity discrepancy.")

    return recs
