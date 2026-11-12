# Ambient AI Voice Scribe

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB.svg)](https://vitejs.dev/)
[![ABDM](https://img.shields.io/badge/Compliance-ABDM%20%2F%20FHIR%20R4-emerald.svg)](https://abdm.gov.in/)

> **Ambient Clinical Voice Scribe for Indian Public Healthcare Facilities**  
> Aligned to the **National Health Authority (NHA) Expression of Interest (EOI)** for the *Standalone Voice Scribe* category.

---

## 📌 Problem & Solution

* **Problem**: Doctors in high-volume public healthcare facilities spend 30-50% of every consultation manually typing records rather than examining patients. This leads to documentation backlog, physician burnout, and incomplete digital records.
* **Solution**: An ambient, non-intrusive voice assistant. The clinician selects a patient and taps **Start**. The app records the doctor-patient dialogue via browser/phone microphone in 10-second chunks, converts speech to text across Indian languages (English, Hindi, Bengali, etc.), and uses a local clinical LLM to generate a structured **SOAP note** (Chief Complaint, History, Examination, Diagnosis, Medications, Advice, Follow-up). The doctor edits and approves the note, exporting it directly as an **ABDM-compliant FHIR R4 Bundle** or printable PDF.

---

## 🏗️ Project Folder Structure

```
ambient-ai-voice-scribe/
|-- .github/workflows/ci.yml # Automated multi-stage GitHub Actions CI pipeline
|-- ACADEMIC_PROJECT_REPORT.md# Complete Professor Academic Report (11 formal sections)
|-- mobile/                  # Dedicated Mobile Extension & PWA Client
|   |-- index.html           # Touch-optimized mobile layout
|   |-- app.js               # Clean vanilla JavaScript client
|   |-- style.css            # Responsive mobile styling
|   |-- manifest.json, sw.js # PWA offline & add-to-home-screen support
|   |-- README.md            # Mobile testing instructions
|-- backend/
|   |-- app/
|   |   |-- main.py          # FastAPI entry point & lifespan init (mounts /mobile)
|   |   |-- config.py        # Environment configuration (Pydantic Settings)
|   |   |-- database.py      # SQLAlchemy session & SQLite/Postgres engine
|   |   |-- models.py        # Doctor, Patient (vitals & history), Session, Note models
|   |   |-- schemas.py       # Pydantic validation & SOAP note schema
|   |   |-- auth.py          # JWT authentication & bcrypt hashing
|   |   |-- routers/
|   |   |   |-- auth.py      # Doctor login & registration endpoints
|   |   |   |-- patients.py  # Patient creation, vitals, history & search
|   |   |   |-- sessions.py  # Consultation session lifecycle & /stop summarizer
|   |   |   |-- audio.py     # Speech chunk & transcript ingestion
|   |   |   |-- notes.py     # Clinical note edit, ABDM approval & export
|   |   |-- services/
|   |   |   |-- stt_service.py # Speech transcription (Whisper/SpeechRecognition)
|   |   |   |-- summarizer.py  # LLM consultation summarizer & clinical heuristic
|   |   |   |-- fhir_service.py# ABDM FHIR R4 Document Bundle generation
|   |   |   |-- pdf_service.py # ReportLab consultation note generator
|   |-- tests/
|   |   |-- test_api.py      # Health check, authentication, patient flow tests
|   |   |-- verify_e2e.py    # End-to-end integration test runner
|-- frontend/
|   |-- src/
|   |   |-- main.jsx, App.jsx# React application root & workflow state machine
|   |   |-- api/client.js    # Axios client with JWT interceptor & aliased start
|   |   |-- hooks/useRecorder.js # Web Speech API (en-US) + MediaRecorder hook
|   |   |-- pages/
|   |   |   |-- PatientSelect.jsx # Patient queue, vitals intake & history
|   |   |   |-- Recorder.jsx      # Ambient English voice scribe & live caption
|   |   |   |-- NoteEditor.jsx    # Doctor-in-the-loop review & export
|   |   |   |-- ConsentModal.jsx # Patient consent checklist requirement
|   |   |   |-- RecordButton.jsx # Dynamic recording button & waveform bars
|   |   |   |-- TranscriptBox.jsx# Real-time scrolling transcript feed
|   |   |   |-- NoteForm.jsx     # Editable SOAP note with Rx medications table
|   |   |-- pages/
|   |   |   |-- Login.jsx        # Doctor authentication with 1-click AIIMS demo
|   |   |   |-- PatientSelect.jsx# OPD search / registration & language selector
|   |   |   |-- Recorder.jsx     # Active ambient consultation room
|   |   |   |-- NoteEditor.jsx   # Clinical review, approval lock & export
|   |-- package.json             # React 18, Lucide icons, Vite
|   |-- vite.config.js           # Vite dev server with proxy to backend
|   |-- Dockerfile               # Multi-stage production frontend Dockerfile
|-- data/audio/                  # Local audio chunk storage directory
|-- docs/
|   |-- ARCHITECTURE.md          # Comprehensive architectural specs & FHIR map
|-- docker-compose.yml           # Unified stack: Backend + Frontend + Ollama
|-- .env.example                 # Configuration template
|-- .gitignore                   # Standard Python/Node/Data exclusions
|-- README.md                    # Project documentation
```

---

## 🚀 Quickstart & Setup

### Prerequisites
* **Python**: 3.11 or 3.12
* **Node.js**: 18+ (Node 20+ recommended)
* **FFmpeg**: For audio chunk processing (`sudo apt install ffmpeg` on Linux/WSL)

---

### Step 1: Backend Setup

```bash
cd backend

# 1. Create and activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate   # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start the FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

* **API Health Check**: `http://localhost:8000/health` (returns `{"status":"ok"}`)
* **Interactive Swagger UI**: `http://localhost:8000/docs`

> **Default Seed Accounts for Quick Testing**:
> * **Doctor Email**: `doctor@hospital.gov.in`
> * **Password**: `doctor123`
> * **Sample Patient**: ID `PID-1001` (Ramesh Kumar, ABHA `14-5521-8890-1234`)

---

### Step 2: Frontend Setup

```bash
cd frontend

# 1. Install frontend packages
npm install

# 2. Run the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### Step 3: Run with Docker Compose

To start the complete containerized stack (FastAPI Backend, React Frontend, and Ollama service):

```bash
docker-compose up --build
```

---

## 📡 Key API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `POST` | `/auth/login` | Doctor login with email/password -> JWT |
| `POST` | `/patients` | Create or fetch patient by Patient ID or ABHA ID |
| `GET` | `/patients` | Search / list OPD patients |
| `POST` | `/sessions` | Start consultation session -> returns `SES-...` ID |
| `POST` | `/sessions/{id}/audio` | Upload 10s audio chunk -> returns transcribed text |
| `POST` | `/sessions/{id}/stop` | End consultation, run LLM summarizer, save draft note |
| `GET` | `/sessions/{id}/transcript` | Get full chronological saved transcript |
| `GET` | `/sessions/{id}/note` | Get structured clinical note |
| `PUT` | `/sessions/{id}/note` | Save doctor edits to draft note |
| `POST` | `/sessions/{id}/approve` | Approve note, lock record, generate ABDM FHIR bundle |
| `GET` | `/sessions/{id}/export?format=pdf\|fhir` | Download printable PDF or ABDM FHIR JSON |

---

## 🧪 Testing

Run automated tests using pytest:

```bash
cd backend
source .venv/bin/activate
pytest tests/ -v
```

---

## 🛡️ Privacy & Compliance Checklist

- [x] **Patient Consent Screen**: Verbal consent verified before microphone activation.
- [x] **Self-Hosted / Open-Source Models**: Whisper & Ollama models keep healthcare data within host premises.
- [x] **JWT Security**: Role-based access control and bcrypt-hashed doctor credentials.
- [x] **ABDM FHIR R4 Standard**: Outpatient Consultation Record profile mapping.
- [x] **Doctor Verification**: Clinician must explicitly review, edit, and sign notes before final locking.
