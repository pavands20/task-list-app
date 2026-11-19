# Sprint Plan

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start sprints -->
## Sprint 1: Sprint 1

Stand up registration and login with token sessions, and let a signed-in user create a task.

Capacity: 20 points · Committed: 19

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-001 | Story | Self-register with email and password | 8 | backend-agent | — |
| ↳ US-001-T1 | Task | Create users and sessions schema | — | backend-agent | — |
| ↳ US-001-T2 | Task | Implement POST /auth/register endpoint | — | backend-agent | — |
| ↳ US-001-T3 | Task | Build registration page with auto sign-in | — | frontend-agent | — |
| US-002 | Story | Sign in to my personal account | 5 | backend-agent | US-001 |
| US-006 | Story | Use the app free of charge | 1 | qa-agent | US-001 |
| US-007 | Story | Add a task with a required title and optional due date | 5 | backend-agent | US-002 |

## Sprint 2: Sprint 2

Add sign-out/session expiry, password reset by email, enforce per-user task ownership, and support marking tasks done.

Capacity: 20 points · Committed: 20

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-003 | Story | Sign out and session expiry | 5 | backend-agent | US-002 |
| US-004 | Story | Reset a forgotten password by email | 8 | backend-agent | US-001 |
| ↳ US-004-T1 | Task | Add password_reset_tokens schema and expiry logic | — | backend-agent | — |
| ↳ US-004-T2 | Task | Implement POST /auth/password-reset/request with SendGrid dispatch | — | integration-agent | — |
| ↳ US-004-T3 | Task | Implement POST /auth/password-reset/confirm | — | backend-agent | — |
| ↳ US-004-T4 | Task | Build password reset request and confirm pages | — | frontend-agent | — |
| US-009 | Story | Mark a task done or not done | 2 | backend-agent | US-007 |
| US-011 | Story | Access only my own tasks | 5 | security-agent | US-007, US-002 |

## Sprint 3: Sprint 3

Complete task edit/delete, account deletion, and ship the main task list view with active/completed filtering.

Capacity: 20 points · Committed: 18

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-005 | Story | Delete my account | 5 | backend-agent | US-001, US-007 |
| US-008 | Story | Edit a task | 3 | backend-agent | US-007 |
| US-010 | Story | Delete a task | 2 | backend-agent | US-007 |
| US-012 | Story | View my tasks in a single list | 5 | frontend-agent | US-007 |
| US-013 | Story | Filter between active and completed tasks | 3 | frontend-agent | US-012 |

## Sprint 4: Sprint 4

Finish default due-date sorting and responsive layout so the app works well on any device.

Capacity: 20 points · Committed: 6

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| US-014 | Story | Default sort by due date then creation time | 3 | backend-agent | US-012 |
| US-015 | Story | Use the app on any device size | 3 | frontend-agent | US-012 |

## Sprint 5: Fixes

Fix the findings SonarQube reported.

Capacity: 0 points · Committed: 0

| Key | Type | Title | Points | Role | Depends on |
|---|---|---|---|---|---|
| FIX-SEC-githubactions-s7637-9c1e4e26 | Story | Fix: Use full commit SHA hash for this dependency. (.github/workflows/sonar-scan.yml) | — | devops-agent | — |
| FIX-SEC-githubactions-s7637-53fd1e3a | Story | Fix: Use full commit SHA hash for this dependency. (.github/workflows/deploy.yml) | — | devops-agent | — |
| FIX-SEC-githubactions-s8543-ca13026c | Story | Fix: Using dependencies without locking resolved versions is security-sensitive. (.github/workflows/deploy.yml) | — | devops-agent | — |
| FIX-SEC-docker-s8544-82cfea7f | Story | Fix: Using dependencies without locking resolved versions is security-sensitive. (backend/Dockerfile) | — | — | — |

## Unscheduled

_Nothing unscheduled._
<!-- sdlc:auto:end sprints -->
