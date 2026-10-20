import pytest
from fastapi.testclient import TestClient
from app.main import app, init_db, seed_initial_data


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    init_db()
    seed_initial_data()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


def test_health_check(client):
    """Step 1 validation: /health returns status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_doctor_login(client):
    """Step 3 validation: Doctor login returns valid JWT token."""
    response = client.post(
        "/auth/login",
        json={"email": "doctor@hospital.gov.in", "password": "doctor123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_patient_flow(client):
    """Step 3 validation: Patient creation and session start."""
    # Login to get token
    login_res = client.post(
        "/auth/login",
        json={"email": "doctor@hospital.gov.in", "password": "doctor123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create new patient
    patient_payload = {
        "id": "PID-TEST-01",
        "name": "Sunita Devi",
        "age": 38,
        "gender": "Female",
        "abha_id": "14-9988-7766-5544"
    }
    create_res = client.post("/patients", json=patient_payload, headers=headers)
    assert create_res.status_code in [200, 201]
    assert create_res.json()["name"] == "Sunita Devi"

    # Start session
    session_res = client.post(
        "/sessions",
        json={"patient_id": "PID-TEST-01", "language": "Hindi"},
        headers=headers
    )
    assert session_res.status_code == 201
    session_id = session_res.json()["id"]
    assert session_id.startswith("SES-")
