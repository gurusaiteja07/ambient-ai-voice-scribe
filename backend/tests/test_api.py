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
        json={"patient_id": "PID-TEST-01", "language": "English"},
        headers=headers
    )
    assert session_res.status_code == 201
    session_id = session_res.json()["id"]
    assert session_id.startswith("SES-")

    # Add transcript chunk
    chunk_res = client.post(
        f"/sessions/{session_id}/transcript-chunk",
        json={"chunk_no": 1, "text": "Patient Sunita has fever, cough, and body aches for 3 days."},
        headers=headers
    )
    assert chunk_res.status_code == 200
    assert "Patient Sunita" in chunk_res.json()["text"]

    # Stop session and generate structured note
    stop_res = client.post(f"/sessions/{session_id}/stop", headers=headers)
    assert stop_res.status_code == 200
    assert "note" in stop_res.json()

    # Get note
    note_res = client.get(f"/sessions/{session_id}/note", headers=headers)
    assert note_res.status_code == 200
    assert note_res.json()["status"] == "draft"

    # Approve note
    approve_res = client.post(f"/sessions/{session_id}/approve", headers=headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["note_status"] == "approved"

    # Export FHIR
    fhir_res = client.get(f"/sessions/{session_id}/export?format=fhir", headers=headers)
    assert fhir_res.status_code == 200
    assert fhir_res.json()["resourceType"] == "Bundle"

    # Patient History
    history_res = client.get("/patients/PID-TEST-01/history", headers=headers)
    assert history_res.status_code == 200
    assert history_res.json()["total_sessions"] >= 1
