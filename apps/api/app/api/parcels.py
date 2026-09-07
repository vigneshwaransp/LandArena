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


# Tahsildars & Taluk Jurisdictions Database
TAHSILDARS_JURISDICTIONS = [
    {
        "id": "tah-prd-01",
        "name": "K. Selvakumar, M.A.",
        "title": "Tahsildar & Executive Magistrate",
        "office": "Taluk Office, Perundurai",
        "taluk": "Perundurai",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.2758, "lng": 77.5828},
        "bbox": [77.5000, 11.2000, 77.6700, 11.3500],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.5000, 11.2000],
                [77.6700, 11.2000],
                [77.6700, 11.3500],
                [77.5000, 11.3500],
                [77.5000, 11.2000]
            ]]
        },
        "revenue_villages": ["Thudupathi", "Perundurai", "Vijayamangalam", "Kunnathur", "Seenapuram", "Moongilpalayam", "Kullampalayam"],
        "total_parcels": 42850,
        "digitized_parcels": 41290,
        "area_sqkm": 442.8,
        "area_acres": 109418.0,
        "dilrmp_compliance_pct": 96.4,
        "contact": {"phone": "+91 4294 220220", "email": "tah.perundurai@tn.gov.in"}
    },
    {
        "id": "tah-erd-02",
        "name": "V. Saravanan, M.Sc.",
        "title": "Tahsildar & Taluk Executive Officer",
        "office": "Taluk Office, Brough Road, Erode",
        "taluk": "Erode",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.3410, "lng": 77.7172},
        "bbox": [77.6500, 11.2800, 77.8200, 11.4200],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.6500, 11.2800],
                [77.8200, 11.2800],
                [77.8200, 11.4200],
                [77.6500, 11.4200],
                [77.6500, 11.2800]
            ]]
        },
        "revenue_villages": ["Nasiyanur", "Chithode", "Surampatti", "Kasipalayam", "Modachur", "Solar", "Villarasampatti"],
        "total_parcels": 68120,
        "digitized_parcels": 66890,
        "area_sqkm": 382.4,
        "area_acres": 94493.0,
        "dilrmp_compliance_pct": 98.1,
        "contact": {"phone": "+91 424 2258250", "email": "tah.erode@tn.gov.in"}
    },
    {
        "id": "tah-bhv-03",
        "name": "M. Dhanalakshmi, B.A., B.L.",
        "title": "Tahsildar & Revenue Divisional Officer",
        "office": "Taluk Office, Kalingarayanpalayam, Bhavani",
        "taluk": "Bhavani",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.4485, "lng": 77.6830},
        "bbox": [77.6000, 11.3800, 77.7800, 11.5300],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.6000, 11.3800],
                [77.7800, 11.3800],
                [77.7800, 11.5300],
                [77.6000, 11.5300],
                [77.6000, 11.3800]
            ]]
        },
        "revenue_villages": ["Kavindapadi", "Bhavani", "Ammapettai", "Mylambadi", "Kurichi", "Jambai", "Oricheri"],
        "total_parcels": 35410,
        "digitized_parcels": 33570,
        "area_sqkm": 312.6,
        "area_acres": 77245.0,
        "dilrmp_compliance_pct": 94.8,
        "contact": {"phone": "+91 4256 230100", "email": "tah.bhavani@tn.gov.in"}
    },
    {
        "id": "tah-mod-04",
        "name": "P. Rajendran, M.A.",
        "title": "Tahsildar & Executive Magistrate",
        "office": "Taluk Office, Modakkurichi",
        "taluk": "Modakkurichi",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.2650, "lng": 77.7720},
        "bbox": [77.6800, 11.1800, 77.8600, 11.3400],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.6800, 11.1800],
                [77.8600, 11.1800],
                [77.8600, 11.3400],
                [77.6800, 11.3400],
                [77.6800, 11.1800]
            ]]
        },
        "revenue_villages": ["Modakkurichi", "Ganapathipalayam", "Sivagiri", "Elumathur", "Kandikattuvalasu", "Avalpoondurai"],
        "total_parcels": 29190,
        "digitized_parcels": 26710,
        "area_sqkm": 288.9,
        "area_acres": 71388.0,
        "dilrmp_compliance_pct": 91.5,
        "contact": {"phone": "+91 424 2500120", "email": "tah.modakkurichi@tn.gov.in"}
    },
    {
        "id": "tah-gbi-05",
        "name": "S. Anandhi, B.Sc.",
        "title": "Tahsildar & Sub-Collector Assistant",
        "office": "Taluk Office, Katcheri Medu, Gobichettipalayam",
        "taluk": "Gobichettipalayam",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.4550, "lng": 77.4420},
        "bbox": [77.3500, 11.3600, 77.5500, 11.5600],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.3500, 11.3600],
                [77.5500, 11.3600],
                [77.5500, 11.5600],
                [77.3500, 11.5600],
                [77.3500, 11.3600]
            ]]
        },
        "revenue_villages": ["Gobi Rural", "Lakkampatti", "Nambiyur", "Kallipatti", "Vellankoil", "Polavapalayam"],
        "total_parcels": 51200,
        "digitized_parcels": 49000,
        "area_sqkm": 418.5,
        "area_acres": 103413.0,
        "dilrmp_compliance_pct": 95.7,
        "contact": {"phone": "+91 4285 222040", "email": "tah.gobi@tn.gov.in"}
    },
    {
        "id": "tah-sat-06",
        "name": "R. Murugesan, M.Com.",
        "title": "Tahsildar & Taluk Magistrate",
        "office": "Taluk Office, Mysore Trunk Road, Sathyamangalam",
        "taluk": "Sathyamangalam",
        "district": "Erode",
        "state": "Tamil Nadu",
        "center": {"lat": 11.5050, "lng": 77.2400},
        "bbox": [77.1000, 11.3800, 77.3800, 11.6400],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [77.1000, 11.3800],
                [77.3800, 11.3800],
                [77.3800, 11.6400],
                [77.1000, 11.6400],
                [77.1000, 11.3800]
            ]]
        },
        "revenue_villages": ["Sathyamangalam", "Bhavanisagar", "Sirumugai", "Punjai Puliampatti", "Alathucombai", "Koduveri"],
        "total_parcels": 38900,
        "digitized_parcels": 34700,
        "area_sqkm": 580.2,
        "area_acres": 143370.0,
        "dilrmp_compliance_pct": 89.2,
        "contact": {"phone": "+91 4295 220300", "email": "tah.sathyamangalam@tn.gov.in"}
    }
]

