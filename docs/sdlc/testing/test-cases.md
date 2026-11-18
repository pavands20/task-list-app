# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
80 tests · Passed 80 · Failed 0 · Skipped 0 · Not run 0

Acceptance criteria covered: 10/31 · passing: 10/31
<!-- sdlc:auto:end summary -->

<!-- sdlc:auto:start tests -->
## Sprint 1

### US-001: Self-register with email and password

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-002 | test_ac002_register_rejects_duplicate_email | Unit | Passed | `backend/tests/unit/test_auth.py` |
| AC-003 | test_ac003_email_validation_rejects_invalid_format | Unit | Passed | `backend/tests/unit/test_auth.py` |
| AC-003 | test_ac003_empty_password_rejected | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | test_auth_dependency_rejects_expired_token | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | test_auth_dependency_rejects_missing_header | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | test_auth_dependency_rejects_unknown_token | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | test_auth_dependency_resolves_user_from_token | Unit | Passed | `backend/tests/unit/test_auth.py` |
| NFR-001 | test_nfr001_hash_password_is_bcrypt_and_never_plaintext | Unit | Passed | `backend/tests/unit/test_auth.py` |
| NFR-001 | test_nfr001_register_stores_hash_not_plaintext | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | test_token_generation_stores_hash_not_plaintext | Unit | Passed | `backend/tests/unit/test_auth.py` |
| — | Auth guard > [auth guard] redirects unauthenticated users from /account to /sign-in | Unit | Passed | `frontend/src/App.auth.test.tsx` |
| — | Auth guard > [auth guard] redirects unauthenticated users from /tasks to /sign-in | Unit | Passed | `frontend/src/App.auth.test.tsx` |
| — | App > renders a screen inside the app shell and shows its menu | Unit | Passed | `frontend/src/App.test.tsx` |
| AC-001 | Register screen > [AC-001] stores the token and redirects to /tasks on successful registration | Unit | Passed | `frontend/src/screens/Register.test.tsx` |
| AC-002 | Register screen > [AC-002] shows 'Email is already registered' on duplicate email | Unit | Passed | `frontend/src/screens/Register.test.tsx` |
| AC-003 | Register screen > [AC-003] shows field-level validation errors for invalid email and empty password | Unit | Passed | `frontend/src/screens/Register.test.tsx` |
| AC-004 | SignIn screen > [AC-004] stores the token and redirects to /tasks on successful sign-in | Unit | Passed | `frontend/src/screens/SignIn.test.tsx` |
| AC-005 | SignIn screen > [AC-005] shows a generic error on failed sign-in that does not reveal whether the email exists | Unit | Passed | `frontend/src/screens/SignIn.test.tsx` |
| AC-006 | SignIn screen > [AC-006] shows only email and password fields with no SSO or third-party auth options | Unit | Passed | `frontend/src/screens/SignIn.test.tsx` |
| AC-001 | test_ac001_register_creates_user_returns_token_and_user | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-002 | test_ac002_register_duplicate_email_returns_409 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-003 | test_ac003_register_empty_password_returns_400_field_detail | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-003 | test_ac003_register_invalid_email_returns_400_field_detail | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-004 | test_ac004_login_correct_credentials_returns_200 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-005 | test_ac005_login_unknown_email_returns_401_generic | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-005 | test_ac005_login_wrong_password_returns_401_generic | Integration | Passed | `backend/tests/integration/test_auth.py` |
| AC-001 | [AC-001] a new email registers, is signed in, and lands on the task list with no verification | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-002 | [AC-002] registering an email that already has an account is rejected with an 'already registered' message | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-003 | [AC-003] an empty password is rejected and the password field is flagged | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-003 | [AC-003] an invalid email format is rejected and the email field is flagged | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-004 | [AC-004] signing in with correct credentials issues a session token and lands on the task list | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-005 | [AC-005] a wrong password is rejected with a generic message that does not reveal the email exists | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-005 | [AC-005] an unknown email is rejected with the same generic message as a wrong password | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |
| AC-006 | [AC-006] the sign-in page offers only email-and-password sign-in with no SSO buttons | E2E | Passed | `frontend/e2e/us001-auth.spec.ts` |

