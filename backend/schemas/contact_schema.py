"""
Contact Form Schemas
====================
Pydantic models for validating contact form requests and responses.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class ContactCreate(BaseModel):
    """
    Schema for sending a contact message.
    """
    name: str
    email: EmailStr
    message: str


class ContactResponse(BaseModel):
    """
    Standard response schema for contact submission.
    """
    status: str  # "success" or "error"
    message: str
    data: Optional[dict] = None
