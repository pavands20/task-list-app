# Traceability Matrix

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start legend -->
Built from recorded links, not written by a model: requirement key → plan item (`source_stable_key`) → development ticket (`stable_key`) → the ticket's test steps → the last live deployment that started after the work finished. **AC tests** counts the story's acceptance criteria that have a test case, and those whose test cases all passed in the latest finished E2E run.
<!-- sdlc:auto:end legend -->

<!-- sdlc:auto:start matrix -->
| Requirement | Epic | Title | Plan items | Sprint | Design | Code | Commits | Ticket | Tests | AC tests | Deployed |
|---|---|---|---|---|---|---|---|---|---|---|---|
| US-001 | EPIC-001 | Self-register with email and password | US-001, US-001-T1, US-001-T2, US-001-T3 | 1 | POST /auth/register, api, db, sessions, spa, users | backend/app/auth.py, backend/app/main.py, backend/app/migrations.py, backend/app/routers/auth.py, backend/app/schemas.py +11 more | a6c2fc7 | delivered | succeeded | 3/3 tested · 3/3 passing | — |
| US-002 | EPIC-001 | Sign in to my personal account | US-002 | 1 | POST /auth/login, api, db, sessions, spa, users | — | a6c2fc7 | delivered | not run | 3/3 tested · 3/3 passing | — |
| US-003 | EPIC-001 | Sign out and session expiry | US-003 | 2 | POST /auth/logout, api, db, sessions | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-004 | EPIC-001 | Reset a forgotten password by email | US-004, US-004-T1, US-004-T2, US-004-T3, US-004-T4 | 2 | POST /auth/password-reset/confirm, POST /auth/password-reset/request, api, db, email, password_reset_tokens, sessions, spa, users | — | — | not started | not run | 0/3 tested · 0/3 passing | — |
| US-005 | EPIC-001 | Delete my account | US-005 | 3 | DELETE /account, api, db, sessions, spa, tasks, users | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-006 | EPIC-001 | Use the app free of charge | US-006 | 1 | spa | backend/tests/integration/test_us006_free_app.py, backend/tests/unit/test_us006_free_app.py, frontend/e2e/us006-free-app.spec.ts, frontend/src/screens/Tasks.free.test.tsx | a6c2fc7 | delivered | succeeded | 1/1 tested · 1/1 passing | — |
| US-007 | EPIC-002 | Add a task with a required title and optional due date | US-007 | 1 | POST /tasks, api, db, spa, tasks | backend/app/main.py, backend/app/routers/tasks.py, backend/app/schemas.py, backend/tests/integration/test_tasks.py, backend/tests/unit/test_tasks.py +4 more | a6c2fc7 | delivered | succeeded | 3/3 tested · 3/3 passing | — |
| US-008 | EPIC-002 | Edit a task | US-008 | 3 | PATCH /tasks/{task_id}, api, db, spa, tasks | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-009 | EPIC-002 | Mark a task done or not done | US-009 | 2 | PATCH /tasks/{task_id}, api, db, spa, tasks | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-010 | EPIC-002 | Delete a task | US-010 | 3 | DELETE /tasks/{task_id}, api, db, spa, tasks | — | — | not started | not run | 0/1 tested · 0/1 passing | — |
| US-011 | EPIC-002 | Access only my own tasks | US-011 | 2 | DELETE /tasks/{task_id}, GET /tasks, PATCH /tasks/{task_id}, api, db, tasks, users | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-012 | EPIC-003 | View my tasks in a single list | US-012 | 3 | GET /tasks, api, spa, tasks | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-013 | EPIC-003 | Filter between active and completed tasks | US-013 | 3 | GET /tasks, api, spa, tasks | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-014 | EPIC-003 | Default sort by due date then creation time | US-014 | 4 | GET /tasks, api, db, tasks | — | — | not started | not run | 0/2 tested · 0/2 passing | — |
| US-015 | EPIC-003 | Use the app on any device size | US-015 | 4 | spa | — | — | not started | not run | 0/1 tested · 0/1 passing | — |
<!-- sdlc:auto:end matrix -->
