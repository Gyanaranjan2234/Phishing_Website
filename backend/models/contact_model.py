"""
Contact Message Database Model
==============================
This file defines the 'contact_messages' table structure.
Stores messages sent by users from the landing page.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database.db import Base


class ContactMessage(Base):
    """
    Model representing contact form submissions.
    
    Attributes:
        id (int): Primary key
        name (str): Person's name
        email (str): Person's email address
        message (str): The content of the message
        timestamp (datetime): When it was sent
    """
    __tablename__ = "contact_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
