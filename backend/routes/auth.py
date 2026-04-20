"""
Authentication Routes
=====================
This file contains the /signup and /login API endpoints.
Handles user registration and authentication logic.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.user_model import User
from schemas.auth_schema import UserSignup, UserLogin, UserResponse, AuthResponse
from utils.security import hash_password, verify_password

# Create router for authentication endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    User Signup Endpoint
    
    Creates a new user account with email, username, and hashed password.
    
    UPDATED: Now accepts and stores username field.
    
    Args:
        user_data (UserSignup): Email, username, and password from request
        db (Session): Database session (injected automatically)
        
    Returns:
        AuthResponse: Success or error message in JSON format
        
    Example Request:
        POST /api/auth/signup
        {
            "email": "user@example.com",
            "username": "johndoe",
            "password": "securepassword123"
        }
        
    Example Response (Success):
        {
            "status": "success",
            "message": "User registered successfully",
            "data": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe"
            }
        }
        
    Example Response (Error):
        {
            "status": "error",
            "message": "Email already registered"
        }
    """
    
    try:
        # Validate that username is not empty
        if not user_data.username or not user_data.username.strip():
            return AuthResponse(
                status="error",
                message="Username cannot be empty"
            )
        
        # Check if user already exists with this email
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        
        if existing_user:
            # Return error if email is already taken
            return AuthResponse(
                status="error",
                message="Email already registered"
            )
        
        # Create new user with hashed password
        # UPDATED: Now includes username field
        new_user = User(
            email=user_data.email,
            username=user_data.username.strip(),  # Store trimmed username
            hashed_password=hash_password(user_data.password)
        )
        
        # Add to database and commit
        db.add(new_user)
        db.commit()
        db.refresh(new_user)  # Refresh to get the generated ID
        
        # Return success response
        # UPDATED: Response now includes username
        return AuthResponse(
            status="success",
            message="User registered successfully",
            data={
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.username
            }
        )
        
    except Exception as e:
        # Rollback on error and return error message
        db.rollback()
        return AuthResponse(
            status="error",
            message=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    User Login Endpoint
    
    Authenticates user with email and password.
    
    UPDATED: Response now includes username.
    
    Args:
        user_data (UserLogin): Email and password from request
        db (Session): Database session (injected automatically)
        
    Returns:
        AuthResponse: Success or error message in JSON format
        
    Example Request:
        POST /api/auth/login
        {
            "email": "user@example.com",
            "password": "securepassword123"
        }
        
    Example Response (Success):
        {
            "status": "success",
            "message": "Login successful",
            "data": {
                "id": 1,
                "email": "user@example.com",
                "username": "johndoe"
            }
        }
        
    Example Response (Error):
        {
            "status": "error",
            "message": "Invalid email or password"
        }
    """
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == user_data.email).first()
        
        # Check if user exists AND password is correct
        if not user or not verify_password(user_data.password, user.hashed_password):
            return AuthResponse(
                status="error",
                message="Invalid email or password"
            )
        
        # Return success with user data (without password)
        # UPDATED: Response now includes username
        return AuthResponse(
            status="success",
            message="Login successful",
            data={
                "id": user.id,
                "email": user.email,
                "username": user.username
            }
        )
        
    except Exception as e:
        return AuthResponse(
            status="error",
            message=f"Login failed: {str(e)}"
        )
