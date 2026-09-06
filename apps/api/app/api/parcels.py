from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.models import Parcel, LandRecord
from app.schemas.schemas import ParcelResponse

router = APIRouter(prefix="/parcels", tags=["GIS & Parcels"])

@router.get("", response_model=List[ParcelResponse])
async def list_parcels(
    village: Optional[str] = None,
    district: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Parcel)
    if village:
        query = query.where(Parcel.village == village)
    if district:
        query = query.where(Parcel.district == district)
    res = await db.execute(query)
    return res.scalars().all()

@router.get("/geojson")
async def get_parcels_geojson(db: AsyncSession = Depends(get_db)):
    """
    Returns MapLibre GL JS compatible FeatureCollection with rich cadastral styling properties.
    """
    res = await db.execute(select(Parcel).options(selectinload(Parcel.land_records)))
    parcels = res.scalars().all()

    features = []
    for p in parcels:
        # Find active linked land record if available
        linked_rec = p.land_records[0] if p.land_records else None
        
        doc_area = linked_rec.property_data.get("area") if linked_rec and linked_rec.property_data else None
        owner_name = linked_rec.owner_data.get("name") if linked_rec and linked_rec.owner_data else "Registered Owner"
        status = linked_rec.status if linked_rec else "VERIFIED"
        risk_level = linked_rec.risk_level if linked_rec else "LOW"
        val_score = linked_rec.validation_score if linked_rec else 95.0
        rec_id = linked_rec.record_id if linked_rec else None

        dev_pct = 0.0
        if doc_area:
            dev_pct = round(abs(doc_area - p.gis_area_acres) / doc_area * 100, 2)

        feat = {
            "type": "Feature",
            "id": p.id,
            "geometry": p.geometry_geojson,
            "properties": {
                "parcel_id": p.id,
                "survey_number": p.survey_number,
                "subdivision": p.subdivision,
                "village": p.village,
                "district": p.district,
                "gis_area_acres": p.gis_area_acres,
                "gis_area_sqm": p.gis_area_sqm,
                "document_area_acres": doc_area,
                "area_deviation_pct": dev_pct,
                "status": status,
                "risk_level": risk_level,
                "validation_score": val_score,
                "owner_name": owner_name,
                "record_id": rec_id,
                "has_overlap": p.has_overlap,
                "overlap_with": p.overlap_with or [],
                "adjacent_surveys": p.adjacent_surveys or []
            }
        }
        features.append(feat)

    return {
        "type": "FeatureCollection",
        "features": features
    }

@router.get("/{parcel_id}", response_model=ParcelResponse)
async def get_parcel(parcel_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Parcel).where(Parcel.id == parcel_id))
    parcel = res.scalar_one_or_none()
    if not parcel:
        raise HTTPException(status_code=404, detail="Parcel not found")
    return parcel
