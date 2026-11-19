# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `9aefefc` · model `claude-sonnet-5`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
A task list application with a FastAPI backend (Python 3.12, SQLAlchemy, PostgreSQL/SQLite) and a Vite + React 19 frontend SPA. Authenticated users can add, edit, complete, and delete their own tasks with a title, optional due date, and done flag. The backend exposes auth endpoints (register, login, logout, password reset) and CRUD task endpoints, while the frontend provides screens for sign-in, registration, password reset, account, and task management. The two run as separate services orchestrated via docker-compose for the database and deployed through a GitHub Actions workflow to AWS (ECR + Amplify).
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js 20+
- Python 3.12+
- PostgreSQL 16 (or use the default SQLite for local dev)
- Docker and Docker Compose (optional, for PostgreSQL)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Clone the repository and cd into the project root.
2. Copy .env.example to .env and fill in any required placeholders such as <database-url> and <sendgrid-api-key>.
3. Backend: cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt
4. Optional PostgreSQL: docker compose up -d db to start a local PostgreSQL 16 container.
5. Backend dev: cd backend && uvicorn app.main:app --reload (defaults to SQLite if DATABASE_URL is unset)
6. Frontend: cd frontend && npm install
7. Frontend dev: cd frontend && npm run dev
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| Backend dev server | `cd backend && uvicorn app.main:app --reload` | Starts the FastAPI backend on http://localhost:8000 with hot reload. |
| Frontend dev server | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA on http://localhost:5173. |
| Frontend build | `cd frontend && npm run build` | Bundles the frontend for production (does not typecheck). |
| Frontend preview | `cd frontend && npm run preview` | Serves the built frontend locally. |
| Docker Compose DB | `docker compose up -d db` | Starts a local PostgreSQL 16 container on port 5432. |
| Backend Docker build | `cd backend && docker build -t tasklist-api .` | Builds the backend Docker image using the provided Dockerfile. |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `frontend/` | Vite + React 19 SPA: screens (sign-in, register, tasks, account, password reset), shared UI/icon/brand libraries, API client, and Playwright e2e tests. |
| `frontend/src/` | Application source: App.tsx route shell, screens/ for page modules, lib/ for api client and UI vocabulary. |
| `frontend/e2e/` | Playwright acceptance test specs covering auth, sign-out, password reset, and task flows. |
| `backend/` | FastAPI service: app package with routers, models, schemas, auth, config, database, migrations, seed; Alembic migrations; tests; Dockerfile; requirements.txt. |
| `backend/app/` | Core application: main.py entrypoint, routers/ for auth and tasks, models.py, schemas.py, database.py, auth.py, security.py, config.py, seed.py. |
| `backend/app/routers/` | API route modules: auth.py (register, login, logout, password reset) and tasks.py (CRUD for tasks). |
| `backend/alembic/` | Alembic schema migration scripts and configuration. |
| `backend/tests/` | Pytest test suite split into unit/ and integration/ tests for auth, tasks, password reset, and health. |
| `.github/workflows/` | CI/CD: deploy.yml builds and pushes the backend image to ECR, builds the frontend, and deploys to AWS Amplify on push to main. |
| `.devcontainer/` | Dev container configuration for VS Code Remote Containers. |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one router per architecture component (auth, tasks), each prefixed and tagged.
- Backend: SQLAlchemy models inherit a shared DeclarativeBase; UUIDs as primary keys; CITEXT for case-insensitive email on PostgreSQL, fallback String on SQLite.
- Backend: Pydantic schemas with field defaults to empty string so missing fields yield 400 not 422; TaskUpdate uses exclude_unset for PATCH semantics.
- Backend: session tokens stored as hashes, never plaintext; bcrypt for password hashing via passlib.
- Backend: cross-user task access returns 404 (not 403) to avoid leaking existence.
- Backend: schema changes go through Alembic migrations, not create_all; migrations and seeding run on app startup via lifespan.
- Frontend: one module per screen in src/screens/; route table and nav shell in App.tsx.
- Frontend: API client in src/lib/api.ts uses Bearer token from localStorage; 401 with a session token clears it and redirects to /sign-in.
- Frontend: VITE_API_BASE_URL and VITE_API_SECRET_KEY are baked at build time; fallback to http://localhost:8000.
- Frontend: component tests in src/ scoped to *.test.tsx; Playwright e2e specs in e2e/.
- Frontend: Tailwind CSS v4 via @tailwindcss/vite; brand tokens in lib/brand.ts and CSS variables in index.css.
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| Backend unit & integration tests | `cd backend && pytest` | Runs the pytest suite (unit/ and integration/) configured via pytest.ini with pythonpath=. |
| Backend lint | `cd backend && ruff check .` | Lints the backend code with ruff. |
| Backend format check | `cd backend && ruff format .` | Formats backend code with ruff. |
| Frontend unit tests | `cd frontend && npm run test` | Runs Vitest component tests in src/. |
| Frontend lint | `cd frontend && npm run lint` | Runs ESLint over the frontend project. |
| Frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit for type checking. |
| Frontend format | `cd frontend && npm run format` | Formats the frontend with Prettier. |
| Frontend e2e tests | `cd frontend && npm run test:e2e` | Runs Playwright acceptance tests; boots backend and frontend automatically unless E2E_BASE_URL is set. |
| Install Playwright browser | `cd frontend && npm run test:e2e:install` | Installs the Chromium browser for Playwright e2e tests. |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend fails to connect to database on first run | If DATABASE_URL is unset, the backend defaults to a local SQLite file. To use PostgreSQL, set DATABASE_URL to a valid connection string and run docker compose up -d db to start the local Postgres container. |
| CORS errors when frontend calls backend in dev | The backend allows http://localhost:5173 and http://127.0.0.1:5173 by default. If you use a different dev port, set ALLOWED_ORIGINS in the backend environment to include your frontend origin. |
| Playwright e2e tests fail with missing browser | Run npm run test:e2e:install to install the Chromium browser before running npm run test:e2e. |
| pytest cannot import app modules | Run pytest from the backend/ directory; pytest.ini sets pythonpath=. so imports resolve correctly. |
| Password reset emails not sent in local dev | send_reset_email is skipped when SENDGRID_API_KEY is empty. Set SENDGRID_API_KEY to a valid key to enable email sending. |
<!-- sdlc:auto:end troubleshooting -->
