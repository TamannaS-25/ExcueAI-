import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from backend.app.database import get_db
from backend.app.models import Meeting, User, Document
from backend.app.schemas import MeetingResponse
from backend.app.auth import require_manager, require_any_user
from backend.app.services.meeting_service import transcribe_audio, analyze_transcript
from backend.app.services.rag_service import index_document

router = APIRouter(prefix="/meetings", tags=["Meeting Intelligence"])

UPLOAD_DIR = os.path.abspath("./uploads/meetings")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[MeetingResponse])
def get_meetings(
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    return db.query(Meeting).order_by(Meeting.upload_date.desc()).all()

@router.post("/upload", response_model=MeetingResponse, status_code=status.HTTP_201_CREATED)
async def upload_meeting_audio(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".mp3", ".wav", ".m4a"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audio format. Only MP3, WAV, and M4A are supported."
        )
        
    # Save audio file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{int(datetime.datetime.utcnow().timestamp())}_{filename}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save audio: {str(e)}"
        )
        
    api_key = os.getenv("OPENAI_API_KEY")
    
    # 1. Whisper Transcription
    try:
        transcript = transcribe_audio(file_path, api_key=api_key)
    except Exception as e:
        transcript = f"Error during audio transcription: {str(e)}"
        
    # 2. GPT Analysis (Summary, Actions, Risks)
    try:
        analysis = analyze_transcript(transcript, api_key=api_key)
    except Exception as e:
        analysis = {
            "summary": "Audio transcription compiled. Analysis failed.",
            "action_items": "[]",
            "risks": "[]"
        }
        
    # 3. Save to database
    meeting_title = os.path.splitext(filename)[0].replace("_", " ").capitalize()
    db_meeting = Meeting(
        title=meeting_title,
        transcript=transcript,
        summary=analysis.get("summary", ""),
        action_items=analysis.get("action_items", "[]"),
        risks=analysis.get("risks", "[]"),
        uploaded_by=current_user.user_id
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # 4. Save transcript and summary into Knowledge Base (RAG)
    # Create a virtual file text to feed the indexer
    virtual_file_name = f"Meeting_{db_meeting.meeting_id}_{db_meeting.title.replace(' ', '_')}.txt"
    virtual_file_dir = os.path.abspath("./uploads/documents")
    os.makedirs(virtual_file_dir, exist_ok=True)
    virtual_file_path = os.path.join(virtual_file_dir, virtual_file_name)
    
    virtual_text = (
        f"MEETING TITLE: {db_meeting.title}\n"
        f"DATE: {db_meeting.upload_date.strftime('%Y-%m-%d')}\n"
        f"SUMMARY:\n{db_meeting.summary}\n\n"
        f"ACTION ITEMS:\n{db_meeting.action_items}\n\n"
        f"TRANSCRIPT:\n{db_meeting.transcript}"
    )
    
    try:
        with open(virtual_file_path, "w", encoding="utf-8") as f:
            f.write(virtual_text)
            
        # Create virtual document in DB for linking
        db_doc = Document(
            filename=virtual_file_name,
            file_path=virtual_file_path,
            uploaded_by=current_user.user_id,
            vector_reference=""
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        
        # Index document
        index_document(db_doc.document_id, db_doc.filename, db_doc.file_path, api_key=api_key)
        db_doc.vector_reference = f"doc_{db_doc.document_id}"
        db.commit()
    except Exception as e:
        print(f"Failed to index meeting notes into RAG: {e}")
        
    return db_meeting
