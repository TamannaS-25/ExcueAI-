import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import datetime
from backend.app.database import get_db
from backend.app.models import User, Document
from backend.app.schemas import PPTRequest, DocumentCompareResponse
from backend.app.auth import require_manager, require_any_user
from backend.app.services.report_service import generate_pptx_report, generate_pdf_report, generate_docx_report
from backend.app.services.comparison_service import compare_documents

router = APIRouter(prefix="/reports", tags=["Reports & Document Generation"])

EXPORTS_DIR = os.path.abspath("./exports")
UPLOAD_DIR = os.path.abspath("./uploads/temp")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/generate/ppt")
def generate_ppt(
    payload: PPTRequest,
    current_user: User = Depends(require_manager),
    db: Session = Depends(get_db)
):
    document_context = ""
    if payload.uploaded_document_id:
        doc = db.query(Document).filter(Document.document_id == payload.uploaded_document_id).first()
        if doc and os.path.exists(doc.file_path):
            try:
                from backend.app.services.rag_service import extract_text_from_file
                document_context = extract_text_from_file(doc.file_path)[:1000]
            except Exception as e:
                print(f"Failed to read doc context for PPT: {e}")
                
    filepath = generate_pptx_report(
        topic=payload.topic,
        project_name=payload.project_name,
        meeting_summary=payload.meeting_summary,
        document_context=document_context
    )
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PowerPoint slide deck"
        )
        
    return FileResponse(
        path=filepath,
        filename=os.path.basename(filepath),
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation"
    )

@router.post("/generate/pdf")
def generate_pdf(
    topic: str = Form(...),
    project_name: Optional[str] = Form(""),
    meeting_summary: Optional[str] = Form(""),
    document_context: Optional[str] = Form(""),
    current_user: User = Depends(require_manager)
):
    filepath = generate_pdf_report(
        topic=topic,
        project_name=project_name,
        meeting_summary=meeting_summary,
        document_context=document_context
    )
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate PDF document"
        )
        
    return FileResponse(
        path=filepath,
        filename=os.path.basename(filepath),
        media_type="application/pdf"
    )

@router.post("/generate/docx")
def generate_docx(
    topic: str = Form(...),
    project_name: Optional[str] = Form(""),
    meeting_summary: Optional[str] = Form(""),
    document_context: Optional[str] = Form(""),
    current_user: User = Depends(require_manager)
):
    filepath = generate_docx_report(
        topic=topic,
        project_name=project_name,
        meeting_summary=meeting_summary,
        document_context=document_context
    )
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate Word document"
        )
        
    return FileResponse(
        path=filepath,
        filename=os.path.basename(filepath),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )

@router.post("/compare", response_model=DocumentCompareResponse)
async def compare_document_versions(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    current_user: User = Depends(require_manager)
):
    # Save files to temp directory
    timestamp = int(datetime.datetime.utcnow().timestamp())
    path_a = os.path.join(UPLOAD_DIR, f"{timestamp}_a_{file_a.filename}")
    path_b = os.path.join(UPLOAD_DIR, f"{timestamp}_b_{file_b.filename}")
    
    try:
        with open(path_a, "wb") as f:
            shutil.copyfileobj(file_a.file, f)
        with open(path_b, "wb") as f:
            shutil.copyfileobj(file_b.file, f)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to copy files: {str(e)}"
        )
        
    api_key = os.getenv("OPENAI_API_KEY")
    
    try:
        result = compare_documents(
            file_a_path=path_a,
            file_b_path=path_b,
            file_a_name=file_a.filename,
            file_b_name=file_b.filename,
            api_key=api_key
        )
        
        # Format the relative paths for client download
        pdf_rel = f"/api/reports/download?filename={os.path.basename(result['pdf_report_path'])}"
        docx_rel = f"/api/reports/download?filename={os.path.basename(result['docx_report_path'])}"
        
        return DocumentCompareResponse(
            summary=result["summary"],
            differences=result["differences"],
            pdf_report_path=pdf_rel,
            docx_report_path=docx_rel
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Comparison failed: {str(e)}"
        )

@router.get("/download")
def download_generated_file(
    filename: str,
    current_user: User = Depends(require_any_user)
):
    # Prevent directory traversal attacks
    clean_filename = os.path.basename(filename)
    filepath = os.path.join(EXPORTS_DIR, clean_filename)
    
    if not os.path.exists(filepath):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
        
    _, ext = os.path.splitext(clean_filename.lower())
    media_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    }
    media = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=filepath,
        filename=clean_filename,
        media_type=media
    )
