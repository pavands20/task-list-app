# Tests

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start summary -->
156 tests · Passed 156 · Failed 0 · Skipped 0 · Not run 0

Acceptance criteria covered: 19/31 · passing: 19/31
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
| — | test_create_session_then_revoke_session_makes_token_hash_unresolvable | Unit | Passed | `backend/tests/unit/test_auth.py` |
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
| AC-008 | test_ac008_expired_session_token_on_tasks_returns_401 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| — | test_logout_with_invalid_or_expired_token_returns_401 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| — | test_logout_with_valid_token_returns_204_and_invalidates_session | Integration | Passed | `backend/tests/integration/test_auth.py` |
| — | test_logout_without_authorization_header_returns_401 | Integration | Passed | `backend/tests/integration/test_auth.py` |
| — | test_register_logout_then_get_tasks_returns_401 | Integration | Passed | `backend/tests/integration/test_auth.py` |
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

## Sprint 2

### US-003: Sign out and session expiry

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-007 | Account screen > [AC-007] Sign Out calls POST /auth/logout, shows a loading state, clears the token and navigates to /sign-in | Unit | Passed | `frontend/src/screens/Account.test.tsx` |
| AC-008 | Global 401 handling > [AC-008] a 401 from an API call clears the session token and redirects to /sign-in | Unit | Passed | `frontend/src/screens/SessionExpired.test.tsx` |
| — | [US-003] a signed-in user clicks Sign Out and is redirected to /sign-in; /tasks then redirects to /sign-in | E2E | Passed | `frontend/e2e/us003-signout.spec.ts` |
| — | [US-003] a user whose token is replaced with an invalid value is redirected to /sign-in when viewing tasks | E2E | Passed | `frontend/e2e/us003-signout.spec.ts` |

### US-004: Reset a forgotten password by email

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-009 | ForgotPassword screen > [AC-009] shows a validation error for an empty email and does not call the API | Unit | Passed | `frontend/src/screens/ForgotPassword.test.tsx` |
| AC-009 | ForgotPassword screen > [AC-009] shows a validation error for an invalid email and does not call the API | Unit | Passed | `frontend/src/screens/ForgotPassword.test.tsx` |
| AC-009 | ForgotPassword screen > [AC-009] submits the email to POST /auth/password-reset/request and shows the neutral confirmation from the response | Unit | Passed | `frontend/src/screens/ForgotPassword.test.tsx` |
| AC-011 | ResetPassword screen > [AC-011] reads the token from the URL, submits to the API, and redirects to /sign-in on success | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-011 | ResetPassword screen > [AC-011] shows a validation error for mismatched passwords and does not call the API | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-011 | ResetPassword screen > [AC-011] shows an error message when the API returns 400 for an invalid/expired token | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-011 | ResetPassword screen > [AC-011] shows validation errors for empty passwords and does not call the API | Unit | Passed | `frontend/src/screens/ResetPassword.test.tsx` |
| AC-009, NFR-004 | [AC-009/NFR-004] navigating to /forgot-password and entering an email shows the neutral confirmation message | E2E | Passed | `frontend/e2e/us004-password-reset.spec.ts` |
| AC-011 | [AC-011] after reset, the user can sign in with the new password | E2E | Passed | `frontend/e2e/us004-password-reset.spec.ts` |
| AC-011 | [AC-011] navigating to /reset-password with a valid token shows success and redirects to /sign-in | E2E | Passed | `frontend/e2e/us004-password-reset.spec.ts` |

