from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import VerificationTask, LandRecord
from app.schemas.schemas import VerificationTaskResponse, ApproveRequest, RejectRequest, FieldEditRequest, LandRecordResponse
from app.services.verification_service import verification_service

router = APIRouter(prefix="/verification", tags=["Human-in-the-Loop Verification"])

@router.get("/tasks", response_model=List[VerificationTaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(VerificationTask).order_by(desc(VerificationTask.created_at))
    if status:
        query = query.where(VerificationTask.status == status)
    if priority:
        query = query.where(VerificationTask.priority == priority)
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/{record_id}/approve")
async def approve_record(
    record_id: str,
    req: ApproveRequest,
    current_user: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    try:
        record = await verification_service.approve_record(
            db=db,
            record_id=record_id,
            user_payload=current_user,
            notes=req.notes
        )
        return {"message": "Record successfully verified and approved", "record_id": record.record_id, "status": record.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{record_id}/reject")
async def reject_record(
    record_id: str,
    req: RejectRequest,
    current_user: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    try:
        record = await verification_service.reject_record(
            db=db,
            record_id=record_id,
            user_payload=current_user,
            reason=req.reason,
            notes=req.notes
        )
        return {"message": "Record marked as rejected", "record_id": record.record_id, "status": record.status}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{record_id}/edit-field")
async def edit_field(
    record_id: str,
    req: FieldEditRequest,
    current_user: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db)
):
    try:
        record = await verification_service.edit_record_field(
            db=db,
            record_id=record_id,
            user_payload=current_user,
            field_path=req.field_name,
            new_value=req.new_value,
            reason=req.reason
        )
        return {"message": f"Field '{req.field_name}' successfully updated", "version": record.version}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
