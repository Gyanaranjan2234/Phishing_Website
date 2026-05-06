"""
Email Service
=============
Handles sending emails via Gmail SMTP.
Used for verification emails, password reset, and notifications.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Gmail configuration
GMAIL_SENDER = os.getenv("GMAIL_SENDER_EMAIL", "")
GMAIL_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")


def send_verification_email(email: str, verification_link: str, username: str = "User") -> bool:
    """
    Send email verification link to user.
    
    Args:
        email (str): Recipient email address
        verification_link (str): Full URL for email verification (e.g., http://localhost:5173/verify-email?token=XYZ)
        username (str): User's name for personalization
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if not GMAIL_SENDER or not GMAIL_PASSWORD or GMAIL_PASSWORD == "your_16_char_app_password_here":
            print("⚠️  Email not configured. Skipping verification email.")
            return False

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "[APGS] Verify Your Email Address"
        msg["From"] = GMAIL_SENDER
        msg["To"] = email

        # HTML email body
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #0f1117; color: #e0e0e0; padding: 20px;">
            <div style="max-width: 600px; margin: auto; background: #1a1d27; border-radius: 12px; border: 1px solid #00ff9c33; padding: 30px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #00ff9c; margin: 0;">✉️ Email Verification</h2>
                </div>
                <hr style="border-color: #00ff9c33; margin: 20px 0;" />
                <p style="color: #e0e0e0; font-size: 16px;">Hi <strong>{username}</strong>,</p>
                <p style="color: #aaa; line-height: 1.6;">
                    Thank you for signing up with <strong>APGS (Advanced Phishing Guard System)</strong>!
                </p>
                <p style="color: #aaa; line-height: 1.6;">
                    To complete your registration, please verify your email address by clicking the button below:
                </p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background: linear-gradient(90deg, #00ff9c, #00d4ff); color: #000; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; font-size: 16px;">
                        Verify Email
                    </a>
                </div>
                <p style="color: #aaa; font-size: 12px; margin-top: 20px;">
                    Or paste this link in your browser: <br/>
                    <a href="{verification_link}" style="color: #00ff9c; word-break: break-all;">{verification_link}</a>
                </p>
                <p style="color: #aaa; font-size: 12px; margin-top: 20px;">
                    This link expires in 24 hours.
                </p>
                <hr style="border-color: #00ff9c33; margin: 20px 0;" />
                <p style="color: #555; font-size: 12px; text-align: center;">
                    If you didn't create this account, please ignore this email.
                </p>
                <p style="color: #555; font-size: 12px; text-align: center;">
                    © 2026 APGS - Advanced Phishing Guard System
                </p>
            </div>
        </body>
        </html>
        """

        msg.attach(MIMEText(html_body, "html"))

        # Connect to Gmail SMTP and send
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL_SENDER, GMAIL_PASSWORD)
            server.sendmail(GMAIL_SENDER, email, msg.as_string())

        print(f"✅ Verification email sent to {email}")
        return True

    except Exception as e:
        print(f"⚠️  Verification email send failed: {str(e)}")
        return False


def send_contact_email(name: str, email: str, message: str, receiver_email: str) -> bool:
    """
    Send a contact form notification email.
    
    Args:
        name (str): Sender's name
        email (str): Sender's email
        message (str): Message content
        receiver_email (str): Email to send notification to
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        if not GMAIL_SENDER or not GMAIL_PASSWORD or GMAIL_PASSWORD == "your_16_char_app_password_here":
            print("⚠️  Email not configured. Skipping contact notification.")
            return False

        # Create email message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[APGS Contact] New message from {name}"
        msg["From"] = GMAIL_SENDER
        msg["To"] = receiver_email

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
            server.sendmail(GMAIL_SENDER, receiver_email, msg.as_string())

        print(f"✅ Contact notification sent to {receiver_email}")
        return True

    except Exception as e:
        print(f"⚠️  Contact email send failed: {str(e)}")
        return False


def send_password_reset_email(email: str, reset_link: str) -> bool:
    """
    Send a beautifully formatted password reset email.
    
    Args:
        email (str): Recipient email address
        reset_link (str): Full URL for password reset (e.g., http://localhost:5173/reset-password?token=XYZ)
        
    Returns:
        bool: True if email sent successfully, False otherwise
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
                <h2 style="color: #00ff9c; margin-bottom: 20px; text-align: center;">🔐 Password Reset</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password for your Advanced Phishing Guard System account.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #00ff9c; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
                </p>
                <p>If you didn't request a password reset, you can safely ignore this email.</p>
                <p style="color: #555; font-size: 12px; margin-top: 20px;">This link will expire in 15 minutes.</p>
                <hr style="border-color: #00ff9c33; margin: 20px 0;" />
                <p style="color: #555; font-size: 12px; text-align: center;">© 2026 APGS - Advanced Phishing Guard System</p>
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
