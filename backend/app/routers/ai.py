import os
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models import User
from backend.app.schemas import ChatQueryRequest, ChatQueryResponse
from backend.app.auth import require_any_user
from backend.app.services.ai_assistant import process_assistant_query

router = APIRouter(prefix="/ai", tags=["Enterprise AI Assistant"])

@router.post("/chat", response_model=ChatQueryResponse)
def assistant_chat(
    payload: ChatQueryRequest,
    current_user: User = Depends(require_any_user),
    db: Session = Depends(get_db)
):
    api_key = os.getenv("OPENAI_API_KEY")
    try:
        result = process_assistant_query(
            query=payload.message,
            current_user=current_user,
            db=db,
            api_key=api_key
        )
        return ChatQueryResponse(
            response=result["response"],
            source=result["source"],
            context=result.get("context"),
            metadata=result.get("metadata")
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI processing failed: {str(e)}"
        )
