# Planning

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### EPIC-001 · approved · source: planning:EPIC-001

Open self sign-up and sign-in using email and password with token-based sessions.

Covers registration, sign-in, sign-out/session security, email-based password reset, and account deletion. Assumptions surfaced: authentication is email + password with token-based sessions and no third-party SSO; no mandatory email verification before using the app; password reset requires a transactional email provider credential; the app is free with no payments or plans.

**Related:** US-001, US-002, US-003, US-004, US-005, US-006

### EPIC-002 · approved · source: planning:EPIC-002

A signed-in user can add, edit, mark done/not done, and delete their own tasks.

Each task has a required title, an optional due date, and a done flag. Each user sees and manages only their own tasks; there is no sharing, no teams and no notifications/reminders (out of scope). Assumption surfaced: task title is required; description/notes and categories/tags are not included.

**Related:** US-007, US-008, US-009, US-010, US-011

### EPIC-003 · approved · source: planning:EPIC-003

Tasks are shown in a single per-user list, filterable between active and completed, with a default sort by due date then creation time.

Delivered as a responsive web app (React frontend, FastAPI backend, PostgreSQL), sized for low scale (individuals with tens to hundreds of tasks). Assumptions surfaced: single per-user list filterable by active/completed, default sort by due date then creation time; low scale with no real-time or high-throughput needs.

**Related:** US-012, US-013, US-014, US-015
<!-- sdlc:auto:end narrative -->
