# Smart Manufacturing AI – Visual Quality Inspection & Defect Intelligence System

An industrial-grade, AI-powered visual quality inspection platform inspired by precision tractor and automotive manufacturing environments (such as Escorts Kubota). 

The platform automates the manual inspection of critical tractor components by comparing a golden **Good Component** reference image against a fabricated **Inspection Component**, extracting morphological anomalies, classifying flaw geometries, computing structural similarity, and compiling certified PDF inspection audit reports.

---

## 1. System Architecture & Computer Vision Pipeline

```
Golden Reference Image (Good)   +   Inspection Component Image
                  │                                │
                  ▼                                ▼
       Image Format & Dimension Validation (800x800 Standard)
                                   │
                                   ▼
        Image Preprocessing (Bilateral Filter + CLAHE Equalization)
                                   │
                                   ▼
          Feature-Based Registration & Alignment (ORB + Homography)
                                   │
                                   ▼
      Structural Similarity Index (SSIM) & Difference Map Calculation
                                   │
                                   ▼
       Morphological Filtering & Anomaly Contour Segmentation
                                   │
                                   ▼
   Defect Classification & Severity Assessment (Geometry & Color Profile)
          ├── Scratches (Linear aspect ratio > 2.2, narrow stroke)
          ├── Cracks (Irregular propagation, dark profile, jagged edge)
          ├── Dents (Concave circular shadow/highlight gradient)
          ├── Corrosion / Rust (Warm tone shift, texture roughness)
          ├── Missing Material (Significant structural void)
          ├── Discolouration (Color tone divergence without structural edge)
          ├── Surface Damage / Pitting (Roughness and abrasion)
          └── Unclassified Anomaly (Transparent fallback for inconclusive patterns)
                                   │
                                   ▼
     Automated Decision Grading: PASS / FAIL / REVIEW REQUIRED
                                   │
                                   ▼
  Dual Persistence & Reporting: SQLite Ledger + ReportLab PDF Generation
```

---

## 2. Technology Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Recharts, Lucide React, Vite
- **Backend:** Python 3.13, FastAPI, Uvicorn, Pydantic v2
- **Computer Vision & Image Processing:** OpenCV (`opencv-python`), `scikit-image`, `scipy`, `numpy`, Pillow
- **Reporting Engine:** ReportLab (Industrial PDF format with multi-figure quad view)
- **Database:** Persistent SQLite (`inspections.db`) with relational defect table and configuration store

---

## 3. Key Features & Dashboard Modules

### 1. Executive Overview Dashboard
- Shop-floor quality KPIs: Total Inspections, Passed parts, Rejected/Failed parts, Review Required, and Defect Rate %.
- Interactive Daily Inspection Trends (Area Chart).
- Defect Category Breakdown (Horizontal Bar Chart).
- Recent Inspection History Table with instant diagnosis viewer and 1-click PDF download.

### 2. New Inspection Workstation
- **Component Selection:** Tractor engine housing, Gearbox casing, Metal bracket, Hydraulic component, Gear assembly, Bearing housing, or Custom component.
- **Dual-Panel Image Dropzone:** Dedicated upload slots for Good Reference Image and Inspection Component.
- **1-Click Sample Test Buttons:** Instantly loads pre-generated industrial component test pairs (Gearbox with scratch & dent, Engine housing with structural crack, Hydraulic bracket with corrosion, and Conforming pass component).
- **Live CV Pipeline Stepper:** Visual feedback through each image alignment, structural comparison, and classification phase.

### 3. Inspection Results & Diagnosis
- Prominent PASS / FAIL / REVIEW REQUIRED status badge.
- **4-Pane Quad View:** Simultaneous side-by-side comparison of:
  - Figure A: Golden Reference Image
  - Figure B: Inspected Component
  - Figure C: SSIM Difference Heatmap (JET Colormap)
  - Figure D: Annotated Defect Image with Bounding Boxes & Tags
- Granular Metrics: SSIM Similarity %, Total Defect Regions, Affected Surface Area %, Execution Time (ms).
- Defect Registry Table: Defect ID, Category, Severity (CRITICAL, MEDIUM, LOW), Confidence Score, Bounding Box `[x, y, w, h]`, and Surface Area (`%` and `px`).
- Automated Quality Engineering Recommendations for human shop-floor inspectors.
- 1-Click Export to **PDF Report**, **CSV**, or **JSON**.

