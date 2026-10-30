import cv2
import numpy as np
from skimage.metrics import structural_similarity as ssim
from typing import Tuple, Dict, Any

def compute_ssim_and_diff(
    ref_gray: np.ndarray, 
    insp_gray: np.ndarray
) -> Tuple[float, np.ndarray, np.ndarray]:
    """
    Computes SSIM similarity score and generates difference maps.
    
    Returns:
        (similarity_score, diff_gray, diff_color_heatmap)
    """
    # Compute SSIM and full difference image
    # Note: scikit-image SSIM returns score in [-1, 1] and diff image in [-1, 1] (or [0, 1] depending on dtype)
    score, diff = ssim(ref_gray, insp_gray, full=True)
    score = float(max(0.0, min(1.0, score)))

    # Convert difference image to 0-255 uint8 range
    # When diff == 1.0 (identical), (1 - diff) is 0
    diff_norm = (diff * 255).astype("uint8")
    diff_abs = 255 - diff_norm  # Invert so differences are high intensity (white)

    # Apply morphological opening to suppress random single-pixel sensor noise
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    clean_diff = cv2.morphologyEx(diff_abs, cv2.MORPH_OPEN, kernel)

    # Generate an industrial Heatmap (JET colormap) for visualization
    # Blue = minimal difference, Yellow/Red = significant structural defect
    diff_heatmap = cv2.applyColorMap(clean_diff, cv2.COLORMAP_JET)

    return score, clean_diff, diff_heatmap

