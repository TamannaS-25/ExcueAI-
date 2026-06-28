import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any

# Department schemas
class DepartmentBase(BaseModel):
    department_name: str

class DepartmentResponse(DepartmentBase):
    department_id: int
    
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  # "Manager" or "Employee"
    department_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    user_id: int
    created_at: datetime.datetime
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    email: str
    user_id: int

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str  # "Low", "Medium", "High", "Critical"
    status: str = "Pending"  # "Pending", "In Progress", "Completed"
    deadline: datetime.date
    assigned_employee_id: int

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime.date] = None
    assigned_employee_id: Optional[int] = None

class TaskEmployeeResponse(BaseModel):
    user_id: int
    name: str
    email: str
    role: str
    
    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    task_id: int
    created_by_manager_id: int
    created_at: datetime.datetime
    assigned_employee: TaskEmployeeResponse
    creator: TaskEmployeeResponse

    class Config:
        from_attributes = True

# Document schemas
class DocumentResponse(BaseModel):
    document_id: int
    filename: str
    upload_date: datetime.datetime
    uploaded_by: int
    file_path: str
    vector_reference: Optional[str] = None
    uploader: TaskEmployeeResponse

    class Config:
        from_attributes = True

# Meeting schemas
class MeetingBase(BaseModel):
    title: str
    transcript: str

class MeetingResponse(BaseModel):
    meeting_id: int
    title: str
    transcript: str
    summary: Optional[str] = None
    action_items: Optional[str] = None  # JSON serialized as string
    risks: Optional[str] = None         # JSON serialized as string
    upload_date: datetime.datetime
    uploaded_by: int
    uploader: TaskEmployeeResponse

    class Config:
        from_attributes = True

# AI schemas
class ChatQueryRequest(BaseModel):
    message: str

class ChatQueryResponse(BaseModel):
    response: str
    source: str  # "PostgreSQL", "ChromaDB RAG", "Meeting Knowledge Base", "GPT"
    context: Optional[str] = None
    metadata: Optional[Any] = None

# Document comparison schema
class DocumentCompareResponse(BaseModel):
    summary: str
    differences: List[str]
    pdf_report_path: Optional[str] = None
    docx_report_path: Optional[str] = None

# PPT generation schema
class PPTRequest(BaseModel):
    topic: str
    project_name: Optional[str] = ""
    meeting_summary: Optional[str] = ""
    uploaded_document_id: Optional[int] = None

# Analytics schemas
class KPICards(BaseModel):
    total_employees: int
    total_tasks: int
    pending_tasks: int
    completed_tasks: int
    productivity_score: float

class EmployeeRanking(BaseModel):
    user_id: int
    name: str
    completed_tasks: int
    on_time_percentage: float
    productivity_score: float

class DepartmentPerformance(BaseModel):
    department_name: str
    total_tasks: int
    completion_rate: float
    efficiency_score: float

class MonthlyTrend(BaseModel):
    month: str  # e.g., "Jan", "Feb"
    productivity: float
    completion_rate: float

class AnalyticsSummaryResponse(BaseModel):
    kpis: KPICards
    employee_rankings: List[EmployeeRanking]
    department_performance: List[DepartmentPerformance]
    monthly_trends: List[MonthlyTrend]
