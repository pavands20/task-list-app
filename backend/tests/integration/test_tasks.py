"""Integration tests for POST /tasks and GET /tasks end-to-end.

Covers AC-015/AC-016 (create success), AC-017 (validation error), auth (401
for missing/invalid token) and user-scoping (a user sees only their own
tasks).
"""

import secrets

from fastapi.testclient import TestClient


def _unique_email() -> str:
    return f"u{secrets.token_hex(8)}@example.com"


def _register_and_get_token(client: TestClient, email: str | None = None) -> tuple[str, str]:
    """Register a fresh user and return (token, email)."""
    email = email or _unique_email()
    password = secrets.token_urlsafe(12)
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["token"], email


def _auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_ac015_post_tasks_creates_active_task_no_due_date(client: TestClient) -> None:
    """AC-015: title with no due date -> 201, is_done false, null due_date."""
    token, _ = _register_and_get_token(client)
    resp = client.post("/tasks", json={"title": "Buy milk"}, headers=_auth_headers(token))

    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Buy milk"
    assert body["due_date"] is None
    assert body["is_done"] is False
    assert isinstance(body["id"], str) and body["id"]
    assert body["created_at"]
    assert body["updated_at"]


def test_ac016_post_tasks_creates_task_with_due_date(client: TestClient) -> None:
    """AC-016: title with a valid due date -> 201 with that due_date."""
    token, _ = _register_and_get_token(client)
    resp = client.post(
        "/tasks",
        json={"title": "Pay rent", "due_date": "2026-12-01"},
        headers=_auth_headers(token),
    )

    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "Pay rent"
    assert body["due_date"] == "2026-12-01"
    assert body["is_done"] is False


def test_ac017_post_tasks_empty_title_returns_400(client: TestClient) -> None:
    """AC-017: an empty title -> 400 'Title is required', no task created."""
    token, _ = _register_and_get_token(client)
    resp = client.post("/tasks", json={"title": ""}, headers=_auth_headers(token))

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Title is required"

    listing = client.get("/tasks", headers=_auth_headers(token))
    assert listing.status_code == 200
    assert listing.json() == []


def test_ac017_post_tasks_missing_title_returns_400(client: TestClient) -> None:
    """AC-017: a missing title field -> 400 'Title is required'."""
    token, _ = _register_and_get_token(client)
    resp = client.post("/tasks", json={}, headers=_auth_headers(token))

    assert resp.status_code == 400
    assert resp.json()["detail"] == "Title is required"


def test_get_tasks_returns_users_tasks_as_array(client: TestClient) -> None:
    """GET /tasks returns all of the authenticated user's tasks as a JSON array."""
    token, _ = _register_and_get_token(client)
    client.post("/tasks", json={"title": "First"}, headers=_auth_headers(token))
    client.post(
        "/tasks",
        json={"title": "Second", "due_date": "2026-12-31"},
        headers=_auth_headers(token),
    )

    resp = client.get("/tasks", headers=_auth_headers(token))

    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) == 2
    titles = {t["title"] for t in body}
    assert titles == {"First", "Second"}


def test_post_tasks_unauthenticated_returns_401(client: TestClient) -> None:
    """A missing Bearer token to POST /tasks returns 401."""
    resp = client.post("/tasks", json={"title": "No auth"})
    assert resp.status_code == 401


def test_get_tasks_unauthenticated_returns_401(client: TestClient) -> None:
    """A missing Bearer token to GET /tasks returns 401."""
    resp = client.get("/tasks")
    assert resp.status_code == 401


def test_post_tasks_invalid_token_returns_401(client: TestClient) -> None:
    """An invalid Bearer token to POST /tasks returns 401."""
    resp = client.post(
        "/tasks",
        json={"title": "Bad token"},
        headers=_auth_headers("not-a-real-token"),
    )
    assert resp.status_code == 401


def test_get_tasks_invalid_token_returns_401(client: TestClient) -> None:
    """An invalid Bearer token to GET /tasks returns 401."""
    resp = client.get("/tasks", headers=_auth_headers("not-a-real-token"))
    assert resp.status_code == 401


def test_tasks_scoped_to_authenticated_user(client: TestClient) -> None:
    """A user cannot see or create tasks attributed to another user."""
    token_a, _ = _register_and_get_token(client)
    token_b, _ = _register_and_get_token(client)

    client.post("/tasks", json={"title": "A's task"}, headers=_auth_headers(token_a))
    client.post("/tasks", json={"title": "B's task"}, headers=_auth_headers(token_b))

    a_tasks = client.get("/tasks", headers=_auth_headers(token_a)).json()
    b_tasks = client.get("/tasks", headers=_auth_headers(token_b)).json()

    assert {t["title"] for t in a_tasks} == {"A's task"}
    assert {t["title"] for t in b_tasks} == {"B's task"}
