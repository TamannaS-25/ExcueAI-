import re
import json
import datetime
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from backend.app.models import Task, User, Document, Meeting, Department
from backend.app.services.rag_service import query_knowledge_base

try:
    import openai
    from openai import OpenAI
except ImportError:
    openai = None

def classify_intent(query: str, api_key: Optional[str] = None) -> str:
    """
    Classify query intent: "Tasks", "Documents", "Meetings", or "ContentGen".
    """
    query_lower = query.lower()
    
    # Heuristic matching (instant & local)
    if any(w in query_lower for w in ["task", "todo", "assigned", "deadline", "due", "priority", "completion"]):
        return "Tasks"
    elif any(w in query_lower for w in ["handbook", "policy", "guideline", "sop", "document", "manual", "leave", "hr"]):
        return "Documents"
    elif any(w in query_lower for w in ["meeting", "transcript", "summary", "decision", "action item", "sync", "risks"]):
        return "Meetings"
    elif any(w in query_lower for w in ["generate", "draft", "write", "email", "report", "briefing"]):
        return "ContentGen"
        
    # OpenAI refinement
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a routing agent. Classify the user query into exactly one of: 'Tasks', 'Documents', 'Meetings', 'ContentGen'."},
                    {"role": "user", "content": f"Query: {query}"}
                ],
                max_tokens=5
            )
            val = response.choices[0].message.content.strip()
            if val in ["Tasks", "Documents", "Meetings", "ContentGen"]:
                return val
        except Exception as e:
            print(f"OpenAI intent classification failed: {e}")
            
    return "Documents" # Default fallback

def handle_task_query(query: str, current_user: User, db: Session) -> Dict[str, Any]:
    """
    Execute SQL logic based on Task queries. Respects user permissions.
    """
    query_lower = query.lower()
    
    # 1. Base Query Filter by permissions
    task_q = db.query(Task)
    if current_user.role != "Manager":
        # Employees can only query their own tasks
        task_q = task_q.filter(Task.assigned_employee_id == current_user.user_id)
        context_msg = "Authorized: Viewing your personal tasks only."
    else:
        context_msg = "Authorized: Viewing department-wide task records."
        
    # 2. Extract keywords for filtering
    # Statuses
    if "completed" in query_lower or "done" in query_lower:
        task_q = task_q.filter(Task.status == "Completed")
    elif "in progress" in query_lower or "ongoing" in query_lower:
        task_q = task_q.filter(Task.status == "In Progress")
    elif "pending" in query_lower or "todo" in query_lower or "open" in query_lower:
        task_q = task_q.filter(Task.status == "Pending")
        
    # Priorities
    if "critical" in query_lower:
        task_q = task_q.filter(Task.priority == "Critical")
    elif "high" in query_lower:
        task_q = task_q.filter(Task.priority == "High")
    elif "medium" in query_lower:
        task_q = task_q.filter(Task.priority == "Medium")
    elif "low" in query_lower:
        task_q = task_q.filter(Task.priority == "Low")
        
    # Deadlines (Due this week)
    if "this week" in query_lower or "due soon" in query_lower:
        today = datetime.date.today()
        end_of_week = today + datetime.timedelta(days=7)
        task_q = task_q.filter(Task.deadline.between(today, end_of_week))
    elif "overdue" in query_lower:
        today = datetime.date.today()
        task_q = task_q.filter(Task.deadline < today, Task.status != "Completed")
        
    tasks = task_q.order_by(Task.deadline.asc()).all()
    
    # 3. Format response
    if not tasks:
        return {
            "response": "I couldn't find any tasks matching those filters in the database.",
            "source": "PostgreSQL",
            "context": context_msg,
            "metadata": {"count": 0}
        }
        
    task_lines = []
    for t in tasks:
        emp_name = t.assigned_employee.name if t.assigned_employee else "Unassigned"
        task_lines.append(
            f"- **[{t.status}]** {t.title} (Priority: {t.priority}, Due: {t.deadline.strftime('%Y-%m-%d')}, Assigned: {emp_name})"
        )
        
    response_text = f"Based on your query, here are the matching tasks from the database:\n\n" + "\n".join(task_lines[:15])
    if len(tasks) > 15:
        response_text += f"\n\n... and {len(tasks) - 15} more tasks."
        
    return {
        "response": response_text,
        "source": "PostgreSQL",
        "context": context_msg,
        "metadata": {"count": len(tasks), "task_ids": [t.task_id for t in tasks[:15]]}
    }

