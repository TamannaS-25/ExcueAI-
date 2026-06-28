import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from backend.app.database import get_db
from backend.app.models import Document, User
from backend.app.schemas import DocumentResponse
from backend.app.auth import require_manager, require_any_user, get_current_user
from backend.app.services.rag_service import index_document, delete_document_index

router = APIRouter(prefix="/documents", tags=["Company Knowledge Base"])

UPLOAD_DIR = os.path.abspath("./uploads/documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("/", response_model=List[DocumentResponse])
def get_documents(
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    return db.query(Document).order_by(Document.upload_date.desc()).all()

@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    # Validate extension
    filename = file.filename
    _, ext = os.path.splitext(filename.lower())
    if ext not in [".pdf", ".docx", ".txt"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Only PDF, DOCX, and TXT are supported."
        )
        
    # Save file to disk
    file_path = os.path.join(UPLOAD_DIR, f"{int(datetime.datetime.utcnow().timestamp())}_{filename}")
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    # Create DB entry
    db_doc = Document(
        filename=filename,
        file_path=file_path,
        uploaded_by=current_user.user_id,
        vector_reference="" # Updated by RAG indexer
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # Run RAG Indexing (chunks and embeds)
    # Check if OPENAI_API_KEY is in environment to pass it
    api_key = os.getenv("OPENAI_API_KEY")
    try:
        index_document(db_doc.document_id, db_doc.filename, db_doc.file_path, api_key=api_key)
        db_doc.vector_reference = f"doc_{db_doc.document_id}"
        db.commit()
    except Exception as e:
        print(f"Indexing failed for {filename}: {e}")
        # Note: even if indexing fails, the file record is saved.
        
    return db_doc

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    document_id: int,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    # Delete from vector store
    try:
        delete_document_index(document_id)
    except Exception as e:
        print(f"Failed to delete vector index: {e}")
        
    # Delete from disk
    if os.path.exists(doc.file_path):
        try:
            os.remove(doc.file_path)
        except Exception as e:
            print(f"Failed to delete file from disk: {e}")
            
    # Delete from DB
    db.delete(doc)
    db.commit()
    return None
