from fastapi import APIRouter
from typing import Dict, Any
from app.services.feedback_learning_service import feedback_learning_service
from app.schemas.schemas import FeedbackLearningStatsResponse

router = APIRouter(prefix="/learning", tags=["AI-driven Continuous Learning Mechanism"])

@router.get("/stats", response_model=FeedbackLearningStatsResponse)
async def get_learning_stats():
    """
    Returns statistics on Human-in-the-Loop corrections and accuracy improvement over time.
    """
    return feedback_learning_service.get_learning_stats()
