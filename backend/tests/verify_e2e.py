import httpx

def test_full_system_flow():
    client = httpx.Client(base_url="http://127.0.0.1:8000")

    # 1. Health check
    r_health = client.get("/health")
    assert r_health.status_code == 200
    assert r_health.json()["status"] == "ok"
    print("\n1. Health Check OK:", r_health.json())

    # 2. Login
    r_login = client.post("/auth/login", json={"email": "doctor@hospital.gov.in", "password": "doctor123"})
    assert r_login.status_code == 200, f"Login failed: {r_login.text}"
    token = r_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("2. Doctor Login OK:", r_login.json()["doctor_name"])

    # 3. Record Patient with Vitals
    patient_data = {
        "name": "Ananya Sharma",
        "age": 32,
        "gender": "Female",
        "phone": "+91-9876543210",
        "blood_group": "B+",
        "vitals": {"bp": "118/76", "pulse": "72", "temp": "98.4", "spo2": "99"},
        "medical_history": "No prior chronic conditions",
        "allergies": "None reported"
    }
    r_patient = client.post("/patients", json=patient_data, headers=headers)
    assert r_patient.status_code == 201, f"Patient create failed: {r_patient.text}"
    p_id = r_patient.json()["id"]
    print("3. Patient Record Created:", p_id, r_patient.json()["name"], "Vitals:", r_patient.json()["vitals"])

    # 4. Start Session
    r_session = client.post("/sessions", json={"patient_id": p_id, "language": "English"}, headers=headers)
    assert r_session.status_code == 201, f"Session start failed: {r_session.text}"
    s_id = r_session.json()["id"]
    print("4. Consultation Session Started:", s_id)

    # 5. Transcribe Speech Chunks
    r_chunk = client.post(
        f"/sessions/{s_id}/transcript-chunk",
        json={"chunk_no": 1, "text": "Patient complains of productive cough, headache and fever for 3 days."},
        headers=headers
    )
    assert r_chunk.status_code == 200
    print("5. Spoken English Chunk Transcribed:", r_chunk.json()["text"])

    # 6. Stop and Summarize
    r_stop = client.post(f"/sessions/{s_id}/stop", headers=headers)
    assert r_stop.status_code == 200
    note = r_stop.json()["note"]
    print("6. AI Generated SOAP Note Chief Complaint:", note.get("chief_complaint"))
    print("   Diagnosis:", note.get("diagnosis"))
    print("   Prescriptions:", note.get("medications"))

    # 7. Approve Note
    r_approve = client.post(f"/sessions/{s_id}/approve", headers=headers)
    assert r_approve.status_code == 200
    print("7. Doctor Note Approved & Signed:", r_approve.json()["note_status"])

    # 8. Export FHIR R4 Bundle
    r_fhir = client.get(f"/sessions/{s_id}/export?format=fhir", headers=headers)
    assert r_fhir.status_code == 200
    fhir = r_fhir.json()
    print("8. ABDM FHIR R4 Bundle Type:", fhir.get("resourceType"), "Total entries:", len(fhir.get("entry", [])))

    # 9. Export PDF
    r_pdf = client.get(f"/sessions/{s_id}/export?format=pdf", headers=headers)
    assert r_pdf.status_code == 200
    print("9. PDF Generated successfully. Size bytes:", len(r_pdf.content))

    # 10. Patient History
    r_hist = client.get(f"/patients/{p_id}/history", headers=headers)
    assert r_hist.status_code == 200
    print("10. Patient History Sessions:", r_hist.json()["total_sessions"])

    print("\n>>> ALL APIS VERIFIED AND WORKING 100%! <<<\n")


if __name__ == "__main__":
    test_full_system_flow()

