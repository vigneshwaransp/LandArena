import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DOCS = BASE_DIR / "uploads" / "documents"
DATA_DOCS = BASE_DIR.parent.parent / "data" / "sample_docs"

UPLOAD_DOCS.mkdir(parents=True, exist_ok=True)
DATA_DOCS.mkdir(parents=True, exist_ok=True)

def create_sample_pdf(filename: str, title: str, subtitle: str, fields: list):
    paths = [UPLOAD_DOCS / filename, DATA_DOCS / filename]
    
    for target in paths:
        doc = SimpleDocTemplate(str(target), pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        
        t_style = ParagraphStyle('T', parent=styles['Heading1'], fontName='Helvetica-Bold', fontSize=16, leading=20, alignment=TA_CENTER, textColor=colors.HexColor('#0f172a'))
        st_style = ParagraphStyle('ST', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=11, leading=15, alignment=TA_CENTER, textColor=colors.HexColor('#2563eb'))
        b_style = ParagraphStyle('B', parent=styles['Normal'], fontName='Helvetica', fontSize=10, leading=14, textColor=colors.HexColor('#334155'))
        bl_style = ParagraphStyle('BL', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#0f172a'))

        elements = [
            Paragraph(title, t_style),
            Paragraph(subtitle, st_style),
            Spacer(1, 10),
            HRFlowable(width="100%", thickness=2, color=colors.HexColor('#2563eb'), spaceBefore=5, spaceAfter=15)
        ]

        table_data = []
        for label, val in fields:
            table_data.append([Paragraph(label, bl_style), Paragraph(str(val), b_style)])

        table = Table(table_data, colWidths=[200, 320])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Seal & Signature of Authorized Revenue Officer / Sub-Registrar", ParagraphStyle('Sign', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, alignment=TA_RIGHT, textColor=colors.HexColor('#64748b'))))
        
        doc.build(elements)

def create_sample_image(filename: str, title: str, fields: list):
    paths = [UPLOAD_DOCS / filename, DATA_DOCS / filename]
    
    for target in paths:
        img = Image.new('RGB', (1200, 1600), color=(250, 250, 252))
        draw = ImageDraw.Draw(img)

        # Header bar
        draw.rectangle([(50, 50), (1150, 150)], fill=(30, 41, 59))
        draw.text((100, 85), title, fill=(255, 255, 255))

        y = 200
        for label, val in fields:
            draw.rectangle([(80, y), (1120, y + 60)], fill=(241, 245, 249), outline=(203, 213, 225))
            draw.text((100, y + 18), f"{label}: {val}", fill=(15, 23, 42))
            y += 80

        # Footer Seal
        draw.ellipse([(900, 1350), (1100, 1550)], outline=(37, 99, 235), width=4)
        draw.text((930, 1440), "GOVT OF TN\nREVENUE SEAL", fill=(37, 99, 235))

        img.save(str(target))

def main():
    print("Generating sample digitized land deed PDFs and images...")
    
    # 1. Standard Patta
    create_sample_pdf(
        "land_record_145_patta.pdf",
        "GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT",
        "PATTA PASS BOOK / நத்தம் பட்டா - ERODE DISTRICT",
        [
            ("Patta Number", "P-88421"),
            ("Survey Number", "145/2A (Subdivision: 2A)"),
            ("Owner Name", "Ravi Kumar (ரவிகுமார்)"),
            ("Father / Husband Name", "S. Kumar"),
            ("Total Extent / Area", "2.45 Acres (0.9915 Hectare)"),
            ("Land Classification", "Agricultural / Ryotwari Punja"),
            ("Village / Taluk", "Thudupathi Village, Perundurai Taluk"),
            ("Registration Date", "12-04-2021"),
            ("Boundaries", "North: 145/1 | South: 145/3 | East: 146/2 | West: 145/2B")
        ]
    )

    create_sample_image(
        "land_record_145_patta.png",
        "GOVERNMENT OF TAMIL NADU - PATTA PASS BOOK",
        [
            ("Patta Number", "P-88421"),
            ("Survey Number", "145/2A"),
            ("Owner Name", "Ravi Kumar (ரவிகுமார்)"),
            ("Father Name", "S. Kumar"),
            ("Area", "2.45 Acres"),
            ("Village", "Thudupathi"),
            ("Deed Date", "12-04-2021")
        ]
    )

    # 2. Sale Deed 89
    create_sample_pdf(
        "sale_deed_89_nasiyanur.pdf",
        "REGISTRATION DEPARTMENT - GOVERNMENT OF TAMIL NADU",
        "REGISTERED SALE DEED / கிரய பத்திரம் - NASIYANUR SRO",
        [
            ("Document Number", "4301/2022"),
            ("Survey Number", "89/1"),
            ("Purchaser / Owner", "Suresh Murugan (சுரேஷ் முருகன்)"),
            ("Father Name", "M. Murugan"),
            ("Area Extent", "3.15 Acres"),
            ("Village & District", "Nasiyanur Village, Erode District"),
            ("Registration Date", "19-08-2022")
        ]
    )

    # 3. Altered Deed (Fraud Scenario)
    create_sample_pdf(
        "fraud_indicator_deed_145_altered.pdf",
        "UNREGISTERED CLAIM DEED - SUSPICIOUS AMENDMENT",
        "ALTERED TITLE INSTRUMENT - SURVEY 145/2A CLAIM",
        [
            ("Claim Document No", "9988/TEMP"),
            ("Survey Number", "145/2A-CLONE"),
            ("Claimant Name", "Rajesh Kumar (ராஜேஷ் குமார்)"),
            ("Father Name", "P. Kumar"),
            ("Claimed Area", "2.85 Acres (19.2% Excess Area Claim)"),
            ("Village", "Thudupathi"),
            ("Alleged Deed Date", "10-11-2028 (SUSPICIOUS FUTURE DATE)")
        ]
    )

    print("Sample test assets created successfully!")

if __name__ == "__main__":
    main()