def handle_document_query(query: str, current_user: User, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    RAG execution. Fetches vector matches and uses GPT or local matching to compile answers.
    """
    # Vector Search
    matches = query_knowledge_base(query, k=3, api_key=api_key)
    
    if not matches:
        return {
            "response": "I searched the knowledge base but couldn't find any documents containing information related to your request.",
            "source": "ChromaDB RAG",
            "context": "No matching chunks found in vector database.",
            "metadata": {}
        }
        
    # Assemble context chunks
    context_chunks = []
    metadata_list = []
    for m in matches:
        context_chunks.append(f"Source: {m['metadata']['filename']}\nContent: {m['text']}")
        metadata_list.append(m['metadata'])
        
    context_str = "\n\n---\n\n".join(context_chunks)
    
    # Synthesize LLM answer
    answer = ""
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
            You are a helpful assistant for ExcueAI Workspace. Answer the query using ONLY the provided document context below.
            If the context does not contain the answer, say that you don't have enough company documentation on this.
            
            Context:
            {context_str}
            
            Query: {query}
            """
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a knowledge retrieval assistant. Keep answers professional and structured."},
                    {"role": "user", "content": prompt}
                ]
            )
            answer = response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI GPT Q&A synthesis failed: {e}")
            
    if not answer:
        # Heuristic answer synthesis (offline)
        best_match = matches[0]
        filename = best_match['metadata']['filename']
        snippet = best_match['text']
        answer = (
            f"Here is what I found in the **{filename}**:\n\n"
            f"> \"... {snippet[:350]} ...\"\n\n"
            f"*(Note: Running in offline fallback mode. Connect an OpenAI API key in your settings for complete AI-synthesized responses.)*"
        )
        
    return {
        "response": answer,
        "source": "ChromaDB RAG",
        "context": f"Matched chunks from: {', '.join(set(m['metadata']['filename'] for m in matches))}",
        "metadata": {"chunks": metadata_list}
    }

def handle_meeting_query(query: str, current_user: User, db: Session, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Search meeting records for summaries, transcripts, action items.
    """
    query_lower = query.lower()
    meetings = db.query(Meeting).all()
    
    if not meetings:
        return {
            "response": "There are no meeting recordings or transcripts uploaded to the system.",
            "source": "Meeting Knowledge Base",
            "context": "Meetings list is empty.",
            "metadata": {}
        }
        
    # Check if querying a specific topic or just latest
    matched_meeting = None
    if "latest" in query_lower or "recent" in query_lower or "last" in query_lower:
        # Sort by upload date desc
        meetings.sort(key=lambda m: m.upload_date, reverse=True)
        matched_meeting = meetings[0]
    else:
        # Find meeting title that matches best
        for m in meetings:
            if any(word in m.title.lower() for word in query_lower.split()):
                matched_meeting = m
                break
        if not matched_meeting:
            matched_meeting = meetings[0] # Default to most recent if no title match

    # Format output based on what was requested
    response_text = ""
    source_context = f"Matched meeting: {matched_meeting.title}"
    
    if "action item" in query_lower:
        try:
            items = json.loads(matched_meeting.action_items)
            response_text = f"Here are the **action items** from the meeting *'{matched_meeting.title}'*:\n\n" + "\n".join(f"- {item}" for item in items)
        except:
            response_text = f"Action items for *'{matched_meeting.title}'*:\n{matched_meeting.action_items}"
    elif "risk" in query_lower:
        try:
            risks = json.loads(matched_meeting.risks)
            response_text = f"Here are the **identified risks** from the meeting *'{matched_meeting.title}'*:\n\n" + "\n".join(f"- {risk}" for risk in risks)
        except:
            response_text = f"Identified risks for *'{matched_meeting.title}'*:\n{matched_meeting.risks}"
    elif "decision" in query_lower:
        response_text = f"Key decisions from *'{matched_meeting.title}'*:\n\n{matched_meeting.summary or 'No summary compiled.'}"
    else:
        # General summary request
        response_text = (
            f"Here is the summary of the meeting: **{matched_meeting.title}** "
            f"(Uploaded on: {matched_meeting.upload_date.strftime('%Y-%m-%d')})\n\n"
            f"**Summary:**\n{matched_meeting.summary or 'No summary compiled.'}\n\n"
            f"**Transcript Snippet:**\n{matched_meeting.transcript[:300]}..."
        )
        
    return {
        "response": response_text,
        "source": "Meeting Knowledge Base",
        "context": source_context,
        "metadata": {"meeting_id": matched_meeting.meeting_id}
    }

def handle_content_gen(query: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate email copy, project briefs, reports templates.
    """
    answer = ""
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional business copywriter. Create clean, structured layouts."},
                    {"role": "user", "content": query}
                ]
            )
            answer = response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI GPT Content Gen failed: {e}")
            
    if not answer:
        # Heuristic Content Gen
        answer = (
            "### Subject: Project Update Briefing\n\n"
            "Dear Team,\n\n"
            "I am writing to provide a structured update based on our recent department reviews. "
            "We have successfully updated our vector search databases and resolved our security token rules. "
            "Moving forward, please verify your assigned tasks and update status updates on the dashboard.\n\n"
            "Best Regards,\n"
            "Enterprise Manager\n\n"
            "*(Note: running in offline fallback mode. Input an OpenAI API key for fully customizable generation.)*"
        )
        
    return {
        "response": answer,
        "source": "GPT Content Generation Engine",
        "context": "Generated utilizing business layouts.",
        "metadata": {}
    }

def process_assistant_query(query: str, current_user: User, db: Session, api_key: Optional[str] = None) -> Dict[str, Any]:
    intent = classify_intent(query, api_key)
    
    if intent == "Tasks":
        return handle_task_query(query, current_user, db)
    elif intent == "Meetings":
        return handle_meeting_query(query, current_user, db, api_key)
    elif intent == "ContentGen":
        return handle_content_gen(query, api_key)
    else: # Documents (RAG)
        return handle_document_query(query, current_user, api_key)
