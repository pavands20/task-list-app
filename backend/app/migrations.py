"""Run Alembic migrations to the latest revision.

Schema changes are made only through Alembic migrations (never
``Base.metadata.create_all`` in the running application). This is invoked from
the application lifespan on startup so a deployment applies pending migrations
before serving requests.
"""

import os
from pathlib import Path

from alembic.config import Config

from alembic import command


def run_migrations() -> None:
    """Apply all pending Alembic migrations to the configured database."""
    config_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    config = Config(str(config_path))
    db_url = os.getenv("DATABASE_URL")
    if db_url:
        config.set_main_option("sqlalchemy.url", db_url)
    command.upgrade(config, "head")
