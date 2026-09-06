export type UserRole = 'ADMIN' | 'OFFICER' | 'VERIFIER' | 'DATA_ENTRY_OPERATOR' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  department?: string;
  created_at: string;
}

export type DocumentType = 
  | 'PATTA'
  | 'SALE_DEED'
  | 'REGISTRATION_DOCUMENT'
  | 'TAX_RECEIPT'
  | 'SURVEY_DOCUMENT'
  | 'FIELD_MEASUREMENT_BOOK'
  | 'LAND_MAP'
  | 'OWNERSHIP_RECORD'
  | 'OTHER';

export type ProcessingStatus = 
  | 'UPLOADED'
  | 'PREPROCESSING'
  | 'OCR_PROCESSING'
  | 'EXTRACTING'
  | 'VALIDATING'
  | 'GIS_ANALYZING'
  | 'COMPLETED'
  | 'FAILED';

export type RecordStatus = 
  | 'UPLOADED'
  | 'PROCESSING'
  | 'OCR_COMPLETED'
  | 'EXTRACTED'
  | 'VALIDATING'
  | 'NEEDS_REVIEW'
  | 'VERIFIED'
  | 'REJECTED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OCRBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text: string;
  confidence: number;
  page: number;
  field_name?: string;
}

export interface DocumentPage {
  id: string;
  document_id: string;
  page_number: number;
  image_url: string;
  processed_image_url?: string;
  width: number;
  height: number;
  ocr_text?: string;
  ocr_boxes: OCRBoundingBox[];
  confidence: number;
  language: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  document_type: DocumentType;
  type_confidence: number;
  page_count: number;
  status: ProcessingStatus;
  processing_progress: number;
  current_stage: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  pages?: DocumentPage[];
}

export interface OwnerEntity {
  id?: string;
  name: string;
  normalized_name?: string;
  father_name?: string;
  aadhaar_masked?: string;
  pan_masked?: string;
  address?: string;
  share_percentage?: number;
}

export interface PropertyDetails {
  survey_number: string;
  subdivision_number?: string;
  patta_number?: string;
  document_number?: string;
  registration_date?: string;
  transaction_date?: string;
  area: number;
  area_unit: string;
  area_sq_meters?: number;
  land_type: string;
  boundaries?: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  };
}

export interface LocationDetails {
  village: string;
  taluk: string;
  district: string;
  state: string;
  pincode?: string;
}

export interface ValidationRuleResult {
  rule: string;
  category: 'OWNER' | 'SURVEY' | 'AREA' | 'LOCATION' | 'DATE' | 'GIS' | 'QUALITY';
  status: 'PASS' | 'WARNING' | 'FAIL';
  score: number;
  severity: AnomalySeverity;
  message: string;
  explanation: string;
  evidence: Record<string, any>;
}

export interface ValidationSummary {
  overall_score: number;
  risk_level: RiskLevel;
  owner_match_score: number;
  survey_match_score: number;
  area_consistency_score: number;
  location_match_score: number;
  document_quality_score: number;
  temporal_consistency_score: number;
  rules: ValidationRuleResult[];
}

export interface AnomalyItem {
  id: string;
  record_id: string;
  type: string;
  severity: AnomalySeverity;
  confidence: number;
  title: string;
  explanation: string;
  evidence: Record<string, any>;
  detected_at: string;
}

export interface ParcelFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: {
    parcel_id: string;
    survey_number: string;
    subdivision: string;
    village: string;
    district: string;
    gis_area_acres: number;
    gis_area_sqm: number;
    document_area_acres?: number;
    area_deviation_pct?: number;
    status: RecordStatus;
    risk_level: RiskLevel;
    owner_name?: string;
    record_id?: string;
    has_overlap?: boolean;
    overlap_with?: string[];
  };
}

export interface LandRecord {
  id: string;
  record_id: string;
  document_id?: string;
  parcel_id?: string;
  status: RecordStatus;
  validation_score: number;
  risk_level: RiskLevel;
  owner: OwnerEntity;
  property: PropertyDetails;
  location: LocationDetails;
  validation_summary?: ValidationSummary;
  anomalies?: AnomalyItem[];
  parcel?: ParcelFeature;
  created_at: string;
  updated_at: string;
  verified_by?: string;
  verified_at?: string;
  version: number;
}

export interface AuditLogEntry {
  id: string;
  record_id?: string;
  user_id: string;
  user_name: string;
  user_role: string;
  action: string;
  field_name?: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  ip_address?: string;
  created_at: string;
}

export interface DashboardStats {
  total_records: number;
  verified_records: number;
  pending_verification: number;
  high_risk_records: number;
  processed_today: number;
  average_ocr_confidence: number;
  average_validation_score: number;
  total_documents: number;
  records_by_status: Record<string, number>;
  records_by_risk: Record<string, number>;
  documents_by_type: Record<string, number>;
  anomalies_by_severity: Record<string, number>;
  records_by_district: Record<string, number>;
  recent_activity: AuditLogEntry[];
}
