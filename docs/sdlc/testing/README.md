# Testing

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start narrative -->
### TEST-runchecks · approved · source: testing:run_checks

Automated check run succeeded with all 8 checks passing.

run_checks (ticket=None): status=succeeded. Detail: 8/8 checks passed.

### TEST-6747cc41-c92d-41db-a6cf-25f3339b43d6 · approved · source: testing:write_tests

Added tests for US-014 (default sort by due date then creation time) across all three layers: backend integration, frontend unit, and Playwright end-to-end.

write_tests (ticket=6747cc41-c92d-41db-a6cf-25f3339b43d6): status=succeeded.

- Backend integration tests in test_tasks.py cover:
  - AC-029: due-date ascending, due date precedence over creation time.
  - AC-030: same-due-date tiebreak by creation time, no-due-date tiebreak by creation time, no-due-date tasks last, and a full mixed sort.
  - Tests are driven through GET /tasks with deterministic created_at stamping.
- Frontend Vitest tests in Tasks.test.tsx cover the client-side re-sort for AC-029/AC-030 by reading displayed order via the toggle buttons' aria-labels.
- A new Playwright spec (us014-d...) was added for end-to-end coverage.

**Related:** US-014

### TEST-7544ed10-694b-4136-876d-277f52ae556a · approved · source: testing:write_tests

Additional test files were written; 2 test files were added.

write_tests (ticket=7544ed10-694b-4136-876d-277f52ae556a): status=succeeded. Detail: 2 test file(s) added. No further detail on specific acceptance criteria or layers covered was provided in the input.
<!-- sdlc:auto:end narrative -->
