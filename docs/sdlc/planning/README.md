# Planning

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### EPIC-001 · approved · source: planning:EPIC-001

Open self sign-up and sign-in using email and password with token-based sessions. Covers registration, sign-in, sign-out/session security, email-based password reset, and account deletion.

EPIC EPIC-001: Account Access and Authentication

Open self sign-up and sign-in using email and password with token-based sessions. Covers registration, sign-in, sign-out/session security, email-based password reset, and account deletion.

Assumptions surfaced: authentication is email + password with token-based sessions and no third-party SSO; no mandatory email verification before using the app; password reset requires a transactional email provider credential; the app is free with no payments or plans.

US-001 [critical] Self-register with email and password: As a new visitor, I want to create an account with my email address and a password, so that I can start managing my personal tasks immediately
  AC-001: Given I am on the registration page and no account exists for my email, when I submit a valid email address and a password, then my account is created, my password is stored only as a hash (never in plain text), and I am signed in and taken to my task list without any email verification step
  AC-002: Given I am on the registration page, when I submit an email address that already has an account, then registration is rejected and I am told the email is already registered
  AC-003: Given I am on the registration page, when I submit an invalid email format or leave the password empty, then registration is rejected and I am shown which field is invalid

US-002 [critical] Sign in to my personal account: As a registered user, I want to sign in with my email and password, so that I can access my own task list
  AC-004: Given I have a registered account, when I submit my correct email and password, then I am signed in, issued a session token, and taken to my task list
  AC-005: Given I am on the sign-in page, when I submit an email and password that do not match a registered account, then sign-in is rejected with a generic message that does not reveal whether the email exists
  AC-006: Given No third-party SSO option is offered, when I view the sign-in page, then only email-and-password sign-in is available and no SSO buttons appear

US-003 [high] Sign out and session expiry: As a signed-in user, I want my session to end when I sign out or after it expires, so that my tasks stay private on shared or public devices
  AC-007: Given I am signed in, when I choose to sign out, then my session ends and I must sign in again before I can view or change any tasks
  AC-008: Given I am signed in and my session token has expired, when I try to perform any task action, then the action is refused and I am prompted to sign in again

US-004 [medium] Reset a forgotten password by email: As a user who has forgotten my password, I want to request a password reset link sent to my email, so that I can regain access to my account
  AC-009: Given A transactional email provider credential (<email-provider-api-key>) is configured, when I request a password reset for a registered email address, then a time-limited password reset link is sent to that email address
  AC-010: Given I request a password reset for an email that is not registered, when the request is submitted, then the same neutral confirmation is shown so that registered emails cannot be discovered
  AC-011: Given I have received a valid, unexpired reset link, when I follow it and set a new password, then my password is updated (stored only as a hash), any existing sessions are ended, and I can sign in with the new password

US-005 [medium] Delete my account: As a signed-in user, I want to permanently delete my account, so that I can remove myself and my data from the app
  AC-012: Given I am signed in and viewing account settings, when I confirm that I want to delete my account, then my account and all of my tasks are permanently removed and my sessions are ended
  AC-013: Given My account has just been deleted, when I try to sign in with the deleted account's email and password, then sign-in fails because the account no longer exists

US-006 [low] Use the app free of charge: As a user, I want to use all features without any payment, so that I am never asked for billing details
  AC-014: Given The app is free with no payments, billing or plans (assumption), when I register and use any feature, then I am never prompted for payment information and no paid-plan restrictions are applied

Plan items for this epic:
- EPIC-001 [epic]: Account Access and Authentication (points=None, role=(unassigned))
- US-001 [story]: Self-register with email and password (points=8, role=backend-agent)
- US-001-T1 [task]: Create users and sessions schema (points=None, role=backend-agent)
- US-001-T2 [task]: Implement POST /auth/register endpoint (points=None, role=backend-agent)
- US-001-T3 [task]: Build registration page with auto sign-in (points=None, role=frontend-agent)
- US-002 [story]: Sign in to my personal account (points=5, role=backend-agent)
- US-003 [story]: Sign out and session expiry (points=5, role=backend-agent)
- US-004 [story]: Reset a forgotten password by email (points=8, role=backend-agent)
- US-004-T1 [task]: Add password_reset_tokens schema and expiry logic (points=None, role=backend-agent)
- US-004-T2 [task]: Implement POST /auth/password-reset/request with SendGrid dispatch (points=None, role=integration-agent)
- US-004-T3 [task]: Implement POST /auth/password-reset/confirm (points=None, role=backend-agent)
- US-004-T4 [task]: Build password reset request and confirm pages (points=None, role=frontend-agent)
- US-005 [story]: Delete my account (points=5, role=backend-agent)
- US-006 [story]: Use the app free of charge (points=1, role=qa-agent)

