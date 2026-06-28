import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.database import engine, Base, SessionLocal
from backend.app.seed import seed_db
from backend.app.routers import auth, tasks, employees, documents, meetings, ai, reports

app = FastAPI(
    title="ExcueAI - Enterprise Workspace API",
    description="Backend API for ExcueAI platform containing JWT authentication, RBAC, Tasks, RAG, Whisper transcripts, and file generators.",
    version="1.0.0"
)

# CORS Configuration
# Allow local React dev server and staging domains
origins = [
    "http://localhost:5173", # Vite React default port
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB generation and seeding hook
@app.on_event("startup")
def on_startup():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        seed_db(db)
    except Exception as e:
        print(f"Startup seeding failed: {e}")
    finally:
        db.close()

# Mount routers
app.include_router(auth.router, prefix="/api")
app.include_router(tasks.router, prefix="/api")
app.include_router(employees.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(meetings.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "ExcueAI API is fully operational.",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
