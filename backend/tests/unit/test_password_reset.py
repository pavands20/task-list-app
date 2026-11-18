"""Unit tests for password-reset token generation, validation and email.

Covers AC-009 (token generation creates a hashed row with future expiry),
NFR-003 (tokens expire and cannot be reused), and AC-009 email delivery.
"""

import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from unittest.mock import MagicMock, patch

from sqlalchemy.orm import Session

from app.models import PasswordResetToken, User
from app.password_reset import (
    find_valid_token,
    generate_reset_token,
    send_reset_email,
)
from app.security import hash_password


def _make_user(db: Session, email: str = "reset@example.com") -> User:
    user = User(email=email, password_hash=hash_password("pw"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_ac009_token_generation_creates_row_with_hashed_token_and_future_expiry(
    db_session: Session,
) -> None:
    """AC-009 / Unit: token generation creates a PasswordResetToken row with a
    hashed token (never plaintext) and an expiry in the future."""
    user = _make_user(db_session, "gen@example.com")
    token = generate_reset_token(db_session, user)

    assert isinstance(token, str) and token
    rows = db_session.query(PasswordResetToken).filter_by(user_id=user.id).all()
    assert len(rows) == 1
    row = rows[0]
    # The stored hash is NOT the raw token.
    assert row.token_hash != token
    assert row.token_hash == hashlib.sha256(token.encode()).hexdigest()
    # Expiry is in the future.
    now = datetime.now(UTC)
    expires = row.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=UTC)
    assert expires > now
    # Token starts unused.
    assert row.used_at is None


def test_nfr003_find_valid_token_rejects_unknown_token(db_session: Session) -> None:
    """NFR-003: an unknown token is not valid."""
    user = _make_user(db_session, "unk@example.com")
    generate_reset_token(db_session, user)
    assert find_valid_token(db_session, "not-a-real-token") is None


def test_nfr003_find_valid_token_rejects_expired_token(db_session: Session) -> None:
    """NFR-003: an expired token is not valid."""
    user = _make_user(db_session, "exp@example.com")
    token = generate_reset_token(db_session, user)
    row = db_session.query(PasswordResetToken).filter_by(user_id=user.id).first()
    assert row is not None
    row.expires_at = datetime.now(UTC) - timedelta(hours=1)
    db_session.commit()
    assert find_valid_token(db_session, token) is None


def test_nfr003_find_valid_token_rejects_used_token(db_session: Session) -> None:
    """NFR-003: an already-used token is not valid."""
    user = _make_user(db_session, "used@example.com")
    token = generate_reset_token(db_session, user)
    row = db_session.query(PasswordResetToken).filter_by(user_id=user.id).first()
    assert row is not None
    row.used_at = datetime.now(UTC)
    db_session.commit()
    assert find_valid_token(db_session, token) is None


def test_nfr003_find_valid_token_accepts_fresh_unused_token(db_session: Session) -> None:
    """NFR-003: a fresh, unused, unexpired token is valid."""
    user = _make_user(db_session, "fresh@example.com")
    token = generate_reset_token(db_session, user)
    row = find_valid_token(db_session, token)
    assert row is not None
    assert row.user_id == user.id


def test_ac009_send_reset_email_skips_when_no_api_key() -> None:
    """AC-009: when SENDGRID_API_KEY is empty, no email is sent (local/test)."""
    with patch("app.password_reset.SENDGRID_API_KEY", ""):
        with patch("sendgrid.SendGridAPIClient") as mock_client:
            send_reset_email("user@example.com", "sometoken")
            mock_client.assert_not_called()


def test_ac009_send_reset_email_sends_link_when_api_key_set() -> None:
    """AC-009: when SENDGRID_API_KEY is set, a reset-link email is sent via SendGrid."""
    token = secrets.token_urlsafe(16)
    with patch("app.password_reset.SENDGRID_API_KEY", "test-key"):
        with patch("app.password_reset.APP_BASE_URL", "https://app.example.com"):
            with patch("sendgrid.SendGridAPIClient") as mock_client_cls:
                mock_client = MagicMock()
                mock_client_cls.return_value = mock_client
                send_reset_email("user@example.com", token)
                mock_client_cls.assert_called_once_with("test-key")
                mock_client.send.assert_called_once()
                sent_mail = mock_client.send.call_args.args[0]
                # The reset link URL is embedded in the email content.
                content = str(sent_mail.contents[0].content)
                assert f"https://app.example.com/reset-password?token={token}" in content
