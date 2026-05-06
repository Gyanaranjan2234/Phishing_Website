"""
Authentication Routes
=====================
This file contains the /signup and /login API endpoints.
Handles user registration and authentication logic.
"""

import smtplib
import os
import secrets
import httpx
import jwt
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database.db import get_db
from models.user_model import User
from models.contact_model import ContactMessage
from models.token_model import PasswordResetToken, EmailVerificationToken
from models.scan_model import ScanHistory
from schemas.auth_schema import UserSignup, UserLogin, UserResponse, AuthResponse, ForgotPasswordRequest, ResetPasswordRequest, ChangePasswordRequest, DeleteAccountRequest
from schemas.contact_schema import ContactCreate, ContactResponse
from utils.security import hash_password, verify_password
from utils.email_service import send_verification_email, send_contact_email, send_password_reset_email

# Load environment variables from .env file
load_dotenv()

# Gmail configuration from .env
GMAIL_SENDER = os.getenv("GMAIL_SENDER_EMAIL", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
GMAIL_RECEIVER = os.getenv("GMAIL_RECEIVER_EMAIL", "")

# Create router for authentication endpoints
router = APIRouter(prefix="/api/auth", tags=["Authentication"])



@router.post("/signup", response_model=AuthResponse)
def signup(user_data: UserSignup, db: Session = Depends(get_db)):
    """
    User Signup Endpoint
    
    Creates a new user account with email, username, and hashed password.
    Generates an email verification token and sends verification email.
    
    UPDATED: Now sends email verification and sets is_verified to False.
    
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
            "message": "Verification email sent. Please verify your email to complete registration.",
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
        
        # Create new user with hashed password and is_verified=False
        new_user = User(
            email=user_data.email,
            username=user_data.username.strip(),
            hashed_password=hash_password(user_data.password),
            is_verified=False  # Email not verified yet
        )
        
        # Add to database and commit
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        # Generate verification token (24-hour expiration)
        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        email_token_record = EmailVerificationToken(
            user_id=new_user.id,
            token=verification_token,
            expires_at=expires_at
        )
        db.add(email_token_record)
        db.commit()
        
        # Construct verification link using frontend URL
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
        
        # Send verification email
        email_sent = send_verification_email(
            email=new_user.email,
            verification_link=verification_link,
            username=new_user.username
        )
        
        if not email_sent:
            print(f"⚠️ Verification email failed for {new_user.email}, but signup continues")
        
        # Return success response
        return AuthResponse(
            status="success",
            message="Account created! Please verify your email to complete registration.",
            data={
                "id": new_user.id,
                "email": new_user.email,
                "username": new_user.username,
                "is_verified": new_user.is_verified
            }
        )
        
    except Exception as e:
        # Rollback on error and return error message
        db.rollback()
        return AuthResponse(
            status="error",
            message=f"Registration failed: {str(e)}"
        )


@router.get("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    """
    Email Verification Endpoint
    
    Verifies the user's email using the token sent in the verification link.
    Sets is_verified to True when successful.
    
    Args:
        token (str): Email verification token from query parameters
        db (Session): Database session (injected automatically)
        
    Returns:
        dict: Status message
        
    Example Request:
        GET /api/auth/verify-email?token=abc123...
        
    Example Response (Success):
        {
            "status": "success",
            "message": "Email verified successfully! You can now login."
        }
        
    Example Response (Error):
        {
            "status": "error",
            "message": "Invalid or expired verification token"
        }
    """
    try:
        # Find the verification token
        email_token = db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token
        ).first()
        
        if not email_token:
            return {
                "status": "error",
                "message": "Invalid verification token"
            }
        
        # Check if token is expired
        if email_token.expires_at < datetime.utcnow():
            return {
                "status": "error",
                "message": "Verification token has expired. Please sign up again."
            }
        
        # Find user and mark as verified
        user = db.query(User).filter(User.id == email_token.user_id).first()
        
        if not user:
            return {
                "status": "error",
                "message": "User not found"
            }
        
        # Set is_verified to True
        user.is_verified = True
        db.add(user)
        
        # Delete the used token
        db.delete(email_token)
        db.commit()
        
        return {
            "status": "success",
            "message": "Email verified successfully! You can now login."
        }
        
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": f"Email verification failed: {str(e)}"
        }


@router.post("/resend-verification-email", response_model=AuthResponse)
def resend_verification_email(user_data: dict, db: Session = Depends(get_db)):
    """
    Resend Email Verification
    
    Sends a new verification email to the user.
    
    Args:
        user_data (dict): Contains "email" field
        db (Session): Database session
        
    Returns:
        AuthResponse: Status message
    """
    try:
        email = user_data.get("email")
        
        if not email:
            return AuthResponse(
                status="error",
                message="Email is required"
            )
        
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            return AuthResponse(
                status="error",
                message="Email not registered"
            )
        
        if user.is_verified:
            return AuthResponse(
                status="error",
                message="Email is already verified"
            )
        
        # Delete old tokens for this user
        db.query(EmailVerificationToken).filter(
            EmailVerificationToken.user_id == user.id
        ).delete()
        
        # Generate new token
        verification_token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        email_token_record = EmailVerificationToken(
            user_id=user.id,
            token=verification_token,
            expires_at=expires_at
        )
        db.add(email_token_record)
        db.commit()
        
        # Send email
        FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
        verification_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
        
        send_verification_email(
            email=user.email,
            verification_link=verification_link,
            username=user.username
        )
        
        return AuthResponse(
            status="success",
            message="Verification email has been resent. Please check your inbox."
        )
        
    except Exception as e:
        db.rollback()
        return AuthResponse(
            status="error",
            message=f"Failed to resend verification email: {str(e)}"
        )


@router.post("/login", response_model=AuthResponse)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    User Login Endpoint
    
    Authenticates user with email and password.
    Email must be verified before login.
    
    UPDATED: Now checks is_verified status.
    
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
            "message": "Please verify your email before logging in"
        }
    """
    
    try:
        # Find user by email
        user = db.query(User).filter(User.email == user_data.email).first()
        
        # Check if user exists
        if not user:
            return AuthResponse(
                status="error",
                message="User not registered"
            )
            
        # Check if password is correct
        if not verify_password(user_data.password, user.hashed_password):
            return AuthResponse(
                status="error",
                message="Invalid email or password"
            )
        
        # Check if email is verified
        if not user.is_verified:
            return AuthResponse(
                status="error",
                message="Please verify your email before logging in"
            )
        
        # Return success with user data (without password)
        return AuthResponse(
            status="success",
            message="Login successful",
            data={
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_verified": user.is_verified
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
        GMAIL_RECEIVER = os.getenv("GMAIL_RECEIVER_EMAIL", "")
        send_contact_email(
            name=contact_data.name.strip(),
            email=contact_data.email.strip(),
            message=contact_data.message.strip(),
            receiver_email=GMAIL_RECEIVER
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


@router.post("/forgot-password", response_model=AuthResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Generates a secure password reset token and sends an email.
    """
    try:
        user = db.query(User).filter(User.email == request.email).first()
        
        if not user:
            return AuthResponse(
                status="error",
                message="Email not registered"
            )

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
            message="Password reset link has been sent to your email."
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


@router.post("/change-password", response_model=AuthResponse)
def change_password(request: ChangePasswordRequest, db: Session = Depends(get_db)):
    """
    Authenticated password change.
    Verifies old password before allowing update.
    """
    try:
        user = db.query(User).filter(User.id == request.user_id).first()
        if not user:
            return AuthResponse(status="error", message="User not found.")

        # If user has a password (not just OAuth)
        if user.hashed_password:
            # Verify current password
            if not verify_password(request.current_password, user.hashed_password):
                return AuthResponse(
                    status="error",
                    message="Incorrect current password."
                )
        
        # Update with new hashed password
        user.hashed_password = hash_password(request.new_password)
        db.add(user)
        db.commit()

        return AuthResponse(
            status="success",
            message="Password updated successfully."
        )

    except Exception as e:
        db.rollback()
        return AuthResponse(
            status="error",
            message="Failed to update password."
        )


@router.delete("/delete-account", response_model=AuthResponse)
def delete_account(request: DeleteAccountRequest, db: Session = Depends(get_db)):
    """
    Delete Account Endpoint

    Permanently removes the user record and all associated data from the database.
    After deletion, any login attempt with the same credentials will return
    "User not registered".

    Steps:
        1. Verify user exists (return 404-style error if not)
        2. For non-OAuth users, verify password before proceeding
        3. Delete all scan history records for the user
        4. Delete all password reset tokens for the user
        5. Delete all email verification tokens for the user
        6. Delete the user record itself

    Args:
        request (DeleteAccountRequest): user_id and optional password
        db (Session): Database session (injected automatically)

    Returns:
        AuthResponse: Success or error message
    """
    try:
        # Step 1: Verify user exists
        user = db.query(User).filter(User.id == request.user_id).first()

        if not user:
            return AuthResponse(
                status="error",
                message="User not found."
            )

        # Step 2: Verify password for non-OAuth users
        if not user.is_oauth_user and user.hashed_password:
            if not request.password:
                return AuthResponse(
                    status="error",
                    message="Password is required to delete your account."
                )
            if not verify_password(request.password, user.hashed_password):
                return AuthResponse(
                    status="error",
                    message="Incorrect password. Account not deleted."
                )

        # Step 3: Delete all scan history records for this user
        db.query(ScanHistory).filter(ScanHistory.user_id == request.user_id).delete()

        # Step 4: Delete all password reset tokens for this user
        db.query(PasswordResetToken).filter(PasswordResetToken.user_id == request.user_id).delete()

        # Step 5: Delete all email verification tokens for this user
        db.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == request.user_id).delete()

        # Step 6: Delete the user record permanently
        db.delete(user)
        db.commit()

        return AuthResponse(
            status="success",
            message="Account permanently deleted. You can no longer log in with these credentials."
        )

    except Exception as e:
        db.rollback()
        return AuthResponse(
            status="error",
            message=f"Failed to delete account: {str(e)}"
        )


# ============ JWT Token Utilities ============
def create_jwt_token(user_data: dict) -> str:
    """
    Create a JWT token for authenticated user.
    
    Args:
        user_data (dict): User information to encode
        
    Returns:
        str: Encoded JWT token
    """
    JWT_SECRET = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-this-in-production-2024")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
    
    payload = {
        "user_id": user_data["id"],
        "email": user_data["email"],
        "username": user_data["username"],
        "exp": expire,
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


# ============ Google OAuth 2.0 Routes ============
@router.get("/google")
def google_login():
    """
    Redirect user to Google OAuth 2.0 authorization page.
    
    This endpoint initiates the Google OAuth flow by redirecting
    the user to Google's consent screen.
    
    Returns:
        RedirectResponse: Redirects to Google OAuth consent screen
    """
    print("🔵 [Google OAuth] Initiating Google login...")
    
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
    
    if not GOOGLE_CLIENT_ID:
        print("❌ [Google OAuth] Client ID not configured!")
        raise HTTPException(status_code=500, detail="Google OAuth not configured")
    
    print(f"✅ [Google OAuth] Client ID: {GOOGLE_CLIENT_ID[:20]}...")
    print(f"✅ [Google OAuth] Redirect URI: {GOOGLE_REDIRECT_URI}")
    
    # Google OAuth authorization URL
    # IMPORTANT: URL must be properly encoded
    from urllib.parse import quote
    
    auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={quote(GOOGLE_REDIRECT_URI, safe='')}"  # URL-encode the redirect_uri
        "&response_type=code&"
        "&scope=openid%20email%20profile&"
        "&access_type=offline&"
        "&prompt=consent"
    )
    
    print(f"🔄 [Google OAuth] Full auth URL:")
    print(f"   {auth_url}")
    print(f"\n🔄 [Google OAuth] Redirecting to Google...")
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """
    Handle Google OAuth callback.
    
    After user authorizes the app, Google redirects here with an authorization code.
    We exchange the code for tokens, get user info, and create/update user in database.
    
    Args:
        request (Request): FastAPI request object
        db (Session): Database session
        
    Returns:
        RedirectResponse: Redirects to frontend dashboard with JWT token
    """
    print("\n" + "="*80)
    print("🔵 [Google Callback] Received callback request")
    print("="*80)
    
    # Get FRONTEND_URL once at the start
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8080")
    print(f"🌐 [Google Callback] Frontend URL: {FRONTEND_URL}")
    
    try:
        # Get authorization code from query parameters
        code = request.query_params.get("code")
        
        print(f"🔑 [Google Callback] CODE: {code[:30] if code else 'NONE'}...")
        print(f"🔍 [Google Callback] All query params: {dict(request.query_params)}")
        
        if not code:
            print("❌ [Google Callback] No authorization code received")
            error_param = request.query_params.get("error")
            if error_param:
                print(f"❌ [Google Callback] Error from Google: {error_param}")
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error={error_param}")
            else:
                return RedirectResponse(url=f"{FRONTEND_URL}/login?error=no_authorization_code")
        
        print(f"✅ [Google Callback] Received authorization code: {code[:20]}...")
        
        # Exchange code for access token
        GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
        GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
        GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/google/callback")
        
        print(f"🔑 [Google Callback] Client ID: {GOOGLE_CLIENT_ID[:20] if GOOGLE_CLIENT_ID else 'NONE'}...")
        print(f"🔑 [Google Callback] Client Secret: {'SET' if GOOGLE_CLIENT_SECRET else 'NOT SET'}")
        print(f"🔗 [Google Callback] Redirect URI: {GOOGLE_REDIRECT_URI}")
        
        token_url = "https://oauth2.googleapis.com/token"
        
        print(f"\n🔄 [Google Callback] Exchanging code for access token...")
        print(f"📤 [Google Callback] POST {token_url}")
        print(f"📦 [Google Callback] Data: code={code[:20]}..., client_id={GOOGLE_CLIENT_ID[:20]}..., grant_type=authorization_code")
        
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                token_url,
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code"
                }
            )
        
        print(f"📥 [Google Callback] TOKEN RESPONSE Status: {token_response.status_code}")
        print(f"📥 [Google Callback] TOKEN RESPONSE Body: {token_response.text[:200]}...")
        
        if token_response.status_code != 200:
            print(f"\n❌ [Google Callback] Token exchange FAILED!")
            print(f"❌ [Google Callback] Status Code: {token_response.status_code}")
            print(f"❌ [Google Callback] Response: {token_response.text}")
            print(f"❌ [Google Callback] Possible causes:")
            print(f"   1. Invalid Client ID or Secret")
            print(f"   2. Redirect URI mismatch")
            print(f"   3. Authorization code expired or already used")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=token_exchange_failed")
        
        print("\n✅ [Google Callback] Successfully obtained access token")
        
        token_data = token_response.json()
        access_token = token_data.get("access_token")
        
        print(f"🎫 [Google Callback] Access Token: {access_token[:30] if access_token else 'NONE'}...")
        
        # Get user info from Google
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        
        print(f"\n🔄 [Google Callback] Fetching user info from Google...")
        print(f"📤 [Google Callback] GET {userinfo_url}")
        
        async with httpx.AsyncClient() as client:
            userinfo_response = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"}
            )
        
        print(f"📥 [Google Callback] USERINFO Status: {userinfo_response.status_code}")
        print(f"📥 [Google Callback] USERINFO Body: {userinfo_response.text[:200]}...")
        
        if userinfo_response.status_code != 200:
            print(f"\n❌ [Google Callback] User info fetch FAILED!")
            print(f"❌ [Google Callback] Status Code: {userinfo_response.status_code}")
            print(f"❌ [Google Callback] Response: {userinfo_response.text}")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=userinfo_fetch_failed")
        
        google_user = userinfo_response.json()
        print(f"\n✅ [Google Callback] Received user info")
        
        # Extract user information
        google_id = google_user.get("id")
        email = google_user.get("email")
        name = google_user.get("name", email.split("@")[0] if email else "Unknown")
        picture = google_user.get("picture", "")
        
        print(f"\n👤 [Google Callback] User Details:")
        print(f"   Name: {name}")
        print(f"   Email: {email}")
        print(f"   Google ID: {google_id}")
        print(f"   Picture: {picture[:50] if picture else 'None'}...")
        
        if not email or not google_id:
            print(f"\n❌ [Google Callback] Missing required user info!")
            print(f"❌ [Google Callback] Email: {email}")
            print(f"❌ [Google Callback] Google ID: {google_id}")
            return RedirectResponse(url=f"{FRONTEND_URL}/login?error=missing_user_info")
        
        # Check if user exists (by email or google_id)
        print(f"🔍 [Google Callback] Checking if user exists...")
        user = db.query(User).filter(
            (User.email == email) | (User.google_id == google_id)
        ).first()
        
        if user:
            print(f"✅ [Google Callback] Existing user found (ID: {user.id})")
            # Update existing user with Google info if not already set
            if not user.google_id:
                user.google_id = google_id
            if not user.avatar_url and picture:
                user.avatar_url = picture
            # Mark as verified since they authenticated via Google
            user.is_verified = True
            db.commit()
            db.refresh(user)
        else:
            print(f"✨ [Google Callback] Creating new user...")
            # Create new user from Google OAuth
            new_user = User(
                email=email,
                username=name,
                hashed_password=None,  # No password for OAuth users
                google_id=google_id,
                avatar_url=picture,
                is_oauth_user=True,
                is_verified=True  # Google users are pre-verified
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user = new_user
            print(f"✅ [Google Callback] New user created (ID: {user.id})")
        
        # Create JWT token
        print(f"🎫 [Google Callback] Generating JWT token...")
        jwt_token = create_jwt_token({
            "id": user.id,
            "email": user.email,
            "username": user.username
        })
        
        # Redirect to frontend auth/success page with JWT token
        auth_success_url = f"{FRONTEND_URL}/auth/success?token={jwt_token}"
        
        print(f"\n🚀 [Google Callback] Redirecting to auth success page...")
        print(f"🔗 [Google Callback] Full URL: {auth_success_url[:100]}...")
        print("="*80 + "\n")
        
        return RedirectResponse(url=auth_success_url)
        
    except Exception as e:
        print(f"\n❌ [Google Callback] EXCEPTION occurred: {str(e)}")
        import traceback
        print(f"📋 [Google Callback] Traceback:")
        traceback.print_exc()
        print(f"🔙 [Google Callback] Redirecting to login with error")
        print("="*80 + "\n")
        return RedirectResponse(url=f"{FRONTEND_URL}/login?error=google_auth_error")
