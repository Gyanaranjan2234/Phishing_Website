"""
User Database Model
===================
This file defines the User table structure in the database.
Each user has: id, email, username, and hashed_password.
"""

from sqlalchemy import Column, Integer, String, Boolean
from database.db import Base


class User(Base):
    """
    User model representing the 'users' table in the database.
    
    Attributes:
        id (int): Primary key, auto-incremented
        email (str): User's email address (unique, required)
        username (str): User's username (required)
        hashed_password (str): Bcrypt-hashed password (optional for OAuth users)
        google_id (str): Google OAuth ID (optional)
        avatar_url (str): Profile picture URL from Google (optional)
        is_oauth_user (bool): True if user signed up via OAuth
    """
    __tablename__ = "users"

    # Primary key column
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Email column - must be unique and not null
    email = Column(String, unique=True, index=True, nullable=False)
    
    # Username column - required, not null
    username = Column(String, nullable=False)
    
    # Password column - stores the bcrypt hash, not plain text
    # Optional for OAuth users (Google login)
    hashed_password = Column(String, nullable=True)
    
    # Google OAuth ID
    google_id = Column(String, unique=True, index=True, nullable=True)
    
    # Profile picture URL from Google
    avatar_url = Column(String, nullable=True)
    
    # Flag to identify OAuth users
    is_oauth_user = Column(Boolean, default=False)
