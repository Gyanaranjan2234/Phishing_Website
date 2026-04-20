"""
Scan History API Schemas
========================
Pydantic schemas for validating scan history API requests and responses.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ScanCreate(BaseModel):
    """
    Schema for creating a new scan record.
    Used when saving scan results to database.
    """
    user_id: int  # REQUIRED - unique user identifier (NOT username)
    scan_type: str  # url, email, file, password
    target: str  # What was scanned
    status: str  # safe, suspicious, phishing, breached, etc.
    result_details: Optional[str] = None  # Optional JSON details


class ScanResponse(BaseModel):
    """
    Schema for scan history response.
    Returns scan data to frontend.
    """
    id: int
    user_id: int
    scan_type: str
    target: str
    status: str
    result_details: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True  # Allows ORM model conversion


class ScanHistoryResponse(BaseModel):
    """
    Schema for scan history list response.
    Returns multiple scan records.
    """
    status: str
    message: str
    data: list  # List of scan records


class ScanStatsResponse(BaseModel):
    """
    Schema for scan statistics response.
    Returns aggregated scan statistics for dashboard.
    """
    status: str
    message: str
    data: dict  # Statistics data
