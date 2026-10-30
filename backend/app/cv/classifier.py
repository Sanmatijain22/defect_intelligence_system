import cv2
import numpy as np
import math
from typing import Dict, Any, Tuple

def extract_region_features(
    contour: np.ndarray,
    ref_color: np.ndarray,
    insp_color: np.ndarray,
    ref_gray: np.ndarray,
    insp_gray: np.ndarray,
    diff_gray: np.ndarray
) -> Dict[str, Any]:
    """
    Extract geometric, colorimetric, and gradient features of a detected candidate defect region.
    """
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)
    x, y, w, h = cv2.boundingRect(contour)

    # Bounding box aspect ratio (elongation)
    major_dim = max(w, h)
    minor_dim = max(1, min(w, h))
    axis_aspect_ratio = major_dim / float(minor_dim)

    # Rotated bounding rect to calculate true geometric aspect ratio independent of diagonal orientation
    if len(contour) >= 5:
        rect = cv2.minAreaRect(contour)
        r_w, r_h = rect[1]
        rotated_aspect_ratio = max(r_w, r_h) / max(1.0, min(r_w, r_h))
    else:
        rotated_aspect_ratio = axis_aspect_ratio

    aspect_ratio = max(axis_aspect_ratio, rotated_aspect_ratio)

    # Circularity (isoperimetric quotient): 1.0 for perfect circle, near 0 for thin lines/cracks
    circularity = (4 * math.pi * area) / (perimeter * perimeter) if perimeter > 0 else 0.0

    # Convex hull and solidity
    hull = cv2.convexHull(contour)
    hull_area = cv2.contourArea(hull)
    solidity = area / float(hull_area) if hull_area > 0 else 0.0

    # Extent: ratio of contour area to bounding box area
    extent = area / float(w * h) if (w * h) > 0 else 0.0

    # Region mask for the contour
    mask = np.zeros(ref_gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], -1, 255, -1)

    # Pixel intensity metrics in defect region
    insp_mean_val = cv2.mean(insp_gray, mask=mask)[0]
    ref_mean_val = cv2.mean(ref_gray, mask=mask)[0]
    diff_mean_val = cv2.mean(diff_gray, mask=mask)[0]
    intensity_delta = insp_mean_val - ref_mean_val  # Negative if darker, positive if brighter

    # Color difference in defect region (BGR & HSV)
    insp_bgr_mean = cv2.mean(insp_color, mask=mask)[:3]
    ref_bgr_mean = cv2.mean(ref_color, mask=mask)[:3]

    # Warmth ratio: (R - B) difference to catch rust/corrosion
    ref_warmth = ref_bgr_mean[2] - ref_bgr_mean[0]
    insp_warmth = insp_bgr_mean[2] - insp_bgr_mean[0]
    warmth_increase = insp_warmth - ref_warmth

    # Sobel gradient roughness in region
    sobelx = cv2.Sobel(insp_gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(insp_gray, cv2.CV_64F, 0, 1, ksize=3)
    gradient_magnitude = cv2.magnitude(sobelx, sobely)
    mean_gradient = cv2.mean(gradient_magnitude, mask=mask)[0]

    return {
        "area": area,
        "perimeter": perimeter,
        "bbox": (x, y, w, h),
        "aspect_ratio": aspect_ratio,
        "circularity": circularity,
        "solidity": solidity,
        "extent": extent,
        "intensity_delta": intensity_delta,
        "diff_mean_val": diff_mean_val,
        "warmth_increase": warmth_increase,
        "mean_gradient": mean_gradient,
        "insp_bgr_mean": insp_bgr_mean,
        "ref_bgr_mean": ref_bgr_mean
    }

def classify_defect(features: Dict[str, Any], total_img_area: int) -> Tuple[str, str, float, str]:
    """
    Classifies the detected anomaly region using computer vision criteria.
    Returns:
        (category, severity, confidence_score, description)
    """
    area = features["area"]
    area_pct = (area / total_img_area) * 100
    aspect_ratio = features["aspect_ratio"]
    circularity = features["circularity"]
    solidity = features["solidity"]
    intensity_delta = features["intensity_delta"]
    diff_val = features["diff_mean_val"]
    warmth_increase = features["warmth_increase"]
    mean_gradient = features["mean_gradient"]

    category = "Unclassified anomaly"
    severity = "LOW"
    confidence = 0.50
    desc = "Visible structural discrepancy detected during inspection."

    # 1. Scratch: Elongated, narrow linear stroke
    if aspect_ratio >= 3.0 and circularity < 0.28 and area < (total_img_area * 0.05):
        category = "Scratch"
        confidence = min(0.95, 0.65 + (aspect_ratio / 20.0))
        if area_pct > 0.4 or abs(intensity_delta) > 50:
            severity = "MEDIUM"
            desc = f"Linear surface score or scratch ({aspect_ratio:.1f}:1 aspect ratio)."
        else:
            severity = "LOW"
            desc = "Superficial hairline scratch on component surface."

    # 2. Crack: High perimeter-to-area, jagged/winding, low solidity, dark line profile
    elif circularity < 0.18 and solidity < 0.65 and intensity_delta < -15 and mean_gradient > 25:
        category = "Crack"
        confidence = min(0.96, 0.75 + (1.0 - circularity) * 0.2)
        severity = "CRITICAL"
        desc = "Structural micro-fracture or crack with irregular propagation pattern."

    # 3. Dent / Depression: Rounded/elliptical, moderate-to-high circularity and solidity
    elif circularity >= 0.40 and solidity >= 0.70 and area_pct > 0.15:
        category = "Dent"
        confidence = min(0.92, 0.65 + circularity * 0.25)
        severity = "MEDIUM" if area_pct < 1.0 else "CRITICAL"
        desc = f"Localized plastic deformation / depression ({area_pct:.2f}% surface area)."

    # 4. Corrosion / Oxidation: Warm color shift (rust red/orange) + surface roughness
    elif warmth_increase > 18 and diff_val > 30 and area_pct > 0.20:
        category = "Corrosion"
        confidence = min(0.94, 0.70 + (warmth_increase / 60.0))
        severity = "MEDIUM" if area_pct < 1.2 else "CRITICAL"
        desc = "Oxidation or rust corrosion bloom with surface degradation."

    # 5. Missing Material: Large void, substantial negative delta or high difference
    elif area_pct > 1.2 and diff_val > 65 and solidity > 0.50:
        category = "Missing material"
        confidence = 0.88
        severity = "CRITICAL"
        desc = "Absence of required structural material, bolt hole mismatch, or casting void."

    # 6. Discolouration: Mild structural deviation but clear color/tone divergence
    elif abs(intensity_delta) > 30 and mean_gradient < 30 and area_pct > 0.25:
        category = "Discolouration"
        confidence = 0.82
        severity = "LOW" if area_pct < 1.0 else "MEDIUM"
        desc = "Heat tint, oil staining, or surface coating inconsistency."

    # 7. Surface Damage / Pitting: Moderate irregularity and rough texture
    elif area_pct > 0.35 and mean_gradient > 35 and circularity < 0.35:
        category = "Surface damage"
        confidence = 0.78
        severity = "MEDIUM" if area_pct < 0.9 else "CRITICAL"
        desc = "Localized surface abrasion, casting spalling, or tool impact marks."

    else:
        # Transparent fallback: When visual evidence does not definitively fit known patterns
        category = "Unclassified anomaly"
        confidence = max(0.40, min(0.70, diff_val / 120.0))
        severity = "MEDIUM" if area_pct > 0.6 or diff_val > 50 else "LOW"
        desc = "Unclassified photometric anomaly requiring manual inspector verification."

    # Escalate severity for large affected regions
    if area_pct > 1.5:
        severity = "CRITICAL"

    return category, severity, round(float(confidence), 2), desc
