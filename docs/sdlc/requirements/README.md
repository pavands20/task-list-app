# Product Requirements

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
## Summary

### REQ-TECH-STACK · approved · source: requirements:tech-stack

Technology stack approved by the product owner: FastAPI backend, React frontend, PostgreSQL database, hosted on AWS.

- Backend: FastAPI 0.115 -- lightweight Python framework sufficient to store tasks, enforce per-user ownership, and handle sign-up/sign-in/password reset.
- Frontend: React 19 -- responsive web app for adding, editing, filtering and completing tasks without page reloads.
- Database: PostgreSQL 16 -- reliably stores simple structured task/user/ownership records at the scale of individuals with hundreds of tasks.
- Cloud: AWS -- hosts the web app, database and outbound email in one place; scales down to near-nothing when idle, up if usage grows; only cloud option offered.
The input states these must be designed against exactly, with no substitution.

### REQ-SERVICES · approved · source: requirements:services

One external service approved: SendGrid for transactional email, required for account and password-reset emails to reach users.

- Email: SendGrid (SaaS), configured via environment variable SENDGRID_API_KEY.
- Rationale given: password reset and account emails must reliably reach inboxes without running a mail server; reset links are the only way back into an account on this free app.
- API keys this app needs: SENDGRID_API_KEY.

### REQ-SCOPE · approved · source: requirements:scope

Scope is a lightweight, single-user task list app: no teams, sharing, or notifications; free to use; email/password auth only.

In scope: email/password self-registration; sign-in to a personal account; add task (required title, optional due date); edit a task; mark task done/not done; delete a task; personal task list showing only the user's own tasks; filter active vs completed; default sort by due date then creation time; email/password sign-in only (no third-party SSO); no mandatory email verification before use; free to use with no payments or plans.
Out of scope -- not to be designed or built: Teams / multi-user workspaces; Task sharing between users; Notifications / reminders (e.g. due-date alerts).
Delivery scope marked 'lightweight'; requirements version 1.

### REQ-FUNC-SIGNIN · approved · source: requirements:functional:sign-in-and-accounts

Functional requirements covering registration, sign-in, sign-out/session expiry, password reset, account deletion, and free access.

- Register with email and password: a new visitor creates an account with a valid email and non-empty password, is signed in straight to their task list; rejected with a reason if email already has an account, email format is invalid, or password is empty.
- Sign in to personal account: registered user signs in with email and password to reach their own task list; only email-and-password sign-in is offered, no third-party sign-on buttons.
- Sign out and session expiry: signed-in user can sign out to end their session; an expired session is refused on next action; in both cases the user must sign in again before viewing or changing tasks.
- Reset forgotten password: user requests a reset for their email; if registered, receives a time-limited reset link; following a valid link lets them set a new password, after which existing sessions end and they can sign in with the new password.
- Delete account: signed-in user can permanently delete their account from account settings; account and all tasks are removed, sessions end, and sign-in is no longer possible.
- Free to use: all features available without payment; user is never asked for billing details and no paid-plan restrictions apply.

**Related:** REQ-NFR-001, REQ-NFR-002, REQ-NFR-003, REQ-NFR-004, REQ-NFR-009

### REQ-FUNC-TASKS · approved · source: requirements:functional:managing-tasks

Functional requirements covering adding, editing, completing and deleting a user's own tasks.

- Add a task: signed-in user adds a task with required title and optional due date; created as active for their account; submitting without a title is rejected with a message that a title is required.
- Edit a task: user can change title or due date (including clearing the due date) of a task they own and save changes; clearing the title is rejected with a message that a title is required.
- Mark a task done or not done: user can toggle one of their tasks between done and not done; marking done shows it as completed, marking not done shows it as active again.
- Delete a task: user can delete a task they own, permanently removing it from their list.

**Related:** REQ-NFR-005, REQ-NFR-006

### REQ-FUNC-LIST · approved · source: requirements:functional:task-list-and-filtering

Functional requirements covering the single task list view, filtering between active/completed, and default sort order.

- View tasks in one list: signed-in user sees all of their own tasks in a single list, each showing title, due date if set, and done/active status; an empty-state message invites the user to add their first task when there are none yet.
- Filter active and completed: user can filter the list to show only active (not done) tasks or only completed (done) tasks.
- Default sort by due date: list is ordered by due date ascending by default; tasks sharing a due date or with no due date are ordered among themselves by creation time.