**Related:** US-001, US-002, US-003, US-004, US-005, US-006

### EPIC-002 · approved · source: planning:EPIC-002

A signed-in user can add, edit, mark done/not done, and delete their own tasks. Each task has a required title, an optional due date, and a done flag. No sharing, teams, or notifications.

EPIC EPIC-002: Personal Task Management

A signed-in user can add, edit, mark done/not done, and delete their own tasks. Each task has a required title, an optional due date, and a done flag. Each user sees and manages only their own tasks; there is no sharing, no teams and no notifications/reminders (out of scope).

Assumption surfaced: task title is required; description/notes and categories/tags are not included.

US-007 [critical] Add a task with a required title and optional due date: As a signed-in user, I want to add a new task with a title and, if I wish, a due date, so that I can capture things I need to do
  AC-015: Given I am signed in, when I submit a new task with a non-empty title and no due date, then the task is created for my account as active (not done) with no due date
  AC-016: Given I am signed in, when I submit a new task with a non-empty title and a valid due date, then the task is created for my account as active with that due date
  AC-017: Given I am adding a task, when I submit without a title, then the task is not created and I am told a title is required

US-008 [high] Edit a task: As a signed-in user, I want to change a task's title or due date, so that I can keep my tasks accurate
  AC-018: Given I own an existing task, when I change its title to a non-empty value and/or change or clear its due date and save, then the task is updated with my changes
  AC-019: Given I am editing one of my tasks, when I clear the title and save, then the change is rejected and I am told a title is required

US-009 [high] Mark a task done or not done: As a signed-in user, I want to toggle a task between done and not done, so that I can track what I have completed
  AC-020: Given I own an active task, when I mark it done, then its done flag is set and it is shown as completed
  AC-021: Given I own a completed task, when I mark it not done, then its done flag is cleared and it is shown as active again

US-010 [high] Delete a task: As a signed-in user, I want to delete a task I no longer need, so that my list stays relevant
  AC-022: Given I own an existing task, when I delete it, then the task is permanently removed from my list

US-011 [critical] Access only my own tasks: As a signed-in user, I want to see and change only my own tasks, so that my tasks remain private to me
  AC-023: Given Other users have their own tasks, when I view my task list, then I see only tasks I created and none belonging to other users
  AC-024: Given A task belongs to another user, when I attempt to view, edit, complete or delete it, then the action is refused because it is not mine

Plan items for this epic:
- EPIC-002 [epic]: Personal Task Management (points=None, role=(unassigned))
- US-007 [story]: Add a task with a required title and optional due date (points=5, role=backend-agent)
- US-008 [story]: Edit a task (points=3, role=backend-agent)
- US-009 [story]: Mark a task done or not done (points=2, role=backend-agent)
- US-010 [story]: Delete a task (points=2, role=backend-agent)
- US-011 [story]: Access only my own tasks (points=5, role=security-agent)

**Related:** US-007, US-008, US-009, US-010, US-011

### EPIC-003 · approved · source: planning:EPIC-003

Tasks are shown in a single per-user list filterable by active/completed, with default sort by due date then creation time. Delivered as a responsive web app sized for low scale (tens to hundreds of tasks per user).

EPIC EPIC-003: Task List, Filtering and Sorting

Tasks are shown in a single per-user list that can be filtered between active and completed items, with a default sort by due date then creation time. Delivered as a responsive web app (React frontend, FastAPI backend, PostgreSQL), sized for low scale (individuals with tens to hundreds of tasks).

Assumptions surfaced: single per-user list filterable by active/completed, default sort by due date then creation time; low scale with no real-time or high-throughput needs.

US-012 [critical] View my tasks in a single list: As a signed-in user, I want to see all my tasks in one list, so that I have a clear overview of my tasks
  AC-025: Given I have several tasks, when I open my task list, then each task shows its title, its due date if set, and whether it is done or active
  AC-026: Given I have no tasks yet, when I open my task list, then I see an empty-state message inviting me to add my first task

US-013 [high] Filter between active and completed tasks: As a signed-in user, I want to filter my list between active and completed tasks, so that I can focus on what still needs doing
  AC-027: Given My list contains both active and completed tasks, when I select the active filter, then only tasks that are not done are shown
  AC-028: Given My list contains both active and completed tasks, when I select the completed filter, then only tasks that are done are shown

