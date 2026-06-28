from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database import get_db
from backend.app.models import User, Department
from backend.app.schemas import UserResponse, AnalyticsSummaryResponse
from backend.app.auth import get_current_user, require_manager, require_any_user
from backend.app.services.analytics_engine import get_manager_analytics, get_employee_analytics

router = APIRouter(prefix="/employees", tags=["Employee Directory & Analytics"])

@router.get("/", response_model=List[UserResponse])
def get_employees(
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    # Returns all employees in the workspace
    return db.query(User).filter(User.role == "Employee").all()

@router.get("/departments", response_model=List[Dict[str, Any]])
def get_departments(
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    depts = db.query(Department).all()
    return [{"department_id": d.department_id, "department_name": d.department_name} for d in depts]

@router.get("/analytics", response_model=AnalyticsSummaryResponse)
def get_dashboard_analytics(
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    # Calculate company wide manager statistics
    return get_manager_analytics(db)

@router.get("/me/analytics", response_model=Dict[str, Any])
def get_personal_analytics(
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    # Retrieve personal dashboard stats for employee
    return get_employee_analytics(current_user.user_id, db)
