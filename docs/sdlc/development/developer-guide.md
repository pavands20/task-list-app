# Developer Guide

> Maintained by QuorQ AI SDLC. Text between `sdlc:auto` markers is regenerated; anything outside them is yours and is kept.

<!-- sdlc:auto:start status -->
_Up to date._
<!-- sdlc:auto:end status -->

<!-- sdlc:auto:start source -->
Generated from commit `74e671d` · model `claude-sonnet-5`
<!-- sdlc:auto:end source -->

<!-- sdlc:auto:start overview -->
A simple task list application where signed-in users can add, edit, complete, and delete their own tasks (title, optional due date, done flag). Built as a monorepo with a React 19 + Vite SPA frontend and a FastAPI 0.115 backend backed by PostgreSQL 16 (SQLite by default for local development). Authentication uses opaque bearer session tokens with bcrypt password hashing. Schema changes go through Alembic migrations applied on startup. The frontend currently renders seeded sample data and includes a generated API client seam for wiring real endpoints. Deployment is handled via a GitHub Actions workflow that pushes a backend Docker image to AWS ECR and deploys the frontend to AWS Amplify.
<!-- sdlc:auto:end overview -->

<!-- sdlc:auto:start prerequisites -->
- Node.js 20+
- Python 3.12+
- pip
- PostgreSQL 16 (optional for local dev; SQLite is used by default)
<!-- sdlc:auto:end prerequisites -->

<!-- sdlc:auto:start setup -->
1. Clone the repository
2. cd frontend && npm install
3. cd ../backend && python -m venv .venv && source .venv/bin/activate
4. pip install -r requirements.txt
5. cp .env.example .env and fill in any required values
6. uvicorn app.main:app --reload  (from the backend/ directory)
7. In a new terminal, cd frontend && npm run dev
<!-- sdlc:auto:end setup -->

<!-- sdlc:auto:start run -->
| Name | Command | Description |
|---|---|---|
| frontend dev | `cd frontend && npm run dev` | Starts the Vite dev server for the React SPA |
| frontend build | `cd frontend && npm run build` | Bundles the frontend for production (does not typecheck) |
| frontend preview | `cd frontend && npm run preview` | Serves the production build locally |
| frontend typecheck | `cd frontend && npm run typecheck` | Runs tsc --noEmit for type checking |
| frontend lint | `cd frontend && npm run lint` | Runs ESLint over the whole frontend |
| frontend lint:fix | `cd frontend && npm run lint:fix` | Runs ESLint and applies auto-fixes |
| frontend format | `cd frontend && npm run format` | Formats the frontend with Prettier |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests |
| frontend e2e tests | `cd frontend && npm run test:e2e` | Runs Playwright acceptance tests (install browser first with npm run test:e2e:install) |
| backend dev | `cd backend && uvicorn app.main:app --reload` | Starts the FastAPI backend with hot reload |
| backend tests | `cd backend && pytest` | Runs the backend pytest suite |
| backend lint | `cd backend && ruff check .` | Lints the backend with Ruff |
| backend format | `cd backend && ruff format .` | Formats the backend with Ruff |
| docker compose up | `docker compose up` | Starts a local PostgreSQL 16 container (user/db: app/app) |
<!-- sdlc:auto:end run -->

<!-- sdlc:auto:start structure -->
| Path | Purpose |
|---|---|
| `backend/` | FastAPI service: app code, routers, models, schemas, Alembic migrations, Dockerfile, tests |
| `backend/app/` | Application package: main.py entrypoint, config, database, models, schemas, auth, security, seed, migrations |
| `backend/app/routers/` | API route modules: auth.py (register/login) and tasks.py (create/list tasks) |
| `backend/alembic/` | Alembic schema migration configuration and versions |
| `backend/tests/` | Pytest tests split into unit/ and integration/ |
| `frontend/` | Vite + React 19 SPA: screens, API client, UI components, e2e tests |
| `frontend/src/` | Source code: screens/, lib/ (api, ui, icons, brand, navigate), App.tsx router, main.tsx entry |
| `frontend/src/screens/` | One module per approved screen: Tasks, SignIn, Register, ForgotPassword, ResetPassword, Account |
| `frontend/src/lib/` | Shared utilities: api.ts (fetch wrapper + session token), ui.tsx, icons.tsx, brand.ts, navigate.ts |
| `frontend/e2e/` | Playwright acceptance test specs |
| `.github/workflows/` | CI/CD: deploy.yml builds and deploys backend image and frontend bundle on push to main |
| `.devcontainer/` | Dev container configuration |
<!-- sdlc:auto:end structure -->

<!-- sdlc:auto:start conventions -->
- Backend: one router per component owning endpoints (auth, tasks), registered in main.py
- Backend: SQLAlchemy declarative models inheriting from a shared Base; UUID primary keys; cascade deletes on user-owned entities
- Backend: Pydantic schemas pair request/response models per entity; field defaults surface missing fields as 400 rather than 422
- Backend: password hashing via bcrypt/passlib; session tokens stored as hashes, returned as opaque bearer tokens
- Backend: schema changes go through Alembic migrations applied at startup via run_migrations(), not create_all()
- Backend: SQLite by default for zero-config local dev; DATABASE_URL switches to PostgreSQL in deployed environments
- Backend: CIText type decorator for case-insensitive email on PostgreSQL, plain String fallback on SQLite
- Frontend: one module per screen in src/screens/; App.tsx holds the route table and navigation shell
- Frontend: apiFetch wrapper sends Bearer token (session or shared secret) on every request; session token persisted in localStorage
- Frontend: protected routes wrapped in RequireAuth which redirects to /sign-in when no session token is present
- Frontend: component tests live beside components (src/**); e2e specs in e2e/ using Playwright
- Frontend: @ path alias maps to ./src via tsconfig and vite resolve.alias
<!-- sdlc:auto:end conventions -->

<!-- sdlc:auto:start testing -->
| Name | Command | Description |
|---|---|---|
| backend unit & integration | `cd backend && pytest` | Runs all backend tests under tests/ (unit and integration) |
| frontend unit tests | `cd frontend && npm test` | Runs Vitest component tests in src/ |
| frontend e2e tests | `cd frontend && npm run test:e2e` | Runs Playwright acceptance tests; boots backend and preview server automatically unless E2E_BASE_URL is set |
<!-- sdlc:auto:end testing -->

<!-- sdlc:auto:start troubleshooting -->
| Problem | Solution |
|---|---|
| Backend import errors when running pytest from backend/ | pytest.ini sets pythonpath = . so run pytest from the backend/ directory, not a subdirectory |
| CORS errors when frontend calls backend in development | ALLOWED_ORIGINS defaults to localhost:5173; ensure the Vite dev server is running on that port or set ALLOWED_ORIGINS in your environment |
| Playwright e2e tests fail because browser is not installed | Run npm run test:e2e:install first to fetch the Chromium browser |
| Backend cannot connect to PostgreSQL | Set DATABASE_URL to a valid PostgreSQL connection string, or run docker compose up to start a local PostgreSQL instance on port 5432 |
| vite build succeeds but deployed app calls localhost | VITE_API_BASE_URL must be set at build time; it is baked into the bundle and cannot be changed at runtime |
<!-- sdlc:auto:end troubleshooting -->
