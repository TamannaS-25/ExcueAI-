from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from backend.app.database import get_db
from backend.app.models import Task, User
from backend.app.schemas import TaskCreate, TaskUpdate, TaskResponse
from backend.app.auth import get_current_user, require_manager, require_any_user

router = APIRouter(prefix="/tasks", tags=["Task Management"])

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    
    # RBAC: Employee can only see their own tasks
    if current_user.role == "Employee":
        query = query.filter(Task.assigned_employee_id == current_user.user_id)
    
    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
        
    return query.order_by(Task.deadline.asc()).all()

@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    # Verify assignee is an employee
    assignee = db.query(User).filter(User.user_id == payload.assigned_employee_id, User.role == "Employee").first()
    if not assignee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assigned employee not found or is not an Employee role"
        )
        
    new_task = Task(
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        deadline=payload.deadline,
        assigned_employee_id=payload.assigned_employee_id,
        created_by_manager_id=current_user.user_id
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Check permissions
    if current_user.role == "Employee":
        # Employees can ONLY update status
        if task.assigned_employee_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot update tasks assigned to other employees"
            )
            
        # Only allow updating status
        if payload.status:
            if payload.status not in ["Pending", "In Progress", "Completed"]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid status value"
                )
            task.status = payload.status
        db.commit()
        db.refresh(task)
        return task
        
    elif current_user.role == "Manager":
        # Managers can update everything
        if payload.title is not None:
            task.title = payload.title
        if payload.description is not None:
            task.description = payload.description
        if payload.priority is not None:
            task.priority = payload.priority
        if payload.status is not None:
            task.status = payload.status
        if payload.deadline is not None:
            task.deadline = payload.deadline
        if payload.assigned_employee_id is not None:
            # Verify employee
            assignee = db.query(User).filter(User.user_id == payload.assigned_employee_id, User.role == "Employee").first()
            if not assignee:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Assigned employee not found"
                )
            task.assigned_employee_id = payload.assigned_employee_id
            
        db.commit()
        db.refresh(task)
        return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    db.delete(task)
    db.commit()
    return None
