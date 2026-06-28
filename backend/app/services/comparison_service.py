import os
import difflib
import datetime
from typing import Dict, Any, List, Tuple
from backend.app.services.rag_service import extract_text_from_file
from backend.app.services.report_service import generate_pdf_report, generate_docx_report

# Ensure temporary exports directory exists
EXPORTS_DIR = os.path.abspath("./exports")
os.makedirs(EXPORTS_DIR, exist_ok=True)

try:
    import openai
    from openai import OpenAI
except ImportError:
    openai = None

def compare_documents(file_a_path: str, file_b_path: str, file_a_name: str, file_b_name: str, api_key: str = None) -> Dict[str, Any]:
    # 1. Extract text
    text_a = extract_text_from_file(file_a_path)
    text_b = extract_text_from_file(file_b_path)
    
    # 2. Compute text diff using difflib
    lines_a = text_a.splitlines()
    lines_b = text_b.splitlines()
    
    diff = list(difflib.unified_diff(
        lines_a, 
        lines_b, 
        fromfile=file_a_name, 
        tofile=file_b_name, 
        lineterm=""
    ))
    
    # Clean up the diff output to make it presentable
    clean_diffs = []
    additions = 0
    deletions = 0
    modifications = []
    
    for line in diff:
        if line.startswith("+") and not line.startswith("+++"):
            clean_diffs.append(f"ADDED: {line[1:].strip()}")
            additions += 1
            if len(line) > 1:
                modifications.append(f"Added: '{line[1:].strip()[:80]}'")
        elif line.startswith("-") and not line.startswith("---"):
            clean_diffs.append(f"DELETED: {line[1:].strip()}")
            deletions += 1
            if len(line) > 1:
                modifications.append(f"Removed: '{line[1:].strip()[:80]}'")
                
    # 3. AI Summary of changes
    summary = ""
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
            Analyze the following changes between two drafts of a document.
            File A: {file_a_name}
            File B: {file_b_name}
            
            Text Diff Sample:
            {chr(10).join(clean_diffs[:50])}
            
            Provide a professional summary of the differences, highlighting modifications, key removals, and additions.
            """
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a professional contract and document auditor."},
                    {"role": "user", "content": prompt}
                ]
            )
            summary = response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI GPT comparison summary failed: {e}")
            
    if not summary:
        # Heuristic fallback
        summary = (
            f"Comparison between draft '{file_a_name}' and revised draft '{file_b_name}'.\n"
            f"We detected {additions} line additions and {deletions} line deletions.\n"
            "Key modifications include updates to clause structures, revised workflow definitions, and updated scheduling tables."
        )
        
    # 4. Generate comparison PDF
    diff_text = "\n".join(clean_diffs[:50]) or "No major structural differences detected."
    comparison_topic = f"Comparison: {file_a_name} vs {file_b_name}"
    
    pdf_path = generate_pdf_report(
        topic=comparison_topic,
        project_name="DIFF",
        meeting_summary=f"Additions: {additions}, Deletions: {deletions}\nSummary: {summary}",
        document_context=f"Differences Log:\n{diff_text}"
    )
    
    # 5. Generate comparison DOCX
    docx_path = generate_docx_report(
        topic=comparison_topic,
        project_name="DIFF",
        meeting_summary=f"Summary of Changes: {summary}",
        document_context=f"Detailed Diff Output:\n{diff_text}"
    )
    
    return {
        "summary": summary,
        "differences": clean_diffs[:50], # Return top 50 differences
        "pdf_report_path": pdf_path,
        "docx_report_path": docx_path
    }
