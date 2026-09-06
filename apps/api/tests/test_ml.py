import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.services.ml_service import ml_service

def test_ml_service_metrics():
    metrics = ml_service.get_metrics()
    assert "best_model" in metrics
    assert "selected_metrics" in metrics
    assert "leaderboard" in metrics
    assert len(metrics["leaderboard"]) >= 2
    assert "feature_importances" in metrics
    assert len(metrics["feature_importances"]) > 0
    assert "confusion_matrix" in metrics
    assert metrics["selected_metrics"]["accuracy"] >= 95.0

def test_ml_service_prediction_clean():
    clean_sample = {
        "stated_area_acres": 2.5,
        "gis_calculated_area_acres": 2.48,
        "area_variance_pct": 0.8,
        "boundary_overlap_ratio": 0.0,
        "owner_name_similarity": 0.98,
        "temporal_date_gap_days": 10,
        "registration_year": 2023,
        "subdivision_depth": 1,
        "ocr_confidence": 96.0,
        "stamp_duty_ratio": 1.0,
        "prior_dispute_flag": 0,
        "document_type": "PATTA",
        "encumbrance_status": "NIL",
        "mutation_status": "APPROVED"
    }
    result = ml_service.predict(clean_sample)
    assert result["fraud_prediction"] == 0
    assert result["risk_level"] in ["LOW", "MEDIUM"]
    assert result["fraud_probability"] < 40.0
    assert "risk_drivers" in result
    assert len(result["risk_drivers"]) > 0

def test_ml_service_prediction_fraud():
    fraud_sample = {
        "stated_area_acres": 5.0,
        "gis_calculated_area_acres": 2.5,
        "area_variance_pct": 50.0,
        "boundary_overlap_ratio": 0.35,
        "owner_name_similarity": 0.40,
        "temporal_date_gap_days": 500,
        "registration_year": 2024,
        "subdivision_depth": 3,
        "ocr_confidence": 60.0,
        "stamp_duty_ratio": 0.40,
        "prior_dispute_flag": 1,
        "document_type": "POWER_OF_ATTORNEY",
        "encumbrance_status": "DISPUTED",
        "mutation_status": "REJECTED"
    }
    result = ml_service.predict(fraud_sample)
    assert result["fraud_prediction"] == 1
    assert result["risk_level"] in ["HIGH", "CRITICAL"]
    assert result["fraud_probability"] > 60.0
    assert len(result["risk_drivers"]) >= 2

@pytest.mark.asyncio
async def test_ml_api_endpoints():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. GET /api/ml/metrics
        res_metrics = await client.get("/api/ml/metrics")
        assert res_metrics.status_code == 200
        data = res_metrics.json()
        assert "best_model" in data
        assert "leaderboard" in data

        # 2. POST /api/ml/predict
        res_predict = await client.post("/api/ml/predict", json={
            "stated_area_acres": 3.0,
            "gis_calculated_area_acres": 2.9,
            "area_variance_pct": 3.3,
            "boundary_overlap_ratio": 0.0,
            "owner_name_similarity": 0.95,
            "ocr_confidence": 95.0,
            "stamp_duty_ratio": 1.0,
            "prior_dispute_flag": 0
        })
        assert res_predict.status_code == 200
        pred_data = res_predict.json()
        assert "fraud_probability" in pred_data
        assert "risk_level" in pred_data
        assert "risk_drivers" in pred_data
