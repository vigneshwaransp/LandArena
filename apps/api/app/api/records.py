from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_payload
from app.models.models import LandRecord, Anomaly, Document, Parcel
from app.schemas.schemas import LandRecordResponse, LandRecordDetailResponse, LandRecordUpdate, AnomalyResponse
from app.services.validation_service import validation_engine
from app.services.anomaly_service import anomaly_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/records", tags=["Land Records"])

@router.get("", response_model=List[LandRecordResponse])
async def list_records(
    status: Optional[str] = None,
    risk: Optional[str] = None,
    district: Optional[str] = None,
    village: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(LandRecord).order_by(desc(LandRecord.created_at)).offset(offset).limit(limit)

    if status:
        query = query.where(LandRecord.status == status)
    if risk:
        query = query.where(LandRecord.risk_level == risk)
    if search:
        search_pattern = f"%{search.lower()}%"
        # Search record_id
        query = query.where(LandRecord.record_id.ilike(search_pattern))

    result = await db.execute(query)
    records = result.scalars().all()

    resp = []
    for r in records:
        # If village or district filter applied in memory or json
        if district and r.location_data.get("district", "").lower() != district.lower():
            continue
        if village and r.location_data.get("village", "").lower() != village.lower():
            continue

        resp.append(
            LandRecordResponse(
                id=r.id,
                record_id=r.record_id,
                document_id=r.document_id,
                parcel_id=r.parcel_id,
                status=r.status,
                validation_score=r.validation_score,
                risk_level=r.risk_level,
                owner=r.owner_data or {},
                property=r.property_data or {},
                location=r.location_data or {},
                validation_summary=r.validation_summary,
                version=r.version,
                verified_by=r.verified_by,
                verified_at=r.verified_at,
                created_at=r.created_at,
                updated_at=r.updated_at
            )
        )
    return resp

@router.get("/{record_id}", response_model=LandRecordDetailResponse)
async def get_record(record_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LandRecord)
        .options(selectinload(LandRecord.anomalies), selectinload(LandRecord.parcel))
        .where(or_(LandRecord.id == record_id, LandRecord.record_id == record_id))
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    anom_resp = [
        AnomalyResponse(
            id=a.id,
            record_id=a.record_id,
            type=a.type,
            severity=a.severity,
            confidence=a.confidence,
            title=a.title,
            explanation=a.explanation,
            evidence=a.evidence or {},
            resolved=a.resolved,
            created_at=a.created_at
        )
        for a in rec.anomalies
    ]

    parcel_geo = rec.parcel.geometry_geojson if rec.parcel else None

    return LandRecordDetailResponse(
        id=rec.id,
        record_id=rec.record_id,
        document_id=rec.document_id,
        parcel_id=rec.parcel_id,
        status=rec.status,
        validation_score=rec.validation_score,
        risk_level=rec.risk_level,
        owner=rec.owner_data or {},
        property=rec.property_data or {},
        location=rec.location_data or {},
        validation_summary=rec.validation_summary,
        version=rec.version,
        verified_by=rec.verified_by,
        verified_at=rec.verified_at,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
        anomalies=anom_resp,
        parcel_geometry=parcel_geo
    )

@router.post("/{record_id}/validate")
async def trigger_validation(record_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(LandRecord)
        .options(selectinload(LandRecord.parcel))
        .where(or_(LandRecord.id == record_id, LandRecord.record_id == record_id))
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise HTTPException(status_code=404, detail="Land record not found")

    parcel_ctx = None
    if rec.parcel:
        parcel_ctx = {
            "id": rec.parcel.id,
            "survey_number": rec.parcel.survey_number,
            "gis_area_acres": rec.parcel.gis_area_acres,
            "has_overlap": rec.parcel.has_overlap,
            "overlap_with": rec.parcel.overlap_with,
            "adjacent_surveys": rec.parcel.adjacent_surveys
        }

    all_res = await db.execute(select(LandRecord))
    all_recs = all_res.scalars().all()
    hist_records = [{"owner": r.owner_data, "record_id": r.record_id, "survey_number": r.property_data.get("survey_number")} for r in all_recs if r.id != rec.id]

    data = {
        "record_id": rec.record_id,
        "owner": rec.owner_data,
        "property": rec.property_data,
        "location": rec.location_data
    }

    val_context = {
        "parcel": parcel_ctx,
        "historical_records": hist_records,
        "existing_survey_claims": hist_records,
        "ocr_confidence": 94.0
    }

    val_summary = validation_engine.validate_record(data, val_context)
    rec.validation_summary = val_summary
    rec.validation_score = val_summary["overall_score"]
    rec.risk_level = val_summary["risk_level"]

    # Refresh anomalies
    # Delete previous
    anoms = await db.execute(select(Anomaly).where(Anomaly.record_id == rec.id))
    for a in anoms.scalars().all():
        await db.delete(a)

    new_anoms = anomaly_service.extract_anomalies_from_validation(val_summary, rec.id)
    for na in new_anoms:
        anom_obj = Anomaly(
            record_id=rec.id,
            type=na["type"],
            severity=na["severity"],
            confidence=na["confidence"],
            title=na["title"],
            explanation=na["explanation"],
            evidence=na["evidence"],
            resolved=False
        )
        db.add(anom_obj)

    await db.commit()
    await db.refresh(rec)

    return {
        "validation_score": rec.validation_score,
        "risk_level": rec.risk_level,
        "validation_summary": rec.validation_summary
    }
