"""
Scan History Database Model
===========================
This file defines the ScanHistory table structure in the database.
Each scan record is associated with a user via user_id (foreign key).
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.db import Base
from datetime import datetime


class ScanHistory(Base):
    """
    ScanHistory model representing the 'scan_history' table in the database.
    
    Attributes:
        id (int): Primary key, auto-incremented
        user_id (int): Foreign key referencing users.id (REQUIRED for data isolation)
        scan_type (str): Type of scan (url, email, file, password)
        target (str): The scanned target (URL, email, filename, etc.)
        status (str): Scan result status (safe, suspicious, phishing, breached, etc.)
        result_details (str): JSON string with detailed scan results (optional)
        timestamp (datetime): When the scan was performed
    """
    __tablename__ = "scan_history"

    # Primary key column
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Foreign key to users table - CRITICAL for user data isolation
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Scan type - url, email, file, password
    scan_type = Column(String(50), nullable=False)
    
    # What was scanned (URL, email address, filename, etc.)
    target = Column(String(500), nullable=False)
    
    # Scan result status
    status = Column(String(50), nullable=False)
    
    # Detailed scan results (stored as JSON string)
    result_details = Column(String(5000), nullable=True)
    
    # SECURITY: Stored hash of target (only for password scans) to detect reuse/similarity
    hashed_target = Column(String(128), nullable=True, index=True)
    
    # Timestamp of when scan was performed
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to User model (optional, for easy querying)
    # user = relationship("User", back_populates="scans")
