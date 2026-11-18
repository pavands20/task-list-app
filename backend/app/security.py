"""Password hashing and verification using passlib with bcrypt.

passlib's bcrypt backend requires the ``bcrypt`` package (declared in
requirements.txt). The CryptContext is configured with the ``bcrypt`` scheme
and ``deprecated="auto"`` so future scheme changes can phase old hashes out.
"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Return a bcrypt hash of *password*."""
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Return True if *password* matches *password_hash*."""
    return pwd_context.verify(password, password_hash)
