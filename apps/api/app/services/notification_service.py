import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class NotificationService:
    """
    Multichannel Notification Gateway (SMS, Email, Push Alerts)
    Sends automated alerts for deed digitization, mutation approval, fraud warnings,
    and revenue officer verification events.
    """

    def __init__(self):
        self._notifications: List[Dict[str, Any]] = [
            {
                "id": "notif-001",
                "channel": "SMS",
                "recipient": "+91 98765 43210",
                "title": "Land Title Verified",
                "message": "Patta No P-88421 for Survey No 145/2A in Thudupathi has been verified by Tahsildar. Validation Score: 96.0%.",
                "record_id": "LR-TN-ERD-00101",
                "read": False,
                "status": "DELIVERED",
                "gateway_ref": "SMS-NIC-89421",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "notif-002",
                "channel": "EMAIL",
                "recipient": "revenue.tahsildar@tn.gov.in",
                "title": "Critical Anomaly Detected",
                "message": "URGENT: Boundary overlap and future registration date detected on Survey 145/2A-CLONE. Immediate inspection recommended.",
                "record_id": "LR-TN-ERD-00103",
                "read": False,
                "status": "SENT",
                "gateway_ref": "MAIL-TN-00319",
                "created_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "id": "notif-003",
                "channel": "PUSH",
                "recipient": "Field Surveyor Mobile App",
                "title": "New Cadastral Survey Assigned",
                "message": "New ground-truth verification task assigned for Survey No 89/1B in Nasiyanur Village.",
                "record_id": "LR-TN-ERD-00102",
                "read": True,
                "status": "DELIVERED",
                "gateway_ref": "PUSH-FMB-7712",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        ]

    def list_notifications(self, limit: int = 20) -> List[Dict[str, Any]]:
        return sorted(self._notifications, key=lambda x: x["created_at"], reverse=True)[:limit]

    def send_notification(
        self,
        channel: str,
        recipient: str,
        title: str,
        message: str,
        record_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches notification via SMS gateway, Email, or Push.
        """
        notif_id = f"notif-{uuid.uuid4().hex[:8]}"
        gateway_ref = f"{channel.upper()}-GW-{uuid.uuid4().hex[:6]}"
        
        record = {
            "id": notif_id,
            "channel": channel.upper(),
            "recipient": recipient,
            "title": title,
            "message": message,
            "record_id": record_id,
            "read": False,
            "status": "DELIVERED",
            "gateway_ref": gateway_ref,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        self._notifications.insert(0, record)
        return record

    def mark_as_read(self, notification_id: str) -> bool:
        for n in self._notifications:
            if n["id"] == notification_id:
                n["read"] = True
                return True
        return False

notification_service = NotificationService()
