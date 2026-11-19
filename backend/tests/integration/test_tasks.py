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


def test_ac025_get_tasks_response_has_required_fields(client: TestClient) -> None:
    """AC-025: each task in GET /tasks carries id, title, due_date, is_done and
    created_at so the list view can show title, due date (if set) and done/active
    status."""
    token, _ = _register_and_get_token(client)
    client.post(
        "/tasks",
        json={"title": "With due date", "due_date": "2026-11-25"},
        headers=_auth_headers(token),
    )
    client.post("/tasks", json={"title": "No due date"}, headers=_auth_headers(token))

    body = client.get("/tasks", headers=_auth_headers(token)).json()
    assert len(body) == 2

    by_title = {t["title"]: t for t in body}

    with_due = by_title["With due date"]
    assert set(with_due.keys()) >= {"id", "title", "due_date", "is_done", "created_at"}
    assert isinstance(with_due["id"], str) and with_due["id"]
    assert with_due["title"] == "With due date"
    assert with_due["due_date"] == "2026-11-25"
    assert with_due["is_done"] is False
    assert with_due["created_at"]

    no_due = by_title["No due date"]
    assert no_due["due_date"] is None
    assert no_due["is_done"] is False


def test_ac026_get_tasks_returns_empty_array_for_new_user(client: TestClient) -> None:
    """AC-026: a user with no tasks gets an empty array (200), which the
    frontend renders as the empty-state message."""
    token, _ = _register_and_get_token(client)
    resp = client.get("/tasks", headers=_auth_headers(token))
    assert resp.status_code == 200
    assert resp.json() == []


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


def test_ac023_get_tasks_returns_only_authenticated_users_tasks(client: TestClient) -> None:
    """AC-023 / NFR-005: GET /tasks returns only the authenticated user's tasks
    and none from other users."""
    token_a, _ = _register_and_get_token(client)
    token_b, _ = _register_and_get_token(client)

    # User A creates two tasks, User B creates one.
    client.post("/tasks", json={"title": "A1"}, headers=_auth_headers(token_a))
    client.post(
        "/tasks",
        json={"title": "A2", "due_date": "2026-12-01"},
        headers=_auth_headers(token_a),
    )
    client.post("/tasks", json={"title": "B1"}, headers=_auth_headers(token_b))

    # A sees only A's two tasks; B sees only B's one task.
    a_resp = client.get("/tasks", headers=_auth_headers(token_a))
    assert a_resp.status_code == 200
    a_titles = {t["title"] for t in a_resp.json()}
    assert a_titles == {"A1", "A2"}
    assert "B1" not in a_titles

    b_resp = client.get("/tasks", headers=_auth_headers(token_b))
    assert b_resp.status_code == 200
    b_titles = {t["title"] for t in b_resp.json()}
    assert b_titles == {"B1"}
    assert "A1" not in b_titles and "A2" not in b_titles


def _create_task(client: TestClient, token: str, title: str = "Task") -> dict:
    resp = client.post("/tasks", json={"title": title}, headers=_auth_headers(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_ac020_patch_tasks_sets_is_done_true(client: TestClient) -> None:
    """AC-020: PATCH with is_done=true sets the flag and returns it true."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Done me")

    resp = client.patch(
        f"/tasks/{task['id']}", json={"is_done": True}, headers=_auth_headers(token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == task["id"]
    assert body["is_done"] is True
    assert body["title"] == "Done me"


def test_ac021_patch_tasks_sets_is_done_false(client: TestClient) -> None:
    """AC-021: PATCH with is_done=false clears the flag and returns it false."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Toggle")
    # Set it true first.
    client.patch(f"/tasks/{task['id']}", json={"is_done": True}, headers=_auth_headers(token))
    # Now clear it.
    resp = client.patch(
        f"/tasks/{task['id']}", json={"is_done": False}, headers=_auth_headers(token)
    )
    assert resp.status_code == 200
    assert resp.json()["is_done"] is False


def test_patch_tasks_updates_title_and_due_date(client: TestClient) -> None:
    """PATCH can update title and due_date; omitted fields stay unchanged."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Original")

    resp = client.patch(
        f"/tasks/{task['id']}",
        json={"title": "Renamed", "due_date": "2026-12-01"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Renamed"
    assert body["due_date"] == "2026-12-01"
    assert body["is_done"] is False


def test_patch_tasks_clears_due_date(client: TestClient) -> None:
    """PATCH with due_date=null clears the due date."""
    token, _ = _register_and_get_token(client)
    resp = client.post(
        "/tasks",
        json={"title": "Has date", "due_date": "2026-12-01"},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 201
    task = resp.json()
    assert task["due_date"] == "2026-12-01"

    cleared = client.patch(
        f"/tasks/{task['id']}", json={"due_date": None}, headers=_auth_headers(token)
    )
    assert cleared.status_code == 200
    assert cleared.json()["due_date"] is None


def test_patch_tasks_empty_title_returns_400(client: TestClient) -> None:
    """PATCH with an empty/whitespace title returns 400 'Title is required'."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Keep")

    resp = client.patch(f"/tasks/{task['id']}", json={"title": "   "}, headers=_auth_headers(token))
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Title is required"
    # Title unchanged.
    listing = client.get("/tasks", headers=_auth_headers(token)).json()
    assert listing[0]["title"] == "Keep"


