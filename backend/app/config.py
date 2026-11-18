"""Application settings, read from environment variables with local defaults.

The platform always sets the deployment values (see ENVIRONMENT.md). Every
default here is a local-development fallback so a fresh clone runs without
them; production overrides every one via the environment.
"""

import os
from pathlib import Path

# --- Database -------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

# --- CORS -----------------------------------------------------------------

# Comma-separated list of frontend origins allowed by the API. In development
# that is the Vite dev server; when deployed, the platform injects the real URL.
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]

# --- Shared API bearer (public; never sign anything with it) ---------------

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

# --- Private signing key (set in production; used for tokens/sessions) -----

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")

# --- Writable directory that survives redeploys ---------------------------

MEDIA_ROOT = Path(os.getenv("MEDIA_ROOT", "./media"))

# --- SendGrid -------------------------------------------------------------

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")

# Frontend base URL, used to build password-reset links in emails.
APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")

# --- Bootstrap admin (set by platform on deploy; empty in local/test) ------

BOOTSTRAP_ADMIN_EMAIL = os.getenv("BOOTSTRAP_ADMIN_EMAIL", "")
BOOTSTRAP_ADMIN_PASSWORD = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "")

# --- Smoke-test user (set by platform on deploy; empty in local/test) ------

SMOKE_TEST_EMAIL = os.getenv("SMOKE_TEST_EMAIL", "")
SMOKE_TEST_PASSWORD = os.getenv("SMOKE_TEST_PASSWORD", "")

# --- Token lifetimes ------------------------------------------------------

SESSION_EXPIRY_HOURS = int(os.getenv("SESSION_EXPIRY_HOURS", "168"))  # 7 days
RESET_TOKEN_EXPIRY_HOURS = int(os.getenv("RESET_TOKEN_EXPIRY_HOURS", "1"))