**Related:** REQ-NFR-007, REQ-NFR-008

### REQ-NFR-001 · approved · source: requirements:NFR-001

Security: passwords must always be stored as hashes, never plain text.

Category: security. User passwords are always stored as a hash and never in plain text, both when an account is created and when a password is reset.

**Related:** REQ-FUNC-SIGNIN

### REQ-NFR-002 · approved · source: requirements:NFR-002

Security: sessions use expiring tokens and must end on sign-out, password reset, or account deletion.

Category: security. Sessions are issued as tokens that expire; any active session is ended when the user signs out, resets their password, or deletes their account. After that, the user must sign in again before viewing or changing any tasks.

**Related:** REQ-FUNC-SIGNIN

### REQ-NFR-003 · approved · source: requirements:NFR-003

Security: password reset links are time-limited and stop working after expiry or after the password changes.

Category: security. A password reset link sent by email is time-limited and stops working once it expires or after the password has been changed.

**Related:** REQ-FUNC-SIGNIN

### REQ-NFR-004 · approved · source: requirements:NFR-004

Privacy: sign-in and password-reset responses must never reveal whether a given email is registered.

Category: privacy. Failed sign-in attempts show a generic message that does not reveal whether an email is registered. Password reset requests show the same neutral confirmation whether or not the email exists, so registered emails cannot be discovered.

**Related:** REQ-FUNC-SIGNIN

### REQ-NFR-005 · approved · source: requirements:NFR-005

Privacy: a user may only view, edit, complete or delete their own tasks; access to others' tasks is refused.

Category: privacy. A signed-in user can view, edit, complete and delete only the tasks they created; any attempt to reach another user's task is refused.

**Related:** REQ-FUNC-TASKS

### REQ-NFR-006 · approved · source: requirements:NFR-006

Privacy: deleting an account permanently and irrecoverably removes the account and all of its tasks.

Category: privacy. When a user confirms account deletion, their account and all of their tasks are permanently removed and cannot be recovered or signed back into.

**Related:** REQ-FUNC-TASKS

### REQ-NFR-007 · approved · source: requirements:NFR-007

Scalability: sized for individual, low-scale use -- tens to hundreds of tasks per user, no real-time or high-throughput needs.

Category: scalability. The app is sized for individual users each managing tens to hundreds of personal tasks, with no real-time or high-throughput demands. Target: tens to hundreds of tasks per user.

**Related:** REQ-FUNC-LIST

### REQ-NFR-008 · approved · source: requirements:NFR-008

Usability: the task list and actions must remain usable without horizontal scrolling from small mobile to large desktop screens.

Category: usability. The task list and task actions stay usable and readable on small mobile screens through to large desktop screens without horizontal scrolling. Target: no horizontal scrolling on small mobile or large desktop screens.

**Related:** REQ-FUNC-LIST

### REQ-NFR-009 · approved · source: requirements:NFR-009

Security (accepted risk): no mandatory email verification before using the app.

Category: security, accepted risk. Open sign-up is allowed with no email verification step before using the app, so unverified email addresses can register and start managing tasks.

**Related:** REQ-FUNC-SIGNIN
<!-- sdlc:auto:end narrative -->

<!-- sdlc:auto:start summary -->
**Requirements version:** v1  
**Delivery scope:** lightweight  
**Approved:** 2026-11-18

**Capabilities in scope:** Email and password self-registration, Sign-in to a personal account, Add a task with required title and optional due date, Edit a task, Mark a task done or not done, Delete a task, Personal task list showing only the user's own tasks, Filter between active and completed tasks, Default sort by due date then creation time, Email and password sign-in, no third-party SSO, No mandatory email verification before using the app, Free to use, with no payments or plans

**Approved technology stack:**

| Layer | Choice | Rationale |
|---|---|---|
| backend | FastAPI | The backend only needs to store tasks, enforce that each user sees only their own, and handle sign-up, sign-in and password reset. FastAPI is a lightweight Python framework that covers exactly this with little ceremony, and it is the backend you named. |
| cloud | AWS | A free personal app with open sign-up needs reliable, low-cost hosting that scales down to near-nothing when idle and up if it catches on. AWS covers the web app, the database and outbound email in one place, and is the only cloud option offered here. |
| database | PostgreSQL | Tasks, users and the ownership link between them are simple structured records, and you need each user reliably scoped to their own rows. PostgreSQL does this dependably at your scale of individuals with hundreds of tasks each, and it was the database you named. |
| frontend | React | Your app is a responsive web app where a signed-in user adds, edits, filters and completes tasks without page reloads. React handles that kind of interactive list — toggling active/completed, marking done in place — cleanly, and it was the stack you named. |
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start epics -->
## EPIC-001: Account Access and Authentication

