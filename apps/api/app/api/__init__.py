from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.records import router as records_router
from app.api.parcels import router as parcels_router
from app.api.verification import router as verification_router
from app.api.anomalies import router as anomalies_router
from app.api.search import router as search_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.audit_logs import router as audit_logs_router
from app.api.assistant import router as assistant_router
from app.api.stream import router as stream_router
from app.api.ml import router as ml_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(documents_router)
api_router.include_router(records_router)
api_router.include_router(parcels_router)
api_router.include_router(verification_router)
api_router.include_router(anomalies_router)
api_router.include_router(search_router)
api_router.include_router(dashboard_router)
api_router.include_router(reports_router)
api_router.include_router(audit_logs_router)
api_router.include_router(assistant_router)
api_router.include_router(stream_router)
api_router.include_router(ml_router, prefix="/ml", tags=["Machine Learning"])

