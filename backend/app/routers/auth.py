from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Doctor
from app.schemas import DoctorLogin, Token, DoctorCreate, DoctorResponse
from app.auth import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
def login(
    login_data: DoctorLogin,
    db: Session = Depends(get_db)
):
    """
    Doctor login endpoint. Returns JWT token.
    """
    doctor = db.query(Doctor).filter(Doctor.email == login_data.email).first()
    if not doctor or not verify_password(login_data.password, doctor.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": doctor.email, "doctor_id": doctor.id, "name": doctor.name}
    )
    return Token(
        access_token=access_token,
        token_type="bearer",
        doctor_id=doctor.id,
        doctor_name=doctor.name,
        hospital=doctor.hospital
    )


@router.post("/register", response_model=DoctorResponse, status_code=status.HTTP_201_CREATED)
def register(
    doctor_in: DoctorCreate,
    db: Session = Depends(get_db)
):
    """Registers a new doctor."""
    existing = db.query(Doctor).filter(Doctor.email == doctor_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor with this email already exists")

    new_doc = Doctor(
        name=doctor_in.name,
        email=doctor_in.email,
        password_hash=get_password_hash(doctor_in.password),
        hospital=doctor_in.hospital or "Community Health Centre"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc
