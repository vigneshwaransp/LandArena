from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from datetime import datetime

# --- Authentication Schemas ---
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- OCR & Document Schemas ---
class OCRBoxSchema(BaseModel):
    x0: float
    y0: float
    x1: float
    y1: float
    text: str
    confidence: float
    page: int = 1
    field_name: Optional[str] = None

class DocumentPageResponse(BaseModel):
    id: str
    page_number: int
    image_url: str
    processed_image_url: Optional[str] = None
    width: int
    height: int
    ocr_text: Optional[str] = None
    ocr_boxes: List[OCRBoxSchema] = []
    confidence: float
    language: str

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    filename: str
    file_size: int
    mime_type: str
    document_type: str
    type_confidence: float
    page_count: int
    status: str
    processing_progress: int
    current_stage: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DocumentDetailResponse(DocumentResponse):
    pages: List[DocumentPageResponse] = []
    download_url: Optional[str] = None

# --- Land Record Schemas ---
class BoundariesSchema(BaseModel):
    north: Optional[str] = None
    south: Optional[str] = None
    east: Optional[str] = None
    west: Optional[str] = None

class OwnerSchema(BaseModel):
    name: str
    normalized_name: Optional[str] = None
    father_name: Optional[str] = None
    aadhaar_masked: Optional[str] = None
    pan_masked: Optional[str] = None
    address: Optional[str] = None
    share_percentage: Optional[float] = 100.0

class PropertySchema(BaseModel):
    survey_number: str
    khasra_number: Optional[str] = None
    khata_number: Optional[str] = None
    khewat_number: Optional[str] = None
    plot_number: Optional[str] = None
    subdivision_number: Optional[str] = "1"
    patta_number: Optional[str] = None
    document_number: Optional[str] = None
    registration_date: Optional[str] = None
    transaction_date: Optional[str] = None
    area: float
    area_unit: str = "acre"
    area_sq_meters: Optional[float] = None
    land_type: str = "Agricultural / Ryotwari"
    land_classification: Optional[str] = "Agricultural / Ryotwari Punja"
    mutation_status: Optional[str] = "APPROVED"
    mutation_date: Optional[str] = None
    mutation_order_number: Optional[str] = None
    boundaries: Optional[BoundariesSchema] = None

class LocationSchema(BaseModel):
    village: str
    taluk: str
    tehsil: Optional[str] = None
    district: str
    state: str = "Tamil Nadu"
    pincode: Optional[str] = None


class ValidationRuleResultSchema(BaseModel):
    rule: str
    category: Optional[str] = "GENERAL"
    status: Optional[str] = "PASS"
    score: float = 100.0
    severity: Optional[str] = "LOW"
    message: Optional[str] = ""
    explanation: Optional[str] = ""
    evidence: Optional[Dict[str, Any]] = {}

class ValidationSummarySchema(BaseModel):
    overall_score: float
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    owner_match_score: float
    survey_match_score: float
    area_consistency_score: float
    location_match_score: float
    document_quality_score: float
    temporal_consistency_score: float
    rules: List[ValidationRuleResultSchema] = []

class AnomalyResponse(BaseModel):
    id: str
    record_id: str
    type: str
    severity: str
    confidence: float
    title: str
    explanation: str
    evidence: Dict[str, Any] = {}
    resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LandRecordResponse(BaseModel):
    id: str
    record_id: str
    document_id: Optional[str] = None
    parcel_id: Optional[str] = None
    status: str
    validation_score: float
    risk_level: str
    owner: OwnerSchema
    property: PropertySchema
    location: LocationSchema
    validation_summary: Optional[ValidationSummarySchema] = None
    version: int = 1
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class LandRecordDetailResponse(LandRecordResponse):
    anomalies: List[AnomalyResponse] = []
    document: Optional[DocumentDetailResponse] = None
    parcel_geometry: Optional[Dict[str, Any]] = None

class LandRecordUpdate(BaseModel):
    owner: Optional[OwnerSchema] = None
    property: Optional[PropertySchema] = None
    location: Optional[LocationSchema] = None
    reason: str

