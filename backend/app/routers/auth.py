"""Authentication endpoints: POST /auth/register and POST /auth/login.

Registration creates a user with a bcrypt-hashed password (never plaintext),
issues an opaque session token, and returns ``{ token, user: { id, email } }``
with 200. No email verification step. A duplicate email is 409; an invalid
email or empty password is 400 with field-level detail naming the bad field.

Login verifies the credentials and returns the same shape, or 401 with a
generic ``Invalid email or password`` that never reveals whether the email
exists.
"""

from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import AuthorizationHeader, create_session, get_current_user, revoke_session
from app.database import get_db
from app.models import User
from app.schemas import AuthResponse, Credentials, UserPublic
from app.security import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

DbSession = Annotated[Session, Depends(get_db)]


def _validate_credentials(email: str, password: str) -> dict[str, list[str]]:
    """Return a field-keyed dict of validation errors; empty when all valid."""
    errors: dict[str, list[str]] = {}
    if not password:
        errors.setdefault("password", []).append("Password is required")
    if not email:
        errors.setdefault("email", []).append("Email is required")
    else:
        try:
            validate_email(email)
        except EmailNotValidError as exc:
            errors.setdefault("email", []).append(str(exc))
    return errors


@router.post("/register", response_model=AuthResponse, status_code=200)
def register(credentials: Credentials, db: DbSession) -> AuthResponse:
    """Register a new user and return a session token (AC-001, AC-002, AC-003)."""
    errors = _validate_credentials(credentials.email, credentials.password)
    if errors:
        raise HTTPException(status_code=400, detail=errors)
    existing = db.query(User).filter_by(email=credentials.email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email is already registered")
    user = User(email=credentials.email, password_hash=hash_password(credentials.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_session(db, user)
    return AuthResponse(token=token, user=UserPublic(id=str(user.id), email=user.email))


@router.post("/login", response_model=AuthResponse, status_code=200)
def login(credentials: Credentials, db: DbSession) -> AuthResponse:
    """Authenticate a user and return a session token (AC-004, AC-005)."""
    user = db.query(User).filter_by(email=credentials.email).first()
    if user is None or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_session(db, user)
    return AuthResponse(token=token, user=UserPublic(id=str(user.id), email=user.email))


@router.post("/logout", status_code=204)
def logout(
    db: DbSession,
    authorization: AuthorizationHeader = None,
) -> None:
    """Revoke the caller's session token (NFR-002).

    A missing, invalid or expired token yields 401; only a currently-valid
    session is revoked.
    """
    get_current_user(authorization=authorization, db=db)
    token = authorization.split(" ", 1)[1].strip()
    revoke_session(db, token)
    return None