def test_patch_tasks_partial_update_omits_fields(client: TestClient) -> None:
    """PATCH with only is_done leaves title and due_date untouched."""
    token, _ = _register_and_get_token(client)
    resp = client.post(
        "/tasks",
        json={"title": "Stable", "due_date": "2026-12-01"},
        headers=_auth_headers(token),
    )
    task = resp.json()

    resp = client.patch(
        f"/tasks/{task['id']}", json={"is_done": True}, headers=_auth_headers(token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["title"] == "Stable"
    assert body["due_date"] == "2026-12-01"
    assert body["is_done"] is True


def test_delete_tasks_returns_204_and_removes_task(client: TestClient) -> None:
    """DELETE /tasks/{task_id} returns 204 and the task is gone."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Delete me")

    resp = client.delete(f"/tasks/{task['id']}", headers=_auth_headers(token))
    assert resp.status_code == 204
    assert resp.content == b""

    listing = client.get("/tasks", headers=_auth_headers(token)).json()
    assert listing == []


def test_ac022_delete_task_permanently_removes_it_from_list(client: TestClient) -> None:
    """AC-022: deleting a task permanently removes it — it is gone from the
    list and can no longer be accessed via PATCH (404)."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Permanently gone")

    resp = client.delete(f"/tasks/{task['id']}", headers=_auth_headers(token))
    assert resp.status_code == 204

    # The task is gone from the list.
    listing = client.get("/tasks", headers=_auth_headers(token)).json()
    assert listing == []

    # The deleted task can no longer be patched — it is permanently removed,
    # not just hidden from the listing.
    patch_resp = client.patch(
        f"/tasks/{task['id']}", json={"title": "Still here?"}, headers=_auth_headers(token)
    )
    assert patch_resp.status_code == 404


def test_ac024_patch_other_users_task_returns_404(client: TestClient) -> None:
    """AC-024: PATCH on another user's task returns 404 (NFR-005)."""
    token_a, _ = _register_and_get_token(client)
    token_b, _ = _register_and_get_token(client)
    task = _create_task(client, token_a, "A's private")

    resp = client.patch(
        f"/tasks/{task['id']}", json={"is_done": True}, headers=_auth_headers(token_b)
    )
    assert resp.status_code == 404
    # Owner still sees it unchanged.
    own = client.get("/tasks", headers=_auth_headers(token_a)).json()
    assert own[0]["is_done"] is False


def test_ac024_delete_other_users_task_returns_404(client: TestClient) -> None:
    """AC-024: DELETE on another user's task returns 404 (NFR-005)."""
    token_a, _ = _register_and_get_token(client)
    token_b, _ = _register_and_get_token(client)
    task = _create_task(client, token_a, "A's private")

    resp = client.delete(f"/tasks/{task['id']}", headers=_auth_headers(token_b))
    assert resp.status_code == 404
    # Owner still has it.
    own = client.get("/tasks", headers=_auth_headers(token_a)).json()
    assert len(own) == 1


def test_patch_tasks_unknown_id_returns_404(client: TestClient) -> None:
    """PATCH on a non-existent task id returns 404."""
    token, _ = _register_and_get_token(client)
    resp = client.patch(
        "/tasks/00000000-0000-0000-0000-000000000000",
        json={"is_done": True},
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_delete_tasks_unknown_id_returns_404(client: TestClient) -> None:
    """DELETE on a non-existent task id returns 404."""
    token, _ = _register_and_get_token(client)
    resp = client.delete(
        "/tasks/00000000-0000-0000-0000-000000000000",
        headers=_auth_headers(token),
    )
    assert resp.status_code == 404


def test_patch_tasks_without_auth_returns_401(client: TestClient) -> None:
    """PATCH without a Bearer token returns 401."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Any")
    resp = client.patch(f"/tasks/{task['id']}", json={"is_done": True})
    assert resp.status_code == 401


def test_delete_tasks_without_auth_returns_401(client: TestClient) -> None:
    """DELETE without a Bearer token returns 401."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Any")
    resp = client.delete(f"/tasks/{task['id']}")
    assert resp.status_code == 401


def test_patch_tasks_invalid_token_returns_401(client: TestClient) -> None:
    """PATCH with an invalid Bearer token returns 401."""
    token, _ = _register_and_get_token(client)
    task = _create_task(client, token, "Any")
    resp = client.patch(
        f"/tasks/{task['id']}", json={"is_done": True}, headers=_auth_headers("bad-token")
    )
    assert resp.status_code == 401
