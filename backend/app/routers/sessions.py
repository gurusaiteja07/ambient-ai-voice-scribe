import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Session as SessionModel, Patient, Doctor, Transcript, Note
from app.schemas import SessionCreate, SessionResponse, FullTranscriptResponse
from app.auth import get_current_doctor
from app.services.summarizer import summarizer_service

router = APIRouter(prefix="/sessions", tags=["Sessions"])


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def start_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Starts a new consultation session for a patient, returning a unique Session ID.
    """
    patient = db.query(Patient).filter(Patient.id == session_in.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found. Create patient first.")

    session_id = f"SES-{datetime.datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    new_session = SessionModel(
        id=session_id,
        patient_id=patient.id,
        doctor_id=current_doctor.id,
        language=session_in.language or "English",
        status="active",
        started_at=datetime.datetime.utcnow()
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Gets consultation session metadata."""
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")
    return session_obj


@router.post("/{session_id}/stop")
async def stop_session_and_summarize(
    session_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Ends session, triggers the AI summarizer on the full saved transcript,
    and stores a structured draft note in the notes table.
    """
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    # Mark session as completed
    session_obj.status = "completed"
    session_obj.ended_at = datetime.datetime.utcnow()

    # Collect full transcript chunks in order
    transcripts = (
        db.query(Transcript)
        .filter(Transcript.session_id == session_id)
        .order_by(Transcript.chunk_no.asc())
        .all()
    )
    full_text = " ".join([t.text.strip() for t in transcripts if t.text.strip()])

    # Generate structured clinical note using AI summarizer
    structured_note = await summarizer_service.summarize_transcript(full_text)

    # Check if a note already exists for this session
    existing_note = db.query(Note).filter(Note.session_id == session_id).first()
    if existing_note:
        existing_note.summary_json = structured_note
        existing_note.updated_at = datetime.datetime.utcnow()
        note_obj = existing_note
    else:
        note_obj = Note(
            session_id=session_id,
            summary_json=structured_note,
            edited_json=structured_note,  # Initial draft is identical
            status="draft",
            updated_at=datetime.datetime.utcnow()
        )
        db.add(note_obj)

    db.commit()
    db.refresh(note_obj)

    return {
        "status": "success",
        "message": "Session completed and clinical note generated.",
        "session_id": session_id,
        "note_id": note_obj.id,
        "note": note_obj.summary_json
    }


@router.get("/{session_id}/transcript", response_model=FullTranscriptResponse)
def get_session_transcript(
    session_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """Retrieves full transcript and all ordered chunks for a session."""
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    chunks = (
        db.query(Transcript)
        .filter(Transcript.session_id == session_id)
        .order_by(Transcript.chunk_no.asc())
        .all()
    )
    full_text = " ".join([c.text.strip() for c in chunks if c.text.strip()])

    return FullTranscriptResponse(
        session_id=session_id,
        total_chunks=len(chunks),
        full_text=full_text,
        chunks=chunks
    )
