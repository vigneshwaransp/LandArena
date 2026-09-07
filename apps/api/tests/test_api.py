import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.services.normalization_service import normalization_service
from app.services.nlp_service import nlp_service
from app.services.validation_service import validation_engine, OwnerConsistencyRule, AreaConsistencyRule, DateConsistencyRule
from app.services.gis_service import gis_service

@pytest.mark.asyncio
async def test_normalization_phonetics():
    # 1. Exact & Transliteration
    res_ta = normalization_service.compare_names("Ravi Kumar", "ரவிகுமார்")
    assert res_ta["category"] in ["MATCH", "PROBABLE_MATCH"]
    assert res_ta["score"] >= 85.0

    # 2. Initial expansion: "R. Kumar" vs "Ravi Kumar"
    res_init = normalization_service.compare_names("R. Kumar", "Ravi Kumar")
    assert res_init["category"] in ["MATCH", "PROBABLE_MATCH"]
    assert res_init["score"] >= 90.0

    # 3. Soundex phonetic similarity
    snd1 = normalization_service.soundex("Suresh")
    snd2 = normalization_service.soundex("Sooresh")
    assert snd1 == snd2

def test_nlp_entity_extraction():
    sample_text = """GOVERNMENT OF TAMIL NADU - REVENUE
Patta No: P-99120
Survey No: 145/2A
Owner Name: Ravi Kumar (ரவிகுமார்)
Father Name: S. Kumar
Total Extent / Area: 2.45 Acres
Village: Thudupathi | District: Erode
Registration Date: 12-04-2021"""

    entities = nlp_service.extract_entities(sample_text)
    assert entities["property"]["survey_number"] == "145/2A"
    assert entities["property"]["area"] == 2.45
    assert entities["property"]["area_unit"] == "acre"
    assert "Ravi Kumar" in entities["owner"]["name"]
    assert entities["location"]["village"] == "Thudupathi"
    assert entities["location"]["district"] == "Erode"

def test_gis_area_and_deviation():
    # Document area: 2.45 acres, GIS area: 2.39 acres -> 2.45% deviation
    dev_res = gis_service.check_area_deviation(doc_area_acres=2.45, gis_area_acres=2.39, tolerance_pct=5.0)
    assert dev_res["status"] == "ACCEPTABLE"
    assert dev_res["deviation_pct"] == 2.45

    # Critical mismatch: 2.85 acres vs 2.39 acres -> 19.25% deviation
    crit_res = gis_service.check_area_deviation(doc_area_acres=2.85, gis_area_acres=2.39, tolerance_pct=5.0)
    assert crit_res["status"] == "CRITICAL_MISMATCH"
    assert crit_res["severity"] == "HIGH"

def test_validation_rule_engine():
    # Test Future Date Anomaly
    data_future = {
        "owner": {"name": "Rajesh Kumar"},
        "property": {"survey_number": "145/2A", "area": 2.45, "registration_date": "2030-01-01"},
        "location": {"village": "Thudupathi", "taluk": "Perundurai", "district": "Erode"}
    }
    date_rule = DateConsistencyRule()
    date_res = date_rule.execute(data_future)
    assert date_res["status"] == "FAIL"
    assert date_res["severity"] == "CRITICAL"

    # Test full validation composite score
    valid_data = {
        "record_id": "TEST-REC-001",
        "owner": {"name": "Ravi Kumar", "father_name": "S. Kumar"},
        "property": {"survey_number": "145/2A", "subdivision_number": "2A", "area": 2.45, "registration_date": "2021-04-12"},
        "location": {"village": "Thudupathi", "taluk": "Perundurai", "district": "Erode", "state": "Tamil Nadu"}
    }
    val_sum = validation_engine.validate_record(valid_data, context={"parcel": {"gis_area_acres": 2.45, "has_overlap": False}})
    assert val_sum["overall_score"] >= 90.0
    assert val_sum["risk_level"] == "LOW"

from app.core.database import init_db, AsyncSessionLocal
from app.scripts.seed_data import seed_database_if_empty

@pytest.mark.asyncio
async def test_api_endpoints():
    await init_db()
    async with AsyncSessionLocal() as session:
        await seed_database_if_empty(session)
        
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Root
        r_root = await client.get("/")
        assert r_root.status_code == 200
        assert r_root.json()["status"] == "OPERATIONAL"

        # 2. Auth login
        r_login = await client.post("/api/auth/login", json={"email": "admin@example.com", "password": "admin123"})
        assert r_login.status_code == 200
        tokens = r_login.json()
        assert "access_token" in tokens
        auth_header = {"Authorization": f"Bearer {tokens['access_token']}"}

        # 3. Dashboard stats
        r_dash = await client.get("/api/dashboard/stats", headers=auth_header)
        assert r_dash.status_code == 200
        dash_data = r_dash.json()
        assert dash_data["total_records"] >= 5
        assert "records_by_risk" in dash_data

        # 4. Records list
        r_records = await client.get("/api/records", headers=auth_header)
        assert r_records.status_code == 200
        records = r_records.json()
        assert len(records) >= 5

        # 5. GeoJSON parcels
        r_geojson = await client.get("/api/parcels/geojson")
        assert r_geojson.status_code == 200
        geo = r_geojson.json()
        assert geo["type"] == "FeatureCollection"
        assert len(geo["features"]) >= 5

        # 6. Global Search
        r_search = await client.get("/api/search?q=145/2A", headers=auth_header)
        assert r_search.status_code == 200
        search_res = r_search.json()
        assert len(search_res) >= 1

        # 7. AI Assistant Chat
        r_chat = await client.post(
            "/api/assistant/chat",
            json={"query": "Why was this record flagged?", "record_id": records[0]["id"]},
            headers=auth_header
        )
        assert r_chat.status_code == 200
        chat_data = r_chat.json()
        assert len(chat_data["answer"]) > 20

        # 8. Tahsildars List
        r_tahsildars = await client.get("/api/parcels/tahsildars/all")
        assert r_tahsildars.status_code == 200
        tahsildar_list = r_tahsildars.json()
        assert len(tahsildar_list) >= 5
        assert "center" in tahsildar_list[0]
        assert "boundary_geojson" in tahsildar_list[0]
        assert "lat" in tahsildar_list[0]["center"]

        # 9. Tahsildar Taluk Jurisdiction
        r_jurisdiction = await client.get("/api/parcels/jurisdiction/Perundurai")
        assert r_jurisdiction.status_code == 200
        juris_data = r_jurisdiction.json()
        assert juris_data["jurisdiction"]["taluk"] == "Perundurai"
        assert "parcels" in juris_data

