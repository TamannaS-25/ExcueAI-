import os
import json
import random
from typing import Dict, Any, Optional
from openai import OpenAI

# Try to import OpenAI
try:
    import openai
except ImportError:
    openai = None

def transcribe_audio(filepath: str, api_key: Optional[str] = None) -> str:
    """
    Transcribe meeting audio files using OpenAI Whisper API.
    If offline or key is missing, uses mock transcripts matching seeded meetings.
    """
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            with open(filepath, "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text
        except Exception as e:
            print(f"OpenAI Whisper API failed, using fallback: {e}")
            
    # Mock transcript generator based on file name or generic
    filename = os.path.basename(filepath).lower()
    
    mock_transcripts = {
        "engineering": (
            "David: Let's discuss our progress. Frank, how is the backend refactoring going?\n"
            "Frank: I have migrated password hashing to standard bcrypt. Running into minor migration issues with user roles, but should resolve it by Wednesday.\n"
            "David: Good. Grace, what about the analytics UI?\n"
            "Grace: Recharts integrations are done. I am finishing the custom dashboard templates today. It looks clean and responsive.\n"
            "David: Excellent. We need to make sure backend security validates user tokens correctly. Let's write integration tests for JWT validation. Ivy, please coordinate with Frank to verify database security rules by Friday."
        ),
        "budget": (
            "Robert: Let's review the Q3 budget estimates. Marketing is requesting a 15% budget increase for the new campaigns.\n"
            "James: The increase is necessary to cover ad spend on new channels. We expect a 3x return in lead generation.\n"
            "Robert: I will review the metrics, but we must stay within our $200k operational limit. Let's examine department spending. Karen, please run a detailed cost comparison report by Thursday.\n"
            "Leo: Engineering and Operations expenses are stable. We might have some savings in server optimization.\n"
            "Robert: Good. Leo, compile the server cost savings report before Friday."
        ),
        "hr": (
            "Sarah: Welcome. We are reviewing our standard leave policies today. There's been a lot of questions about parental leave.\n"
            "Alice: Right now, the policy says 12 weeks of paid leave. Some employees are requesting clarification on split leave options.\n"
            "Sarah: We will update the guidelines to allow splitting parental leave into two separate blocks within 12 months. Bob, please draft the updated SOP guidelines by next Monday.\n"
            "Charlie: We also need to distribute the updated health benefits enrollment forms.\n"
            "Sarah: Charlie, please email the benefits packet to all departments by Wednesday afternoon."
        )
    }
    
    for key, val in mock_transcripts.items():
        if key in filename:
            return val
            
    return (
        "Alice: Welcome everyone to today's operations sync. We need to finalize our project timelines.\n"
        "Bob: We are slightly behind schedule on tasks assignments. I need managers to assign employees to tasks by Wednesday.\n"
        "Charlie: I can draft the timeline adjustments and distribute them to the team.\n"
        "Alice: Great. Let's make sure the analytics dashboard is fully operational for the review on Friday. Charlie, please sync with Engineering to ensure data accuracy."
    )

def analyze_transcript(transcript: str, api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Use GPT to extract summary, action items, and risks from a transcript.
    Provides a clean, rule-based text breakdown fallback.
    """
    if api_key and openai:
        try:
            client = OpenAI(api_key=api_key)
            prompt = f"""
            Analyze the following meeting transcript. Generate:
            1. A concise meeting summary.
            2. Bullet-point list of Action Items (include owner name if mentioned).
            3. Bullet-point list of potential Risks or issues.
            
            Return the output STRICTLY as a JSON object with the keys:
            "summary" (string), "action_items" (array of strings), and "risks" (array of strings).
            
            Transcript:
            {transcript}
            """
            
            response = client.chat.completions.create(
                model="gpt-4o",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system", "content": "You are an AI meeting assistant. Output valid JSON only."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            result = json.loads(response.choices[0].message.content)
            # Serialize arrays to JSON string to save to DB
            return {
                "summary": result.get("summary", ""),
                "action_items": json.dumps(result.get("action_items", [])),
                "risks": json.dumps(result.get("risks", []))
            }
        except Exception as e:
            print(f"OpenAI GPT analysis failed, using fallback: {e}")

    # Heuristic/Mock analysis
    summary = "Weekly meeting discussing team operational deliverables, workflow roadblocks, and upcoming project syncs."
    action_items = []
    risks = []
    
    # Simple regex parsing to look for "Name: " lines and identify action items
    lines = transcript.split("\n")
    for line in lines:
        if ":" in line:
            parts = line.split(":", 1)
            speaker = parts[0].strip()
            text = parts[1].strip()
            
            if any(word in text.lower() for word in ["will", "should", "need to", "please", "tasked"]):
                action_items.append(f"{speaker}: Address deliverables mentioned in transcript: '{text[:60]}...'")
                
            if any(word in text.lower() for word in ["issue", "problem", "leak", "bug", "risk", "delay", "behind"]):
                risks.append(f"Potential bottleneck noted: '{text[:60]}...'")

    if not action_items:
        action_items = ["Team: Coordinate with departments to verify weekly deliverables", "Manager: Follow up on deadline extensions"]
    if not risks:
        risks = ["Timeline delays if deliverables are not assigned by Wednesday", "Security configuration lapses due to insufficient testing coverage"]
        
    return {
        "summary": summary,
        "action_items": json.dumps(action_items),
        "risks": json.dumps(risks)
    }
