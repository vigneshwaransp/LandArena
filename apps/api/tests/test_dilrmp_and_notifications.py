import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_dilrmp_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. DILRMP Status
        res = await client.get("/api/dilrmp/status")
        assert res.status_code == 200
        data = res.json()
        assert "program_name" in data
        assert "state_rankings" in data
        assert len(data["state_rankings"]) >= 4

        # 2. DILRMP Khasra/Survey Verification
        res_ver = await client.get("/api/dilrmp/verify/145%2F2A")
        assert res_ver.status_code == 200
        ver_data = res_ver.json()
        assert ver_data["matched"] is True
        assert "khasra_survey_number" in ver_data
        assert "registered_owner" in ver_data

        # 3. DILRMP Sync
        res_sync = await client.post("/api/dilrmp/sync", json={
            "record_ids": ["LR-TN-ERD-00101", "LR-TN-ERD-00102"]
        })
        assert res_sync.status_code == 200
        sync_data = res_sync.json()
        assert sync_data["status"] == "SUCCESS"
        assert sync_data["synced_records_count"] == 2

@pytest.mark.asyncio
async def test_notification_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List notifications
        res_list = await client.get("/api/notifications")
        assert res_list.status_code == 200
        notifs = res_list.json()
        assert isinstance(notifs, list)
        assert len(notifs) > 0

        # 2. Send notification
        res_send = await client.post("/api/notifications/send", json={
            "channel": "SMS",
            "recipient": "+91 99999 11111",
            "title": "Title Deed Verified",
            "message": "Your title deed has been verified by Tahsildar.",
            "record_id": "LR-TN-ERD-00101"
        })
        assert res_send.status_code == 200
        sent_data = res_send.json()
        assert sent_data["channel"] == "SMS"
        assert "id" in sent_data

        # 3. Mark single notification as read
        notif_id = sent_data["id"]
        res_read = await client.post(f"/api/notifications/{notif_id}/read")
        assert res_read.status_code == 200
        assert res_read.json()["status"] == "success"

        # 4. Mark all notifications as read
        res_read_all = await client.post("/api/notifications/read-all")
        assert res_read_all.status_code == 200
        assert res_read_all.json()["status"] == "success"
        assert "marked_read_count" in res_read_all.json()

@pytest.mark.asyncio
async def test_learning_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/learning/stats")
        assert res.status_code == 200
        data = res.json()
        assert "total_corrections" in data
        assert "improved_accuracy" in data
