"""Session-token creation and the Bearer-token authentication dependency.

Session tokens are opaque strings (``secrets.token_urlsafe``) returned to the
client in the register/login response body. Only a hash of the token is stored
in the ``sessions`` table, so a database leak never exposes live tokens. The
auth dependency reads the ``Authorization: Bearer <token>`` header, hashes the
presented token, looks up the matching session, rejects expired or unknown
tokens with 401, and returns the owning user.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.config import SESSION_EXPIRY_HOURS
from app.database import get_db
from app.models import Session as SessionModel
from app.models import User

AuthorizationHeader = Annotated[str | None, Header()]
DbSession = Annotated[Session, Depends(get_db)]


def _hash_token(token: str) -> str:
    """A fixed SHA-256 hash of the opaque token, for storage and lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def _is_expired(expires_at: datetime) -> bool:
    """True if *expires_at* is in the past. Treats naive datetimes as UTC."""
    now = datetime.now(UTC)
    expires = expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    return expires < now


def create_session(db: Session, user: User) -> str:
    """Create a session row for *user* and return the opaque token string."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(hours=SESSION_EXPIRY_HOURS)
    db.add(SessionModel(user_id=user.id, token_hash=_hash_token(token), expires_at=expires_at))
    db.commit()
    return token


def get_current_user(
    authorization: AuthorizationHeader = None,
    db: DbSession = None,
) -> User:
    """Resolve the bearer token to a user, or raise 401 for any failure.

    ``db`` defaults to None so the function is also callable directly in unit
    tests (which pass an explicit session); FastAPI injects the dependency from
    the ``Annotated`` metadata for real requests.
    """
    if db is None:
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    session = db.query(SessionModel).filter_by(token_hash=_hash_token(token)).first()
    if session is None or _is_expired(session.expires_at):
        raise HTTPException(status_code=401, detail="Invalid or missing authentication token")
    return session.user
