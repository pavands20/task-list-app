"""Integration tests for POST /auth/register and POST /auth/login.

Covers AC-001 (register success, no verification), AC-002 (duplicate 409),
AC-003 (invalid email / empty password 400 with field detail), AC-004 (login
success) and AC-005/NFR-004 (wrong credentials 401 generic, no enumeration).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Session as SessionModel


def _expire_active_session(db: Session, token: str) -> None:
    """Move the session row matching *token* into the past so it is expired."""
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    session = db.query(SessionModel).filter_by(token_hash=token_hash).first()
    assert session is not None, "no session row for the given token"
    session.expires_at = datetime.now(UTC) - timedelta(hours=1)
    db.commit()


def _unique_email() -> str:
    return f"u{secrets.token_hex(8)}@example.com"


def test_ac001_register_creates_user_returns_token_and_user(client: TestClient) -> None:
    """AC-001: a new email registers and gets { token, user: { id, email } }, 200."""
    email = _unique_email()
    password = secrets.token_urlsafe(12)
    resp = client.post("/auth/register", json={"email": email, "password": password})

    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body["token"], str) and body["token"]
    assert body["user"]["email"] == email
    assert isinstance(body["user"]["id"], str) and body["user"]["id"]


def test_ac002_register_duplicate_email_returns_409(client: TestClient) -> None:
    """AC-002: a duplicate email is rejected with 409 and the agreed message."""
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "goodpass"})
    resp = client.post("/auth/register", json={"email": email, "password": "goodpass"})

    assert resp.status_code == 409
    assert resp.json()["detail"] == "Email is already registered"


def test_ac003_register_invalid_email_returns_400_field_detail(client: TestClient) -> None:
    """AC-003: an invalid email yields 400 with an 'email' field error."""
    resp = client.post("/auth/register", json={"email": "not-an-email", "password": "goodpass"})

    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert isinstance(detail, dict)
    assert "email" in detail
    assert detail["email"]


def test_ac003_register_empty_password_returns_400_field_detail(client: TestClient) -> None:
    """AC-003: an empty password yields 400 with a 'password' field error."""
    resp = client.post("/auth/register", json={"email": _unique_email(), "password": ""})

    assert resp.status_code == 400
    detail = resp.json()["detail"]
    assert isinstance(detail, dict)
    assert "password" in detail
    assert detail["password"]


def test_ac004_login_correct_credentials_returns_200(client: TestClient) -> None:
    """AC-004: correct credentials return { token, user } with 200."""
    email = _unique_email()
    password = secrets.token_urlsafe(12)
    client.post("/auth/register", json={"email": email, "password": password})
    resp = client.post("/auth/login", json={"email": email, "password": password})

    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body["token"], str) and body["token"]
    assert body["user"]["email"] == email


def test_ac005_login_wrong_password_returns_401_generic(client: TestClient) -> None:
    """AC-005/NFR-004: a wrong password yields 401 with a generic message."""
    email = _unique_email()
    client.post("/auth/register", json={"email": email, "password": "correctpass"})
    resp = client.post("/auth/login", json={"email": email, "password": "wrongpass"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


def test_ac005_login_unknown_email_returns_401_generic(client: TestClient) -> None:
    """AC-005/NFR-004: an unknown email yields the same 401 as a wrong password."""
    resp = client.post("/auth/login", json={"email": "nobody@example.com", "password": "whatever"})

    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid email or password"


def _unique_password() -> str:
    return secrets.token_urlsafe(16)


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_logout_with_valid_token_returns_204_and_invalidates_session(
    client: TestClient,
) -> None:
    """NFR-002: logout with a valid Bearer token returns 204 and the token cannot be reused."""
    email = _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]

    logout = client.post("/auth/logout", headers=_auth_headers(token))
    assert logout.status_code == 204
    assert logout.content == b""

    # Subsequent calls with the same token return 401.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401
    assert (
        client.post("/auth/logout", headers=_auth_headers(token)).status_code == 401
    )


def test_logout_without_authorization_header_returns_401(client: TestClient) -> None:
    """logout without an Authorization header returns 401."""
    resp = client.post("/auth/logout")
    assert resp.status_code == 401


def test_logout_with_invalid_or_expired_token_returns_401(
    client: TestClient, db_session: Session
) -> None:
    """logout with an invalid or expired token returns 401."""
    # Invalid token.
    assert (
        client.post("/auth/logout", headers=_auth_headers("not-a-real-token")).status_code
        == 401
    )
    # Expired token: register, then expire the session row, then attempt logout.
    email = _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    _expire_active_session(db_session, token)
    assert client.post("/auth/logout", headers=_auth_headers(token)).status_code == 401


def test_register_logout_then_get_tasks_returns_401(client: TestClient) -> None:
    """Integration: register -> logout -> GET /tasks returns 401."""
    email = _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]

    # The token works before logout.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 200

    logout = client.post("/auth/logout", headers=_auth_headers(token))
    assert logout.status_code == 204

    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401


def test_ac008_expired_session_token_on_tasks_returns_401(
    client: TestClient, db_session: Session
) -> None:
    """AC-008: an expired session token used on GET /tasks and POST /tasks returns 401."""
    email = _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    _expire_active_session(db_session, token)

    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401
    assert (
        client.post("/tasks", json={"title": "x"}, headers=_auth_headers(token)).status_code
        == 401
    )
