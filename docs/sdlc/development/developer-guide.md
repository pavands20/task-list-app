# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `208a997` · model `claude-sonnet-5`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
A simple task list application with a React 19 + Vite frontend SPA and a FastAPI 0.115 backend backed by PostgreSQL 16 (SQLite for local dev/tests). Users can register, sign in, reset passwords, and create, edit, complete, and delete their own tasks. The backend exposes auth and task CRUD endpoints with opaque session tokens; the frontend uses a typed API client with localStorage-based session management. Schema migrations are handled via Alembic, and the app is containerized and deployed via GitHub Actions to AWS (ECR + Amplify).
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js 20+
- Python 3.12+
- PostgreSQL 16 (optional for local dev; SQLite is used by default)
- Docker and Docker Compose (optional, for running PostgreSQL locally)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. git clone the repository and cd into the project root
2. cd frontend && npm install
3. cd ../backend && pip install -r requirements.txt
4. Copy .env.example to .env and fill in required values (e.g. <your-api-key>, <database-password>)
5. Optional: docker compose up -d to start a local PostgreSQL instance
6. cd backend && uvicorn app.main:app --reload to start the API on port 8000
7. cd frontend && npm run dev to start the Vite dev server on port 5173
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| Backend dev server | `cd backend && uvicorn app.main:app --reload` | Starts the FastAPI backend with auto-reload on port 8000 |
| Frontend dev server | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA on port 5173 |
| Frontend build | `cd frontend && npm run build` | Bundles the frontend for production (does not typecheck) |
| Frontend preview | `cd frontend && npm run preview` | Serves the production build locally |
| Frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit for full type checking |
| Docker Compose (PostgreSQL) | `docker compose up -d` | Starts a local PostgreSQL 16 container on port 5432 |
| Backend Docker build | `cd backend && docker build -t task-list-api .` | Builds the backend Docker image |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `frontend/` | React 19 + Vite SPA: screens, API client, brand tokens, UI components, unit and e2e tests |
| `frontend/src/screens/` | One module per approved screen (SignIn, Register, Tasks, Account, ForgotPassword, ResetPassword) |
| `frontend/src/lib/` | Shared library code: API client (api.ts), brand tokens, icons, UI vocabulary, navigation helpers |
| `frontend/e2e/` | Playwright acceptance tests, one spec per user story |
| `backend/` | FastAPI service: app code, routers, models, schemas, Alembic migrations, tests, Dockerfile |
| `backend/app/` | Application package: main entrypoint, config, database, models, schemas, auth, security, seed, migrations |
| `backend/app/routers/` | API route modules: auth.py (register, login, logout, password reset, account deletion) and tasks.py (task CRUD) |
| `backend/alembic/` | Alembic schema migration configuration and version scripts |
| `backend/tests/` | Pytest unit and integration tests for auth, tasks, health, password reset, and free app scenarios |
| `.github/workflows/` | CI/CD workflows: deploy.yml (AWS ECR + Amplify deploy) and sonar-scan.yml (SonarQube scan) |
| `.devcontainer/` | Dev container configuration for VS Code / Codespaces |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend uses FastAPI with one router per component (auth, tasks), each endpoint declared with explicit status codes and response models
- Database access via SQLAlchemy 2.0 declarative models; all schema changes go through Alembic migrations, not create_all
- SQLite is the default local DATABASE_URL for zero-setup development; PostgreSQL 16 is used in deployed environments
- Session tokens are opaque (stored as hashes), sent as Bearer tokens in the Authorization header
- Passwords are hashed with bcrypt via passlib; plaintext passwords are never stored
- Tasks are always scoped to the authenticated user; cross-user access returns 404 (not 403) to avoid leaking existence
- Email column uses CITEXT on PostgreSQL for case-insensitive uniqueness, falling back to String on SQLite
- Foreign keys use ON DELETE CASCADE so deleting a user atomically removes sessions, reset tokens, and tasks
- Frontend uses React 19 with react-router-dom v7; screens live in src/screens/, one module per screen
- Frontend API client (apiFetch) sends the session token as Bearer; falls back to a shared API secret key
- Frontend uses Tailwind CSS v4 with CSS variable-based brand tokens; no inline color literals
- Pydantic schemas use empty-string defaults for required fields to surface 400 field-level errors instead of 422 validation errors
- PATCH endpoints use model_dump(exclude_unset=True) to distinguish omitted fields from explicit nulls
- Backend linting uses ruff; frontend linting uses ESLint with Prettier integration
- Backend tests are split into unit/ and integration/ directories under backend/tests/
- Frontend component tests live beside components using Vitest + jsdom; e2e tests use Playwright with chromium only
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| Backend tests | `cd backend && pytest` | Runs all unit and integration tests via pytest with the config in pytest.ini |
| Backend lint | `cd backend && ruff check .` | Runs ruff linter over the backend codebase |
| Backend format check | `cd backend && ruff format .` | Auto-formats backend Python code with ruff |
| Frontend unit tests | `cd frontend && npm run test` | Runs Vitest component tests scoped to src/ |
| Frontend lint | `cd frontend && npm run lint` | Runs ESLint over the whole frontend |
| Frontend lint fix | `cd frontend && npm run lint:fix` | Runs ESLint with auto-fix enabled |
| Frontend format | `cd frontend && npm run format` | Runs Prettier to format the frontend codebase |
| Frontend e2e tests | `cd frontend && npm run test:e2e` | Runs Playwright acceptance tests; boots backend and frontend locally if E2E_BASE_URL is not set |
| Install Playwright browser | `cd frontend && npm run test:e2e:install` | Downloads Chromium for Playwright e2e tests |
| Frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit for full TypeScript type checking |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend ImportError when running pytest from the backend directory | pytest.ini sets pythonpath=. so always run pytest from the backend/ directory, not from the project root |
| Frontend calls go to localhost:8000 instead of the deployed API | VITE_API_BASE_URL is baked at build time; set it as an env var before npm run build or npm run dev, or rely on the fallback to http://localhost:8000 |
| CORS errors when the frontend calls the backend | ALLOWED_ORIGINS in the backend config must include the frontend's origin; in dev, localhost:5173 and 127.0.0.1:5173 are allowed by default |
| Playwright e2e tests fail to start Chromium in Docker | The config already passes --disable-dev-shm-usage; ensure the container has enough /tmp space and that npm run test:e2e:install has been run first |
| Backend uses SQLite instead of PostgreSQL locally | Set DATABASE_URL environment variable to a PostgreSQL connection string (e.g. postgresql://app:<database-password>@localhost:5432/app) and start PostgreSQL via docker compose up -d |
| npm run build succeeds but npm run typecheck fails | The build command does not typecheck by design; run npm run typecheck separately and fix type errors before maintaining the codebase |
| Password reset emails not being sent | SendGrid is skipped when SENDGRID_API_KEY is empty; set it in the environment to enable email delivery |
| 401 on authenticated requests after password reset | Password reset confirmation revokes all existing sessions for the user; the user must sign in again to get a new session token |
<!-- sdlc:auto:end troubleshooting -->
