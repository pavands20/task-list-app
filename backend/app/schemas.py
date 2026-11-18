"""Pydantic request and response models, one pair per entity in the data model."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, field_validator


class UserPublic(BaseModel):
    """The user fields safe to return to a client; never the password hash."""

    id: str
    email: str


class AuthResponse(BaseModel):
    """Body of a successful register or login: an opaque token plus the user."""

    token: str
    user: UserPublic


class Credentials(BaseModel):
    """Email/password request body for register and login.

    Both fields default to the empty string so a missing field is treated as an
    empty value and surfaced as a field-level 400 error rather than a 422.
    """

    email: str = ""
    password: str = ""


class TaskCreate(BaseModel):
    """Request body for POST /tasks: a required title and optional due date.

    ``title`` defaults to the empty string so a missing title is surfaced as a
    400 with ``Title is required`` rather than a 422 validation error.
    """

    title: str = ""
    due_date: date | None = None


class TaskResponse(BaseModel):
    """The full task object returned by POST /tasks and GET /tasks."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    due_date: date | None = None
    is_done: bool
    created_at: datetime
    updated_at: datetime

    @field_validator("id", mode="before")
    @classmethod
    def _coerce_id(cls, value: object) -> str:
        return str(value)
