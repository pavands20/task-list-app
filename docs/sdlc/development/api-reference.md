# API Reference

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start endpoints -->
| Method | Path | Handler | Source | Summary |
|---|---|---|---|---|
| POST | /auth/login | login | `backend/app/routers/auth.py:73` | Authenticate a user and return a session token (AC-004, AC-005). |
| POST | /auth/logout | logout | `backend/app/routers/auth.py:83` | — |
| POST | /auth/password-reset/confirm | password_reset_confirm | `backend/app/routers/auth.py:118` | Confirm a password reset (AC-011, NFR-001, NFR-002, NFR-003). |
| POST | /auth/password-reset/request | password_reset_request | `backend/app/routers/auth.py:102` | Request a password-reset link (AC-009, AC-010, NFR-004). |
| POST | /auth/register | register | `backend/app/routers/auth.py:56` | Register a new user and return a session token (AC-001, AC-002, AC-003). |
| GET | /health | health | `backend/app/main.py:67` | Liveness probe. |
| GET | /tasks | list_tasks | `backend/app/routers/tasks.py:53` | Return all tasks belonging to the authenticated user. |
| POST | /tasks | create_task | `backend/app/routers/tasks.py:36` | Create a task for the authenticated user (AC-015, AC-016, AC-017). |
| DELETE | /tasks/{task_id} | delete_task | `backend/app/routers/tasks.py:95` | Delete one of the authenticated user's tasks. |
| PATCH | /tasks/{task_id} | patch_task | `backend/app/routers/tasks.py:65` | Partially update one of the authenticated user's tasks. |
<!-- sdlc:auto:end endpoints -->

<!-- sdlc:auto:start drift -->
**Designed but missing:**

- DELETE /account
<!-- sdlc:auto:end drift -->

<!-- sdlc:auto:start source -->
Generated from commit `208a997`
<!-- sdlc:auto:end source -->
