import io
import csv
import json
from datetime import datetime, timezone
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

class ReportService:
    def generate_pdf_report(self, record_data: Dict[str, Any]) -> bytes:
        """
        Generates a high-quality government-style Land Record Validation Report PDF.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a'),
            alignment=TA_CENTER
        )
        subtitle_style = ParagraphStyle(
            'ReportSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#475569'),
            alignment=TA_CENTER
        )
        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e293b'),
            spaceBefore=12,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#334155')
        )
        bold_label = ParagraphStyle(
            'BoldLabel',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#0f172a')
        )

        elements = []

        # Header
        elements.append(Paragraph("INTELLIGENT LAND RECORD DIGITIZATION & VALIDATION SYSTEM", title_style))
        elements.append(Paragraph("OFFICIAL AUDIT & VALIDATION CERTIFICATE", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2563eb'), spaceBefore=4, spaceAfter=12))

        # Record Meta
        rec_id = record_data.get("record_id", "N/A")
        status = record_data.get("status", "N/A")
        score = record_data.get("validation_score", 0.0)
        risk = record_data.get("risk_level", "LOW")
        gen_time = datetime.now(timezone.utc).strftime("%d-%b-%Y %H:%M UTC")

        meta_table_data = [
            [Paragraph("<b>Record Reference ID:</b>", bold_label), Paragraph(rec_id, body_style),
             Paragraph("<b>Verification Status:</b>", bold_label), Paragraph(f"<b>{status}</b>", body_style)],
            [Paragraph("<b>Validation Score:</b>", bold_label), Paragraph(f"<b>{score}%</b>", body_style),
             Paragraph("<b>Risk Assessment:</b>", bold_label), Paragraph(f"<b>{risk}</b>", body_style)],
            [Paragraph("<b>Generated Timestamp:</b>", bold_label), Paragraph(gen_time, body_style),
             Paragraph("<b>Issuing Authority:</b>", bold_label), Paragraph("Revenue Administration", body_style)],
        ]
        meta_table = Table(meta_table_data, colWidths=[130, 140, 130, 140])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 14))

        # Owner & Property Details
        elements.append(Paragraph("1. Extracted Cadastral & Ownership Particulars", section_heading))
        owner = record_data.get("owner", {})
        prop = record_data.get("property", {})
        loc = record_data.get("location", {})

        details_data = [
            [Paragraph("<b>Registered Owner:</b>", bold_label), Paragraph(owner.get("name", "N/A"), body_style),
             Paragraph("<b>Father / Husband:</b>", bold_label), Paragraph(owner.get("father_name", "N/A"), body_style)],
            [Paragraph("<b>Survey Number:</b>", bold_label), Paragraph(prop.get("survey_number", "N/A"), body_style),
             Paragraph("<b>Subdivision:</b>", bold_label), Paragraph(prop.get("subdivision_number", "1"), body_style)],
            [Paragraph("<b>Document Area:</b>", bold_label), Paragraph(f"{prop.get('area', 0)} {prop.get('area_unit', 'acre')}", body_style),
             Paragraph("<b>Land Classification:</b>", bold_label), Paragraph(prop.get("land_type", "Agricultural"), body_style)],
            [Paragraph("<b>Patta Number:</b>", bold_label), Paragraph(prop.get("patta_number", "N/A"), body_style),
             Paragraph("<b>Deed Reg. Date:</b>", bold_label), Paragraph(prop.get("registration_date", "N/A"), body_style)],
            [Paragraph("<b>Village & Taluk:</b>", bold_label), Paragraph(f"{loc.get('village')}, {loc.get('taluk')}", body_style),
             Paragraph("<b>District & State:</b>", bold_label), Paragraph(f"{loc.get('district')}, {loc.get('state')}", body_style)],
        ]
        details_table = Table(details_data, colWidths=[130, 140, 130, 140])
        details_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
            ('PADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(details_table)
        elements.append(Spacer(1, 14))

        # Validation Rule Breakdown
        elements.append(Paragraph("2. Automated Validation Rule Verification Breakdown", section_heading))
        val_sum = record_data.get("validation_summary", {})
        rules = val_sum.get("rules", [])

        rule_table_data = [[
            Paragraph("<b>Rule</b>", bold_label),
            Paragraph("<b>Status</b>", bold_label),
            Paragraph("<b>Score</b>", bold_label),
            Paragraph("<b>Findings & Evidence</b>", bold_label)
        ]]

        for r in rules:
            status_txt = r.get("status", "PASS")
            score_txt = f"{r.get('score', 100):.0f}%"
            msg = r.get("message", "")
            rule_table_data.append([
                Paragraph(r.get("rule", ""), body_style),
                Paragraph(f"<b>{status_txt}</b>", body_style),
                Paragraph(score_txt, body_style),
                Paragraph(msg, body_style)
            ])

        if len(rule_table_data) > 1:
            rule_table = Table(rule_table_data, colWidths=[130, 65, 55, 290])
            rule_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e2e8f0')),
                ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(rule_table)

        # Disclaimer
        elements.append(Spacer(1, 20))
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94a3b8'), spaceBefore=4, spaceAfter=8))
        elements.append(Paragraph(
            "<b>LEGAL NOTICE:</b> This system identifies risk indicators and cross-checks legacy records using AI document intelligence, OCR, and PostGIS cadastral mapping for human investigation. It does not replace statutory judicial procedures.",
            subtitle_style
        ))

        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_csv_report(self, records: List[Dict[str, Any]]) -> str:
        """
        Exports land records to CSV.
        """
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Record ID", "Owner Name", "Father Name", "Survey Number", 
            "Subdivision", "Area", "Unit", "Village", "Taluk", "District", 
            "Validation Score", "Risk Level", "Status", "Patta Number", "Registration Date"
        ])

        for r in records:
            owner = r.get("owner", {})
            prop = r.get("property", {})
            loc = r.get("location", {})
            writer.writerow([
                r.get("record_id"),
                owner.get("name"),
                owner.get("father_name"),
                prop.get("survey_number"),
                prop.get("subdivision_number"),
                prop.get("area"),
                prop.get("area_unit"),
                loc.get("village"),
                loc.get("taluk"),
                loc.get("district"),
                r.get("validation_score"),
                r.get("risk_level"),
                r.get("status"),
                prop.get("patta_number"),
                prop.get("registration_date")
            ])

        return output.getvalue()

report_service = ReportService()