### US-009: Mark a task done or not done

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| — | test_delete_task_other_user_returns_404 | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_delete_task_removes_task | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_patch_task_empty_title_rejected | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_patch_task_other_user_returns_404 | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_patch_task_unknown_id_returns_404 | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_patch_task_updates_is_done_correctly | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| — | test_patch_task_updates_title_and_due_date | Unit | Passed | `backend/tests/unit/test_tasks.py` |
| AC-020 | Tasks screen > [AC-020] clicking the done toggle on an active task calls PATCH /tasks/{id} with is_done=true and the task appears completed | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-021 | Tasks screen > [AC-021] clicking the done toggle on a completed task calls PATCH /tasks/{id} with is_done=false and the task appears active again | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-023 | Tasks screen > [AC-023] loads only the authenticated user's tasks from GET /tasks on mount | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| NFR-007 | Tasks screen > [NFR-007] a user can manage tens of tasks with no paywall or restriction | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| — | Tasks screen > [handleDelete] calls DELETE /tasks/{id} and removes the task from the list | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| — | Tasks screen > [handleDelete] shows an error message when DELETE fails | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| — | Tasks screen > [handleSave] calls PATCH /tasks/{id} with the updated title and due_date and updates the task from the response | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| — | Tasks screen > [handleSave] shows an error message when the API returns 400 for an empty title | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| — | Tasks screen > [toggleDone] shows an error message when PATCH fails | Unit | Passed | `frontend/src/screens/Tasks.test.tsx` |
| AC-020 | test_ac020_patch_tasks_sets_is_done_true | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-021 | test_ac021_patch_tasks_sets_is_done_false | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-023 | test_ac023_get_tasks_returns_only_authenticated_users_tasks | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-024 | test_ac024_delete_other_users_task_returns_404 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| AC-024 | test_ac024_patch_other_users_task_returns_404 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_delete_tasks_returns_204_and_removes_task | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_delete_tasks_unknown_id_returns_404 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_delete_tasks_without_auth_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_clears_due_date | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_empty_title_returns_400 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_invalid_token_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_partial_update_omits_fields | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_unknown_id_returns_404 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_updates_title_and_due_date | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | test_patch_tasks_without_auth_returns_401 | Integration | Passed | `backend/tests/integration/test_tasks.py` |
| — | PATCH and DELETE without auth return 401 | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| AC-020, AC-021 | [AC-020/AC-021] the done state persists after a page reload | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| AC-020 | [AC-020] marking a task done shows strikethrough and a Done badge | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| AC-021 | [AC-021] marking a done task not done makes it active again | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| AC-023 | [AC-023] GET /tasks returns only the authenticated user's tasks | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| AC-024 | [AC-024] PATCH and DELETE on another user's task return 404 | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| — | user deletes a task and it no longer appears in the list | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |
| — | user edits a task's title and due date via the edit modal and changes persist after reload | E2E | Passed | `frontend/e2e/us009-toggle-edit-delete.spec.ts` |

## Project setup

| Criteria | Test | Level | Result | File |
|---|---|---|---|---|
| AC-009 | test_ac009_send_reset_email_sends_link_when_api_key_set | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| AC-009 | test_ac009_send_reset_email_skips_when_no_api_key | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| AC-009 | test_ac009_token_generation_creates_row_with_hashed_token_and_future_expiry | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| NFR-003 | test_nfr003_find_valid_token_accepts_fresh_unused_token | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| NFR-003 | test_nfr003_find_valid_token_rejects_expired_token | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| NFR-003 | test_nfr003_find_valid_token_rejects_unknown_token | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| NFR-003 | test_nfr003_find_valid_token_rejects_used_token | Unit | Passed | `backend/tests/unit/test_password_reset.py` |
| — | test_health_reports_ok | Integration | Passed | `backend/tests/integration/test_health.py` |
| — | test_the_openapi_document_builds | Integration | Passed | `backend/tests/integration/test_health.py` |
| AC-009 | test_ac009_request_registered_email_creates_token_row | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| AC-010 | test_ac010_request_unregistered_email_returns_same_neutral_200 | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| AC-011 | test_ac011_confirm_valid_token_resets_password | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | test_confirm_already_used_token_returns_400 | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | test_confirm_empty_password_returns_400_field_detail | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | test_confirm_expired_token_returns_400 | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | test_confirm_invalid_token_returns_400 | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | test_full_reset_flow | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| NFR-002 | test_nfr002_sessions_revoked_on_reset | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| NFR-004 | test_nfr004_request_returns_same_message_for_registered_and_unregistered | Integration | Passed | `backend/tests/integration/test_password_reset.py` |
| — | the app loads | E2E | Passed | `frontend/e2e/example.spec.ts` |
<!-- sdlc:auto:end tests -->
