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
        abha_id=patient_in.abha_id
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


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
