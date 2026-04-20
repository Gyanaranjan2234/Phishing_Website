"""
Contact API Routes
==================
Endpoint for receiving and storing contact form messages.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.contact_model import ContactMessage
from schemas.contact_schema import ContactCreate, ContactResponse

router = APIRouter(prefix="/api/contact", tags=["Contact"])


@router.post("/send", response_model=ContactResponse)
def send_contact_message(contact_data: ContactCreate, db: Session = Depends(get_db)):
    """
    Receive a contact form message and save it to the database.
    """
    try:
        # Create new database record
        new_message = ContactMessage(
            name=contact_data.name.strip(),
            email=contact_data.email.strip(),
            message=contact_data.message.strip()
        )
        
        db.add(new_message)
        db.commit()
        db.refresh(new_message)
        
        return ContactResponse(
            status="success",
            message="Your message has been received! We will get back to you soon."
        )
        
    except Exception as e:
        db.rollback()
        return ContactResponse(
            status="error",
            message=f"Failed to send message: {str(e)}"
        )
