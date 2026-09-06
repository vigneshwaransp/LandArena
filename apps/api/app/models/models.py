import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, 
    Text, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="OFFICER", nullable=False) # ADMIN, OFFICER, VERIFIER, DATA_ENTRY_OPERATOR, VIEWER
    department = Column(String(255), default="Revenue & Land Administration")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    document_type = Column(String(50), default="PATTA") # PATTA, SALE_DEED, TAX_RECEIPT, SURVEY_DOCUMENT, FMB, LAND_MAP, OTHER
    type_confidence = Column(Float, default=0.90)
    page_count = Column(Integer, default=1)
    status = Column(String(50), default="UPLOADED") # UPLOADED, PREPROCESSING, OCR_PROCESSING, EXTRACTING, VALIDATING, GIS_ANALYZING, COMPLETED, FAILED
    processing_progress = Column(Integer, default=0) # 0 to 100
    current_stage = Column(String(100), default="Uploaded")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    pages = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    land_records = relationship("LandRecord", back_populates="document")
    processing_jobs = relationship("ProcessingJob", back_populates="document", cascade="all, delete-orphan")

class DocumentPage(Base):
    __tablename__ = "document_pages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    page_number = Column(Integer, nullable=False)
    image_path = Column(String(512), nullable=False)
    processed_image_path = Column(String(512), nullable=True)
    width = Column(Integer, default=1200)
    height = Column(Integer, default=1600)
    ocr_text = Column(Text, nullable=True)
    ocr_boxes = Column(JSON, default=list) # [{bbox: [x0, y0, x1, y1], text, confidence, field_name}]
    confidence = Column(Float, default=0.0)
    language = Column(String(20), default="en") # en, ta, hi
    created_at = Column(DateTime, default=utc_now)

    document = relationship("Document", back_populates="pages")

class Parcel(Base):
    __tablename__ = "parcels"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    survey_number = Column(String(100), index=True, nullable=False)
    subdivision = Column(String(50), default="1")
    village = Column(String(100), index=True, nullable=False)
    taluk = Column(String(100), nullable=False)
    district = Column(String(100), index=True, nullable=False)
    state = Column(String(100), default="Tamil Nadu")
    gis_area_acres = Column(Float, nullable=False)
    gis_area_sqm = Column(Float, nullable=False)
    centroid_lat = Column(Float, nullable=False)
    centroid_lng = Column(Float, nullable=False)
    geometry_geojson = Column(JSON, nullable=False) # GeoJSON geometry
    bbox = Column(JSON, default=list) # [minX, minY, maxX, maxY]
    adjacent_surveys = Column(JSON, default=list)
    has_overlap = Column(Boolean, default=False)
    overlap_with = Column(JSON, default=list)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    land_records = relationship("LandRecord", back_populates="parcel")

class LandRecord(Base):
    __tablename__ = "land_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    record_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. LR-TN-ERD-00145
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True)
    parcel_id = Column(String(36), ForeignKey("parcels.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="EXTRACTED") # UPLOADED, PROCESSING, OCR_COMPLETED, EXTRACTED, VALIDATING, NEEDS_REVIEW, VERIFIED, REJECTED
    validation_score = Column(Float, default=0.0) # 0 to 100
    risk_level = Column(String(20), default="LOW") # LOW, MEDIUM, HIGH, CRITICAL
    
    # Stored extracted entity data
    owner_data = Column(JSON, default=dict) # {name, father_name, aadhaar_masked, address}
    property_data = Column(JSON, default=dict) # {survey_number, subdivision, patta_number, area, area_unit, land_type, boundaries, doc_number, reg_date}
    location_data = Column(JSON, default=dict) # {village, taluk, district, state, pincode}
    
    validation_summary = Column(JSON, default=dict) # {overall_score, risk_level, breakdown: {...}, rules: [...]}
    version = Column(Integer, default=1)
    
    verified_by = Column(String(255), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    document = relationship("Document", back_populates="land_records")
    parcel = relationship("Parcel", back_populates="land_records")
    anomalies = relationship("Anomaly", back_populates="land_record", cascade="all, delete-orphan")
    verification_tasks = relationship("VerificationTask", back_populates="land_record", cascade="all, delete-orphan")
    versions = relationship("RecordVersion", back_populates="land_record", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="land_record")

class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    record_id = Column(String(36), ForeignKey("land_records.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(100), nullable=False) # AREA_MISMATCH, OWNER_MISMATCH, DUPLICATE_RECORD, SURVEY_CONFLICT, DATE_ANOMALY, BOUNDARY_OVERLAP, DOCUMENT_TAMPERING_INDICATOR
    severity = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, CRITICAL
    confidence = Column(Float, default=0.90)
    title = Column(String(255), nullable=False)
    explanation = Column(Text, nullable=False)
    evidence = Column(JSON, default=dict)
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    land_record = relationship("LandRecord", back_populates="anomalies")

class VerificationTask(Base):
    __tablename__ = "verification_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    record_id = Column(String(36), ForeignKey("land_records.id", ondelete="CASCADE"), nullable=False)
    assigned_to = Column(String(255), nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, APPROVED, REJECTED, CORRECTION_REQUESTED
    priority = Column(String(20), default="MEDIUM") # LOW, MEDIUM, HIGH, URGENT
    reviewer_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    edited_fields = Column(JSON, default=dict)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    land_record = relationship("LandRecord", back_populates="verification_tasks")

class RecordVersion(Base):
    __tablename__ = "record_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    record_id = Column(String(36), ForeignKey("land_records.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    snapshot_data = Column(JSON, nullable=False)
    changed_by = Column(String(255), nullable=False)
    change_reason = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    land_record = relationship("LandRecord", back_populates="versions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    record_id = Column(String(36), ForeignKey("land_records.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(100), default="system")
    user_name = Column(String(255), default="System AI Engine")
    user_role = Column(String(50), default="OFFICER")
    action = Column(String(100), nullable=False) # RECORD_CREATED, VERIFICATION_APPROVED, FIELD_EDITED, ANOMALY_RESOLVED, etc.
    field_name = Column(String(100), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    reason = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    created_at = Column(DateTime, default=utc_now)

    land_record = relationship("LandRecord", back_populates="audit_logs")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, RUNNING, COMPLETED, FAILED
    progress = Column(Integer, default=0)
    current_step = Column(String(100), default="Queued")
    logs = Column(JSON, default=list) # [{timestamp, message, level}]
    created_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    document = relationship("Document", back_populates="processing_jobs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(100), default="all")
    type = Column(String(50), default="INFO") # INFO, SUCCESS, WARNING, CRITICAL
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String(255), nullable=True)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
