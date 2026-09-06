from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.schemas import ChatRequest, ChatResponse
from app.services.ai_assistant_service import ai_assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Land Assistant"])

@router.post("/chat", response_model=ChatResponse)
async def chat_with_assistant(req: ChatRequest, db: AsyncSession = Depends(get_db)):
    res = await ai_assistant_service.answer_query(db, req.query, req.record_id)
    return ChatResponse(
        answer=res["answer"],
        citations=res.get("citations", []),
        suggested_queries=res.get("suggested_queries", [])
    )
