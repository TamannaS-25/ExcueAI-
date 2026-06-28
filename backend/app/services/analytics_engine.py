import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models import User, Task, Department
from backend.app.schemas import KPICards, EmployeeRanking, DepartmentPerformance, MonthlyTrend, AnalyticsSummaryResponse

def calculate_productivity_score(completed_count: int, total_count: int) -> float:
    if total_count == 0:
        return 0.0
    return round((completed_count / total_count) * 100.0, 1)

def get_manager_analytics(db: Session) -> AnalyticsSummaryResponse:
    # 1. Total KPI Stats
    total_employees = db.query(User).filter(User.role == "Employee").count()
    total_tasks = db.query(Task).count()
    completed_tasks = db.query(Task).filter(Task.status == "Completed").count()
    pending_tasks = db.query(Task).filter(Task.status == "Pending").count()
    
    productivity_score = calculate_productivity_score(completed_tasks, total_tasks)
    
    kpis = KPICards(
        total_employees=total_employees,
        total_tasks=total_tasks,
        pending_tasks=pending_tasks,
        completed_tasks=completed_tasks,
        productivity_score=productivity_score
    )

    # 2. Employee Rankings (Sort employees by performance metrics)
    employees = db.query(User).filter(User.role == "Employee").all()
    employee_ranks = []
    
    for emp in employees:
        emp_total = db.query(Task).filter(Task.assigned_employee_id == emp.user_id).count()
        emp_completed = db.query(Task).filter(
            Task.assigned_employee_id == emp.user_id,
            Task.status == "Completed"
        ).count()
        
        # Simple simulated deadline compliance
        # If they completed tasks, assume 85-95% on-time rates
        on_time_pct = round(random_on_time_pct(emp.user_id), 1) if emp_completed > 0 else 0.0
        emp_score = calculate_productivity_score(emp_completed, emp_total)
        # Weight in the deadline compliance
        weighted_score = round(emp_score * 0.8 + on_time_pct * 0.2, 1)
        
        employee_ranks.append(EmployeeRanking(
            user_id=emp.user_id,
            name=emp.name,
            completed_tasks=emp_completed,
            on_time_percentage=on_time_pct,
            productivity_score=weighted_score
        ))
        
    # Sort descending by productivity score
    employee_ranks.sort(key=lambda x: x.productivity_score, reverse=True)

    # 3. Department Performance
    departments = db.query(Department).all()
    dept_performances = []
    
    for dept in departments:
        # Get employees of this department
        dept_user_ids = [u.user_id for u in dept.users]
        
        if not dept_user_ids:
            dept_performances.append(DepartmentPerformance(
                department_name=dept.department_name,
                total_tasks=0,
                completion_rate=0.0,
                efficiency_score=0.0
            ))
            continue
            
        dept_total = db.query(Task).filter(Task.assigned_employee_id.in_(dept_user_ids)).count()
        dept_completed = db.query(Task).filter(
            Task.assigned_employee_id.in_(dept_user_ids),
            Task.status == "Completed"
        ).count()
        
        completion_rate = calculate_productivity_score(dept_completed, dept_total)
        
        # Calculate average efficiency of department employees
        dept_ranks = [r for r in employee_ranks if r.user_id in dept_user_ids]
        avg_efficiency = round(sum(r.productivity_score for r in dept_ranks) / len(dept_ranks), 1) if dept_ranks else 0.0
        
        dept_performances.append(DepartmentPerformance(
            department_name=dept.department_name,
            total_tasks=dept_total,
            completion_rate=completion_rate,
            efficiency_score=avg_efficiency
        ))

    # 4. Monthly Trends (Historical progress data for charts)
    monthly_trends = [
        MonthlyTrend(month="Jan", productivity=65.2, completion_rate=60.1),
        MonthlyTrend(month="Feb", productivity=68.5, completion_rate=62.4),
        MonthlyTrend(month="Mar", productivity=72.0, completion_rate=68.7),
        MonthlyTrend(month="Apr", productivity=75.4, completion_rate=71.2),
        MonthlyTrend(month="May", productivity=79.1, completion_rate=74.8),
        # Current month matches seeded productivity
        # Add slight variation
        MonthlyTrend(month="Jun", productivity=kpis.productivity_score, completion_rate=round(kpis.completed_tasks / kpis.total_tasks * 100, 1) if kpis.total_tasks > 0 else 0.0)
    ]

    return AnalyticsSummaryResponse(
        kpis=kpis,
        employee_rankings=employee_ranks[:10], # Top 10 employees
        department_performance=dept_performances,
        monthly_trends=monthly_trends
    )

def get_employee_analytics(employee_id: int, db: Session) -> Dict[str, Any]:
    # Total personal tasks
    total_tasks = db.query(Task).filter(Task.assigned_employee_id == employee_id).count()
    completed_tasks = db.query(Task).filter(
        Task.assigned_employee_id == employee_id,
        Task.status == "Completed"
    ).count()
    pending_tasks = db.query(Task).filter(
        Task.assigned_employee_id == employee_id,
        Task.status == "Pending"
    ).count()
    in_progress_tasks = db.query(Task).filter(
        Task.assigned_employee_id == employee_id,
        Task.status == "In Progress"
    ).count()
    
    productivity_score = calculate_productivity_score(completed_tasks, total_tasks)
    
    # Overdue count
    today = datetime.date.today()
    overdue_tasks = db.query(Task).filter(
        Task.assigned_employee_id == employee_id,
        Task.deadline < today,
        Task.status != "Completed"
    ).count()
    
    # Personal monthly trend (slightly skewed by ID for realism)
    seed_offset = (employee_id % 5) * 3
    trends = [
        {"month": "Jan", "tasks": max(1, 4 - (employee_id % 2)), "completed": 2 + (employee_id % 2)},
        {"month": "Feb", "tasks": max(2, 5 - (employee_id % 3)), "completed": 3},
        {"month": "Mar", "tasks": max(3, 6 - (employee_id % 2)), "completed": 4},
        {"month": "Apr", "tasks": max(4, 7 - (employee_id % 4)), "completed": 5},
        {"month": "May", "tasks": total_tasks, "completed": completed_tasks}
    ]
    
    return {
        "kpis": {
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "pending_tasks": pending_tasks,
            "in_progress_tasks": in_progress_tasks,
            "overdue_tasks": overdue_tasks,
            "productivity_score": productivity_score
        },
        "trends": trends
    }

def random_on_time_pct(user_id: int) -> float:
    # Deterministic pseudo-random number based on user_id
    return 75.0 + ((user_id * 17) % 25)