# --- GIS Schemas ---
class ParcelResponse(BaseModel):
    id: str
    survey_number: str
    subdivision: str
    village: str
    taluk: str
    district: str
    state: str
    gis_area_acres: float
    gis_area_sqm: float
    centroid_lat: float
    centroid_lng: float
    geometry_geojson: Dict[str, Any]
    bbox: List[float] = []
    adjacent_surveys: List[str] = []
    has_overlap: bool = False
    overlap_with: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

# --- Verification & Audit Schemas ---
class VerificationTaskResponse(BaseModel):
    id: str
    record_id: str
    assigned_to: Optional[str] = None
    status: str
    priority: str
    reviewer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    edited_fields: Dict[str, Any] = {}
    resolved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ApproveRequest(BaseModel):
    notes: Optional[str] = "Approved after human officer verification."

class RejectRequest(BaseModel):
    reason: str = "Discrepancies found in ownership / survey boundaries."
    notes: Optional[str] = None

class FieldEditRequest(BaseModel):
    field_name: str
    new_value: Any
    reason: str

class AuditLogResponse(BaseModel):
    id: str
    record_id: Optional[str] = None
    user_id: str
    user_name: str
    user_role: str
    action: str
    field_name: Optional[str] = None
    old_value: Optional[Any] = None
    new_value: Optional[Any] = None
    reason: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Assistant Schemas ---
class DashboardStatsResponse(BaseModel):
    total_records: int
    verified_records: int
    pending_verification: int
    high_risk_records: int
    processed_today: int
    average_ocr_confidence: float
    average_validation_score: float
    total_documents: int
    records_by_status: Dict[str, int]
    records_by_risk: Dict[str, int]
    documents_by_type: Dict[str, int]
    anomalies_by_severity: Dict[str, int]
    records_by_district: Dict[str, int]
    recent_activity: List[AuditLogResponse]

class ChatMessage(BaseModel):
    role: str # user | assistant | system
    content: str

class ChatRequest(BaseModel):
    query: str
    record_id: Optional[str] = None
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    answer: str
    citations: List[Dict[str, Any]] = []
    suggested_queries: List[str] = []

class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    message: str
    link: Optional[str] = None
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationSendRequest(BaseModel):
    channel: str = "SMS" # SMS, EMAIL, PUSH, ALL
    recipient: str
    title: str
    message: str
    record_id: Optional[str] = None

# --- DILRMP & National LRMS Schemas ---
class StateProgressSchema(BaseModel):
    state_name: str
    total_villages: int
    digitized_villages_pct: float
    cadastral_maps_digitized_pct: float
    mutation_computerized_pct: float
    overall_dilrmp_score: float
    districts_count: int
    top_districts: List[Dict[str, Any]] = []

class DILRMPStatusResponse(BaseModel):
    program_name: str = "Digital India Land Records Modernization Programme (DILRMP)"
    nodal_ministry: str = "Department of Land Resources, Ministry of Rural Development"
    national_digitization_pct: float
    cadastral_maps_georeferenced_pct: float
    roor_mutation_integration_pct: float
    sro_revenue_integration_pct: float
    state_rankings: List[StateProgressSchema] = []
    compliance_summary: Dict[str, Any] = {}

class DILRMPRecordVerifyResponse(BaseModel):
    query_identifier: str
    matched: bool
    lrms_source: str # e.g. "TamilNilam / Bhulekh Central Gateway"
    state: str
    district: str
    tehsil_taluk: str
    village: str
    khasra_survey_number: str
    khata_number: Optional[str] = None
    registered_owner: str
    area_acres: float
    land_classification: str
    mutation_status: str
    encumbrance_status: str
    last_verified_at: str

class DILRMPSyncRequest(BaseModel):
    record_ids: List[str]
    target_lrms_gateway: Optional[str] = "DILRMP_NATIONAL_GATEWAY"

class FeedbackLearningStatsResponse(BaseModel):
    total_corrections: int
    model_baseline_accuracy: float
    improved_accuracy: float
    top_corrected_fields: List[Dict[str, Any]]
    active_learning_iterations: int
    last_updated: str

