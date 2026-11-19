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
| US-003 | EPIC-001 | Sign out and session expiry | US-003 | 2 | POST /auth/logout, api, db, sessions | frontend/e2e/us003-signout.spec.ts, frontend/src/lib/api.ts, frontend/src/screens/Account.test.tsx, frontend/src/screens/Account.tsx, frontend/src/screens/SessionExpired.test.tsx | 0dec605 | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-004 | EPIC-001 | Reset a forgotten password by email | US-004, US-004-T1, US-004-T2, US-004-T3, US-004-T4 | 2 | POST /auth/password-reset/confirm, POST /auth/password-reset/request, api, db, email, password_reset_tokens, sessions, spa, users | frontend/e2e/us004-password-reset.spec.ts, frontend/package.json, frontend/src/screens/ForgotPassword.test.tsx, frontend/src/screens/ForgotPassword.tsx, frontend/src/screens/ResetPassword.test.tsx +1 more | 0dec605 | delivered | succeeded | 3/3 tested · 3/3 passing | — |
| US-005 | EPIC-001 | Delete my account | US-005 | 3 | DELETE /account, api, db, sessions, spa, tasks, users | backend/app/main.py, backend/app/routers/auth.py, backend/tests/integration/test_auth.py, backend/tests/unit/test_auth.py, frontend/e2e/us005-delete-account.spec.ts +2 more | be293bd | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-006 | EPIC-001 | Use the app free of charge | US-006 | 1 | spa | backend/tests/integration/test_us006_free_app.py, backend/tests/unit/test_us006_free_app.py, frontend/e2e/us006-free-app.spec.ts, frontend/src/screens/Tasks.free.test.tsx | a6c2fc7 | delivered | succeeded | 1/1 tested · 1/1 passing | — |
| US-007 | EPIC-002 | Add a task with a required title and optional due date | US-007 | 1 | POST /tasks, api, db, spa, tasks | backend/app/main.py, backend/app/routers/tasks.py, backend/app/schemas.py, backend/tests/integration/test_tasks.py, backend/tests/unit/test_tasks.py +4 more | a6c2fc7 | delivered | succeeded | 3/3 tested · 3/3 passing | — |
| US-008 | EPIC-002 | Edit a task | US-008 | 3 | PATCH /tasks/{task_id}, api, db, spa, tasks | backend/tests/conftest.py, frontend/e2e/us008-edit-task.spec.ts, frontend/src/screens/Tasks.test.tsx | be293bd | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-009 | EPIC-002 | Mark a task done or not done | US-009 | 2 | PATCH /tasks/{task_id}, api, db, spa, tasks | backend/app/routers/tasks.py, backend/app/schemas.py, backend/tests/integration/test_tasks.py, backend/tests/unit/test_tasks.py, frontend/e2e/us009-toggle-edit-delete.spec.ts +2 more | 0dec605 | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-010 | EPIC-002 | Delete a task | US-010 | 3 | DELETE /tasks/{task_id}, api, db, spa, tasks | — | be293bd | delivered | not run | 1/1 tested · 1/1 passing | — |
| US-011 | EPIC-002 | Access only my own tasks | US-011 | 2 | DELETE /tasks/{task_id}, GET /tasks, PATCH /tasks/{task_id}, api, db, tasks, users | — | 0dec605 | delivered | not run | 2/2 tested · 2/2 passing | — |
| US-012 | EPIC-003 | View my tasks in a single list | US-012 | 3 | GET /tasks, api, spa, tasks | backend/tests/integration/test_tasks.py, frontend/e2e/us012-view-tasks.spec.ts, frontend/src/screens/Tasks.test.tsx, frontend/src/screens/Tasks.tsx | be293bd | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-013 | EPIC-003 | Filter between active and completed tasks | US-013 | 3 | GET /tasks, api, spa, tasks | — | be293bd | delivered | not run | 2/2 tested · 2/2 passing | — |
| US-014 | EPIC-003 | Default sort by due date then creation time | US-014 | 4 | GET /tasks, api, db, tasks | backend/tests/conftest.py, backend/tests/integration/test_tasks.py, frontend/e2e/us014-default-sort.spec.ts, frontend/src/screens/Tasks.test.tsx | a1f6d0b | delivered | succeeded | 2/2 tested · 2/2 passing | — |
| US-015 | EPIC-003 | Use the app on any device size | US-015 | 4 | spa | frontend/e2e/us015-responsive.spec.ts, frontend/src/screens/Tasks.responsive.test.tsx, frontend/src/screens/Tasks.tsx | a1f6d0b | delivered | succeeded | 1/1 tested · 1/1 passing | — |
<!-- sdlc:auto:end matrix -->
