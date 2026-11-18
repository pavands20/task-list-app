"""Task endpoints: POST /tasks (create) and GET /tasks (list own tasks).

Both endpoints require a valid Bearer session token (resolved by
``get_current_user``). Tasks are always scoped to the authenticated user: a
new task is created for that user with ``is_done=false``, and the list returns
only that user's tasks. A missing or invalid token yields 401 from the auth
dependency.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Task, User
from app.schemas import TaskCreate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["tasks"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


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
    tasks = db.query(Task).filter_by(user_id=user.id).order_by(Task.created_at).all()
    return [TaskResponse.model_validate(t) for t in tasks]
