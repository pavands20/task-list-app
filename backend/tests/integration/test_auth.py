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

from app.models import PasswordResetToken, Task, User
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
    assert client.post("/auth/logout", headers=_auth_headers(token)).status_code == 401


def test_logout_without_authorization_header_returns_401(client: TestClient) -> None:
    """logout without an Authorization header returns 401."""
    resp = client.post("/auth/logout")
    assert resp.status_code == 401


def test_logout_with_invalid_or_expired_token_returns_401(
    client: TestClient, db_session: Session
) -> None:
    """logout with an invalid or expired token returns 401."""
    # Invalid token.
    assert client.post("/auth/logout", headers=_auth_headers("not-a-real-token")).status_code == 401
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
        client.post("/tasks", json={"title": "x"}, headers=_auth_headers(token)).status_code == 401
    )


def _register_user(client: TestClient, email: str | None = None) -> tuple[str, str, str]:
    """Register a user; return (token, email, password)."""
    email = email or _unique_email()
    password = _unique_password()
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"], email, password


def test_ac012_delete_account_returns_204_and_removes_all_data(
    client: TestClient, db_session: Session
) -> None:
    """AC-012: DELETE /account with a valid token returns 204 and removes the
    user, all tasks, all sessions and all password-reset tokens."""
    token, email, password = _register_user(client)
    user = db_session.query(User).filter_by(email=email).first()
    assert user is not None
    user_id = user.id

    # Create a task and a password-reset token for the user.
    assert (
        client.post("/tasks", json={"title": "Mine"}, headers=_auth_headers(token)).status_code
        == 201
    )
    db_session.add(
        PasswordResetToken(
            user_id=user_id,
            token_hash=hashlib.sha256(b"reset").hexdigest(),
            expires_at=datetime.now(UTC) + timedelta(hours=1),
            used_at=None,
        )
    )
    db_session.commit()
    # Reload the user into this session so the delete cascades cleanly.
    db_session.expire_all()
    user = db_session.query(User).filter_by(id=user_id).first()
    assert user is not None

    assert db_session.query(SessionModel).filter_by(user_id=user_id).count() == 1
    assert db_session.query(Task).filter_by(user_id=user_id).count() == 1
    assert db_session.query(PasswordResetToken).filter_by(user_id=user_id).count() == 1

    resp = client.delete("/account", headers=_auth_headers(token))
    assert resp.status_code == 204
    assert resp.content == b""

    assert db_session.query(User).filter_by(id=user_id).count() == 0
    assert db_session.query(SessionModel).filter_by(user_id=user_id).count() == 0
    assert db_session.query(Task).filter_by(user_id=user_id).count() == 0
    assert db_session.query(PasswordResetToken).filter_by(user_id=user_id).count() == 0


def test_ac013_login_after_account_deletion_returns_401(client: TestClient) -> None:
    """AC-013: after the account is deleted, POST /auth/login with the deleted
    account's credentials returns 401 because the account no longer exists."""
    token, email, password = _register_user(client)

    # The credentials worked before deletion.
    assert (
        client.post("/auth/login", json={"email": email, "password": password}).status_code == 200
    )

    resp = client.delete("/account", headers=_auth_headers(token))
    assert resp.status_code == 204

    login_resp = client.post("/auth/login", json={"email": email, "password": password})
    assert login_resp.status_code == 401
    assert login_resp.json()["detail"] == "Invalid email or password"


def test_nfr002_delete_account_revokes_sessions_old_token_401(client: TestClient) -> None:
    """NFR-002: after deletion, the old session token no longer authenticates
    any subsequent call (401)."""
    token, email, password = _register_user(client)
    # Token works before deletion.
    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 200

    assert client.delete("/account", headers=_auth_headers(token)).status_code == 204

    assert client.get("/tasks", headers=_auth_headers(token)).status_code == 401
    assert client.delete("/account", headers=_auth_headers(token)).status_code == 401


def test_delete_account_without_authorization_returns_401(client: TestClient) -> None:
    """DELETE /account without an Authorization header returns 401."""
    assert client.delete("/account").status_code == 401


def test_delete_account_with_invalid_token_returns_401(client: TestClient) -> None:
    """DELETE /account with an invalid Bearer token returns 401."""
    assert client.delete("/account", headers=_auth_headers("not-a-real-token")).status_code == 401


def test_delete_account_with_expired_token_returns_401(
    client: TestClient, db_session: Session
) -> None:
    """DELETE /account with an expired token returns 401."""
    token, email, password = _register_user(client)
    _expire_active_session(db_session, token)
    assert client.delete("/account", headers=_auth_headers(token)).status_code == 401


def test_nfr006_delete_account_does_not_affect_other_users(client: TestClient) -> None:
    """NFR-006: deleting one user does not remove another user's data."""
    token_a, email_a, password_a = _register_user(client)
    token_b, email_b, password_b = _register_user(client)

    assert (
        client.post("/tasks", json={"title": "A task"}, headers=_auth_headers(token_a)).status_code
        == 201
    )
    assert (
        client.post("/tasks", json={"title": "B task"}, headers=_auth_headers(token_b)).status_code
        == 201
    )

    assert client.delete("/account", headers=_auth_headers(token_a)).status_code == 204

    # User A is gone; user B is unaffected.
    assert (
        client.post("/auth/login", json={"email": email_a, "password": password_a}).status_code
        == 401
    )
    assert (
        client.post("/auth/login", json={"email": email_b, "password": password_b}).status_code
        == 200
    )
    b_tasks = client.get("/tasks", headers=_auth_headers(token_b)).json()
    assert {t["title"] for t in b_tasks} == {"B task"}