### US-006: Use the app free of charge

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_auth_response_schema_has_no_billing_or_plan_fields | Unit | Passed | `backend/tests/unit/test_us006_free_app.py` |
| — | test_user_model_has_no_billing_or_plan_columns | Unit | Passed | `backend/tests/unit/test_us006_free_app.py` |
| — | test_user_public_schema_has_no_billing_or_plan_fields | Unit | Passed | `backend/tests/unit/test_us006_free_app.py` |
| AC-014 | [AC-014] Tasks screen is free of payment prompts > lets a user add, complete and edit a task with no payment gate | Unit | Passed | `frontend/src/screens/Tasks.free.test.tsx` |
| AC-014 | [AC-014] Tasks screen is free of payment prompts > offers no payment, plan, upgrade or billing call to action | Unit | Passed | `frontend/src/screens/Tasks.free.test.tsx` |
| AC-014 | [AC-014] Tasks screen is free of payment prompts > renders no payment, billing, plan or subscription copy | Unit | Passed | `frontend/src/screens/Tasks.free.test.tsx` |
| AC-014 | test_ac014_likely_payment_endpoints_are_not_routable | Integration | Passed | `backend/tests/integration/test_us006_free_app.py` |
| AC-014 | test_ac014_no_billing_or_plan_routes_are_exposed | Integration | Passed | `backend/tests/integration/test_us006_free_app.py` |
| AC-014 | test_ac014_openapi_document_has_no_billing_or_plan_paths | Integration | Passed | `backend/tests/integration/test_us006_free_app.py` |
| AC-014 | test_ac014_register_requires_no_payment_information | Integration | Passed | `backend/tests/integration/test_us006_free_app.py` |
| AC-014 | test_ac014_register_response_carries_no_billing_or_plan_fields | Integration | Passed | `backend/tests/integration/test_us006_free_app.py` |
| AC-014 | [AC-014] no paywall dialog or paid-plan restriction blocks any task feature | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |
| AC-014 | [AC-014] registering and using every task feature never prompts for payment | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |
| AC-014 | [AC-014] the bootstrap admin uses the app with no payment restriction | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |
| AC-014 | [AC-014] the registration API returns no plan or billing fields and no payment endpoint is routable | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |
| AC-014 | [AC-014] the sign-in page shows no payment, billing or plan prompts | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |
| NFR-007 | [NFR-007] a user can manage tens of tasks with no paywall or restriction | E2E | Passed | `frontend/e2e/us006-free-app.spec.ts` |

### US-007: Add a task with a required title and optional due date

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-015 | test_ac015_create_task_no_due_date_is_active | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| AC-016 | test_ac016_create_task_with_due_date | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| AC-017 | test_ac017_empty_title_rejected | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| AC-017 | test_ac017_whitespace_title_rejected | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_create_task_assigns_to_authenticated_user | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_tasks_list_scoped_to_user | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| AC-015 | Tasks screen > [AC-015] adding a task with a title and no due date calls POST /tasks and shows it active with no due date | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-015 | Tasks screen > [AC-015] loads the task list from GET /tasks on mount and displays real tasks | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-016 | Tasks screen > [AC-016] adding a task with a title and a due date calls POST /tasks and shows that due date | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-017 | Tasks screen > [AC-017] submitting with an empty title shows 'Title is required' and creates no task | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-015 | test_ac015_post_tasks_creates_active_task_no_due_date | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-016 | test_ac016_post_tasks_creates_task_with_due_date | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-017 | test_ac017_post_tasks_empty_title_returns_400 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-017 | test_ac017_post_tasks_missing_title_returns_400 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_get_tasks_invalid_token_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_get_tasks_returns_users_tasks_as_array | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_get_tasks_unauthenticated_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_post_tasks_invalid_token_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_post_tasks_unauthenticated_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_tasks_scoped_to_authenticated_user | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-015 | [AC-015] a non-empty title and no due date creates an active task with no due date | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |
| AC-016 | [AC-016] a non-empty title and a valid due date creates an active task with that due date | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |
| AC-017 | [AC-017] a whitespace-only title is treated as missing and rejected | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |
| AC-017 | [AC-017] submitting without a title does not create a task and reports a title is required | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |
| AC-017 | [AC-017] typing then clearing the title lets the error recover | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |
| NFR-007 | [NFR-007] a user can manage tens of tasks (with and without due dates) with no restriction | E2E | Passed | `frontend/e2e/us007-add-task.spec.ts` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_health_reports_ok | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
