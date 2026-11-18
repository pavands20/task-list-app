# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| POST | /auth/login | login | `backend/app/routers/auth.py:62` | Authenticate a user and return a session token (AC-004, AC-005). |
| POST | /auth/register | register | `backend/app/routers/auth.py:45` | Register a new user and return a session token (AC-001, AC-002, AC-003). |
| GET | /health | health | `backend/app/main.py:65` | Liveness probe. |
| GET | /tasks | list_tasks | `backend/app/routers/tasks.py:43` | Return all tasks belonging to the authenticated user. |
| POST | /tasks | create_task | `backend/app/routers/tasks.py:26` | Create a task for the authenticated user (AC-015, AC-016, AC-017). |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- DELETE /account
- DELETE /tasks/{task_id}
- PATCH /tasks/{task_id}
- POST /auth/logout
- POST /auth/password-reset/confirm
- POST /auth/password-reset/request
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `74e671d`
<!-- sdlc:auto:end source -->
