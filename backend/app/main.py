import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, SessionLocal
from app.models import Doctor, Patient
from app.auth import get_password_hash
from app.routers import auth, patients, sessions, audio, notes

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ambient_voice_scribe")


def seed_initial_data():
    """Seeds default test doctor and demo patient if database is empty."""
    db = SessionLocal()
    try:
        # Seed test doctor
        test_doc = db.query(Doctor).filter(Doctor.email == "doctor@hospital.gov.in").first()
        if not test_doc:
            logger.info("Seeding default test doctor (doctor@hospital.gov.in)...")
            doc = Doctor(
                name="Aakash Sharma",
                email="doctor@hospital.gov.in",
                password_hash=get_password_hash("doctor123"),
                hospital="All India Institute of Medical Sciences (AIIMS)"
            )
            db.add(doc)
            db.commit()

        # Seed sample patient
        test_patient = db.query(Patient).filter(Patient.id == "PID-1001").first()
        if not test_patient:
            logger.info("Seeding default demo patient (PID-1001)...")
            patient = Patient(
                id="PID-1001",
                name="Ramesh Kumar",
                age=45,
                gender="Male",
                abha_id="14-5521-8890-1234"
            )
            db.add(patient)
            db.commit()
    except Exception as e:
        logger.warning(f"Seed data error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created and seed data initialized
    logger.info("Initializing database schema...")
    init_db()
    seed_initial_data()
    logger.info("Database initialized successfully.")
    yield
    # Shutdown
    logger.info("Shutting down application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Ambient AI Voice Scribe for Indian Public Healthcare Facilities (NHA EOI Compliant).",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core /health route as required by Project Plan Step 1
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint: returns status ok."""
    return {
        "status": "ok",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION
    }


@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Ambient AI Voice Scribe API is running",
        "docs_url": "/docs",
        "health_url": "/health"
    }


# Include Routers
app.include_router(auth.router)
app.include_router(patients.router)
app.include_router(sessions.router)
app.include_router(audio.router)
app.include_router(notes.router)
