import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Session as SessionModel, Note, Doctor, Patient
from app.schemas import NoteResponse, NoteUpdate, NoteApproveResponse
from app.auth import get_current_doctor
from app.services.fhir_service import fhir_service
from app.services.pdf_service import pdf_service

router = APIRouter(prefix="/sessions", tags=["Notes & Export"])


@router.get("/{session_id}/note", response_model=NoteResponse)
def get_session_note(
    session_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Retrieves clinical note (summary_json and edited_json) for a session."""
    note = db.query(Note).filter(Note.session_id == session_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found for this session")
    return note


@router.put("/{session_id}/note", response_model=NoteResponse)
def update_session_note(
    session_id: str,
    note_update: NoteUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Updates the edited clinical note.
    Once approved, modifications are restricted.
    """
    note = db.query(Note).filter(Note.session_id == session_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found for this session")

    if note.status == "approved":
        raise HTTPException(status_code=400, detail="Cannot edit an already approved note.")

    note.edited_json = note_update.edited_note.model_dump()
    note.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note


@router.post("/{session_id}/approve", response_model=NoteApproveResponse)
def approve_session_note(
    session_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Doctor approves the note. Changes status to 'approved', makes it read-only,
    and generates an ABDM-compliant FHIR R4 Bundle.
    """
    note = db.query(Note).filter(Note.session_id == session_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found for this session")

    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    patient = db.query(Patient).filter(Patient.id == session_obj.patient_id).first()

    # Use edited note if doctor made modifications, else raw summary
    active_note = note.edited_json if note.edited_json else note.summary_json

    patient_data = {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "abha_id": patient.abha_id
    }
    doctor_data = {
        "id": current_doctor.id,
        "name": current_doctor.name,
        "hospital": current_doctor.hospital
    }

    # Generate ABDM FHIR bundle
    fhir_bundle = fhir_service.create_op_consult_bundle(
        session_id=session_id,
        patient_data=patient_data,
        doctor_data=doctor_data,
        note_data=active_note
    )

    note.status = "approved"
    note.fhir_json = fhir_bundle
    note.updated_at = datetime.datetime.utcnow()

    db.commit()
    db.refresh(note)

    return NoteApproveResponse(
        status="success",
        message="Consultation note approved and locked. ABDM FHIR bundle generated.",
        session_id=session_id,
        note_status=note.status,
        fhir_ready=True
    )


@router.get("/{session_id}/export")
def export_note(
    session_id: str,
    format: str = Query("pdf", pattern="^(pdf|fhir)$"),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Exports consultation note as printable PDF or ABDM FHIR R4 JSON document.
    """
    note = db.query(Note).filter(Note.session_id == session_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found for this session")

    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    patient = db.query(Patient).filter(Patient.id == session_obj.patient_id).first()

    active_note = note.edited_json if note.edited_json else note.summary_json

    patient_data = {
        "id": patient.id,
        "name": patient.name,
        "age": patient.age,
        "gender": patient.gender,
        "abha_id": patient.abha_id
    }
    doctor_data = {
        "id": current_doctor.id,
        "name": current_doctor.name,
        "hospital": current_doctor.hospital
    }

    if format == "fhir":
        # If FHIR bundle was not yet generated, generate now
        fhir_bundle = note.fhir_json or fhir_service.create_op_consult_bundle(
            session_id=session_id,
            patient_data=patient_data,
            doctor_data=doctor_data,
            note_data=active_note
        )
        return fhir_bundle

    # Export as PDF
    pdf_bytes = pdf_service.generate_consultation_pdf(
        session_id=session_id,
        patient_data=patient_data,
        doctor_data=doctor_data,
        note_data=active_note
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=consultation_note_{session_id}.pdf"
        }
    )
