import cv2
import numpy as np
from pathlib import Path

def create_metallic_texture(w=800, h=800, base_color=(135, 135, 140), noise_level=12):
    """Generates realistic machined/cast metal texture with anisotropic brushed grain."""
    np.random.seed(42)
    # Base metallic tone
    img = np.full((h, w, 3), base_color, dtype=np.uint8)
    
    # Cast metal grainy noise
    noise = np.random.normal(0, noise_level, (h, w)).astype(np.int16)
    for c in range(3):
        channel = img[:, :, c].astype(np.int16) + noise
        img[:, :, c] = np.clip(channel, 0, 255).astype(np.uint8)
        
    # Brushed metal horizontal lines
    brush = np.random.normal(0, 4, (h, 1)).astype(np.int16)
    brush = np.repeat(brush, w, axis=1)
    for c in range(3):
        channel = img[:, :, c].astype(np.int16) + brush
        img[:, :, c] = np.clip(channel, 0, 255).astype(np.uint8)

    return img

def draw_gearbox_casing(img):
    """Draws a cast tractor gearbox casing with machined face and bolt holes."""
    res = img.copy()
    h, w = res.shape[:2]

    # Outer casing body (darker cast iron perimeter)
    cv2.rectangle(res, (100, 100), (700, 700), (95, 95, 100), -1)
    cv2.rectangle(res, (100, 100), (700, 700), (50, 50, 55), 4)

    # Chamfered corner cuts
    pts = np.array([[100, 180], [180, 100], [620, 100], [700, 180], 
                    [700, 620], [620, 700], [180, 700], [100, 620]], np.int32)
    cv2.fillPoly(res, [pts], (145, 145, 152))
    cv2.polylines(res, [pts], True, (70, 70, 75), 3)

    # Central machined circular chamber
    cv2.circle(res, (400, 400), 190, (175, 175, 180), -1)
    cv2.circle(res, (400, 400), 190, (60, 60, 65), 3)
    cv2.circle(res, (400, 400), 110, (110, 110, 115), -1)
    cv2.circle(res, (400, 400), 110, (40, 40, 45), 3)
    cv2.circle(res, (400, 400), 45, (60, 60, 65), -1)

    # Precision bolt holes around perimeter
    bolt_coords = [
        (150, 150), (650, 150), (150, 650), (650, 650),
        (400, 130), (400, 670), (130, 400), (670, 400)
    ]
    for bx, by in bolt_coords:
        cv2.circle(res, (bx, by), 18, (45, 45, 50), -1)
        cv2.circle(res, (bx, by), 24, (200, 200, 205), 2)

    return res

def draw_engine_housing(img):
    """Draws a heavy-duty tractor engine housing block."""
    res = img.copy()
    
    # Outer block
    cv2.rectangle(res, (120, 80), (680, 720), (120, 122, 128), -1)
    cv2.rectangle(res, (120, 80), (680, 720), (60, 60, 65), 4)

    # Two dual cylinder bores
    cv2.circle(res, (400, 260), 125, (80, 80, 85), -1)
    cv2.circle(res, (400, 260), 125, (190, 190, 195), 3)
    cv2.circle(res, (400, 260), 80, (40, 40, 45), -1)

    cv2.circle(res, (400, 540), 125, (80, 80, 85), -1)
    cv2.circle(res, (400, 540), 125, (190, 190, 195), 3)
    cv2.circle(res, (400, 540), 80, (40, 40, 45), -1)

    # Coolant/oil gallery passage slots
    cv2.rectangle(res, (160, 200), (210, 600), (70, 70, 75), -1)
    cv2.rectangle(res, (590, 200), (640, 600), (70, 70, 75), -1)

    return res

def draw_hydraulic_bracket(img):
    """Draws a tractor hydraulic mounting bracket."""
    res = img.copy()
    
    # Triangle / Trapezoid bracket plate
    pts = np.array([[200, 150], [600, 150], [700, 650], [100, 650]], np.int32)
    cv2.fillPoly(res, [pts], (155, 155, 160))
    cv2.polylines(res, [pts], True, (65, 65, 70), 3)

    # Mounting slots
    cv2.circle(res, (400, 320), 75, (75, 75, 80), -1)
    cv2.circle(res, (400, 320), 75, (210, 210, 215), 3)

    cv2.circle(res, (250, 550), 35, (60, 60, 65), -1)
    cv2.circle(res, (550, 550), 35, (60, 60, 65), -1)

    return res

def add_scratch(img, start_pt=(240, 260), end_pt=(360, 310), thickness=2, color=(50, 50, 50)):
    """Simulates a sharp linear scratch on the metal surface."""
    res = img.copy()
    # Draw dark incision line
    cv2.line(res, start_pt, end_pt, color, thickness, cv2.LINE_AA)
    # Add adjacent bright specular highlight edge to mirror real gouged metal
    hl_start = (start_pt[0] + 1, start_pt[1] + 1)
    hl_end = (end_pt[0] + 1, end_pt[1] + 1)
    cv2.line(res, hl_start, hl_end, (230, 230, 235), 1, cv2.LINE_AA)
    return res

