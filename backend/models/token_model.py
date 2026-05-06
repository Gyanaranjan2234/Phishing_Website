"""
Password Reset Token Database Model
===================================
This file defines the PasswordResetToken table structure.
It maps a secure reset token to a specific user with an expiration time.
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database.db import Base
from datetime import datetime


class PasswordResetToken(Base):
    """
    PasswordResetToken model representing the 'password_reset_tokens' table.
    
    Attributes:
        id (int): Primary key, auto-incremented
        user_id (int): Foreign key linking to the users table
        token (str): Secure random token (Base64 URL safe, unique)
        expires_at (datetime): When the token expires
    """
    __tablename__ = "password_reset_tokens"

    # Primary key column
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The secure token
    token = Column(String, unique=True, index=True, nullable=False)
    
    # Expiration timestamp
    expires_at = Column(DateTime, nullable=False)


class EmailVerificationToken(Base):
    """
    EmailVerificationToken model representing the 'email_verification_tokens' table.
    
    Attributes:
        id (int): Primary key, auto-incremented
        user_id (int): Foreign key linking to the users table
        token (str): Secure random token for email verification
        expires_at (datetime): When the token expires
        created_at (datetime): When the token was created
    """
    __tablename__ = "email_verification_tokens"

    # Primary key column
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # User relationship
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # The secure token
    token = Column(String, unique=True, index=True, nullable=False)
    
    # Expiration timestamp
    expires_at = Column(DateTime, nullable=False)
    
    # Creation timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
