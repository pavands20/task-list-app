"""US-006 / AC-014: registration and every exposed route are free of payment.

Integration tests driven through the TestClient. They assert the negative
space the criterion names: registering an account never prompts for payment
information, the response carries only the agreed identity shape, and the
application exposes no billing/payment/plan/subscription endpoint. If a later
ticket adds a paid tier, these fail rather than shipping a paywall silently.
"""

import re
import secrets

from fastapi.testclient import TestClient

_BILLING_PATH_TERMS = re.compile(
    r"(billing|payment|payments|subscription|subscriptions|"
    r"checkout|paywall|pricing|plans?|tiers?|upgrade|downgrade|stripe)",
    re.IGNORECASE,
)

# Full-word / phrase payment concepts a paywall surfaces in copy. ``plan`` is
# matched as a whole word so a task title such as "Plan weekend trip" does not
# false-trigger, but "choose a plan" or "your plan" still does.
_PAYMENT_COPY_TERMS = [
    "payment",
    "billing",
    "subscription",
    "upgrade",
    "downgrade",
    "pricing",
    "paywall",
    "stripe",
    "credit card",
    "card number",
    "free trial",
    "paid plan",
    "choose a plan",
    "your plan",
    "payment information",
    "payment method",
    "billing details",
]


def _unique_email() -> str:
    return f"u{secrets.token_hex(8)}@example.com"


def _unique_password() -> str:
    return secrets.token_urlsafe(16)


def test_ac014_register_response_carries_no_billing_or_plan_fields(client: TestClient) -> None:
    """AC-014: a successful registration returns only { token, user }, no plan."""
    resp = client.post(
        "/auth/register",
        json={"email": _unique_email(), "password": _unique_password()},
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()

    # The agreed shape -- nothing billing-related is attached to the session.
    assert set(body.keys()) == {"token", "user"}
    assert set(body["user"].keys()) == {"id", "email"}

    serialised = repr(body).lower()
    for term in _PAYMENT_COPY_TERMS:
        assert term not in serialised, f"register response mentions '{term}'"


def test_ac014_register_requires_no_payment_information(client: TestClient) -> None:
    """AC-014: registration with only email + password succeeds, never 402."""
    resp = client.post(
        "/auth/register",
        json={"email": _unique_email(), "password": _unique_password()},
    )
    # 402 Payment Required would mean a paywall sits in front of registration.
    assert resp.status_code != 402
    assert resp.status_code == 200, resp.text


def test_ac014_no_billing_or_plan_routes_are_exposed(client: TestClient) -> None:
    """AC-014: the application registers no payment/plan/subscription routes."""
    paths = {getattr(route, "path", "") for route in client.app.routes}
    paths.discard("")
    offending = sorted(path for path in paths if _BILLING_PATH_TERMS.search(path))
    assert offending == [], f"app exposes billing/plan routes: {offending}"


def test_ac014_openapi_document_has_no_billing_or_plan_paths(client: TestClient) -> None:
    """AC-014: the published OpenAPI contract advertises no payment endpoints."""
    resp = client.get("/openapi.json")
    assert resp.status_code == 200
    spec = resp.json()
    path_keys = list(spec.get("paths", {}).keys())
    offending = sorted(path for path in path_keys if _BILLING_PATH_TERMS.search(path))
    assert offending == [], f"OpenAPI advertises billing/plan paths: {offending}"


def test_ac014_likely_payment_endpoints_are_not_routable(client: TestClient) -> None:
    """AC-014: a client guessing payment URLs gets 404, never a billing flow."""
    candidates = [
        "/billing",
        "/payments",
        "/plans",
        "/subscriptions",
        "/checkout",
        "/pricing",
        "/upgrade",
        "/account/plan",
        "/account/billing",
        "/account/subscription",
    ]
    for path in candidates:
        resp = client.get(path)
        assert resp.status_code == 404, f"GET {path} returned {resp.status_code}, not 404"
