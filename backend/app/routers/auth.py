"""Authentication endpoints: POST /auth/register and POST /auth/login.

Registration creates a user with a bcrypt-hashed password (never plaintext),
issues an opaque session token, and returns ``{ token, user: { id, email } }``
with 200. No email verification step. A duplicate email is 409; an invalid
email or empty password is 400 with field-level detail naming the bad field.

Login verifies the credentials and returns the same shape, or 401 with a
generic ``Invalid email or password`` that never reveals whether the email
exists.
"""

from datetime import UTC, datetime
from typing import Annotated

from email_validator import EmailNotValidError, validate_email
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import AuthorizationHeader, create_session, get_current_user, revoke_session
from app.database import get_db
from app.models import Session as SessionModel
from app.models import User
from app.password_reset import find_valid_token, generate_reset_token, send_reset_email
from app.schemas import (
    AuthResponse,
    Credentials,
    PasswordResetConfirm,
    PasswordResetRequest,
    UserPublic,
)
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


_NEUTRAL_RESET_MESSAGE = "If an account exists for this email, a password reset link has been sent."


@router.post("/password-reset/request", status_code=200)
def password_reset_request(body: PasswordResetRequest, db: DbSession) -> dict[str, str]:
    """Request a password-reset link (AC-009, AC-010, NFR-004).

    The same neutral 200 response is returned whether or not the email is
    registered, so registered emails cannot be discovered. When the email is
    registered a time-limited reset token is created and a reset link email is
    sent via SendGrid (skipped when ``SENDGRID_API_KEY`` is empty).
    """
    user = db.query(User).filter_by(email=body.email).first()
    if user is not None:
        token = generate_reset_token(db, user)
        send_reset_email(user.email, token)
    return {"message": _NEUTRAL_RESET_MESSAGE}


@router.post("/password-reset/confirm", status_code=200)
def password_reset_confirm(body: PasswordResetConfirm, db: DbSession) -> dict[str, str]:
    """Confirm a password reset (AC-011, NFR-001, NFR-002, NFR-003).

    A valid, unexpired, unused token updates the password (stored as a bcrypt
    hash), marks the token used, and revokes all existing sessions for the
    user. An invalid, expired or already-used token yields 400; an empty
    ``new_password`` yields 400 with field-level detail.
    """
    reset_token = find_valid_token(db, body.token)
    if reset_token is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")
    if not body.new_password:
        raise HTTPException(
            status_code=400, detail={"new_password": ["Password is required"]}
        )
    user = db.query(User).filter_by(id=reset_token.user_id).first()
    assert user is not None  # FK guarantees the user exists
    user.password_hash = hash_password(body.new_password)
    reset_token.used_at = datetime.now(UTC)
    db.query(SessionModel).filter_by(user_id=user.id).delete()
    db.commit()
    return {"message": "Your password has been reset."}
