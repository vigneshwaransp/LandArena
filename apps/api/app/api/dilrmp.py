from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from app.services.dilrmp_service import dilrmp_service
from app.schemas.schemas import DILRMPStatusResponse, DILRMPRecordVerifyResponse, DILRMPSyncRequest

router = APIRouter(prefix="/dilrmp", tags=["DILRMP & National LRMS Integration"])

@router.get("/status", response_model=DILRMPStatusResponse)
async def get_dilrmp_status():
    """
    Returns nationwide DILRMP modernization performance statistics,
    state-wise and district-wise digitization progress, and compliance benchmarks.
    """
    return dilrmp_service.get_status()

@router.get("/verify/{identifier:path}", response_model=DILRMPRecordVerifyResponse)
async def verify_khasra_or_survey(identifier: str):
    """
    Cross-checks Khasra number, Khata number, or Survey number against
    the central DILRMP and State Land Records Management System (LRMS) master database.
    """
    return dilrmp_service.verify_khasra_or_survey(identifier)

@router.post("/sync")
async def sync_records_to_dilrmp(payload: DILRMPSyncRequest):
    """
    Publishes and synchronizes verified land records to the central DILRMP repository.
    """
    return dilrmp_service.sync_records(payload.record_ids, payload.target_lrms_gateway or "DILRMP_NATIONAL_GATEWAY")
