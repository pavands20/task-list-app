"""Password-reset token generation, validation and email delivery.

Reset tokens are opaque strings (``secrets.token_urlsafe``) whose SHA-256 hash
is stored in the ``password_reset_tokens`` table, so a database leak never
exposes live tokens. Each token is single-use (marked ``used_at`` on success)
and time-limited (``expires_at`` = now + ``RESET_TOKEN_EXPIRY_HOURS``).
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from app.config import APP_BASE_URL, RESET_TOKEN_EXPIRY_HOURS, SENDGRID_API_KEY
from app.models import PasswordResetToken, User

_RESET_FROM_EMAIL = "noreply@tasklist.app"


def _hash_token(token: str) -> str:
    """A fixed SHA-256 hash of the opaque reset token, for storage and lookup."""
    return hashlib.sha256(token.encode()).hexdigest()


def _is_expired(expires_at: datetime) -> bool:
    """True if *expires_at* is in the past. Treats naive datetimes as UTC."""
    now = datetime.now(UTC)
    expires = expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    return expires < now


def generate_reset_token(db: Session, user: User) -> str:
    """Create a PasswordResetToken row for *user* and return the raw token string."""
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + timedelta(hours=RESET_TOKEN_EXPIRY_HOURS)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=expires_at,
            used_at=None,
        )
    )
    db.commit()
    return token


def find_valid_token(db: Session, token: str) -> PasswordResetToken | None:
    """Return the reset-token row if *token* is valid, unused and unexpired."""
    reset_token = (
        db.query(PasswordResetToken).filter_by(token_hash=_hash_token(token)).first()
    )
    if reset_token is None:
        return None
    if reset_token.used_at is not None:
        return None
    if _is_expired(reset_token.expires_at):
        return None
    return reset_token


def build_reset_link(token: str) -> str:
    """Build the reset link URL a user clicks in the email."""
    return f"{APP_BASE_URL}/reset-password?token={token}"


def send_reset_email(email: str, token: str) -> None:
    """Send a password-reset email via SendGrid; skip when no API key is set."""
    if not SENDGRID_API_KEY:
        return
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail

    reset_link = build_reset_link(token)
    message = Mail(
        from_email=_RESET_FROM_EMAIL,
        to_emails=email,
        subject="Reset your password",
        html_content=(
            f"<p>Click the link below to reset your password:</p>"
            f'<p><a href="{reset_link}">{reset_link}</a></p>'
            f"<p>This link expires in {RESET_TOKEN_EXPIRY_HOURS} hours.</p>"
        ),
    )
    SendGridAPIClient(SENDGRID_API_KEY).send(message)