@router.get("/tahsildars/all")
async def list_tahsildars():
    """
    Returns list of Tahsildars with their administrative taluk jurisdictions,
    center latitude/longitude coordinates, bounding boxes, and boundary GeoJSON.
    """
    return TAHSILDARS_JURISDICTIONS

@router.get("/jurisdiction/{taluk}")
async def get_tahsildar_jurisdiction(taluk: str, db: AsyncSession = Depends(get_db)):
    """
    Returns specific Tahsildar jurisdiction boundary and all parcels within that taluk.
    """
    matched = next((t for t in TAHSILDARS_JURISDICTIONS if t["taluk"].lower() == taluk.lower()), None)
    if not matched:
        raise HTTPException(status_code=404, detail=f"Tahsildar jurisdiction for taluk '{taluk}' not found")
    
    # Query parcels in this taluk
    res = await db.execute(select(Parcel).where(Parcel.taluk == matched["taluk"]))
    parcels = res.scalars().all()
    
    return {
        "jurisdiction": matched,
        "parcels_count": len(parcels),
        "parcels": [
            {
                "id": p.id,
                "survey_number": p.survey_number,
                "subdivision": p.subdivision,
                "village": p.village,
                "gis_area_acres": p.gis_area_acres,
                "centroid_lat": p.centroid_lat,
                "centroid_lng": p.centroid_lng
            }
            for p in parcels
        ]
    }

