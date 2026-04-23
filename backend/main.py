"""
Main Application Entry Point
=============================
This is the main FastAPI application file.
It sets up the app, includes routes, and handles CORS.

Run this file with: uvicorn main:app --reload
"""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database.db import engine, Base, get_db
from sqlalchemy.orm import Session
from models.user_model import User
from models.scan_model import ScanHistory
from models.token_model import PasswordResetToken
from routes.auth import router as auth_router
from routes.scans import router as scans_router

# ============ Create Database Tables ============
# This creates the 'users', 'scan_history', and 'contact_messages' tables if they don't exist
# Should be called before the app starts
Base.metadata.create_all(bind=engine)

# ============ Initialize FastAPI App ============
app = FastAPI(
    title="APGS Authentication API",
    description="Backend API for Advanced Phishing Guard System - User Authentication",
    version="1.0.0"
)

# ============ Configure CORS ============
# CORS allows your React frontend (different port) to access this backend
# Without this, browser will block requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (React)
        "http://localhost:3000",  # Alternative dev server
        "http://localhost:8080",  # Current frontend port
        "http://localhost:8081",  # Alternative frontend port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# ============ Include Routes ============
# Add authentication routes to the app
app.include_router(auth_router)
# ADDED: Add scan history routes
app.include_router(scans_router)


# ============ Root Endpoint ============
@app.get("/")
def read_root():
    """
    Root endpoint - API health check.
    Visit http://localhost:8000/ to see this message.
    """
    return {
        "status": "success",
        "message": "APGS Authentication API is running",
        "docs": "Visit http://localhost:8000/docs for API documentation"
    }

# ============ Global Stats Endpoint ============
@app.get("/api/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    """
    Public endpoint to get global platform statistics.
    Returns the total number of users and total number of scans.
    """
    from models.scan_stats_model import ScanStats
    
    total_users = db.query(User).count()
    
    # Get global scan counter (NEVER decreases)
    stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
    total_scans = stats_record.total_scans if stats_record else db.query(ScanHistory).count()
    
    return {
        "total_users": total_users,
        "total_scans": total_scans
    }


# ============ Run the Application ============
if __name__ == "__main__":
    import uvicorn
    # Run the server on port 8000 with auto-reload
    # Auto-reload restarts server when you change code
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
