import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Patient, Doctor
from app.schemas import PatientCreate, PatientResponse
from app.auth import get_current_doctor

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
def create_or_get_patient(
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Creates a new patient or retrieves existing patient by Patient ID or ABHA ID.
    """
    if patient_in.id:
        existing = db.query(Patient).filter(Patient.id == patient_in.id).first()
        if existing:
            return existing

    if patient_in.abha_id:
        existing = db.query(Patient).filter(Patient.abha_id == patient_in.abha_id).first()
        if existing:
            return existing

    # Generate Patient ID if not specified
    generated_id = patient_in.id or f"PID-{uuid.uuid4().hex[:8].upper()}"

    new_patient = Patient(
        id=generated_id,
        name=patient_in.name,
        age=patient_in.age,
        gender=patient_in.gender,
        abha_id=patient_in.abha_id,
        phone=patient_in.phone,
        blood_group=patient_in.blood_group,
        vitals=patient_in.vitals,
        medical_history=patient_in.medical_history,
        allergies=patient_in.allergies
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.put("/{patient_id}", response_model=PatientResponse)
def update_patient(
    patient_id: str,
    patient_in: PatientCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Updates an existing patient record."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient.name = patient_in.name
    patient.age = patient_in.age
    patient.gender = patient_in.gender
    if patient_in.abha_id is not None:
        patient.abha_id = patient_in.abha_id
    if patient_in.phone is not None:
        patient.phone = patient_in.phone
    if patient_in.blood_group is not None:
        patient.blood_group = patient_in.blood_group
    if patient_in.vitals is not None:
        patient.vitals = patient_in.vitals
    if patient_in.medical_history is not None:
        patient.medical_history = patient_in.medical_history
    if patient_in.allergies is not None:
        patient.allergies = patient_in.allergies

    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}/history")
def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Returns past consultation sessions and notes for this patient."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    from app.models import Session as SessionModel, Note
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.patient_id == patient_id)
        .order_by(SessionModel.started_at.desc())
        .all()
    )
    history = []
    for s in sessions:
        note = db.query(Note).filter(Note.session_id == s.id).first()
        history.append({
            "session_id": s.id,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "status": s.status,
            "language": s.language,
            "note_status": note.status if note else "none",
            "summary": (note.edited_json or note.summary_json) if note else None
        })
    return {"patient_id": patient_id, "total_sessions": len(history), "history": history}


@router.get("", response_model=List[PatientResponse])
def list_patients(
    query: Optional[str] = Query(None, description="Search by name, ID or ABHA ID"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Lists or searches patients."""
    q = db.query(Patient)
    if query:
        pattern = f"%{query}%"
        q = q.filter(
            (Patient.name.ilike(pattern)) |
            (Patient.id.ilike(pattern)) |
            (Patient.abha_id.ilike(pattern))
        )
    return q.offset(skip).limit(limit).all()


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Retrieves patient by Patient ID."""
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient
