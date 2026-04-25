"""
Pydantic Schemas
================
This file defines request and response data validation schemas.
Pydantic ensures incoming data has the correct format and types.

UPDATED: Added username field to signup request and responses.
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


# ============ Request Schemas ============

class UserSignup(BaseModel):
    """
    Schema for user signup request.
    Validates that email is valid and password meets requirements.
    
    UPDATED: Now includes username field.
    """
    email: EmailStr  # Validates email format automatically
    username: str    # User's chosen username
    password: str    # Plain text password from the user


class UserLogin(BaseModel):
    """
    Schema for user login request.
    """
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    """
    Schema for forgot password requests.
    Validates that a correctly formatted email is provided.
    """
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """
    Schema for reset password requests.
    Validates token and new password format.
    """
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    """
    Schema for authenticated user to change password.
    Requires current password for verification.
    """
    user_id: int
    current_password: str
    new_password: str


# ============ Response Schemas ============

class UserResponse(BaseModel):
    """
    Schema for user response.
    Returns user data WITHOUT password for security.
    
    UPDATED: Now includes username field.
    """
    id: int
    email: str
    username: str
    
    class Config:
        # Allow reading from SQLAlchemy model (Pydantic v2 syntax)
        from_attributes = True


class AuthResponse(BaseModel):
    """
    Schema for authentication responses (login/signup).
    Standard response format for all auth endpoints.
    
    UPDATED: Data dict now includes username.
    """
    status: str  # "success" or "error"
    message: str
    data: Optional[dict] = None  # Optional additional data (includes username)
