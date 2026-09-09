"""
Google Workspace Gmail Tool — Draft only, minimal scope.
Scope: https://www.googleapis.com/auth/gmail.compose
"""

import base64
from email.mime.text import MIMEText
from typing import Dict, Any, Optional

SCOPES = ["https://www.googleapis.com/auth/gmail.compose"]

def create_gmail_draft_payload(to: Optional[str], subject: str, body: str) -> Dict[str, Any]:
    """
    Creates an encoded MIME message draft payload for the Gmail API.
    """
    message = MIMEText(body)
    if to:
        message["to"] = to
    message["subject"] = subject
    
    encoded_raw = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
    return {
        "userId": "me",
        "body": {
            "message": {
                "raw": encoded_raw
            }
        }
    }

def execute_create_draft(service: Any, to: Optional[str], subject: str, body: str) -> Dict[str, Any]:
    """
    Executes Gmail users().drafts().create against an authenticated Google API service.
    """
    payload = create_gmail_draft_payload(to, subject, body)
    return service.users().drafts().create(
        userId=payload["userId"],
        body=payload["body"]
    ).execute()
