from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.models import LandRecord
from app.services.normalization_service import normalization_service
from app.schemas.schemas import LandRecordResponse

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("", response_model=List[LandRecordResponse])
async def search_records(
    q: str = Query(..., min_length=1),
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    query_str = q.lower().strip()
    res = await db.execute(select(LandRecord))
    all_records = res.scalars().all()

    matched_records = []
    
    for r in all_records:
        rec_id = (r.record_id or "").lower()
        owner = r.owner_data or {}
        prop = r.property_data or {}
        loc = r.location_data or {}

        owner_name = (owner.get("name") or "").lower()
        survey_no = str(prop.get("survey_number") or "").lower()
        patta_no = str(prop.get("patta_number") or "").lower()
        village = (loc.get("village") or "").lower()
        district = (loc.get("district") or "").lower()
        taluk = (loc.get("taluk") or "").lower()

        # Direct containment check
        if (query_str in rec_id or 
            query_str in owner_name or 
            query_str in survey_no or 
            query_str in patta_no or 
            query_str in village or 
            query_str in district or 
            query_str in taluk):
            matched_records.append((100.0, r))
            continue

        # Fuzzy / Phonetic name check
        cmp_res = normalization_service.compare_names(query_str, owner_name)
        if cmp_res["score"] >= 75.0:
            matched_records.append((cmp_res["score"], r))
            continue

    # Sort by relevance score descending
    matched_records.sort(key=lambda x: x[0], reverse=True)
    
    results = []
    for score, r in matched_records[:limit]:
        results.append(
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
        
    return results
