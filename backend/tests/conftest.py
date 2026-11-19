"""Test fixtures: one fresh database per test, never the application's own.

Each test gets an in-memory SQLite database of its own. ``StaticPool`` keeps
every session on the one connection that memory lives in, and the ``get_db``
override makes the application use it instead of the engine ``app.database``
built at import.

When ``DATABASE_URL`` names a PostgreSQL server (the sandbox, production) the
same fixture uses a real PostgreSQL connection with a transaction that rolls
back on teardown, so tests exercise the same database the app runs against.
The models use database-agnostic types (see ``app.models``) that resolve to
``CITEXT`` and native ``uuid`` on PostgreSQL and plain ``String``/hex on
SQLite, so both paths create the same schema.
"""

import os
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401 -- imported so the tables register before create_all
from app.database import Base, get_db
from app.main import app

_DATABASE_URL = os.getenv("DATABASE_URL", "")
_IS_POSTGRES = _DATABASE_URL.startswith("postgresql")


@pytest.fixture
def db_session() -> Iterator[Session]:
    """An empty database, built and thrown away around one test."""
    if _IS_POSTGRES:
        engine = create_engine(_DATABASE_URL, pool_pre_ping=True, future=True)
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS citext"))
            conn.commit()
        Base.metadata.create_all(bind=engine)

        connection = engine.connect()
        transaction = connection.begin()
        session = Session(bind=connection, join_transaction_mode="create_savepoint")
        try:
            yield session
        finally:
            session.close()
            transaction.rollback()
            connection.close()
            # Drop the tables this fixture created so the shared sandbox
            # database is left clean. Without this, ``create_all`` persists the
            # schema (but no ``alembic_version`` row), and a later ``alembic
            # upgrade head`` -- e.g. the E2E boot -- fails with DuplicateTable.
            Base.metadata.drop_all(bind=engine)
            engine.dispose()
    else:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            future=True,
        )
        Base.metadata.create_all(bind=engine)
        session = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)()
        try:
            yield session
        finally:
            session.close()
            engine.dispose()


@pytest.fixture
def client(db_session: Session) -> Iterator[TestClient]:
    """The application, talking to this test's database and nothing else."""

    def _get_db() -> Iterator[Session]:
        yield db_session

    app.dependency_overrides[get_db] = _get_db
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()
