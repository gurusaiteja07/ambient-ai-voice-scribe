import os
import shutil
import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Session as SessionModel, Transcript, Doctor
from app.auth import get_current_doctor
from app.services.stt_service import stt_service

router = APIRouter(prefix="/sessions", tags=["Audio"])


class TranscriptChunkCreate(BaseModel):
    chunk_no: Optional[int] = None
    text: str


@router.post("/{session_id}/audio")
async def upload_audio_chunk(
    session_id: str,
    file: UploadFile = File(...),
    chunk_no: Optional[int] = Form(default=None),
    transcript_text: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Receives an audio chunk from browser or mobile client,
    saves the chunk locally, processes English transcription via Web Speech/STT,
    and stores the transcript in DB.
    """
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    # Determine chunk number if not sent
    if chunk_no is None:
        last_chunk = (
            db.query(Transcript)
            .filter(Transcript.session_id == session_id)
            .order_by(Transcript.chunk_no.desc())
            .first()
        )
        chunk_number = (last_chunk.chunk_no + 1) if last_chunk else 1
    else:
        chunk_number = chunk_no

    # Create session-specific audio directory
    session_audio_dir = os.path.join(settings.AUDIO_STORAGE_DIR, session_id)
    os.makedirs(session_audio_dir, exist_ok=True)

    # Save audio chunk file
    filename = f"chunk_{chunk_number}_{file.filename or 'audio.webm'}"
    file_path = os.path.join(session_audio_dir, filename)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save audio file: {e}")

    # Prioritize client-captured English speech transcript if provided
    if transcript_text and transcript_text.strip():
        text = transcript_text.strip()
        detected_lang = "en"
    else:
        # Transcribe audio file using Whisper / SpeechRecognition STT service
        try:
            text, detected_lang = stt_service.transcribe_audio_file(
                file_path=file_path,
                language=session_obj.language or "en"
            )
        except Exception:
            text = f"[Spoken consultation segment #{chunk_number}]"
            detected_lang = "en"

    # Save transcript record to DB
    transcript_record = Transcript(
        session_id=session_id,
        chunk_no=chunk_number,
        text=text,
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(transcript_record)
    db.commit()
    db.refresh(transcript_record)

    return {
        "status": "success",
        "session_id": session_id,
        "chunk_no": chunk_number,
        "text": text,
        "language": detected_lang,
        "timestamp": transcript_record.timestamp.isoformat()
    }


@router.post("/{session_id}/transcript-chunk")
def add_transcript_chunk(
    session_id: str,
    chunk_in: TranscriptChunkCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_doctor)
):
    """
    Directly adds a transcribed speech chunk (e.g. from browser or mobile Web Speech API).
    """
    session_obj = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session_obj:
        raise HTTPException(status_code=404, detail="Session not found")

    if chunk_in.chunk_no is None:
        last_chunk = (
            db.query(Transcript)
            .filter(Transcript.session_id == session_id)
            .order_by(Transcript.chunk_no.desc())
            .first()
        )
        chunk_number = (last_chunk.chunk_no + 1) if last_chunk else 1
    else:
        chunk_number = chunk_in.chunk_no

    transcript_record = Transcript(
        session_id=session_id,
        chunk_no=chunk_number,
        text=chunk_in.text.strip(),
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db.add(transcript_record)
    db.commit()
    db.refresh(transcript_record)

    return {
        "status": "success",
        "session_id": session_id,
        "chunk_no": chunk_number,
        "text": transcript_record.text,
        "timestamp": transcript_record.timestamp.isoformat()
    }
