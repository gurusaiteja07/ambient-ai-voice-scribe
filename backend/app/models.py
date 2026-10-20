import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    hospital = Column(String(255), nullable=True, default="District Hospital")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="doctor", cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(64), primary_key=True, index=True)  # Patient ID (e.g. PID-1001)
    name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)  # Male, Female, Other
    abha_id = Column(String(50), nullable=True, index=True)  # Ayushman Bharat Health Account ID
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    sessions = relationship("Session", back_populates="patient", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String(64), primary_key=True, index=True)  # Session ID (e.g. SES-20261011-001)
    patient_id = Column(String(64), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False, index=True)
    language = Column(String(50), default="English")  # English, Hindi, Bengali, etc.
    status = Column(String(30), default="active")  # active, completed, cancelled
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    audio_path = Column(String(500), nullable=True)

    # Relationships
    doctor = relationship("Doctor", back_populates="sessions")
    patient = relationship("Patient", back_populates="sessions")
    transcripts = relationship("Transcript", back_populates="session", cascade="all, delete-orphan", order_by="Transcript.chunk_no")
    note = relationship("Note", back_populates="session", uselist=False, cascade="all, delete-orphan")


class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_no = Column(Integer, nullable=False, default=1)
    text = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="transcripts")


class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(String(64), ForeignKey("sessions.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    summary_json = Column(JSON, nullable=False)  # Raw AI generated structured SOAP note
    edited_json = Column(JSON, nullable=True)   # Doctor edited version
    status = Column(String(30), default="draft")  # draft, approved
    fhir_json = Column(JSON, nullable=True)     # ABDM FHIR R4 Bundle JSON
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    session = relationship("Session", back_populates="note")
