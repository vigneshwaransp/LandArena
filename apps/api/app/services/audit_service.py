from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import AuditLog, RecordVersion

class AuditService:
    async def log_action(
        self,
        db: AsyncSession,
        action: str,
        record_id: Optional[str] = None,
        user_payload: Optional[Dict[str, Any]] = None,
        field_name: Optional[str] = None,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        reason: Optional[str] = None,
        ip_address: str = "127.0.0.1"
    ) -> AuditLog:
        """
        Appends an immutable audit entry to the system ledger.
        """
        user_id = user_payload.get("sub", "system") if user_payload else "system"
        user_name = user_payload.get("name", "Revenue Officer / System") if user_payload else "System Engine"
        user_role = user_payload.get("role", "OFFICER") if user_payload else "SYSTEM"

        entry = AuditLog(
            record_id=record_id,
            user_id=user_id,
            user_name=user_name,
            user_role=user_role,
            action=action,
            field_name=field_name,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            ip_address=ip_address,
            created_at=datetime.now(timezone.utc)
        )
        db.add(entry)
        await db.commit()
        await db.refresh(entry)
        return entry

    async def create_version_snapshot(
        self,
        db: AsyncSession,
        record_id: str,
        version_number: int,
        snapshot_data: Dict[str, Any],
        changed_by: str,
        change_reason: str
    ) -> RecordVersion:
        version = RecordVersion(
            record_id=record_id,
            version_number=version_number,
            snapshot_data=snapshot_data,
            changed_by=changed_by,
            change_reason=change_reason,
            created_at=datetime.now(timezone.utc)
        )
        db.add(version)
        await db.commit()
        await db.refresh(version)
        return version

audit_service = AuditService()
