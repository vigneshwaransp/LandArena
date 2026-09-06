import os
import uuid
import json
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import get_password_hash
from app.models.models import (
    User, Document, DocumentPage, Parcel, LandRecord,
    Anomaly, VerificationTask, AuditLog, Notification
)
from app.services.storage_service import storage_service
from app.core.config import settings

async def seed_database_if_empty(db: AsyncSession):
    # Check if users already exist
    user_check = await db.execute(select(User))
    if user_check.scalars().first():
        return # Database already seeded

    print("--- [SEEDING] Populating database with realistic SIH 2026 demo data ---")

    # 1. Seed Users
    users = [
        User(
            id=str(uuid.uuid4()),
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            full_name="Dr. S. Arumugam IAS",
            role="ADMIN",
            department="District Revenue & Land Administration"
        ),
        User(
            id=str(uuid.uuid4()),
            email="officer@example.com",
            hashed_password=get_password_hash("officer123"),
            full_name="K. Selvakumar",
            role="OFFICER",
            department="Tahsildar Office, Perundurai"
        ),
        User(
            id=str(uuid.uuid4()),
            email="verifier@example.com",
            hashed_password=get_password_hash("verifier123"),
            full_name="P. Meenakshi",
            role="VERIFIER",
            department="Cadastral Survey & Verification Unit"
        ),
        User(
            id=str(uuid.uuid4()),
            email="viewer@example.com",
            hashed_password=get_password_hash("viewer123"),
            full_name="R. Senthil",
            role="VIEWER",
            department="Public Land Records Cell"
        )
    ]
    for u in users:
        db.add(u)
    await db.commit()

    # 2. Seed GIS Cadastral Parcels with coordinates in Erode District, TN (Lat ~11.34, Lng ~77.71)
    base_lng = 77.7150
    base_lat = 11.3400

    parcels_data = [
        {
            "survey": "145/2A",
            "sub": "2A",
            "village": "Thudupathi",
            "taluk": "Perundurai",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 2.39,
            "coords": [[[base_lng, base_lat], [base_lng + 0.003, base_lat], [base_lng + 0.003, base_lat + 0.002], [base_lng, base_lat + 0.002], [base_lng, base_lat]]],
            "adjacent": ["145/1", "145/2B", "145/3", "146/2"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "145/2B",
            "sub": "2B",
            "village": "Thudupathi",
            "taluk": "Perundurai",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 1.85,
            "coords": [[[base_lng + 0.003, base_lat], [base_lng + 0.0055, base_lat], [base_lng + 0.0055, base_lat + 0.002], [base_lng + 0.003, base_lat + 0.002], [base_lng + 0.003, base_lat]]],
            "adjacent": ["145/2A", "145/4", "146/1"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "89/1",
            "sub": "1",
            "village": "Nasiyanur",
            "taluk": "Erode",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 3.15,
            "coords": [[[base_lng + 0.006, base_lat + 0.003], [base_lng + 0.0095, base_lat + 0.003], [base_lng + 0.0095, base_lat + 0.0055], [base_lng + 0.006, base_lat + 0.0055], [base_lng + 0.006, base_lat + 0.003]]],
            "adjacent": ["89/2", "88/4", "90/1"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "210/3C",
            "sub": "3C",
            "village": "Perundurai",
            "taluk": "Perundurai",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 4.50,
            "coords": [[[base_lng - 0.004, base_lat + 0.002], [base_lng - 0.001, base_lat + 0.002], [base_lng - 0.001, base_lat + 0.005], [base_lng - 0.004, base_lat + 0.005], [base_lng - 0.004, base_lat + 0.002]]],
            "adjacent": ["210/3A", "210/3B", "211/1"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "45/1",
            "sub": "1",
            "village": "Chithode",
            "taluk": "Erode",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 1.20,
            "coords": [[[base_lng + 0.001, base_lat - 0.003], [base_lng + 0.003, base_lat - 0.003], [base_lng + 0.003, base_lat - 0.0015], [base_lng + 0.001, base_lat - 0.0015], [base_lng + 0.001, base_lat - 0.003]]],
            "adjacent": ["45/2", "44/3"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "112/4",
            "sub": "4",
            "village": "Kavindapadi",
            "taluk": "Bhavani",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 5.80,
            "coords": [[[base_lng + 0.007, base_lat - 0.004], [base_lng + 0.011, base_lat - 0.004], [base_lng + 0.011, base_lat - 0.001], [base_lng + 0.007, base_lat - 0.001], [base_lng + 0.007, base_lat - 0.004]]],
            "adjacent": ["112/3", "113/1"],
            "overlap": False,
            "overlap_with": []
        },
        {
            "survey": "145/2A-CLONE",
            "sub": "2A",
            "village": "Thudupathi",
            "taluk": "Perundurai",
            "district": "Erode",
            "state": "Tamil Nadu",
            "area_ac": 2.85, # Suspicious area
            "coords": [[[base_lng + 0.002, base_lat + 0.001], [base_lng + 0.0045, base_lat + 0.001], [base_lng + 0.0045, base_lat + 0.003], [base_lng + 0.002, base_lat + 0.003], [base_lng + 0.002, base_lat + 0.001]]],
            "adjacent": ["145/2A", "145/2B"],
            "overlap": True,
            "overlap_with": ["145/2A", "145/2B"]
        }
    ]

    parcels_map = {}
    for p in parcels_data:
        geom = {
            "type": "Polygon",
            "coordinates": p["coords"]
        }
        # Compute centroid
        all_pts = p["coords"][0]
        avg_lng = sum(pt[0] for pt in all_pts) / len(all_pts)
        avg_lat = sum(pt[1] for pt in all_pts) / len(all_pts)

        parcel_obj = Parcel(
            id=str(uuid.uuid4()),
            survey_number=p["survey"],
            subdivision=p["sub"],
            village=p["village"],
            taluk=p["taluk"],
            district=p["district"],
            state=p["state"],
            gis_area_acres=p["area_ac"],
            gis_area_sqm=round(p["area_ac"] * 4046.86, 2),
            centroid_lat=round(avg_lat, 6),
            centroid_lng=round(avg_lng, 6),
            geometry_geojson=geom,
            bbox=[p["coords"][0][0][0], p["coords"][0][0][1], p["coords"][0][2][0], p["coords"][0][2][1]],
            adjacent_surveys=p["adjacent"],
            has_overlap=p["overlap"],
            overlap_with=p["overlap_with"]
        )
        db.add(parcel_obj)
        parcels_map[p["survey"]] = parcel_obj

    await db.commit()

    # 3. Create Sample Documents & DocumentPages for Demo
    sample_doc_meta = [
        {
            "filename": "land_record_145_patta.pdf",
            "type": "PATTA",
            "survey": "145/2A",
            "owner": "Ravi Kumar",
            "father": "S. Kumar",
            "area": 2.45, # Document states 2.45, GIS is 2.39 -> 2.45% dev
            "village": "Thudupathi",
            "score": 78.5,
            "risk": "MEDIUM",
            "status": "NEEDS_REVIEW",
            "tamil": "ரவிகுமார்",
            "date": "2021-04-12",
            "anomaly_type": "AREA_MISMATCH",
            "anomaly_title": "Cadastral Area Variance Detected",
            "anomaly_msg": "Recorded area (2.45 ac) differs from GIS parcel area (2.39 ac) by 2.45%."
        },
        {
            "filename": "sale_deed_89_nasiyanur.pdf",
            "type": "SALE_DEED",
            "survey": "89/1",
            "owner": "Suresh Murugan",
            "father": "M. Murugan",
            "area": 3.15,
            "village": "Nasiyanur",
            "score": 96.0,
            "risk": "LOW",
            "status": "VERIFIED",
            "tamil": "சுரேஷ் முருகன்",
            "date": "2022-08-19",
            "anomaly_type": None
        },
        {
            "filename": "fraud_indicator_deed_145_altered.pdf",
            "type": "SALE_DEED",
            "survey": "145/2A-CLONE",
            "owner": "Rajesh Kumar",
            "father": "P. Kumar",
            "area": 2.85, # 19.2% excess area claim + overlap
            "village": "Thudupathi",
            "score": 42.0,
            "risk": "CRITICAL",
            "status": "REJECTED",
            "tamil": "ராஜேஷ் குமார்",
            "date": "2028-11-10", # Future date!
            "anomaly_type": "DOCUMENT_TAMPERING_INDICATOR",
            "anomaly_title": "Critical Fraud Indicators: Future Date & Boundary Encroachment",
            "anomaly_msg": "Deed contains future registration date (2028-11-10) and overlaps with Survey 145/2A & 145/2B."
        },
        {
            "filename": "tamil_patta_chitta_210_perundurai.pdf",
            "type": "PATTA",
            "survey": "210/3C",
            "owner": "Kandasamy Palanisamy (கந்தசாமி)",
            "father": "Palanisamy Gounder",
            "area": 4.50,
            "village": "Perundurai",
            "score": 94.5,
            "risk": "LOW",
            "status": "VERIFIED",
            "tamil": "கந்தசாமி பழனிசாமி",
            "date": "2020-01-15",
            "anomaly_type": None
        },
        {
            "filename": "tax_receipt_kist_45_chithode.pdf",
            "type": "TAX_RECEIPT",
            "survey": "45/1",
            "owner": "Venkatesh Raman",
            "father": "K. Raman",
            "area": 1.20,
            "village": "Chithode",
            "score": 91.0,
            "risk": "LOW",
            "status": "VERIFIED",
            "tamil": "வெங்கடேஷ்",
            "date": "2023-03-25",
            "anomaly_type": None
        }
    ]

    # Additional 20 synthetic records for full volume density
    villages_pool = ["Thudupathi", "Nasiyanur", "Perundurai", "Chithode", "Kavindapadi", "Bhavani", "Modakkurichi", "Anthiyur"]
    owners_pool = [
        ("Mani Selvam", "R. Selvam"), ("Balan Natarajan", "Natarajan"), ("Dhanalakshmi V", "K. Varadarajan"),
        ("Govindaraj Muthusamy", "Muthusamy"), ("Sangeetha Ramesh", "Ramesh Babu"), ("Palanivel Sengottaiyan", "Sengottaiyan"),
        ("Anil Kumar Sharma", "R. P. Sharma"), ("Deepak Verma", "M. L. Verma"), ("Gopalakrishnan S", "Subramaniam"),
        ("Kavitha Loganathan", "Loganathan"), ("Prabhu Ramasamy", "Ramasamy"), ("Vijay Anand", "Anand G"),
        ("Nandhini Prakash", "Prakash K"), ("Mohanraj Chinnasamy", "Chinnasamy"), ("Sasikumar Duraisamy", "Duraisamy"),
        ("Lakshmi Narayanan", "Narayanan"), ("Vasanth Kumar", "Kumarasamy"), ("Karthikeyan Shanmugam", "Shanmugam"),
        ("Suganya Moorthi", "Moorthi"), ("Poongodi Sivalingam", "Sivalingam")
    ]

    record_count = 100

    # 4. Insert detailed records
    for i, meta in enumerate(sample_doc_meta):
        doc_id = str(uuid.uuid4())
        doc_path = str(settings.UPLOAD_DIR / "documents" / meta["filename"])
        
        doc = Document(
            id=doc_id,
            filename=meta["filename"],
            file_path=doc_path,
            file_size=142800 + (i * 25400),
            mime_type="application/pdf",
            document_type=meta["type"],
            type_confidence=0.96,
            page_count=1,
            status="COMPLETED",
            processing_progress=100,
            current_stage="Digitization Complete"
        )
        db.add(doc)

        # Page with OCR boxes
        page_id = str(uuid.uuid4())
        page_obj = DocumentPage(
            id=page_id,
            document_id=doc_id,
            page_number=1,
            image_path=doc_path.replace(".pdf", ".png"),
            processed_image_path=doc_path.replace(".pdf", "_proc.png"),
            width=1200,
            height=1600,
            ocr_text=f"GOVERNMENT OF TAMIL NADU - REVENUE DEPARTMENT\nPatta No: P-{88000+i}\nSurvey No: {meta['survey']}\nOwner: {meta['owner']}\nFather: {meta['father']}\nArea: {meta['area']} Acres\nVillage: {meta['village']}",
            ocr_boxes=[
                {"x0": 80, "y0": 60, "x1": 500, "y1": 90, "text": f"Patta No: P-{88000+i}", "confidence": 98.0, "page": 1, "field_name": "patta_number"},
                {"x0": 80, "y0": 110, "x1": 420, "y1": 140, "text": f"Survey No: {meta['survey']}", "confidence": 99.0, "page": 1, "field_name": "survey_number"},
                {"x0": 80, "y0": 160, "x1": 460, "y1": 190, "text": f"Owner: {meta['owner']} ({meta['tamil']})", "confidence": 96.5, "page": 1, "field_name": "owner_name"},
                {"x0": 80, "y0": 210, "x1": 400, "y1": 240, "text": f"Father: {meta['father']}", "confidence": 95.0, "page": 1, "field_name": "father_name"},
                {"x0": 80, "y0": 260, "x1": 480, "y1": 290, "text": f"Extent / Area: {meta['area']} Acres", "confidence": 97.0, "page": 1, "field_name": "area"},
                {"x0": 80, "y0": 310, "x1": 430, "y1": 340, "text": f"Village: {meta['village']} | District: Erode", "confidence": 98.0, "page": 1, "field_name": "location"}
            ],
            confidence=96.0,
            language="ta" if "tamil" in meta["filename"] or meta.get("tamil") else "en"
        )
        db.add(page_obj)

        # Land Record
        record_count += 1
        rec_id_str = f"LR-TN-ERD-{record_count:05d}"
        
        val_summary = {
            "overall_score": meta["score"],
            "risk_level": meta["risk"],
            "owner_match_score": 98.0 if meta["risk"] == "LOW" else (85.0 if meta["risk"] == "MEDIUM" else 35.0),
            "survey_match_score": 98.0 if meta["risk"] == "LOW" else (92.0 if meta["risk"] == "MEDIUM" else 45.0),
            "area_consistency_score": 95.0 if meta["risk"] == "LOW" else (78.0 if meta["risk"] == "MEDIUM" else 30.0),
            "location_match_score": 99.0,
            "document_quality_score": 96.0,
            "temporal_consistency_score": 98.0 if meta["risk"] != "CRITICAL" else 25.0,
            "rules": [
                {
                    "rule": "OwnerConsistencyRule", "category": "OWNER",
                    "status": "PASS" if meta["risk"] != "CRITICAL" else "FAIL",
                    "score": 98.0 if meta["risk"] != "CRITICAL" else 40.0,
                    "severity": "LOW" if meta["risk"] != "CRITICAL" else "HIGH",
                    "message": f"Owner '{meta['owner']}' matches registration chain.",
                    "explanation": "Normalized phonetic comparison verified."
                },
                {
                    "rule": "AreaConsistencyRule", "category": "AREA",
                    "status": "PASS" if meta["risk"] == "LOW" else ("WARNING" if meta["risk"] == "MEDIUM" else "FAIL"),
                    "score": 95.0 if meta["risk"] == "LOW" else (72.0 if meta["risk"] == "MEDIUM" else 30.0),
                    "severity": "LOW" if meta["risk"] == "LOW" else ("MEDIUM" if meta["risk"] == "MEDIUM" else "HIGH"),
                    "message": f"Document area ({meta['area']} ac) vs GIS parcel area.",
                    "explanation": meta.get("anomaly_msg", "Area aligns with spatial measurement.")
                },
                {
                    "rule": "BoundaryOverlapRule", "category": "GIS",
                    "status": "PASS" if meta["risk"] != "CRITICAL" else "FAIL",
                    "score": 98.0 if meta["risk"] != "CRITICAL" else 20.0,
                    "severity": "LOW" if meta["risk"] != "CRITICAL" else "CRITICAL",
                    "message": "Boundary topology clearance verified." if meta["risk"] != "CRITICAL" else "Boundary encroachment detected.",
                    "explanation": "PostGIS spatial polygon intersection clear." if meta["risk"] != "CRITICAL" else "Overlaps with adjacent parcels 145/2A and 145/2B."
                }
            ]
        }

        matched_parcel = parcels_map.get(meta["survey"])

        land_rec = LandRecord(
            id=str(uuid.uuid4()),
            record_id=rec_id_str,
            document_id=doc_id,
            parcel_id=matched_parcel.id if matched_parcel else None,
            status=meta["status"],
            validation_score=meta["score"],
            risk_level=meta["risk"],
            owner_data={
                "name": meta["owner"],
                "normalized_name": meta["owner"].lower(),
                "father_name": meta["father"],
                "aadhaar_masked": f"XXXX-XXXX-{8000+i}",
                "pan_masked": f"ABCDE{1000+i}F",
                "address": f"{meta['village']}, Perundurai, Erode, Tamil Nadu",
                "share_percentage": 100.0
            },
            property_data={
                "survey_number": meta["survey"],
                "subdivision_number": meta["survey"].split("/")[1] if "/" in meta["survey"] else "1",
                "patta_number": f"P-{88000+i}",
                "document_number": f"{4300+i}/2021",
                "registration_date": meta["date"],
                "transaction_date": meta["date"],
                "area": meta["area"],
                "area_unit": "acre",
                "area_sq_meters": round(meta["area"] * 4046.86, 2),
                "land_type": "Agricultural / Ryotwari Punja",
                "boundaries": {
                    "north": "Survey 145/1 (Gopal Land)",
                    "south": "Survey 145/3 (Village Road)",
                    "east": "Survey 146/2 (Kandasamy Land)",
                    "west": "Survey 145/2B (Mani Land)"
                }
            },
            location_data={
                "village": meta["village"],
                "taluk": "Perundurai",
                "district": "Erode",
                "state": "Tamil Nadu",
                "pincode": "638057"
            },
            validation_summary=val_summary,
            version=1,
            verified_by="Dr. S. Arumugam IAS" if meta["status"] == "VERIFIED" else None,
            verified_at=datetime.now(timezone.utc) - timedelta(days=2) if meta["status"] == "VERIFIED" else None
        )
        db.add(land_rec)
        await db.commit()

        # Add Anomaly if present
        if meta.get("anomaly_type"):
            anom = Anomaly(
                id=str(uuid.uuid4()),
                record_id=land_rec.id,
                type=meta["anomaly_type"],
                severity=meta["risk"],
                confidence=0.92,
                title=meta["anomaly_title"],
                explanation=meta["anomaly_msg"],
                evidence={"document_area": meta["area"], "gis_area": matched_parcel.gis_area_acres if matched_parcel else meta["area"]},
                resolved=False
            )
            db.add(anom)

        # Verification Task
        v_task = VerificationTask(
            id=str(uuid.uuid4()),
            record_id=land_rec.id,
            status="APPROVED" if meta["status"] == "VERIFIED" else ("REJECTED" if meta["status"] == "REJECTED" else "PENDING"),
            priority="URGENT" if meta["risk"] in ["HIGH", "CRITICAL"] else "MEDIUM",
            reviewer_notes="Verified against official Patta Chitta registry and GIS sketch." if meta["status"] == "VERIFIED" else None,
            rejection_reason="Unreconciled boundary overlap and future date anomaly." if meta["status"] == "REJECTED" else None,
            resolved_at=datetime.now(timezone.utc) if meta["status"] in ["VERIFIED", "REJECTED"] else None
        )
        db.add(v_task)

        # Audit Log
        a_log = AuditLog(
            id=str(uuid.uuid4()),
            record_id=land_rec.id,
            user_id="demo-admin-id",
            user_name="Dr. S. Arumugam IAS",
            user_role="ADMIN",
            action="RECORD_INITIALIZED" if meta["status"] != "VERIFIED" else "RECORD_VERIFIED_APPROVED",
            field_name="status",
            new_value=meta["status"],
            reason="Automated OCR digitization and cadastral spatial validation completed."
        )
        db.add(a_log)

    # 5. Populate remaining 20 realistic records
    for j in range(20):
        record_count += 1
        owner_tuple = owners_pool[j % len(owners_pool)]
        v_name = villages_pool[j % len(villages_pool)]
        s_num = f"{100 + j}/{1 + (j % 4)}"
        area_val = round(1.10 + (j * 0.28), 2)
        score_val = round(88.0 + ((j * 3) % 11), 1)

        rec_obj = LandRecord(
            id=str(uuid.uuid4()),
            record_id=f"LR-TN-ERD-{record_count:05d}",
            status="VERIFIED" if j % 3 != 0 else "NEEDS_REVIEW",
            validation_score=score_val,
            risk_level="LOW" if score_val > 90 else "MEDIUM",
            owner_data={
                "name": owner_tuple[0],
                "normalized_name": owner_tuple[0].lower(),
                "father_name": owner_tuple[1],
                "aadhaar_masked": f"XXXX-XXXX-{7000+j}",
                "address": f"{v_name}, Erode District, Tamil Nadu"
            },
            property_data={
                "survey_number": s_num,
                "subdivision_number": s_num.split("/")[1],
                "patta_number": f"P-{92000+j}",
                "document_number": f"{5100+j}/2022",
                "registration_date": f"2022-0{(j%9)+1}-15",
                "area": area_val,
                "area_unit": "acre",
                "land_type": "Agricultural / Ryotwari Punja"
            },
            location_data={
                "village": v_name,
                "taluk": "Perundurai" if j % 2 == 0 else "Erode",
                "district": "Erode",
                "state": "Tamil Nadu"
            },
            validation_summary={
                "overall_score": score_val,
                "risk_level": "LOW" if score_val > 90 else "MEDIUM",
                "owner_match_score": 96.0,
                "survey_match_score": 97.0,
                "area_consistency_score": score_val,
                "location_match_score": 99.0,
                "document_quality_score": 94.0,
                "temporal_consistency_score": 98.0,
                "rules": [
                    {"rule": "OwnerConsistencyRule", "category": "OWNER", "status": "PASS", "score": 96.0, "severity": "LOW", "message": "Owner name verified."},
                    {"rule": "AreaConsistencyRule", "category": "AREA", "status": "PASS", "score": score_val, "severity": "LOW", "message": "Area matches cadastral record."}
                ]
            },
            version=1
        )
        db.add(rec_obj)

    # 6. Notifications
    notifs = [
        Notification(
            id=str(uuid.uuid4()),
            type="CRITICAL",
            title="High Risk Fraud Indicator Flagged",
            message="Record LR-TN-ERD-00103 has a future date anomaly and overlapping boundary with Survey 145/2A.",
            link="/anomalies"
        ),
        Notification(
            id=str(uuid.uuid4()),
            type="WARNING",
            title="Area Discrepancy Requires Review",
            message="Record LR-TN-ERD-00101 has a 2.45% area deviation against GIS parcel 145/2A.",
            link="/records"
        ),
        Notification(
            id=str(uuid.uuid4()),
            type="SUCCESS",
            title="Batch Digitization Complete",
            message="25 Land Records digitized and cross-validated with PostGIS cadastral registry.",
            link="/dashboard"
        )
    ]
    for n in notifs:
        db.add(n)

    await db.commit()
    print("--- [SEEDING COMPLETE] Successfully seeded users, cadastral parcels, documents, and records! ---")
