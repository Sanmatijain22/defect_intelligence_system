import os
from pathlib import Path
from typing import Dict, Any
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from ..config import STORAGE_DIR, REPORTS_DIR

def generate_pdf_report(inspection_data: Dict[str, Any]) -> Path:
    """
    Generates a professional, production-grade Quality Inspection PDF Report
    following industrial automotive/machinery standards.
    """
    inspection_id = inspection_data["id"]
    pdf_path = REPORTS_DIR / f"{inspection_id}_report.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom styles
    header_style = ParagraphStyle(
        'DocHeader',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=2
    )
    
    subheader_style = ParagraphStyle(
        'DocSubHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        spaceAfter=12
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1E293B'),
        spaceBefore=10,
        spaceAfter=6
    )

    cell_bold = ParagraphStyle(
        'CellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )

    cell_normal = ParagraphStyle(
        'CellNormal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # 1. Company & System Header Banner
    result = inspection_data.get("result", "REVIEW REQUIRED")
    if result == "PASS":
        status_bg = colors.HexColor('#16A34A')  # Green
        status_text = "PASSED QUALITY AUDIT"
    elif result == "FAIL":
        status_bg = colors.HexColor('#DC2626')  # Red
        status_text = "FAILED QUALITY AUDIT"
    else:
        status_bg = colors.HexColor('#D97706')  # Amber
        status_text = "REVIEW REQUIRED"

    header_table_data = [
        [
            Paragraph("SMART MANUFACTURING AI", header_style),
            Paragraph(f"<b>RESULT: {result}</b>", ParagraphStyle('StatusBadge', fontName='Helvetica-Bold', fontSize=12, leading=14, textColor=colors.white, alignment=1))
        ],
        [
            Paragraph("Visual Quality Inspection & Automated Defect Intelligence Platform", subheader_style),
            Paragraph(f"<font size=8>{status_text}</font>", ParagraphStyle('StatusSub', fontName='Helvetica', fontSize=8, leading=10, textColor=colors.white, alignment=1))
        ]
    ]

    header_table = Table(header_table_data, colWidths=[400, 140])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (1, 0), (1, 1), status_bg),
        ('ALIGN', (1, 0), (1, 1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#CBD5E1'), spaceBefore=6, spaceAfter=10))

    # 2. Metadata / Audit Ledger Table
    meta_data = [
        [
            Paragraph("<b>Inspection ID:</b>", cell_bold),
            Paragraph(inspection_data["id"], cell_normal),
            Paragraph("<b>Timestamp:</b>", cell_bold),
            Paragraph(inspection_data["timestamp"], cell_normal),
        ],
        [
            Paragraph("<b>Component Name:</b>", cell_bold),
            Paragraph(inspection_data["component_name"], cell_normal),
            Paragraph("<b>Similarity Score (SSIM):</b>", cell_bold),
            Paragraph(f"{inspection_data['similarity_score'] * 100:.2f}%", cell_normal),
        ],
        [
            Paragraph("<b>Total Defect Regions:</b>", cell_bold),
            Paragraph(str(inspection_data["defect_count"]), cell_normal),
            Paragraph("<b>Affected Surface Area:</b>", cell_bold),
            Paragraph(f"{inspection_data['total_affected_area_pct']:.3f}%", cell_normal),
        ],
        [
            Paragraph("<b>High-Severity Defects:</b>", cell_bold),
            Paragraph(str(inspection_data["high_severity_count"]), cell_normal),
            Paragraph("<b>Processing Duration:</b>", cell_bold),
            Paragraph(f"{inspection_data.get('processing_time_ms', 0):.1f} ms", cell_normal),
        ]
    ]

    meta_table = Table(meta_data, colWidths=[130, 140, 130, 140])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # 3. Four-Pane Visual Evidence (Reference, Inspection, Difference Map, Annotated Defect)
    story.append(Paragraph("Visual Evidence & Comparative Computer Vision Analysis", section_heading))

    img_dir = STORAGE_DIR / inspection_id
    ref_img_path = img_dir / "reference.jpg"
    insp_img_path = img_dir / "inspection.jpg"
    diff_img_path = img_dir / "difference_map.jpg"
    annot_img_path = img_dir / "annotated.jpg"

    def make_rl_image(p: Path):
        if p.exists():
            return RLImage(str(p), width=2.4*inch, height=2.4*inch)
        return Paragraph("Image unavailable", cell_normal)

    img_grid_data = [
        [
            Paragraph("<b>Figure A: Reference (Good Component)</b>", cell_bold),
            Paragraph("<b>Figure B: Inspected Component</b>", cell_bold)
        ],
        [
            make_rl_image(ref_img_path),
            make_rl_image(insp_img_path)
        ],
        [
            Paragraph("<b>Figure C: SSIM Difference Heatmap</b>", cell_bold),
            Paragraph("<b>Figure D: Defect Highlighted & Annotated</b>", cell_bold)
        ],
        [
            make_rl_image(diff_img_path),
            make_rl_image(annot_img_path)
        ]
    ]

    img_table = Table(img_grid_data, colWidths=[270, 270])
    img_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#F1F5F9')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(img_table)
    story.append(Spacer(1, 12))

    # 4. Detected Defects Breakdown Table
    story.append(Paragraph("Detected Defects & Anomaly Registry", section_heading))
    defects = inspection_data.get("defects", [])

    if len(defects) == 0:
        story.append(Paragraph("<i>No anomalous defects detected. Component complies with quality specification.</i>", cell_normal))
    else:
        defect_table_rows = [
            [
                Paragraph("<b>Defect ID</b>", cell_bold),
                Paragraph("<b>Category</b>", cell_bold),
                Paragraph("<b>Severity</b>", cell_bold),
                Paragraph("<b>Score</b>", cell_bold),
                Paragraph("<b>Location (X, Y, W, H)</b>", cell_bold),
                Paragraph("<b>Area (% / px)</b>", cell_bold),
                Paragraph("<b>Description</b>", cell_bold),
            ]
        ]

        for d in defects:
            bbox = d["bbox"]
            bbox_str = f"({bbox['x']}, {bbox['y']}) {bbox['width']}x{bbox['height']}"
            area_str = f"{d['area_percentage']:.2f}% ({d['area_px']}px)"
            sev = d["severity"]
            sev_color = "#DC2626" if sev == "CRITICAL" else ("#D97706" if sev == "MEDIUM" else "#2563EB")
            
            defect_table_rows.append([
                Paragraph(d["id"], cell_normal),
                Paragraph(f"<b>{d['category']}</b>", cell_normal),
                Paragraph(f"<font color='{sev_color}'><b>{sev}</b></font>", cell_normal),
                Paragraph(f"{d['confidence_score']:.2f}", cell_normal),
                Paragraph(bbox_str, cell_normal),
                Paragraph(area_str, cell_normal),
                Paragraph(d.get("description", ""), cell_normal),
            ])

        defect_table = Table(defect_table_rows, colWidths=[55, 75, 55, 40, 110, 85, 120])
        defect_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#E2E8F0')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ]))
        story.append(defect_table)

    story.append(Spacer(1, 12))

    # 5. Quality Inspector Recommendations
    recommendations = inspection_data.get("recommendations", [])
    if recommendations:
        rec_items = [[Paragraph("<b>AUTOMATED QUALITY ENGINEERING RECOMMENDATIONS:</b>", cell_bold)]]
        for rec in recommendations:
            rec_items.append([Paragraph(f"• {rec}", cell_normal)])

        rec_table = Table(rec_items, colWidths=[540])
        rec_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#EFF6FF')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#BFDBFE')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(KeepTogether([rec_table]))

    # Footer note
    story.append(Spacer(1, 14))
    footer_text = Paragraph(
        "<i>Generated by Smart Manufacturing AI – Computer Vision Quality Inspection Intelligence Suite. Certified for plant floor auditor sign-off.</i>",
        subheader_style
    )
    story.append(footer_text)

    # Build document
    doc.build(story)
    return pdf_path

