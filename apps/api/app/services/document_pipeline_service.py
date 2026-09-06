import os
import uuid
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.models import Document, DocumentPage, LandRecord, Parcel, Anomaly, VerificationTask, ProcessingJob, Notification
from app.services.storage_service import storage_service
from app.services.preprocessing_service import preprocessing_service
from app.services.ocr_service import ocr_service
from app.services.nlp_service import nlp_service
from app.services.validation_service import validation_engine
from app.services.anomaly_service import anomaly_service
from app.services.audit_service import audit_service
from app.core.config import settings

class DocumentPipelineService:
    def classify_document(self, filename: str, sample_text: str = "") -> tuple[str, float]:
        """
        Classifies document type based on keywords and filename heuristics.
        """
        lowered = (filename + " " + sample_text).lower()
        
        if "patta" in lowered or "பட்டா" in lowered or "chitta" in lowered:
            return "PATTA", 0.95
        elif "sale" in lowered or "deed" in lowered or "கிரயம்" in lowered or "விற்பனை" in lowered:
            return "SALE_DEED", 0.92
        elif "tax" in lowered or "kist" in lowered or "ரசீது" in lowered or "வரி" in lowered:
            return "TAX_RECEIPT", 0.91
        elif "fmb" in lowered or "field" in lowered or "measurement" in lowered or "புலப்படம்" in lowered:
            return "FIELD_MEASUREMENT_BOOK", 0.94
        elif "map" in lowered or "village" in lowered or "வரைபடம்" in lowered:
            return "LAND_MAP", 0.90
        elif "survey" in lowered or "சர்வே" in lowered:
            return "SURVEY_DOCUMENT", 0.89
        else:
            return "OWNERSHIP_RECORD", 0.85

    async def process_document(self, db: AsyncSession, document_id: str):
        """
        Asynchronously executes the full intelligent digitization, OCR, NLP, Validation, and GIS pipeline.
        """
        res = await db.execute(select(Document).where(Document.id == document_id))
        doc = res.scalar_one_or_none()
        if not doc:
            return

        job_res = await db.execute(select(ProcessingJob).where(ProcessingJob.document_id == doc.id))
        job = job_res.scalar_one_or_none()
        if not job:
            job = ProcessingJob(document_id=doc.id, status="RUNNING", progress=5, current_step="Initializing")
            db.add(job)
            await db.commit()

        try:
            # Stage 1: Preprocessing & PDF Conversion (Progress: 20%)
            doc.status = "PREPROCESSING"
            doc.processing_progress = 20
            doc.current_stage = "Converting and Enhancing Document Images"
            job.progress = 20
            job.current_step = "Image Preprocessing & Deskew"
            await db.commit()

            doc_path = Path(doc.file_path)
            pages_info = []

            if doc.mime_type == "application/pdf" or doc_path.suffix.lower() == ".pdf":
                page_imgs = preprocessing_service.convert_pdf_to_images(
                    str(doc_path), settings.UPLOAD_DIR / "documents"
                )
                doc.page_count = len(page_imgs)
                pages_info = page_imgs
            else:
                # Single image
                doc.page_count = 1
                pages_info = [(str(doc_path), 1200, 1600)]

            # Stage 2: OCR & Text Extraction (Progress: 45%)
            doc.status = "OCR_PROCESSING"
            doc.processing_progress = 45
            doc.current_stage = "Multilingual OCR Character Recognition"
            job.progress = 45
            job.current_step = "Running Optical Character Recognition"
            await db.commit()

            accumulated_text = []
            page_records = []

            for idx, (img_p, w, h) in enumerate(pages_info):
                proc_img_name = f"proc_{Path(img_p).name}"
                proc_img_path = str(settings.UPLOAD_DIR / "processed" / proc_img_name)
                
                # Image enhancements
                proc_res = preprocessing_service.process_image(img_p, proc_img_path)
                
                # OCR
                ocr_out = ocr_service.process_document_page(
                    img_p, 
                    original_pdf=str(doc_path) if doc_path.suffix.lower() == ".pdf" else None,
                    page_num=idx
                )
                accumulated_text.append(ocr_out["text"])

                page_obj = DocumentPage(
                    document_id=doc.id,
                    page_number=idx + 1,
                    image_path=img_p,
                    processed_image_path=proc_img_path,
                    width=w,
                    height=h,
                    ocr_text=ocr_out["text"],
                    ocr_boxes=ocr_out["boxes"],
                    confidence=ocr_out["confidence"],
                    language=ocr_out["language"]
                )
                db.add(page_obj)
                page_records.append(page_obj)

            await db.commit()

            # Stage 3: NLP & Named Entity Extraction (Progress: 65%)
            doc.status = "EXTRACTING"
            doc.processing_progress = 65
            doc.current_stage = "Named Entity Extraction & Normalization"
            job.progress = 65
            job.current_step = "Extracting Land & Ownership Entities"
            await db.commit()

            full_ocr_text = "\n".join(accumulated_text)
            extracted_data = nlp_service.extract_entities(full_ocr_text)

            # Classify document with text context
            doc_type, type_conf = self.classify_document(doc.filename, full_ocr_text)
            doc.document_type = doc_type
            doc.type_confidence = type_conf

            # Stage 4: Cross-Record Validation & GIS Analysis (Progress: 85%)
            doc.status = "VALIDATING"
            doc.processing_progress = 85
            doc.current_stage = "Cross-Record & Cadastral GIS Validation"
            job.progress = 85
            job.current_step = "Running Validation Rules & GIS Checks"
            await db.commit()

            # Find matching parcel by survey number
            survey_no = extracted_data["property"]["survey_number"]
            parcel_res = await db.execute(select(Parcel).where(Parcel.survey_number == survey_no))
            parcel = parcel_res.scalar_one_or_none()

            parcel_ctx = None
            if parcel:
                parcel_ctx = {
                    "id": parcel.id,
                    "survey_number": parcel.survey_number,
                    "gis_area_acres": parcel.gis_area_acres,
                    "has_overlap": parcel.has_overlap,
                    "overlap_with": parcel.overlap_with,
                    "adjacent_surveys": parcel.adjacent_surveys
                }

            # Fetch existing records for duplicate/conflict detection
            all_rec_res = await db.execute(select(LandRecord))
            all_records = all_rec_res.scalars().all()
            hist_records = [{"owner": r.owner_data, "record_id": r.record_id, "survey_number": r.property_data.get("survey_number")} for r in all_records]

            val_context = {
                "parcel": parcel_ctx,
                "historical_records": hist_records,
                "existing_survey_claims": hist_records,
                "ocr_confidence": page_records[0].confidence if page_records else 95.0
            }

            validation_summary = validation_engine.validate_record(extracted_data, val_context)

            # Stage 5: Land Record Creation & Anomaly Extraction (Progress: 100%)
            rec_id_number = 100 + len(all_records) + 1
            generated_record_id = f"LR-TN-ERD-{rec_id_number:05d}"

            land_rec = LandRecord(
                record_id=generated_record_id,
                document_id=doc.id,
                parcel_id=parcel.id if parcel else None,
                status="NEEDS_REVIEW" if validation_summary["risk_level"] in ["MEDIUM", "HIGH", "CRITICAL"] else "VERIFIED",
                validation_score=validation_summary["overall_score"],
                risk_level=validation_summary["risk_level"],
                owner_data=extracted_data["owner"],
                property_data=extracted_data["property"],
                location_data=extracted_data["location"],
                validation_summary=validation_summary,
                version=1
            )
            db.add(land_rec)
            await db.commit()
            await db.refresh(land_rec)

            # Extract and persist anomalies
            anomalies_list = anomaly_service.extract_anomalies_from_validation(validation_summary, land_rec.id)
            for a in anomalies_list:
                anom_obj = Anomaly(
                    record_id=land_rec.id,
                    type=a["type"],
                    severity=a["severity"],
                    confidence=a["confidence"],
                    title=a["title"],
                    explanation=a["explanation"],
                    evidence=a["evidence"],
                    resolved=False
                )
                db.add(anom_obj)

            # Create Verification Task
            verif_task = VerificationTask(
                record_id=land_rec.id,
                status="PENDING",
                priority="URGENT" if validation_summary["risk_level"] in ["HIGH", "CRITICAL"] else "MEDIUM"
            )
            db.add(verif_task)

            # Audit Log
            await audit_service.log_action(
                db=db,
                action="DOCUMENT_DIGITIZED_AND_EXTRACTED",
                record_id=land_rec.id,
                field_name="record_id",
                new_value=land_rec.record_id,
                reason=f"Automated digitization of {doc.filename}. Overall validation score: {land_rec.validation_score}%"
            )

            # Mark Document Completed
            doc.status = "COMPLETED"
            doc.processing_progress = 100
            doc.current_stage = "Digitization Complete"
            job.status = "COMPLETED"
            job.progress = 100
            job.current_step = "Finished"
            job.completed_at = datetime.now(timezone.utc)

            # Notification
            notif = Notification(
                type="SUCCESS" if validation_summary["risk_level"] == "LOW" else "WARNING",
                title=f"Document {doc.filename} Processed",
                message=f"Extracted Record {land_rec.record_id} with score {land_rec.validation_score}%. Risk: {land_rec.risk_level}.",
                link=f"/records/{land_rec.id}"
            )
            db.add(notif)
            await db.commit()

        except Exception as e:
            doc.status = "FAILED"
            doc.error_message = str(e)
            if job:
                job.status = "FAILED"
                job.logs.append({"timestamp": str(datetime.now()), "error": str(e)})
            await db.commit()

document_pipeline_service = DocumentPipelineService()
