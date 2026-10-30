import cv2
import numpy as np
from typing import Tuple

def align_images(
    ref_img: np.ndarray, 
    insp_img: np.ndarray, 
    max_features: int = 1500,
    match_ratio: float = 0.75
) -> Tuple[np.ndarray, bool, float]:
    """
    Aligns the inspection image with the reference image using ORB feature detection
    and RANSAC Homography transformation to correct camera shifts and rotation.
    
    Returns:
        (aligned_insp_img, success_bool, match_quality_score)
    """
    ref_gray = cv2.cvtColor(ref_img, cv2.COLOR_BGR2GRAY) if len(ref_img.shape) == 3 else ref_img
    insp_gray = cv2.cvtColor(insp_img, cv2.COLOR_BGR2GRAY) if len(insp_img.shape) == 3 else insp_img

    # Initialize ORB detector
    orb = cv2.ORB_create(nfeatures=max_features, fastThreshold=12)

    kp1, des1 = orb.detectAndCompute(ref_gray, None)
    kp2, des2 = orb.detectAndCompute(insp_gray, None)

    if des1 is None or des2 is None or len(des1) < 10 or len(des2) < 10:
        return insp_img, False, 0.0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    matches = bf.knnMatch(des2, des1, k=2)

    good_matches = []
    for m, n in matches:
        if m.distance < match_ratio * n.distance:
            good_matches.append(m)

    if len(good_matches) < 8:
        return insp_img, False, len(good_matches) / 50.0

    src_pts = np.float32([kp2[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([kp1[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

    if H is None:
        return insp_img, False, 0.0

    # Inlier ratio
    inliers = np.sum(mask) if mask is not None else 0
    inlier_ratio = min(1.0, inliers / max(1, len(good_matches)))

    # If transformation is already virtually identity (shift < 1.5 pixels), keep original to avoid resample interpolation
    if np.allclose(H, np.eye(3), atol=0.015):
        return insp_img, True, round(float(inlier_ratio), 3)

    h, w = ref_img.shape[:2]
    aligned_insp = cv2.warpPerspective(insp_img, H, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    return aligned_insp, True, round(float(inlier_ratio), 3)
