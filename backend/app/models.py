import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Department(Base):
    __tablename__ = "departments"

    department_id = Column(Integer, primary_key=True, index=True)
    department_name = Column(String(100), unique=True, nullable=False)

    users = relationship("User", back_populates="department")

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # "Manager" or "Employee"
    department_id = Column(Integer, ForeignKey("departments.department_id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    department = relationship("Department", back_populates="users")
    
    # Tasks assigned to this employee
    assigned_tasks = relationship(
        "Task", 
        foreign_keys="[Task.assigned_employee_id]", 
        back_populates="assigned_employee"
    )
    
    # Tasks created by this manager
    created_tasks = relationship(
        "Task", 
        foreign_keys="[Task.created_by_manager_id]", 
        back_populates="creator"
    )
    
    uploaded_documents = relationship("Document", back_populates="uploader")
    uploaded_meetings = relationship("Meeting", back_populates="uploader")

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(50), nullable=False)  # "Low", "Medium", "High", "Critical"
    status = Column(String(50), nullable=False, default="Pending")  # "Pending", "In Progress", "Completed"
    deadline = Column(Date, nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_by_manager_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    assigned_employee = relationship("User", foreign_keys=[assigned_employee_id], back_populates="assigned_tasks")
    creator = relationship("User", foreign_keys=[created_by_manager_id], back_populates="created_tasks")

class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    file_path = Column(String(500), nullable=False)
    vector_reference = Column(String(255), nullable=True)

    uploader = relationship("User", back_populates="uploaded_documents")

class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, default="Meeting Transcript")
    transcript = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    action_items = Column(Text, nullable=True)  # Store structured info as JSON/text
    risks = Column(Text, nullable=True)         # Store structured info as JSON/text
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)

    uploader = relationship("User", back_populates="uploaded_meetings")