def add_dent(img, center=(520, 360), radius=38):
    """Simulates a concave plastic impact dent with shadow gradient."""
    res = img.copy()
    overlay = res.copy()
    cx, cy = center
    # Dark depression shadow
    cv2.circle(overlay, (cx - 4, cy - 4), radius, (35, 35, 40), -1)
    # Rim highlight reflection
    cv2.circle(overlay, (cx + 5, cy + 5), radius - 6, (215, 215, 220), -1)
    # Blend with original
    cv2.addWeighted(overlay, 0.65, res, 0.35, 0, res)
    return res

def add_crack(img, start_pt=(480, 150)):
    """Simulates a jagged propagating metallurgical crack."""
    res = img.copy()
    points = [
        start_pt,
        (start_pt[0] + 18, start_pt[1] + 25),
        (start_pt[0] + 10, start_pt[1] + 50),
        (start_pt[0] + 35, start_pt[1] + 75),
        (start_pt[0] + 20, start_pt[1] + 105),
        (start_pt[0] + 45, start_pt[1] + 140)
    ]
    for i in range(len(points) - 1):
        cv2.line(res, points[i], points[i+1], (20, 20, 25), 3, cv2.LINE_AA)
        
    # Branching sub-crack
    cv2.line(res, points[2], (points[2][0] - 20, points[2][1] + 25), (25, 25, 30), 2, cv2.LINE_AA)
    return res

def add_corrosion(img, center=(320, 480), size=60):
    """Simulates localized rust oxidation bloom."""
    res = img.copy()
    cx, cy = center
    # Create irregular rust patch with reddish-brown BGR (B=30, G=70, R=165)
    np.random.seed(99)
    for _ in range(35):
        rx = cx + np.random.randint(-size, size)
        ry = cy + np.random.randint(-size, size)
        rad = np.random.randint(8, 22)
        rust_bgr = (np.random.randint(15, 45), np.random.randint(55, 95), np.random.randint(150, 205))
        cv2.circle(res, (rx, ry), rad, rust_bgr, -1)
    
    # Smooth to blend naturally
    res = cv2.GaussianBlur(res, (5, 5), 0)
    return res

def generate_all_samples(target_dir: Path):
    """Generates complete suite of tractor component demo image pairs."""
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Gearbox Casing (Scratch & Dent)
    base_tex1 = create_metallic_texture()
    gearbox_ref = draw_gearbox_casing(base_tex1)
    gearbox_def = draw_gearbox_casing(base_tex1.copy())
    gearbox_def = add_scratch(gearbox_def, (220, 280), (350, 320), thickness=3)
    gearbox_def = add_dent(gearbox_def, (540, 340), radius=35)

    cv2.imwrite(str(target_dir / "gearbox_casing_good.png"), gearbox_ref)
    cv2.imwrite(str(target_dir / "gearbox_casing_defective.png"), gearbox_def)

    # 2. Tractor Engine Housing (Structural Crack)
    base_tex2 = create_metallic_texture(base_color=(128, 130, 134))
    engine_ref = draw_engine_housing(base_tex2)
    engine_def = draw_engine_housing(base_tex2.copy())
    engine_def = add_crack(engine_def, (490, 120))

    cv2.imwrite(str(target_dir / "engine_housing_good.png"), engine_ref)
    cv2.imwrite(str(target_dir / "engine_housing_defective.png"), engine_def)

    # 3. Hydraulic Bracket (Corrosion & Surface damage)
    base_tex3 = create_metallic_texture(base_color=(140, 140, 145))
    bracket_ref = draw_hydraulic_bracket(base_tex3)
    bracket_def = draw_hydraulic_bracket(base_tex3.copy())
    bracket_def = add_corrosion(bracket_def, (300, 420), size=55)

    cv2.imwrite(str(target_dir / "hydraulic_bracket_good.png"), bracket_ref)
    cv2.imwrite(str(target_dir / "hydraulic_bracket_defective.png"), bracket_def)

    # 4. Pristine Tractor Engine Housing (PASS Test Demo)
    # Slight normal sensor camera noise to demonstrate robust PASS decision
    noise_pass = np.random.normal(0, 1.5, engine_ref.shape).astype(np.int16)
    engine_pass_insp = np.clip(engine_ref.astype(np.int16) + noise_pass, 0, 255).astype(np.uint8)

    cv2.imwrite(str(target_dir / "engine_housing_pass_good.png"), engine_ref)
    cv2.imwrite(str(target_dir / "engine_housing_pass_insp.png"), engine_pass_insp)

    print(f"Sample datasets generated in: {target_dir}")

if __name__ == "__main__":
    generate_all_samples(Path(__file__).parent)