Open self sign-up and sign-in using email and password with token-based sessions. Covers registration, sign-in, sign-out/session security, email-based password reset, and account deletion. Assumptions surfaced: authentication is email + password with token-based sessions and no third-party SSO; no mandatory email verification before using the app; password reset requires a transactional email provider credential; the app is free with no payments or plans.

### US-001: Self-register with email and password

**Priority:** critical

> As a new visitor, I want to create an account with my email address and a password, so that I can start managing my personal tasks immediately.

| ID | Given | When | Then |
|---|---|---|---|
| AC-001 | I am on the registration page and no account exists for my email | I submit a valid email address and a password | my account is created, my password is stored only as a hash (never in plain text), and I am signed in and taken to my task list without any email verification step |
| AC-002 | I am on the registration page | I submit an email address that already has an account | registration is rejected and I am told the email is already registered |
| AC-003 | I am on the registration page | I submit an invalid email format or leave the password empty | registration is rejected and I am shown which field is invalid |

### US-002: Sign in to my personal account

**Priority:** critical

> As a registered user, I want to sign in with my email and password, so that I can access my own task list.

| ID | Given | When | Then |
|---|---|---|---|
| AC-004 | I have a registered account | I submit my correct email and password | I am signed in, issued a session token, and taken to my task list |
| AC-005 | I am on the sign-in page | I submit an email and password that do not match a registered account | sign-in is rejected with a generic message that does not reveal whether the email exists |
| AC-006 | No third-party SSO option is offered | I view the sign-in page | only email-and-password sign-in is available and no SSO buttons appear |

### US-003: Sign out and session expiry

**Priority:** high

> As a signed-in user, I want my session to end when I sign out or after it expires, so that my tasks stay private on shared or public devices.

| ID | Given | When | Then |
|---|---|---|---|
| AC-007 | I am signed in | I choose to sign out | my session ends and I must sign in again before I can view or change any tasks |
| AC-008 | I am signed in and my session token has expired | I try to perform any task action | the action is refused and I am prompted to sign in again |

### US-004: Reset a forgotten password by email

**Priority:** medium

> As a user who has forgotten my password, I want to request a password reset link sent to my email, so that I can regain access to my account.

| ID | Given | When | Then |
|---|---|---|---|
| AC-009 | A transactional email provider credential (<email-provider-api-key>) is configured | I request a password reset for a registered email address | a time-limited password reset link is sent to that email address |
| AC-010 | I request a password reset for an email that is not registered | the request is submitted | the same neutral confirmation is shown so that registered emails cannot be discovered |
| AC-011 | I have received a valid, unexpired reset link | I follow it and set a new password | my password is updated (stored only as a hash), any existing sessions are ended, and I can sign in with the new password |

### US-005: Delete my account

**Priority:** medium

> As a signed-in user, I want to permanently delete my account, so that I can remove myself and my data from the app.

| ID | Given | When | Then |
|---|---|---|---|
| AC-012 | I am signed in and viewing account settings | I confirm that I want to delete my account | my account and all of my tasks are permanently removed and my sessions are ended |
| AC-013 | My account has just been deleted | I try to sign in with the deleted account's email and password | sign-in fails because the account no longer exists |

### US-006: Use the app free of charge

**Priority:** low

> As a user, I want to use all features without any payment, so that I am never asked for billing details.

| ID | Given | When | Then |
|---|---|---|---|
| AC-014 | The app is free with no payments, billing or plans (assumption) | I register and use any feature | I am never prompted for payment information and no paid-plan restrictions are applied |

## EPIC-002: Personal Task Management

A signed-in user can add, edit, mark done/not done, and delete their own tasks. Each task has a required title, an optional due date, and a done flag. Each user sees and manages only their own tasks; there is no sharing, no teams and no notifications/reminders (out of scope). Assumption surfaced: task title is required; description/notes and categories/tags are not included.

