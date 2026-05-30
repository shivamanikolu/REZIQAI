from typing import Optional, Any, Dict
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import httpx
from datetime import datetime

from app.config import settings
from app.db import get_db
from app.services.auth_service import get_current_user
from app.services.rate_limiter import check_feedback_rate_limit

router = APIRouter(prefix="/api/feedback", tags=["Feedback System"])

class FeedbackSubmitRequest(BaseModel):
    user_id: Optional[str] = None
    full_name: str
    email: EmailStr
    feedback_type: str
    feedback_message: str
    rating: int
    browser_metadata: Optional[Dict[str, Any]] = None
    device_metadata: Optional[Dict[str, Any]] = None

async def send_resend_email(req: FeedbackSubmitRequest):
    if not settings.RESEND_API_KEY:
        print("Warning: RESEND_API_KEY is not defined. Skipping email delivery.")
        return
        
    headers = {
        "Authorization": f"Bearer {settings.RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    browser = req.browser_metadata.get("userAgent", "Unknown Browser") if req.browser_metadata else "Unknown Browser"
    device = f"{req.browser_metadata.get('width', '?')}x{req.browser_metadata.get('height', '?')}" if req.browser_metadata else "Unknown Device"
    
    payload = {
        "from": "REZIQ Telemetry <onboarding@resend.dev>",
        "to": [settings.FEEDBACK_RECEIVER_EMAIL],
        "subject": f"REZIQ Telemetry: New {req.feedback_type} Feedback Received",
        "html": f"""
        <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f2; color: #0a0a0a; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.015);">
                <h2 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 15px; margin-bottom: 20px;">New System Feedback Submission</h2>
                
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5); width: 140px;">User Name</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">{req.full_name}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">User Email</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600;"><a href="mailto:{req.email}" style="color: #0a0a0a; text-decoration: underline;">{req.email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">Category</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600; text-transform: capitalize;">{req.feedback_type}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">ATS Rating</td>
                        <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">{"★" * req.rating}{"☆" * (5 - req.rating)} ({req.rating}/5)</td>
                    </tr>
                </table>
                
                <div style="margin-bottom: 30px;">
                    <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5); margin-bottom: 10px;">Critique Message</p>
                    <blockquote style="background-color: #f5f5f2; border-left: 2px solid #0a0a0a; padding: 18px; margin: 0; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.6; color: rgba(10,10,10,0.85); font-style: italic;">
                        "{req.feedback_message}"
                    </blockquote>
                </div>
                
                <div style="border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px; font-size: 11px; color: rgba(10,10,10,0.5); line-height: 1.65;">
                    <p style="margin: 3px 0;"><strong>Timestamp:</strong> {timestamp}</p>
                    <p style="margin: 3px 0;"><strong>Browser Agent:</strong> {browser}</p>
                    <p style="margin: 3px 0;"><strong>Resolution:</strong> {device}</p>
                </div>
            </div>
        </body>
        </html>
        """
    }
    
    try:
        async with httpx.AsyncClient() as client:
            res = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
            if res.status_code not in [200, 201, 202]:
                print(f"Resend HTTP error {res.status_code}: {res.text}")
            else:
                print("Feedback email successfully dispatched via Resend API.")
    except Exception as e:
        print(f"Resend Exception: {e}")

@router.post("/submit", dependencies=[Depends(check_feedback_rate_limit), Depends(get_current_user)])
async def submit_feedback(req: FeedbackSubmitRequest):
    db = get_db()
    if not db:
        raise HTTPException(status_code=500, detail="Database client is offline.")
        
    try:
        # Prepare Supabase insert payload
        db_payload = {
            "user_id": req.user_id,
            "full_name": req.full_name,
            "email": req.email,
            "feedback_type": req.feedback_type,
            "feedback_message": req.feedback_message,
            "rating": req.rating,
            "browser_metadata": req.browser_metadata or {},
            "device_metadata": req.device_metadata or {}
        }
        
        # Write to public.feedback
        res = db.table("feedback").insert(db_payload).execute()
        
        return {
            "status": "success",
            "message": "Feedback persisted.",
            "data": res.data if res else []
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")
