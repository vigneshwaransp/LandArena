from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import LandRecord
from app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Exports"])

@router.get("/validation/{record_id}/pdf")
async def export_validation_report_pdf(record_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(LandRecord)
        .options(selectinload(LandRecord.anomalies))
        .where(LandRecord.id == record_id)
    )
    rec = res.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    record_data = {
        "record_id": rec.record_id,
        "status": rec.status,
        "validation_score": rec.validation_score,
        "risk_level": rec.risk_level,
        "owner": rec.owner_data,
        "property": rec.property_data,
        "location": rec.location_data,
        "validation_summary": rec.validation_summary,
    }

    pdf_bytes = report_service.generate_pdf_report(record_data)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=validation_report_{rec.record_id}.pdf"}
    )

@router.get("/export/csv")
async def export_records_csv(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LandRecord))
    records = res.scalars().all()

    records_data = [
        {
            "record_id": r.record_id,
            "owner": r.owner_data,
            "property": r.property_data,
            "location": r.location_data,
            "validation_score": r.validation_score,
            "risk_level": r.risk_level,
            "status": r.status
        }
        for r in records
    ]

    csv_content = report_service.generate_csv_report(records_data)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=land_records_export.csv"}
    )

@router.get("/export/json")
async def export_records_json(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(LandRecord))
    records = res.scalars().all()

    records_data = [
        {
            "record_id": r.record_id,
            "owner": r.owner_data,
            "property": r.property_data,
            "location": r.location_data,
            "validation_score": r.validation_score,
            "risk_level": r.risk_level,
            "status": r.status,
            "version": r.version,
            "created_at": str(r.created_at)
        }
        for r in records
    ]

    return records_data
