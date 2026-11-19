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

from app.auth import create_session, get_current_user, revoke_session
from app.models import PasswordResetToken, Task, User
from app.models import Session as SessionModel
from app.routers.auth import _validate_credentials, delete_account, register
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


def test_create_session_then_revoke_session_makes_token_hash_unresolvable(
    db_session: Session,
) -> None:
    """NFR-002: create_session then revoke_session makes the token_hash unresolvable."""
    user = User(email="revoke@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_session(db_session, user)
    assert db_session.query(SessionModel).filter_by(user_id=user.id).count() == 1

    assert revoke_session(db_session, token) is True
    # The session row is gone, so the token can no longer resolve to a user.
    assert db_session.query(SessionModel).filter_by(user_id=user.id).count() == 0
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization=f"Bearer {token}", db=db_session)
    assert exc.value.status_code == 401
    # Revoking again is a no-op (token already gone).
    assert revoke_session(db_session, token) is False


def test_ac012_delete_account_removes_user_tasks_sessions_and_tokens(db_session: Session) -> None:
    """AC-012 / NFR-006: delete_account removes the user and cascades to tasks,
    sessions and password-reset tokens."""
    user = User(email="del@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Give the user a session, a task and a reset token.
    create_session(db_session, user)
    db_session.add(Task(user_id=user.id, title="Do something"))
    db_session.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hashlib.sha256(b"rt").hexdigest(),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            used_at=None,
        )
    )
    db_session.commit()

    assert db_session.query(SessionModel).filter_by(user_id=user.id).count() == 1
    assert db_session.query(Task).filter_by(user_id=user.id).count() == 1
    assert db_session.query(PasswordResetToken).filter_by(user_id=user.id).count() == 1

    delete_account(db=db_session, user=user)

    assert db_session.query(User).filter_by(id=user.id).count() == 0
    assert db_session.query(SessionModel).filter_by(user_id=user.id).count() == 0
    assert db_session.query(Task).filter_by(user_id=user.id).count() == 0
    assert db_session.query(PasswordResetToken).filter_by(user_id=user.id).count() == 0


def test_nfr002_delete_account_revokes_all_sessions(db_session: Session) -> None:
    """NFR-002: after delete_account, all sessions for the user are revoked so
    the old token can no longer resolve to a user."""
    user = User(email="revoke-del@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_session(db_session, user)
    # The token resolves before deletion.
    assert get_current_user(authorization=f"Bearer {token}", db=db_session).id == user.id

    delete_account(db=db_session, user=user)

    # No session rows remain and the old token is now rejected.
    assert db_session.query(SessionModel).filter_by(user_id=user.id).count() == 0
    with pytest.raises(HTTPException) as exc:
        get_current_user(authorization=f"Bearer {token}", db=db_session)
    assert exc.value.status_code == 401


def test_nfr006_delete_account_is_permanent_user_gone(db_session: Session) -> None:
    """NFR-006: the user record is permanently removed and cannot be found."""
    user = User(email="perm@example.com", password_hash=hash_password("pw"))
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    user_id = user.id

    delete_account(db=db_session, user=user)

    assert db_session.query(User).filter_by(id=user_id).first() is None
