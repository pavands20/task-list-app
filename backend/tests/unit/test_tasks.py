"""Unit tests for task creation validation and user-scoping logic.

Covers AC-015 (create active task, null due_date), AC-016 (create with due
date), AC-017 (empty/missing title rejected with 400) and user-scoping
(a user's tasks list only contains their own tasks).
"""

from datetime import date

import pytest
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Task, User
from app.routers.tasks import create_task, list_tasks
from app.schemas import TaskCreate
from app.security import hash_password


def _make_user(db: Session, email: str) -> User:
    user = User(email=email, password_hash=hash_password("pw"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_ac015_create_task_no_due_date_is_active(db_session: Session) -> None:
    """AC-015: a task with a title and no due date is created active, null due_date."""
    user = _make_user(db_session, "ac015@example.com")
    resp = create_task(TaskCreate(title="Buy milk"), db=db_session, user=user)

    assert resp.is_done is False
    assert resp.due_date is None
    assert resp.title == "Buy milk"
    assert resp.id

    stored = db_session.query(Task).filter_by(user_id=user.id).one()
    assert stored.is_done is False
    assert stored.due_date is None


def test_ac016_create_task_with_due_date(db_session: Session) -> None:
    """AC-016: a task with a valid due date is created active with that due_date."""
    user = _make_user(db_session, "ac016@example.com")
    resp = create_task(
        TaskCreate(title="Pay rent", due_date=date(2026, 12, 1)),
        db=db_session,
        user=user,
    )

    assert resp.is_done is False
    assert resp.due_date == date(2026, 12, 1)


def test_ac017_empty_title_rejected(db_session: Session) -> None:
    """AC-017: an empty title raises 400 'Title is required' and creates nothing."""
    user = _make_user(db_session, "ac017@example.com")
    with pytest.raises(HTTPException) as exc:
        create_task(TaskCreate(title=""), db=db_session, user=user)
    assert exc.value.status_code == 400
    assert exc.value.detail == "Title is required"
    assert db_session.query(Task).filter_by(user_id=user.id).count() == 0


def test_ac017_whitespace_title_rejected(db_session: Session) -> None:
    """AC-017: a whitespace-only title is treated as empty and rejected."""
    user = _make_user(db_session, "ac017b@example.com")
    with pytest.raises(HTTPException) as exc:
        create_task(TaskCreate(title="   "), db=db_session, user=user)
    assert exc.value.status_code == 400
    assert exc.value.detail == "Title is required"


def test_tasks_list_scoped_to_user(db_session: Session) -> None:
    """A user's task list contains only their own tasks, not another user's."""
    user_a = _make_user(db_session, "scope-a@example.com")
    user_b = _make_user(db_session, "scope-b@example.com")

    create_task(TaskCreate(title="A's task"), db=db_session, user=user_a)
    create_task(TaskCreate(title="B's task"), db=db_session, user=user_b)

    a_tasks = list_tasks(db=db_session, user=user_a)
    assert len(a_tasks) == 1
    assert a_tasks[0].title == "A's task"

    b_tasks = list_tasks(db=db_session, user=user_b)
    assert len(b_tasks) == 1
    assert b_tasks[0].title == "B's task"


def test_create_task_assigns_to_authenticated_user(db_session: Session) -> None:
    """A created task is owned by the authenticated user, never another."""
    user = _make_user(db_session, "owner@example.com")
    resp = create_task(TaskCreate(title="Mine"), db=db_session, user=user)

    stored = db_session.query(Task).filter_by(id=resp.id).one()
    assert stored.user_id == user.id