### US-007: Add a task with a required title and optional due date

**Priority:** critical

> As a signed-in user, I want to add a new task with a title and, if I wish, a due date, so that I can capture things I need to do.

| ID | Given | When | Then |
|---|---|---|---|
| AC-015 | I am signed in | I submit a new task with a non-empty title and no due date | the task is created for my account as active (not done) with no due date |
| AC-016 | I am signed in | I submit a new task with a non-empty title and a valid due date | the task is created for my account as active with that due date |
| AC-017 | I am adding a task | I submit without a title | the task is not created and I am told a title is required |

### US-008: Edit a task

**Priority:** high

> As a signed-in user, I want to change a task's title or due date, so that I can keep my tasks accurate.

| ID | Given | When | Then |
|---|---|---|---|
| AC-018 | I own an existing task | I change its title to a non-empty value and/or change or clear its due date and save | the task is updated with my changes |
| AC-019 | I am editing one of my tasks | I clear the title and save | the change is rejected and I am told a title is required |

### US-009: Mark a task done or not done

**Priority:** high

> As a signed-in user, I want to toggle a task between done and not done, so that I can track what I have completed.

| ID | Given | When | Then |
|---|---|---|---|
| AC-020 | I own an active task | I mark it done | its done flag is set and it is shown as completed |
| AC-021 | I own a completed task | I mark it not done | its done flag is cleared and it is shown as active again |

### US-010: Delete a task

**Priority:** high

> As a signed-in user, I want to delete a task I no longer need, so that my list stays relevant.

| ID | Given | When | Then |
|---|---|---|---|
| AC-022 | I own an existing task | I delete it | the task is permanently removed from my list |

### US-011: Access only my own tasks

**Priority:** critical

> As a signed-in user, I want to see and change only my own tasks, so that my tasks remain private to me.

| ID | Given | When | Then |
|---|---|---|---|
| AC-023 | Other users have their own tasks | I view my task list | I see only tasks I created and none belonging to other users |
| AC-024 | A task belongs to another user | I attempt to view, edit, complete or delete it | the action is refused because it is not mine |

## EPIC-003: Task List, Filtering and Sorting

Tasks are shown in a single per-user list that can be filtered between active and completed items, with a default sort by due date then creation time. Delivered as a responsive web app (React frontend, FastAPI backend, PostgreSQL), sized for low scale (individuals with tens to hundreds of tasks). Assumptions surfaced: single per-user list filterable by active/completed, default sort by due date then creation time; low scale with no real-time or high-throughput needs.

### US-012: View my tasks in a single list

**Priority:** critical

> As a signed-in user, I want to see all my tasks in one list, so that I have a clear overview of my tasks.

| ID | Given | When | Then |
|---|---|---|---|
| AC-025 | I have several tasks | I open my task list | each task shows its title, its due date if set, and whether it is done or active |
| AC-026 | I have no tasks yet | I open my task list | I see an empty-state message inviting me to add my first task |

### US-013: Filter between active and completed tasks

**Priority:** high

> As a signed-in user, I want to filter my list between active and completed tasks, so that I can focus on what still needs doing.

| ID | Given | When | Then |
|---|---|---|---|
| AC-027 | My list contains both active and completed tasks | I select the active filter | only tasks that are not done are shown |
| AC-028 | My list contains both active and completed tasks | I select the completed filter | only tasks that are done are shown |

### US-014: Default sort by due date then creation time

**Priority:** medium

> As a signed-in user, I want my tasks ordered by due date and then by when I created them, so that the most time-relevant tasks appear first.

| ID | Given | When | Then |
|---|---|---|---|
| AC-029 | I have tasks with different due dates | I view my list with the default sort | tasks are ordered by due date ascending |
| AC-030 | Some tasks share the same due date or have no due date | I view my list with the default sort | tasks with the same due date are ordered by creation time, and tasks without a due date are ordered among themselves by creation time |

### US-015: Use the app on any device size

**Priority:** medium

> As a user, I want the app to adapt to my screen size, so that I can manage tasks on phone, tablet or desktop.

| ID | Given | When | Then |
|---|---|---|---|
| AC-031 | The app is a responsive web app sized for low scale (assumption) | I open it on a small mobile screen or a large desktop screen | the task list and task actions remain usable and readable without horizontal scrolling |
<!-- sdlc:auto:end epics -->
