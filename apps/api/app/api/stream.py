import json
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import AsyncSessionLocal
from app.models.models import Document, Notification

router = APIRouter(prefix="/stream", tags=["Real-time Streaming"])

async def event_generator(request: Request) -> AsyncGenerator[str, None]:
    """
    SSE generator sending document status updates and notifications.
    """
    while True:
        if await request.is_disconnected():
            break

        try:
            async with AsyncSessionLocal() as db:
                # Fetch currently processing documents
                res = await db.execute(
                    select(Document)
                    .where(Document.status.in_(["UPLOADED", "PREPROCESSING", "OCR_PROCESSING", "EXTRACTING", "VALIDATING", "GIS_ANALYZING"]))
                    .limit(5)
                )
                processing_docs = res.scalars().all()

                # Fetch latest unread notification
                notif_res = await db.execute(
                    select(Notification).order_by(desc(Notification.created_at)).limit(3)
                )
                notifs = notif_res.scalars().all()

                data = {
                    "processing_documents": [
                        {
                            "id": d.id,
                            "filename": d.filename,
                            "status": d.status,
                            "progress": d.processing_progress,
                            "stage": d.current_stage
                        }
                        for d in processing_docs
                    ],
                    "notifications": [
                        {
                            "id": n.id,
                            "title": n.title,
                            "message": n.message,
                            "type": n.type,
                            "link": n.link,
                            "created_at": str(n.created_at)
                        }
                        for n in notifs
                    ]
                }

                yield f"data: {json.dumps(data)}\n\n"
        except Exception:
            pass

        await asyncio.sleep(2)

@router.get("/events")
async def sse_events(request: Request):
    return StreamingResponse(
        event_generator(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
