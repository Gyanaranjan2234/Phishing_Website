"""
Global Scan Statistics Database Model
======================================
This file defines the ScanStats table for tracking global scan counters.
These counters ONLY increase and NEVER decrease, even when users clear history.
"""

from sqlalchemy import Column, Integer, DateTime
from database.db import Base
from datetime import datetime


class ScanStats(Base):
    """
    ScanStats model representing the 'scan_stats' table in the database.
    
    This table stores global counters that track the total number of scans
    performed across all users. These values are NEVER decremented.
    
    Attributes:
        id (int): Primary key (single row, always id=1)
        total_scans (int): Global counter of all scans performed (NEVER decreases)
        last_updated (datetime): Timestamp of last update
    """
    __tablename__ = "scan_stats"

    # Primary key - we'll only have one row (id=1)
    id = Column(Integer, primary_key=True, default=1)
    
    # Global scan counter - ONLY increments, NEVER decrements
    total_scans = Column(Integer, nullable=False, default=0)
    
    # Timestamp of last update
    last_updated = Column(DateTime, default=datetime.utcnow, nullable=False)
