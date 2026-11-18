"""Application entrypoint.

Generated from the approved architecture: one router per component that owns
endpoints, one route per endpoint the API spec declares. Every generated route
is a stub that returns a typed placeholder, so the service starts, serves its
OpenAPI document and passes its tests before a single handler is implemented.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 -- imported so the tables register before create_all
from app.config import ALLOWED_ORIGINS as _configured_origins
from app.database import Base, SessionLocal, engine
from app.seed import seed_bootstrap_users


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create tables from the models on startup and seed bootstrap users.

    Alembic is configured (see ``backend/alembic/``) for managed migrations in
    production. ``create_all`` is kept here so a fresh clone or test still
    starts without a separate migration step; it is idempotent and will not
    alter tables Alembic already created.

    This runs on startup and not at import, so importing the application never
    opens a connection. A test can therefore point ``get_db`` at a database of
    its own, and a deployment whose ``DATABASE_URL`` names a server that is not
    up fails where you can read the error, not while pytest collects the files.
    """
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_bootstrap_users(session)
    yield


app = FastAPI(
    title="Task list app",
    description=(
        "A simple task list app: a signed-in user can add, edit, complete and "
        "delete their own tasks, with a title, optional due date and done flag. "
        "React frontend, FastAPI backend, PostgreSQL. No teams, no sharing, "
        "no notifications."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# The SPA runs on a different origin than the API, so the browser refuses its calls
# unless that origin is allowed here. In development that is the Vite dev server; when
# deployed, the platform injects the frontend's real URL as ALLOWED_ORIGINS (comma
# separated). Point ALLOWED_ORIGINS at the real thing and nothing else has to change.
_dev_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_configured_origins or _dev_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe, and the only route here that is not a stub."""
    return {"status": "ok"}
