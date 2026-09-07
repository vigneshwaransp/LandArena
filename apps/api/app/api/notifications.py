from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from app.services.notification_service import notification_service
from app.schemas.schemas import NotificationSendRequest

router = APIRouter(prefix="/notifications", tags=["Notification Services (SMS / Email / Push)"])

@router.get("")
async def list_notifications(limit: int = 20):
    """
    Returns dispatched notifications across SMS, Email, and Push channels.
    """
    return notification_service.list_notifications(limit=limit)

@router.post("/send")
async def send_notification(payload: NotificationSendRequest):
    """
    Sends automated land record alert via SMS Gateway, Email API, or Push notification.
    """
    return notification_service.send_notification(
        channel=payload.channel,
        recipient=payload.recipient,
        title=payload.title,
        message=payload.message,
        record_id=payload.record_id
    )

@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """
    Marks a notification as read.
    """
    success = notification_service.mark_as_read(notification_id)
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "id": notification_id}
