"""Integration tests for the password-reset flow end-to-end.

Covers AC-009 (request creates token + sends email), AC-010 / NFR-004 (same
neutral 200 for registered and unregistered email), AC-011 / NFR-001
(confirm updates password as bcrypt hash), NFR-002 (all sessions revoked),
NFR-003 (token expiry and single-use), empty-password 400, and a full reset
flow (register → request → confirm → sign in with new password → old token
invalid).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import PasswordResetToken, User
from app.models import Session as SessionModel
from app.security import verify_password

_NEUTRAL_MESSAGE = "If an account exists for this email, a password reset link has been sent."


def _unique_email() -> str:
    return f"u{secrets.token_hex(8)}@example.com"


def _unique_password() -> str:
    return secrets.token_urlsafe(16)


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _register(client: TestClient, email: str | None = None) -> tuple[str, str, str]:
    """Register a user; return (token, email, password)."""
    email = email or _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"], email, password


def _capture_reset_token(client: TestClient, email: str) -> str:
    """Call the request endpoint and capture the raw reset token from the
    send_reset_email call (which receives it as an argument)."""
    captured: list[str] = []

    def _capture(_email: str, token: str) -> None:
        captured.append(token)

    with patch("app.routers.auth.send_reset_email", side_effect=_capture):
        resp = client.post("/auth/password-reset/request", json={"email": email})
    assert resp.status_code == 200, resp.text
    assert captured, "send_reset_email was not called for a registered email"
    return captured[0]


def test_ac009_request_registered_email_creates_token_row(
    client: TestClient, db_session: Session
) -> None:
    """AC-009: a registered email produces a PasswordResetToken row with a hash."""
    _, email, _ = _register(client)
    token = _capture_reset_token(client, email)

    user = db_session.query(User).filter_by(email=email).first()
    assert user is not None
    rows = db_session.query(PasswordResetToken).filter_by(user_id=user.id).all()
    assert len(rows) == 1
    assert rows[0].token_hash == hashlib.sha256(token.encode()).hexdigest()
    assert rows[0].token_hash != token
    assert rows[0].used_at is None


def test_ac010_request_unregistered_email_returns_same_neutral_200(client: TestClient) -> None:
    """AC-010 / NFR-004: an unregistered email returns the same neutral 200."""
    resp = client.post(
        "/auth/password-reset/request", json={"email": "nobody@example.com"}
    )
    assert resp.status_code == 200
    assert resp.json() == {"message": _NEUTRAL_MESSAGE}


def test_nfr004_request_returns_same_message_for_registered_and_unregistered(
    client: TestClient,
) -> None:
    """NFR-004: registered and unregistered emails get the identical 200 body."""
    _, email, _ = _register(client)

    registered = client.post("/auth/password-reset/request", json={"email": email})
    unregistered = client.post(
        "/auth/password-reset/request", json={"email": "nope@example.com"}
    )

    assert registered.status_code == 200
    assert unregistered.status_code == 200
    assert registered.json() == unregistered.json() == {"message": _NEUTRAL_MESSAGE}


def test_ac011_confirm_valid_token_resets_password(
    client: TestClient, db_session: Session
) -> None:
    """AC-011 / NFR-001: a valid token updates the password as a bcrypt hash."""
    _, email, old_password = _register(client)
    reset_token = _capture_reset_token(client, email)
    new_password = _unique_password()

    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": new_password},
    )
    assert resp.status_code == 200
    assert resp.json() == {"message": "Your password has been reset."}

    user = db_session.query(User).filter_by(email=email).first()
    assert user is not None
    # Stored as a bcrypt hash, never plaintext.
    assert user.password_hash != new_password
    assert user.password_hash.startswith("$2")
    assert verify_password(new_password, user.password_hash)
    assert not verify_password(old_password, user.password_hash)

    # Token is marked used.
    token_row = db_session.query(PasswordResetToken).filter_by(
        user_id=user.id
    ).first()
    assert token_row is not None
    assert token_row.used_at is not None


def test_confirm_invalid_token_returns_400(client: TestClient) -> None:
    """An invalid token returns 400 with the agreed message."""
    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": "not-a-real-token", "new_password": "newpass123"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid or expired reset token."


def test_confirm_expired_token_returns_400(
    client: TestClient, db_session: Session
) -> None:
    """An expired token returns 400 with the agreed message."""
    _, email, _ = _register(client)
    reset_token = _capture_reset_token(client, email)

    row = db_session.query(PasswordResetToken).filter_by(
        token_hash=hashlib.sha256(reset_token.encode()).hexdigest()
    ).first()
    assert row is not None
    row.expires_at = datetime.now(UTC) - timedelta(hours=1)
    db_session.commit()

    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "newpass123"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Invalid or expired reset token."


def test_confirm_already_used_token_returns_400(
    client: TestClient, db_session: Session
) -> None:
    """An already-used token returns 400 with the agreed message."""
    _, email, _ = _register(client)
    reset_token = _capture_reset_token(client, email)
    new_password = _unique_password()

    # First confirm succeeds.
    resp1 = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": new_password},
    )
    assert resp1.status_code == 200

    # Second confirm with the same token fails.
    resp2 = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "another123"},
    )
    assert resp2.status_code == 400
    assert resp2.json()["detail"] == "Invalid or expired reset token."


def test_confirm_empty_password_returns_400_field_detail(client: TestClient) -> None:
    """An empty new_password returns 400 with field-level detail."""
    _, email, _ = _register(client)
    reset_token = _capture_reset_token(client, email)

    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": ""},
    )
    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert isinstance(detail, dict)
    assert detail == {"new_password": ["Password is required"]}


def test_nfr002_sessions_revoked_on_reset(
    client: TestClient, db_session: Session
) -> None:
    """NFR-002: all existing sessions are revoked on successful password reset."""
    token, email, _ = _register(client)
    # The session token works before reset.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 200

    reset_token = _capture_reset_token(client, email)
    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "brandnewpass"},
    )
    assert resp.status_code == 200

    # The old session token no longer works.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401

    # No session rows remain for the user.
    user = db_session.query(User).filter_by(email=email).first()
    assert user is not None
    count = db_session.query(SessionModel).filter_by(user_id=user.id).count()
    assert count == 0


def test_full_reset_flow(client: TestClient) -> None:
    """Integration: register → request reset → confirm → sign in with new
    password → old session token invalid → reset token cannot be reused."""
    token, email, password = _register(client)
    reset_token = _capture_reset_token(client, email)
    new_password = _unique_password()

    # Confirm the reset.
    resp = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": new_password},
    )
    assert resp.status_code == 200

    # Old session token is now invalid.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401

    # Sign in with the new password succeeds.
    resp_signin = client.post(
        "/auth/login", json={"email": email, "password": new_password}
    )
    assert resp_signin.status_code == 200
    new_token = resp_signin.json()["token"]
    assert client.get("/tasks", headers=_auth_headers(new_token)).status_code == 200

    # Sign in with the old password fails.
    resp_old = client.post(
        "/auth/login", json={"email": email, "password": password}
    )
    assert resp_old.status_code == 401

    # Reset token cannot be reused.
    resp_reuse = client.post(
        "/auth/password-reset/confirm",
        json={"token": reset_token, "new_password": "yetanother"},
    )
    assert resp_reuse.status_code == 400
    assert resp_reuse.json()["detail"] == "Invalid or expired reset token."