### 4. Inspection History Ledger
- Persistent audit ledger loaded from SQLite.
- Search by Inspection ID or component name.
- Filter by Result (`PASS`, `FAIL`, `REVIEW REQUIRED`) or Component Type.
- Direct links to view complete visual diagnosis, download PDF reports, and export defect tables.

### 5. System Settings & Algorithmic Thresholds
- Sensitivity Presets: Low, Medium, High.
- Configurable SSIM Pass/Review Threshold sliders.
- Minimum Defect Area filter (pixels) to suppress sensor noise.
- Maximum Allowed Defect Surface Area % before failure.
- Preprocessing Toggles: ORB Alignment and CLAHE Contrast Equalization.
- Shop-floor metadata: Inspector name and manufacturing plant facility.

---

## 4. Setup and Execution Instructions

### Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js 18+ (tested on Node v24) and npm

### Quick Start (Single Launcher)
The application comes with the frontend already built into `frontend/dist`. You can launch the entire full-stack platform with a single Python command:

```bash
python start_system.py
```
Open your browser at **http://127.0.0.1:8000/**.

---

### Running Development Mode (Frontend & Backend Separately)

#### 1. Backend Server
```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start FastAPI backend
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`.

#### 2. Frontend Development Server
```bash
# Navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:3000/`.

---

## 5. Sample Demonstration Walkthrough

To demonstrate the system:
1. Open the web portal and navigate to **New Inspection**.
2. Click on the 1-Click test scenario: **⚙️ Gearbox (Scratch/Dent)**.
3. Observe the immediate preview of the reference casting and the defective casting.
4. Click **Execute AI Inspection**.
5. Watch the CV pipeline execute alignment, SSIM calculation, difference thresholding, and flaw classification.
6. Review the diagnosis:
   - Status: **FAIL**
   - Detected Flaws: `Dent` (Medium severity, circular plastic depression) and `Scratch` (Low severity, linear hairline score).
   - Visual Evidence: Difference heatmap highlighting structural displacement and annotated bounding boxes.
   - Engineering Action Steps: Concrete rework recommendations (deburr scratch, verify seal face).
7. Click **Download PDF Report** to view or print the certified quality audit document.

---

## 6. Backend API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend service health and status |
| `GET` | `/api/dashboard/stats` | Aggregated shop-floor metrics, trends, and recent records |
| `POST` | `/api/inspect` | Upload reference & inspection images and run CV pipeline |
| `GET` | `/api/inspections` | Retrieve historical inspections with search and filtering |
| `GET` | `/api/inspections/{id}` | Retrieve individual inspection details and defect records |
| `GET` | `/api/inspections/{id}/report` | Generate and download certified PDF inspection report |
| `GET` | `/api/inspections/{id}/export` | Export inspection data in JSON or CSV format |
| `GET` | `/api/settings` | Retrieve active CV sensitivity and quality thresholds |
| `POST` | `/api/settings` | Update and persist quality thresholds to database |
| `GET` | `/api/samples` | List pre-generated sample tractor component test datasets |

---

## 7. Verification & Testing

To run the automated test suite verifying the CV pipeline, alignment, SSIM analyzer, and PDF generator:

```bash
# Run sample generation and verify pipeline
python -m backend.app.sample_data.generate_samples
python -c "from backend.app.cv.pipeline import run_inspection_pipeline; from backend.app.config import STORAGE_DIR, SAMPLES_DIR, DEFAULT_SETTINGS; res = run_inspection_pipeline(open(SAMPLES_DIR/'gearbox_casing_good.png', 'rb').read(), open(SAMPLES_DIR/'gearbox_casing_defective.png', 'rb').read(), 'Gearbox casing', STORAGE_DIR, DEFAULT_SETTINGS); print('Verification Result:', res['result'], 'Defects:', len(res['defects']))"
```
Output:
`Verification Result: FAIL Defects: 2` (Identifies both the Dent and the Scratch with high confidence).

