import os
import shutil
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.core.database import get_db, AsyncSessionLocal
from app.core.config import settings
from app.models.models import Document, DocumentPage, ProcessingJob
from app.schemas.schemas import DocumentResponse, DocumentDetailResponse, DocumentPageResponse
from app.services.storage_service import storage_service
from app.services.document_pipeline_service import document_pipeline_service

router = APIRouter(prefix="/documents", tags=["Documents"])

async def background_pipeline_worker(document_id: str):
    async with AsyncSessionLocal() as db:
        await document_pipeline_service.process_document(db, document_id)

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    # Validate file format
    allowed_extensions = [".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif"]
    suffix = Path(file.filename).suffix.lower()
    if suffix not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{suffix}'. Allowed: {', '.join(allowed_extensions)}"
        )

    content = await file.read()
    file_size = len(content)
    
    # Save to storage
    stored_path = await storage_service.save_file(content, file.filename, subfolder="documents")

    # Determine initial type
    doc_type, type_conf = document_pipeline_service.classify_document(file.filename)

    doc = Document(
        filename=file.filename,
        file_path=stored_path,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf",
        document_type=doc_type,
        type_confidence=type_conf,
        page_count=1,
        status="UPLOADED",
        processing_progress=0,
        current_stage="Uploaded to Queue"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Trigger background processing
    background_tasks.add_task(background_pipeline_worker, doc.id)

    return doc

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    query = select(Document).order_by(desc(Document.created_at)).offset(offset).limit(limit)
    if status_filter:
        query = query.where(Document.status == status_filter)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{document_id}", response_model=DocumentDetailResponse)
async def get_document(document_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Document)
        .options(selectinload(Document.pages))
        .where(Document.id == document_id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pages_resp = []
    for p in doc.pages:
        pages_resp.append(
            DocumentPageResponse(
                id=p.id,
                page_number=p.page_number,
                image_url=storage_service.get_public_url(p.image_path),
                processed_image_url=storage_service.get_public_url(p.processed_image_path) if p.processed_image_path else None,
                width=p.width,
                height=p.height,
                ocr_text=p.ocr_text,
                ocr_boxes=p.ocr_boxes or [],
                confidence=p.confidence,
                language=p.language
            )
        )

    resp = DocumentDetailResponse(
        id=doc.id,
        filename=doc.filename,
        file_size=doc.file_size,
        mime_type=doc.mime_type,
        document_type=doc.document_type,
        type_confidence=doc.type_confidence,
        page_count=doc.page_count,
        status=doc.status,
        processing_progress=doc.processing_progress,
        current_stage=doc.current_stage,
        error_message=doc.error_message,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
        pages=pages_resp,
        download_url=storage_service.get_public_url(doc.file_path)
    )
    return resp

@router.post("/{document_id}/process")
async def reprocess_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    res = await db.execute(select(Document).where(Document.id == document_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.status = "PREPROCESSING"
    doc.processing_progress = 5
    doc.current_stage = "Reprocessing Started"
    await db.commit()

    background_tasks.add_task(background_pipeline_worker, doc.id)
    return {"message": "Document reprocessing started", "document_id": doc.id}

@router.delete("/{document_id}")
async def delete_document(document_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Document).where(Document.id == document_id))
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/files/{subfolder}/{filename}")
async def serve_file(subfolder: str, filename: str):
    file_path = settings.UPLOAD_DIR / subfolder / filename
    if not file_path.exists():
        # Check parent folder fallback
        file_path = settings.UPLOAD_DIR / "documents" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on server")

    return FileResponse(path=str(file_path))
