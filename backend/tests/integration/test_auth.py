"""Integration tests for POST /auth/register and POST /auth/login.

Covers AC-001 (register success, no verification), AC-002 (duplicate 409),
AC-003 (invalid email / empty password 400 with field detail), AC-004 (login
success) and AC-005/NFR-004 (wrong credentials 401 generic, no enumeration).
"""

import secrets

from fastapi.testclient import TestClient


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
