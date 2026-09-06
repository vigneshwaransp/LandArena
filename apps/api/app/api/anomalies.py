from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.models.models import Anomaly
from app.schemas.schemas import AnomalyResponse

router = APIRouter(prefix="/anomalies", tags=["Anomalies & Fraud Indicators"])

@router.get("", response_model=List[AnomalyResponse])
async def list_anomalies(
    severity: Optional[str] = None,
    anomaly_type: Optional[str] = Query(None, alias="type"),
    resolved: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Anomaly).order_by(desc(Anomaly.created_at)).offset(offset).limit(limit)
    if severity:
        query = query.where(Anomaly.severity == severity)
    if anomaly_type:
        query = query.where(Anomaly.type == anomaly_type)
    if resolved is not None:
        query = query.where(Anomaly.resolved == resolved)

    res = await db.execute(query)
    return res.scalars().all()

@router.post("/{anomaly_id}/resolve")
async def resolve_anomaly(anomaly_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Anomaly).where(Anomaly.id == anomaly_id))
    anom = res.scalar_one_or_none()
    if not anom:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    anom.resolved = True
    await db.commit()
    return {"message": "Anomaly marked as resolved", "id": anom.id}
