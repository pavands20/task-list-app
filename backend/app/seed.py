"""Idempotent startup seeding of the bootstrap admin and smoke-test user.

The platform always sets ``BOOTSTRAP_ADMIN_EMAIL`` and
``BOOTSTRAP_ADMIN_PASSWORD`` on the deployed API, and
``SMOKE_TEST_EMAIL`` and ``SMOKE_TEST_PASSWORD`` when a smoke-test user is
wanted. Without them set (local runs, tests), nothing is seeded.

Seeding is idempotent: a user is created only when no user with that email
exists already, so a restart never duplicates or overwrites one.
"""

from sqlalchemy.orm import Session

from app.config import (
    BOOTSTRAP_ADMIN_EMAIL,
    BOOTSTRAP_ADMIN_PASSWORD,
    SMOKE_TEST_EMAIL,
    SMOKE_TEST_PASSWORD,
)
from app.models import User
from app.security import hash_password


def _seed_user(session: Session, email: str, password: str) -> None:
    """Create *email* if it does not already exist; never overwrite."""
    existing = session.query(User).filter_by(email=email).first()
    if existing is not None:
        return
    session.add(User(email=email, password_hash=hash_password(password)))
    session.commit()


def seed_bootstrap_users(session: Session) -> None:
    """Seed the bootstrap admin and smoke-test user when their env vars are set."""
    if BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD:
        _seed_user(session, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD)
    if SMOKE_TEST_EMAIL and SMOKE_TEST_PASSWORD:
        _seed_user(session, SMOKE_TEST_EMAIL, SMOKE_TEST_PASSWORD)