US-014 [medium] Default sort by due date then creation time: As a signed-in user, I want my tasks ordered by due date and then by when I created them, so that the most time-relevant tasks appear first
  AC-029: Given I have tasks with different due dates, when I view my list with the default sort, then tasks are ordered by due date ascending
  AC-030: Given Some tasks share the same due date or have no due date, when I view my list with the default sort, then tasks with the same due date are ordered by creation time, and tasks without a due date are ordered among themselves by creation time

US-015 [medium] Use the app on any device size: As a user, I want the app to adapt to my screen size, so that I can manage tasks on phone, tablet or desktop
  AC-031: Given The app is a responsive web app sized for low scale (assumption), when I open it on a small mobile screen or a large desktop screen, then the task list and task actions remain usable and readable without horizontal scrolling

Plan items for this epic:
- EPIC-003 [epic]: Task List, Filtering and Sorting (points=None, role=(unassigned))
- US-012 [story]: View my tasks in a single list (points=5, role=frontend-agent)
- US-013 [story]: Filter between active and completed tasks (points=3, role=frontend-agent)
- US-014 [story]: Default sort by due date then creation time (points=3, role=backend-agent)
- US-015 [story]: Use the app on any device size (points=3, role=frontend-agent)

**Related:** US-012, US-013, US-014, US-015

### SPRINT-1 · approved · source: planning:Sprint 1

Sprint 1 goal: stand up registration and login with token sessions, and let a signed-in user create a task. Capacity is 20 points.

Sprint 1 (Plan version 1, approved)

Goal: Stand up registration and login with token sessions, and let a signed-in user create a task.
Capacity: 20 points

The sprint goal maps to: US-001 (Self-register with email and password, 8 pts, backend-agent) with tasks US-001-T1 (Create users and sessions schema), US-001-T2 (Implement POST /auth/register endpoint), US-001-T3 (Build registration page with auto sign-in); US-002 (Sign in to my personal account, 5 pts, backend-agent); US-007 (Add a task with a required title and optional due date, 5 pts, backend-agent). Total story points for mapped stories: 18.

**Related:** US-001, US-002, US-007

### SPRINT-2 · approved · source: planning:Sprint 2

Sprint 2 goal: add sign-out/session expiry, password reset by email, enforce per-user task ownership, and support marking tasks done. Capacity is 20 points.

Sprint 2 (Plan version 1, approved)

Goal: Add sign-out/session expiry, password reset by email, enforce per-user task ownership, and support marking tasks done.
Capacity: 20 points

The sprint goal maps to: US-003 (Sign out and session expiry, 5 pts, backend-agent); US-004 (Reset a forgotten password by email, 8 pts, backend-agent) with tasks US-004-T1 (Add password_reset_tokens schema and expiry logic), US-004-T2 (Implement POST /auth/password-reset/request with SendGrid dispatch, integration-agent), US-004-T3 (Implement POST /auth/password-reset/confirm), US-004-T4 (Build password reset request and confirm pages, frontend-agent); US-009 (Mark a task done or not done, 2 pts, backend-agent); US-011 (Access only my own tasks, 5 pts, security-agent). Total story points for mapped stories: 20.

**Related:** US-003, US-004, US-009, US-011

### SPRINT-3 · approved · source: planning:Sprint 3

Sprint 3 goal: complete task edit/delete, account deletion, and ship the main task list view with active/completed filtering. Capacity is 20 points.

Sprint 3 (Plan version 1, approved)

Goal: Complete task edit/delete, account deletion, and ship the main task list view with active/completed filtering.
Capacity: 20 points

The sprint goal maps to: US-008 (Edit a task, 3 pts, backend-agent); US-010 (Delete a task, 2 pts, backend-agent); US-005 (Delete my account, 5 pts, backend-agent); US-012 (View my tasks in a single list, 5 pts, frontend-agent); US-013 (Filter between active and completed tasks, 3 pts, frontend-agent). Total story points for mapped stories: 18.

**Related:** US-005, US-008, US-010, US-012, US-013

### SPRINT-4 · approved · source: planning:Sprint 4

Sprint 4 goal: finish default due-date sorting and responsive layout so the app works well on any device. Capacity is 20 points.

Sprint 4 (Plan version 1, approved)

Goal: Finish default due-date sorting and responsive layout so the app works well on any device.
Capacity: 20 points

The sprint goal maps to: US-014 (Default sort by due date then creation time, 3 pts, backend-agent); US-015 (Use the app on any device size, 3 pts, frontend-agent); US-006 (Use the app free of charge, 1 pt, qa-agent) — US-006 is a constraint/validation story that may be verified in this final sprint. Total story points for mapped stories: 7.

**Related:** US-006, US-014, US-015
<!-- sdlc:auto:end narrative -->
