"""Task endpoints: POST /tasks, GET /tasks, PATCH/DELETE /tasks/{task_id}.

Every endpoint requires a valid Bearer session token (resolved by
``get_current_user``). Tasks are always scoped to the authenticated user: a
new task is created for that user with ``is_done=false``, the list returns
only that user's tasks, and PATCH/DELETE look up the task by id *and*
``user_id`` so another user's task is a 404 (never 403, to avoid leaking its
existence). A missing or invalid token yields 401 from the auth dependency.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Task, User
from app.schemas import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _parse_task_id(task_id: str) -> uuid.UUID:
    """Parse the path id, or raise 404 if it is not a valid UUID."""
    try:
        return uuid.UUID(task_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Task not found") from None


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(body: TaskCreate, db: DbSession, user: CurrentUser) -> TaskResponse:
    """Create a task for the authenticated user (AC-015, AC-016, AC-017)."""
    if not body.title or not body.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    task = Task(
        user_id=user.id,
        title=body.title,
        due_date=body.due_date,
        is_done=False,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.get("", response_model=list[TaskResponse], status_code=200)
def list_tasks(db: DbSession, user: CurrentUser) -> list[TaskResponse]:
    """Return all tasks belonging to the authenticated user."""
    tasks = (
        db.query(Task)
        .filter_by(user_id=user.id)
        .order_by(Task.due_date.asc(), Task.created_at.asc())
        .all()
    )
    return [TaskResponse.model_validate(t) for t in tasks]


@router.patch("/{task_id}", response_model=TaskResponse, status_code=200)
def patch_task(task_id: str, body: TaskUpdate, db: DbSession, user: CurrentUser) -> TaskResponse:
    """Partially update one of the authenticated user's tasks.

    Only fields the client actually sent are applied (AC-020, AC-021); an
    empty/whitespace ``title`` is a 400. A task that does not exist or belongs
    to another user is a 404 (AC-024, NFR-005).
    """
    task = db.query(Task).filter_by(id=_parse_task_id(task_id), user_id=user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    data = body.model_dump(exclude_unset=True)
    if "title" in data:
        title = data["title"]
        if not title or not title.strip():
            raise HTTPException(status_code=400, detail="Title is required")
        task.title = title
    if "due_date" in data:
        task.due_date = data["due_date"]
    if "is_done" in data and data["is_done"] is not None:
        task.is_done = data["is_done"]

    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str, db: DbSession, user: CurrentUser) -> None:
    """Delete one of the authenticated user's tasks.

    Returns 204 with no body on success; 404 when the task does not exist or
    belongs to another user (AC-024, NFR-005).
    """
    task = db.query(Task).filter_by(id=_parse_task_id(task_id), user_id=user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
