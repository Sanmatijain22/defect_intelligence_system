import cv2
import numpy as np
from typing import Tuple, Dict, Any

TARGET_WIDTH = 800
TARGET_HEIGHT = 800

def resize_standard(img: np.ndarray, target_size: Tuple[int, int] = (TARGET_WIDTH, TARGET_HEIGHT)) -> np.ndarray:
    """Resize image to standard dimensions while maintaining clarity."""
    return cv2.resize(img, target_size, interpolation=cv2.INTER_AREA)

def preprocess_for_inspection(
    img: np.ndarray, 
    enable_clahe: bool = True,
    blur_kernel: int = 5
) -> Dict[str, np.ndarray]:
    """
    Standardize, denoise, and enhance image without altering the original.
    Returns dictionary with color, gray, denoised, and enhanced representations.
    """
    # 1. Resize to consistent standard inspection resolution
    resized = resize_standard(img)
    
    # 2. Convert to Grayscale
    if len(resized.shape) == 3 and resized.shape[2] == 3:
        gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
        lab = cv2.cvtColor(resized, cv2.COLOR_BGR2LAB)
        hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV)
    else:
        gray = resized.copy()
        lab = None
        hsv = None

    # 3. Noise Reduction (Bilateral filtering preserves crisp defect edges like cracks/scratches)
    if blur_kernel > 0:
        d = blur_kernel
        sigma_color = 50
        sigma_space = 50
        denoised_gray = cv2.bilateralFilter(gray, d, sigma_color, sigma_space)
    else:
        denoised_gray = gray.copy()

    # 4. Contrast Limited Adaptive Histogram Equalization (CLAHE)
    # Compensates for uneven industrial shop-floor illumination
    if enable_clahe:
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_gray = clahe.apply(denoised_gray)
    else:
        enhanced_gray = denoised_gray.copy()

    return {
        "resized_color": resized,
        "gray": gray,
        "denoised_gray": denoised_gray,
        "enhanced_gray": enhanced_gray,
        "lab": lab,
        "hsv": hsv
    }

