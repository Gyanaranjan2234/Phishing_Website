"""
Authentication Routes
=====================
This file contains the /signup and /login API endpoints.
Handles user registration and authentication logic.
"""

import smtplib
import os
import secrets
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models.user_model import User
from models.contact_model import ContactMessage
from models.token_model import PasswordResetToken
from schemas.auth_schema import UserSignup, UserLogin, UserResponse, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest
from schemas.contact_schema import ContactCreate, ContactResponse
from utils.security import hash_password, verify_password

# Load environment variables from .env file
load_dotenv()

# Gmail configuration from .env
GMAIL_SENDER = os.getenv("GMAIL_SENDER_EMAIL", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
GMAIL_RECEIVER = os.getenv("GMAIL_RECEIVER_EMAIL", "support.apgs@gmail.com")

# Create router for authentication endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def send_email_notification(name: str, email: str, message: str):
    """
    Send a contact form notification email via Gmail SMTP.
    Uses App Password for secure authentication.
    """
    try:
        if not GMAIL_SENDER or not GMAIL_PASSWORD or GMAIL_PASSWORD == "your_16_char_app_password_here":
            print("⚠️  Email not configured. Skipping email notification.")
            return False

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[APGS Contact] New message from {name}"
        msg["From"] = GMAIL_SENDER
        msg["To"] = GMAIL_RECEIVER

        # HTML email body
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0f1117; color: #e0e0e0; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #1a1d27; border-radius: 12px; border: 1px solid #00ff9c33; padding: 30px;">
                <h2 style="color: #00ff9c; margin-bottom: 4px;">📩 New Contact Message</h2>
                <p style="color: #aaa; font-size: 13px; margin-top: 0;">Received via APGS Contact Form</p>
                <hr style="border-color: #00ff9c33; margin: 20px 0;" />
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; color: #aaa; width: 80px;"><strong>Name</strong></td>
                        <td style="padding: 8px; color: #e0e0e0;">{name}</td>
                    </tr>
                    <tr style="background: #ffffff08;">
                        <td style="padding: 8px; color: #aaa;"><strong>Email</strong></td>
                        <td style="padding: 8px;"><a href="mailto:{email}" style="color: #00ff9c;">{email}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; color: #aaa; vertical-align: top;"><strong>Message</strong></td>
                        <td style="padding: 8px; color: #e0e0e0; white-space: pre-wrap;">{message}</td>
                    </tr>
                </table>
                <hr style="border-color: #00ff9c33; margin: 20px 0;" />
                <p style="color: #555; font-size: 12px;">This notification was sent by the APGS backend system.</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        # Connect to Gmail SMTP and send
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_SENDER, GMAIL_RECEIVER, msg.as_string())

        print(f"✅ Email notification sent to {GMAIL_RECEIVER}")
        return True

    except Exception as e:
        # Email failure should NOT break the form submission
        print(f"⚠️  Email send failed (non-critical): {str(e)}")
        return False



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


@router.post("/contact/send", response_model=ContactResponse)
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

        # Send email notification (non-blocking - failure won't break the response)
        send_email_notification(
            name=contact_data.name.strip(),
            email=contact_data.email.strip(),
            message=contact_data.message.strip()
        )
        
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


def send_password_reset_email(email: str, reset_link: str):
    """
    Send a beautifully formatted password reset email.
    """
    try:
        if not GMAIL_SENDER or not GMAIL_PASSWORD or GMAIL_PASSWORD == "your_16_char_app_password_here":
            print("⚠️ Email not configured. Skipping reset email notification.")
            return False

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "APGS - Password Reset Request"
        msg["From"] = f"APGS Support <{GMAIL_SENDER}>"
        msg["To"] = email

        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0f1117; color: #e0e0e0; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #1a1d27; border-radius: 12px; border: 1px solid #00ff9c33; padding: 30px;">
                <h2 style="color: #00ff9c; margin-bottom: 20px; text-align: center;">Lock Verified</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your Advanced Phishing Guard System account.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #00ff9c; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p style="color: #555; font-size: 12px; margin-top: 30px;">This link will expire in 15 minutes.</p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_SENDER, email, msg.as_string())

        print(f"✅ Password reset email sent to {email}")
        return True
    except Exception as e:
        print(f"⚠️ Failed to send reset email: {str(e)}")
        return False


@router.post("/forgot-password", response_model=AuthResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a secure password reset token and sends an email.
    """
    try:
        user = db.query(User).filter(User.email == request.email).first()
        
        # We don't reveal if user exists to prevent email enumeration
        if user:
            # Delete any existing tokens for this user
            db.query(PasswordResetToken).filter(PasswordResetToken.user_id == user.id).delete()
            
            # Generate secure token
            token = secrets.token_urlsafe(32)
            expires_at = datetime.utcnow() + timedelta(minutes=15)
            
            new_token = PasswordResetToken(user_id=user.id, token=token, expires_at=expires_at)
            db.add(new_token)
            db.commit()
            
            # Construct link using frontend URL port
            FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
            reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
            
            # Dispatch email
            send_password_reset_email(user.email, reset_link)

        return AuthResponse(
            status="success",
            message="If an account exists with that email, a reset link was sent."
        )
        
    except Exception as e:
        db.rollback()
        return AuthResponse(
            status="error",
            message="An internal error occurred."
        )


@router.post("/reset-password", response_model=AuthResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    """
    Verifies the reset token and updates the user's password.
    """
    try:
        # Find active token
        token_record = db.query(PasswordResetToken).filter(PasswordResetToken.token == request.token).first()
        
        if not token_record or token_record.expires_at < datetime.utcnow():
            return AuthResponse(
                status="error",
                message="Invalid or expired reset token."
            )
            
        user = db.query(User).filter(User.id == token_record.user_id).first()
        if not user:
            return AuthResponse(status="error", message="User not found.")
            
        # Update user's password
        user.hashed_password = hash_password(request.new_password)
        db.add(user)
        
        # Delete used token
        db.delete(token_record)
        db.commit()
        
        return AuthResponse(
            status="success",
            message="Your password has been successfully reset."
        )
        
    except Exception as e:
        db.rollback()
        return AuthResponse(
            status="error",
            message="Failed to reset password."
        )
