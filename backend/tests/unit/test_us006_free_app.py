"""US-006 / AC-014: the app is free with no payments, billing or plans.

These tests guard the negative space: the data model and the API schemas that
ship with the app must never gain billing, payment, plan, subscription, tier,
trial or quota concepts. If a later change adds any of those, the criteria here
fail rather than silently letting a paid-plan restriction slip in.
"""

import re

from app.models import User
from app.schemas import AuthResponse, UserPublic

# Names a billing/plan feature would plausibly use. Matched as whole words so a
# legitimate column such as ``created_at`` (contains "red") or ``plan`` inside a
# task title is not flagged. ``plan`` is included because a ``plan`` column on
# the user is the canonical paid-tier concept.
_BILLING_TERMS = re.compile(
    r"\b(plan|plans|billing|payment|payments|subscription|subscriptions|"
    r"tier|tiers|trial|trials|paywall|pricing|upgrade|downgrade|quota|"
    r"limit|limits|stripe|paid|free_tier|price|pricing_plan)\b",
    re.IGNORECASE,
)


def test_user_model_has_no_billing_or_plan_columns() -> None:
    """AC-014: the User table carries only identity columns, never a plan."""
    column_names = {c.name for c in User.__table__.columns}
    # The approved identity columns: nothing billing-related belongs here.
    assert column_names == {"id", "email", "password_hash", "created_at"}
    offending = [name for name in column_names if _BILLING_TERMS.search(name)]
    assert offending == [], f"User model gained billing/plan columns: {offending}"


def test_auth_response_schema_has_no_billing_or_plan_fields() -> None:
    """AC-014: the register/login response carries token + user, never a plan."""
    field_names = set(AuthResponse.model_fields.keys())
    assert field_names == {"token", "user"}
    offending = [name for name in field_names if _BILLING_TERMS.search(name)]
    assert offending == [], f"AuthResponse gained billing/plan fields: {offending}"


def test_user_public_schema_has_no_billing_or_plan_fields() -> None:
    """AC-014: the public user shape is id + email, never a plan or tier."""
    field_names = set(UserPublic.model_fields.keys())
    assert field_names == {"id", "email"}
    offending = [name for name in field_names if _BILLING_TERMS.search(name)]
    assert offending == [], f"UserPublic gained billing/plan fields: {offending}"
