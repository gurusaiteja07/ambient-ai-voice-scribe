import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# Medication Item in Structured Note
class MedicationItem(BaseModel):
    name: str = ""
    dose: str = ""
    frequency: str = ""
    duration: str = ""


# Structured Clinical Note Format (Section 8)
class StructuredNoteSchema(BaseModel):
    chief_complaint: str = ""
    history_of_present_illness: str = ""
    symptoms: List[str] = Field(default_factory=list)
    examination: str = ""
    diagnosis: str = ""
    medications: List[MedicationItem] = Field(default_factory=list)
    investigations: List[str] = Field(default_factory=list)
    advice: str = ""
    follow_up: str = ""


# Auth Schemas
class DoctorLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    doctor_id: int
    doctor_name: str
    hospital: Optional[str] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    doctor_id: Optional[int] = None


class DoctorCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    hospital: Optional[str] = "District Hospital"


class DoctorResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    hospital: Optional[str]
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Patient Schemas
class PatientCreate(BaseModel):
    id: Optional[str] = None
    name: str
    age: int
    gender: str
    abha_id: Optional[str] = None


class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    abha_id: Optional[str] = None
    created_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


# Session Schemas
class SessionCreate(BaseModel):
    patient_id: str
    language: Optional[str] = "English"


class SessionResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: int
    language: str
    status: str
    started_at: datetime.datetime
    ended_at: Optional[datetime.datetime] = None
    patient: Optional[PatientResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Transcript Schemas
class TranscriptChunkResponse(BaseModel):
    id: int
    session_id: str
    chunk_no: int
    text: str
    timestamp: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class FullTranscriptResponse(BaseModel):
    session_id: str
    total_chunks: int
    full_text: str
    chunks: List[TranscriptChunkResponse]


# Note Schemas
class NoteUpdate(BaseModel):
    edited_note: StructuredNoteSchema


class NoteResponse(BaseModel):
    id: int
    session_id: str
    status: str
    summary_json: Dict[str, Any]
    edited_json: Optional[Dict[str, Any]] = None
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)


class NoteApproveResponse(BaseModel):
    status: str
    message: str
    session_id: str
    note_status: str
    fhir_ready: bool
