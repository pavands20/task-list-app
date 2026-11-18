"""Unit tests for auth primitives: hashing, validation, tokens, duplicate email.

Covers NFR-001 (password hashing), AC-003 (field-level validation), token
generation/lookup, and AC-002 (duplicate-email rejection).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.auth import create_session, get_current_user
from app.models import Session as SessionModel
from app.models import User
from app.routers.auth import _validate_credentials, register
from app.schemas import Credentials
from app.security import hash_password, verify_password


def test_nfr001_hash_password_is_bcrypt_and_never_plaintext() -> None:
    """NFR-001: hash is bcrypt, differs from plaintext, and verifies."""
    password = secrets.token_urlsafe(12)
    hashed = hash_password(password)
    assert hashed != password
    assert hashed.startswith("$2")
    assert verify_password(password, hashed)
    assert not verify_password("wrong-password", hashed)


def test_ac003_email_validation_rejects_invalid_format() -> None:
    """AC-003: an invalid email produces an 'email' field error."""
    errors = _validate_credentials("not-an-email", "goodpass")
    assert "email" in errors
    assert errors["email"]

    ok = _validate_credentials("user@example.com", "goodpass")
    assert "email" not in ok


def test_ac003_empty_password_rejected() -> None:
    """AC-003: an empty password produces a 'password' field error."""
    errors = _validate_credentials("user@example.com", "")
    assert "password" in errors
    assert errors["password"]


def test_token_generation_stores_hash_not_plaintext(db_session: Session) -> None:
    """A session row stores the token hash, never the raw token."""
    user = User(email="token@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_session(db_session, user)
    assert isinstance(token, str) and token

    sessions = db_session.query(SessionModel).filter_by(user_id=user.id).all()
    assert len(sessions) == 1
    assert sessions[0].token_hash != token
    assert sessions[0].token_hash == hashlib.sha256(token.encode()).hexdigest()


def test_auth_dependency_resolves_user_from_token(db_session: Session) -> None:
    """A valid bearer token resolves to the owning user."""
    user = User(email="resolve@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_session(db_session, user)
    current = get_current_user(authorization=f"Bearer {token}", db=db_session)
    assert current.id == user.id


def test_auth_dependency_rejects_unknown_token(db_session: Session) -> None:
    """An unrecognised token returns 401."""
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization="Bearer no-such-token", db=db_session)
    assert exc.value.status_code == 401


def test_auth_dependency_rejects_missing_header(db_session: Session) -> None:
    """A missing Authorization header returns 401."""
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization=None, db=db_session)
    assert exc.value.status_code == 401


def test_auth_dependency_rejects_expired_token(db_session: Session) -> None:
    """An expired session token returns 401."""
    user = User(email="expired@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = secrets.token_urlsafe(32)
    expired = datetime.now(UTC) - timedelta(hours=1)
    db_session.add(
        SessionModel(
            user_id=user.id,
            token_hash=hashlib.sha256(token.encode()).hexdigest(),
            expires_at=expired,
        )
    )
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization=f"Bearer {token}", db=db_session)
    assert exc.value.status_code == 401


def test_ac002_register_rejects_duplicate_email(db_session: Session) -> None:
    """AC-002: registering an existing email raises 409."""
    cred = Credentials(email="dup@example.com", password="goodpass")
    register(cred, db=db_session)

    with pytest.raises(HTTPException) as exc:
        register(cred, db=db_session)
    assert exc.value.status_code == 409
    assert exc.value.detail == "Email is already registered"


def test_nfr001_register_stores_hash_not_plaintext(db_session: Session) -> None:
    """NFR-001: the stored password_hash is a bcrypt hash, never the plaintext."""
    password = secrets.token_urlsafe(12)
    register(Credentials(email="store@example.com", password=password), db=db_session)

    user = db_session.query(User).filter_by(email="store@example.com").first()
    assert user is not None
    assert user.password_hash != password
    assert user.password_hash.startswith("$2")
