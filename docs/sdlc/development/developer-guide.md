# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `22af993` · model `claude-sonnet-5`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
Task list app is a generated two-part repository from the Quorq AI SDLC platform: a React 19 + Vite single-page frontend with approved, fully built screens currently running on seeded sample data, and a FastAPI 0.115 backend that is still a bare scaffold (only a /health endpoint exists; no data model, routers, or business logic have been generated yet). The backend uses SQLAlchemy with a SQLite file by default (or Postgres via DATABASE_URL), and a docker-compose.yml provides a Postgres 16 service for local use. The frontend talks to the backend only through the apiFetch helper in src/lib/api.ts, which is prepared for bearer-token auth but not yet wired into any screen.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js (for npm/Vite/React 19, per frontend/package.json)
- npm
- Python 3.12 (per backend/Dockerfile)
- pip
- Docker and Docker Compose (optional, for the Postgres service in docker-compose.yml)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Clone the repository.
2. (Optional) Start the Postgres database: docker compose up -d db
3. Backend: cd backend
4. Install backend dependencies: pip install -r requirements.txt
5. Set DATABASE_URL to point at Postgres if using docker-compose's db service; otherwise the backend defaults to a local SQLite file (sqlite:///./app.db)
6. Run the backend: uvicorn app.main:app --reload
7. In a new terminal, frontend: cd frontend
8. Install frontend dependencies: npm install
9. Run the frontend: npm run dev
10. Open the app at the URL Vite prints (defaults to http://localhost:5173); the backend should be reachable at http://localhost:8000
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `npm run dev` | Starts the Vite dev server for the React SPA. |
| frontend build | `npm run build` | Bundles the frontend for deployment (does not typecheck). |
| frontend preview | `npm run preview` | Serves the production build locally. |
| backend dev | `uvicorn app.main:app --reload` | Runs the FastAPI app with auto-reload from backend/, creating SQLite/Postgres tables on startup. |
| db up | `docker compose up -d db` | Starts the Postgres 16 service defined in docker-compose.yml. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `.devcontainer` | Dev container configuration for a consistent development environment. |
| `.quorq` | Platform metadata (handoff.json) used by the Quorq AI SDLC platform. |
| `backend` | FastAPI service: app package, tests, Dockerfile, and Python dependency/lint config. |
| `backend/app` | Application code: main.py entrypoint, database.py (engine/session), models.py (SQLAlchemy models, empty scaffold), schemas.py (Pydantic schemas, stub response), routers/ (empty, one router per future architecture component). |
| `backend/tests` | Pytest suite: tests/integration (e.g. health check test) and tests/unit (empty scaffold), plus conftest.py fixtures. |
| `frontend` | React 19 + Vite SPA: approved screens, shared lib (API client, UI/icon vocabulary), e2e tests, and build/lint/test config. |
| `frontend/src` | Application source: entry point (main.tsx), styles (index.css), and lib/ (api.ts client, icons.tsx, navigate.ts, ui.tsx). |
| `frontend/e2e` | Playwright acceptance tests and support helpers (e.g. admin.ts), run against a locally booted app or a deployed URL via E2E_BASE_URL. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend routes are generated as typed stubs (StubResponse) until implemented, one router per architecture component owning endpoints (backend/app/routers).
- SQLAlchemy models all inherit from the shared Base in app/database.py; app/main.py imports app.models before calling Base.metadata.create_all so tables register.
- Database access is per-request via the get_db() generator dependency, which opens one Session and always closes it.
- DATABASE_URL and ALLOWED_ORIGINS are read from the environment with safe local defaults (SQLite file; localhost:5173 dev origins) so the backend runs without external services configured.
- Frontend API calls go through the single apiFetch helper in src/lib/api.ts, which attaches a bearer token (session token if present, else the baked-in API secret) and normalizes base-URL/path joining.
- Frontend screens currently render seeded sample data and are not yet wired to backend endpoints; wiring a screen to a real endpoint is a deliberate future step, not an oversight.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| frontend unit | `npm test` | Runs Vitest component tests under src/ with jsdom. |
| frontend typecheck | `npm run typecheck` | Runs tsc --noEmit (not run by build, but worth keeping green). |
| frontend lint | `npm run lint` | Runs ESLint over the whole frontend app. |
| frontend format check | `npm run format:check` | Checks formatting with Prettier. |
| frontend e2e install | `npm run test:e2e:install` | Installs the Chromium browser Playwright needs. |
| frontend e2e | `npm run test:e2e` | Runs Playwright acceptance tests from e2e/; boots the backend and a built/preview frontend locally unless E2E_BASE_URL is set. |
| backend tests | `pytest` | Runs the pytest suite (tests/integration, tests/unit) from the backend/ directory. |
| backend lint | `ruff check .` | Lints the backend Python code. |
| backend format | `ruff format .` | Formats the backend Python code. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Frontend cannot reach the backend / CORS errors in the browser. | Ensure the backend is running and, if the frontend is served from an origin other than http://localhost:5173 or http://127.0.0.1:5173, set the backend's ALLOWED_ORIGINS environment variable to that origin. |
| Backend tests fail with ImportError on 'app' when running pytest directly. | Run pytest from the backend/ directory so pytest.ini's pythonpath = . is applied, or ensure the command is run with backend/ as the working directory. |
| Data disappears between backend runs. | By default DATABASE_URL is unset and the backend uses a local SQLite file (sqlite:///./app.db); for persistent/shared data, start the Postgres service (docker compose up -d db) and set DATABASE_URL accordingly. |
| Playwright e2e tests fail to start or time out. | Run npm run test:e2e:install first to fetch the Chromium browser; without E2E_BASE_URL set, Playwright needs both a runnable backend (uvicorn) and a successful frontend build, which can take minutes on a cold run. |
| Screens show data that never changes no matter what the backend does. | This is expected: the generated screens render seeded sample data via src/lib/api.ts's apiFetch is only a prepared seam, not yet called from any screen. |
<!-- sdlc:auto:end troubleshooting -->
