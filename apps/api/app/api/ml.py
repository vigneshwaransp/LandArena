from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

from app.services.ml_service import ml_service
from app.core.security import get_current_user_payload

router = APIRouter()

class MLPredictRequest(BaseModel):
    stated_area_acres: Optional[float] = Field(default=2.5, description="Stated deed area in acres")
    gis_calculated_area_acres: Optional[float] = Field(default=2.4, description="Calculated GIS parcel area")
    area_variance_pct: Optional[float] = Field(default=1.5, description="Percentage variance between deed and GIS")
    boundary_overlap_ratio: Optional[float] = Field(default=0.0, description="Overlap ratio with adjacent parcels (0-1)")
    owner_name_similarity: Optional[float] = Field(default=0.95, description="Phonetic / transliteration match score (0-1)")
    temporal_date_gap_days: Optional[int] = Field(default=15, description="Days between deed signing & registration")
    registration_year: Optional[int] = Field(default=2024, description="Registration year")
    subdivision_depth: Optional[int] = Field(default=2, description="Subdivision survey depth")
    ocr_confidence: Optional[float] = Field(default=92.0, description="Mean OCR optical confidence score")
    stamp_duty_ratio: Optional[float] = Field(default=1.0, description="Paid stamp duty vs expected circle rate ratio")
    prior_dispute_flag: Optional[int] = Field(default=0, description="1 if prior dispute exists, else 0")
    document_type: Optional[str] = Field(default="PATTA", description="Document type")
    encumbrance_status: Optional[str] = Field(default="NIL", description="Encumbrance certificate status")
    mutation_status: Optional[str] = Field(default="APPROVED", description="Revenue mutation status")

@router.get("/metrics")
async def get_model_metrics():
    """
    Returns benchmark leaderboard, cross-validation metrics, confusion matrix,
    ROC-AUC curve points, and feature importances for the trained Kaggle model.
    """
    metrics = ml_service.get_metrics()
    return metrics

@router.post("/predict")
async def predict_fraud_risk(payload: MLPredictRequest):
    """
    Runs real-time Random Forest ML inference on land record features and returns
    fraud probability, risk tier, confidence, and explainable feature risk drivers.
    """
    try:
        result = ml_service.predict(payload.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML inference error: {str(e)}")

@router.post("/retrain")
async def retrain_model():
    """
    Re-executes 5-fold cross-validation and trains the ML model pipeline on updated cadastral records.
    """
    try:
        metrics = ml_service.retrain()
        return {
            "status": "success",
            "message": "Model retrained and updated successfully",
            "metrics": metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {str(e)}")
