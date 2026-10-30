import sqlite3
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from .config import DB_PATH, DEFAULT_SETTINGS

def get_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Inspections table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inspections (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        component_name TEXT NOT NULL,
        result TEXT NOT NULL,
        similarity_score REAL NOT NULL,
        defect_count INTEGER NOT NULL,
        high_severity_count INTEGER NOT NULL,
        total_affected_area_pct REAL NOT NULL,
        reference_image_url TEXT NOT NULL,
        inspection_image_url TEXT NOT NULL,
        annotated_image_url TEXT NOT NULL,
        difference_map_url TEXT NOT NULL,
        aligned INTEGER NOT NULL DEFAULT 1,
        processing_time_ms REAL NOT NULL,
        recommendations TEXT,
        metadata TEXT
    )
    """)

    # Defects table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS defects (
        id TEXT NOT NULL,
        inspection_id TEXT NOT NULL,
        category TEXT NOT NULL,
        bbox_x INTEGER NOT NULL,
        bbox_y INTEGER NOT NULL,
        bbox_w INTEGER NOT NULL,
        bbox_h INTEGER NOT NULL,
        area_px INTEGER NOT NULL,
        area_percentage REAL NOT NULL,
        confidence_score REAL NOT NULL,
        severity TEXT NOT NULL,
        description TEXT,
        PRIMARY KEY (inspection_id, id),
        FOREIGN KEY (inspection_id) REFERENCES inspections (id) ON DELETE CASCADE
    )
    """)

    # Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Insert default settings if not exists
    for key, val in DEFAULT_SETTINGS.items():
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (key, json.dumps(val)))

    conn.commit()
    conn.close()

def get_settings() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM app_settings")
    rows = cursor.fetchall()
    conn.close()
    settings = dict(DEFAULT_SETTINGS)
    for row in rows:
        try:
            settings[row["key"]] = json.loads(row["value"])
        except Exception:
            settings[row["key"]] = row["value"]
    return settings

def update_settings(updates: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    for key, val in updates.items():
        if val is not None:
            cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", (key, json.dumps(val)))
    conn.commit()
    conn.close()
    return get_settings()

def save_inspection(inspection_data: Dict[str, Any], defects: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO inspections (
        id, timestamp, component_name, result, similarity_score,
        defect_count, high_severity_count, total_affected_area_pct,
        reference_image_url, inspection_image_url, annotated_image_url, difference_map_url,
        aligned, processing_time_ms, recommendations, metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        inspection_data["id"],
        inspection_data["timestamp"],
        inspection_data["component_name"],
        inspection_data["result"],
        inspection_data["similarity_score"],
        inspection_data["defect_count"],
        inspection_data["high_severity_count"],
        inspection_data["total_affected_area_pct"],
        inspection_data["reference_image_url"],
        inspection_data["inspection_image_url"],
        inspection_data["annotated_image_url"],
        inspection_data["difference_map_url"],
        1 if inspection_data.get("aligned", True) else 0,
        inspection_data["processing_time_ms"],
        json.dumps(inspection_data.get("recommendations", [])),
        json.dumps(inspection_data.get("metadata", {}))
    ))

    for defect in defects:
        bbox = defect["bbox"]
        cursor.execute("""
        INSERT INTO defects (
            id, inspection_id, category, bbox_x, bbox_y, bbox_w, bbox_h,
            area_px, area_percentage, confidence_score, severity, description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            defect["id"],
            inspection_data["id"],
            defect["category"],
            bbox["x"], bbox["y"], bbox["width"], bbox["height"],
            defect["area_px"],
            defect["area_percentage"],
            defect["confidence_score"],
            defect["severity"],
            defect.get("description", "")
        ))

    conn.commit()
    conn.close()

def get_inspection(inspection_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inspections WHERE id = ?", (inspection_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    inspection = dict(row)
    inspection["aligned"] = bool(inspection["aligned"])
    inspection["recommendations"] = json.loads(inspection["recommendations"] or "[]")
    inspection["metadata"] = json.loads(inspection["metadata"] or "{}")

    cursor.execute("SELECT * FROM defects WHERE inspection_id = ?", (inspection_id,))
    defect_rows = cursor.fetchall()
    defects = []
    for d in defect_rows:
        defects.append({
            "id": d["id"],
            "category": d["category"],
            "bbox": {
                "x": d["bbox_x"],
                "y": d["bbox_y"],
                "width": d["bbox_w"],
                "height": d["bbox_h"]
            },
            "area_px": d["area_px"],
            "area_percentage": d["area_percentage"],
            "confidence_score": d["confidence_score"],
            "severity": d["severity"],
            "description": d["description"]
        })
    inspection["defects"] = defects
    conn.close()
    return inspection

def get_all_inspections(
    component_name: Optional[str] = None,
    result: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100
) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM inspections WHERE 1=1"
    params = []

    if component_name and component_name != "All":
        query += " AND component_name = ?"
        params.append(component_name)
    if result and result != "All":
        query += " AND result = ?"
        params.append(result)
    if search:
        query += " AND (id LIKE ? OR component_name LIKE ?)"
        params.append(f"%{search}%")
        params.append(f"%{search}%")

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        item = dict(row)
        item["aligned"] = bool(item["aligned"])
        results.append(item)
    return results

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM inspections")
    total = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'PASS'")
    passed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'FAIL'")
    failed = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM inspections WHERE result = 'REVIEW REQUIRED'")
    review = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(similarity_score) FROM inspections")
    avg_similarity_res = cursor.fetchone()[0]
    avg_similarity = round(avg_similarity_res or 0.0, 3)

    defect_rate = round((failed / total * 100), 1) if total > 0 else 0.0

    # Defect category distribution
    cursor.execute("""
    SELECT category, COUNT(*) as count 
    FROM defects 
    GROUP BY category 
    ORDER BY count DESC
    """)
    cat_rows = cursor.fetchall()
    category_distribution = {row["category"]: row["count"] for row in cat_rows}

    # Trend stats (group by date)
    cursor.execute("""
    SELECT SUBSTR(timestamp, 1, 10) as day, 
           COUNT(*) as total,
           SUM(CASE WHEN result = 'PASS' THEN 1 ELSE 0 END) as passed,
           SUM(CASE WHEN result = 'FAIL' THEN 1 ELSE 0 END) as failed,
           SUM(CASE WHEN result = 'REVIEW REQUIRED' THEN 1 ELSE 0 END) as review
    FROM inspections
    GROUP BY day
    ORDER BY day ASC
    LIMIT 14
    """)
    trend_rows = cursor.fetchall()
    daily_trends = [
        {
            "date": r["day"],
            "total": r["total"],
            "passed": r["passed"] or 0,
            "failed": r["failed"] or 0,
            "review": r["review"] or 0
        }
        for r in trend_rows
    ]

    # Recent inspections
    cursor.execute("SELECT * FROM inspections ORDER BY timestamp DESC LIMIT 6")
    recent_rows = cursor.fetchall()
    recent = [dict(r) for r in recent_rows]

    conn.close()

    return {
        "total_inspections": total,
        "passed_inspections": passed,
        "failed_inspections": failed,
        "review_required_inspections": review,
        "defect_rate_pct": defect_rate,
        "avg_similarity_score": avg_similarity,
        "category_distribution": category_distribution,
        "daily_trends": daily_trends,
        "recent_inspections": recent
    }
