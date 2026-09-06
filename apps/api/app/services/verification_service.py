from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import LandRecord, VerificationTask, Document
from app.services.audit_service import audit_service

class VerificationService:
    async def approve_record(
        self,
        db: AsyncSession,
        record_id: str,
        user_payload: Dict[str, Any],
        notes: Optional[str] = None
    ) -> LandRecord:
        result = await db.execute(select(LandRecord).where(LandRecord.id == record_id))
        record = result.scalar_one_or_none()
        if not record:
            raise ValueError("Land record not found")

        old_status = record.status
        record.status = "VERIFIED"
        record.verified_by = user_payload.get("name", "District Revenue Officer")
        record.verified_at = datetime.now(timezone.utc)
        record.updated_at = datetime.now(timezone.utc)

        # Update verification task
        task_res = await db.execute(select(VerificationTask).where(VerificationTask.record_id == record.id))
        task = task_res.scalar_one_or_none()
        if task:
            task.status = "APPROVED"
            task.reviewer_notes = notes
            task.resolved_at = datetime.now(timezone.utc)

        # Audit log
        await audit_service.log_action(
            db=db,
            action="RECORD_VERIFIED_APPROVED",
            record_id=record.id,
            user_payload=user_payload,
            field_name="status",
            old_value=old_status,
            new_value="VERIFIED",
            reason=notes or "Verified against physical registry and GIS cadastral map."
        )

        await db.commit()
        await db.refresh(record)
        return record

    async def reject_record(
        self,
        db: AsyncSession,
        record_id: str,
        user_payload: Dict[str, Any],
        reason: str,
        notes: Optional[str] = None
    ) -> LandRecord:
        result = await db.execute(select(LandRecord).where(LandRecord.id == record_id))
        record = result.scalar_one_or_none()
        if not record:
            raise ValueError("Land record not found")

        old_status = record.status
        record.status = "REJECTED"
        record.updated_at = datetime.now(timezone.utc)

        task_res = await db.execute(select(VerificationTask).where(VerificationTask.record_id == record.id))
        task = task_res.scalar_one_or_none()
        if task:
            task.status = "REJECTED"
            task.rejection_reason = reason
            task.reviewer_notes = notes
            task.resolved_at = datetime.now(timezone.utc)

        await audit_service.log_action(
            db=db,
            action="RECORD_VERIFIED_REJECTED",
            record_id=record.id,
            user_payload=user_payload,
            field_name="status",
            old_value=old_status,
            new_value="REJECTED",
            reason=f"Rejected: {reason}. Notes: {notes or 'N/A'}"
        )

        await db.commit()
        await db.refresh(record)
        return record

    async def edit_record_field(
        self,
        db: AsyncSession,
        record_id: str,
        user_payload: Dict[str, Any],
        field_path: str,
        new_value: Any,
        reason: str
    ) -> LandRecord:
        result = await db.execute(select(LandRecord).where(LandRecord.id == record_id))
        record = result.scalar_one_or_none()
        if not record:
            raise ValueError("Land record not found")

        old_snapshot = {
            "owner": record.owner_data,
            "property": record.property_data,
            "location": record.location_data,
            "status": record.status,
            "version": record.version
        }

        # Snapshot before edit
        await audit_service.create_version_snapshot(
            db=db,
            record_id=record.id,
            version_number=record.version,
            snapshot_data=old_snapshot,
            changed_by=user_payload.get("name", "Officer"),
            change_reason=reason
        )

        # Apply edit
        old_val = None
        if field_path.startswith("owner."):
            key = field_path.split(".")[1]
            old_val = record.owner_data.get(key)
            owner_copy = dict(record.owner_data)
            owner_copy[key] = new_value
            record.owner_data = owner_copy
        elif field_path.startswith("property."):
            key = field_path.split(".")[1]
            old_val = record.property_data.get(key)
            prop_copy = dict(record.property_data)
            prop_copy[key] = new_value
            record.property_data = prop_copy
        elif field_path.startswith("location."):
            key = field_path.split(".")[1]
            old_val = record.location_data.get(key)
            loc_copy = dict(record.location_data)
            loc_copy[key] = new_value
            record.location_data = loc_copy

        record.version += 1
        record.updated_at = datetime.now(timezone.utc)

        await audit_service.log_action(
            db=db,
            action="FIELD_CORRECTION_APPLIED",
            record_id=record.id,
            user_payload=user_payload,
            field_name=field_path,
            old_value=old_val,
            new_value=new_value,
            reason=reason
        )

        await db.commit()
        await db.refresh(record)
        return record

verification_service = VerificationService()
