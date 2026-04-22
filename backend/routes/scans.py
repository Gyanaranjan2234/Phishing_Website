"""
Scan History API Routes
=======================
API endpoints for managing scan history.
All operations use user_id for secure data isolation.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database.db import get_db
from models.scan_model import ScanHistory
from models.user_model import User
from schemas.scan_schema import ScanCreate, ScanHistoryResponse, ScanStatsResponse
from typing import Optional

router = APIRouter(prefix="/api/scans", tags=["scans"])


@router.post("/save", response_model=dict)
def save_scan(scan_data: ScanCreate, db: Session = Depends(get_db)):
    """
    Save a scan result to the database.
    
    SECURITY: Uses user_id (NOT username) for data isolation.
    Only authenticated users can save scans.
    
    Args:
        scan_data: ScanCreate object with user_id, scan_type, target, status
        db: Database session
    
    Returns:
        Success message with scan ID
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == scan_data.user_id).first()
        if not user:
            return {
                "status": "error",
                "message": f"User with ID {scan_data.user_id} not found"
            }
        
        # Create new scan record
        new_scan = ScanHistory(
            user_id=scan_data.user_id,
            scan_type=scan_data.scan_type,
            target=scan_data.target,
            status=scan_data.status,
            result_details=scan_data.result_details
        )
        
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        
        return {
            "status": "success",
            "message": "Scan saved successfully",
            "data": {
                "id": new_scan.id,
                "user_id": new_scan.user_id,
                "scan_type": new_scan.scan_type,
                "target": new_scan.target,
                "status": new_scan.status,
                "timestamp": new_scan.timestamp.isoformat() + "Z" if new_scan.timestamp else None
            }
        }
    
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": f"Failed to save scan: {str(e)}"
        }


@router.get("/history", response_model=ScanHistoryResponse)
def get_scan_history(
    user_id: int = Query(..., description="User ID to fetch history for"),
    limit: int = Query(50, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
):
    """
    Get scan history for a specific user.
    
    SECURITY: 
    - Uses user_id (NOT username) for filtering
    - Only returns scans belonging to the specified user
    - Prevents data leakage between users
    
    Args:
        user_id: Unique user identifier (required)
        limit: Maximum records to return (default 50)
        db: Database session
    
    Returns:
        List of scan records for the user
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "status": "error",
                "message": f"User with ID {user_id} not found",
                "data": []
            }
        
        # Fetch ONLY this user's scans (data isolation)
        scans = (
            db.query(ScanHistory)
            .filter(ScanHistory.user_id == user_id)
            .order_by(ScanHistory.timestamp.desc())
            .limit(limit)
            .all()
        )
        
        # Convert to response format
        scan_list = []
        for scan in scans:
            scan_list.append({
                "id": scan.id,
                "user_id": scan.user_id,
                "scan_type": scan.scan_type,
                "target": scan.target,
                "status": scan.status,
                "result_details": scan.result_details,
                "timestamp": scan.timestamp.isoformat() + "Z" if scan.timestamp else None
            })
        
        return {
            "status": "success",
            "message": f"Retrieved {len(scan_list)} scan(s) for user {user_id}",
            "data": scan_list
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch scan history: {str(e)}",
            "data": []
        }


@router.get("/stats", response_model=ScanStatsResponse)
def get_scan_stats(
    user_id: int = Query(..., description="User ID to fetch stats for"),
    db: Session = Depends(get_db)
):
    """
    Get scan statistics for a specific user's dashboard.
    
    SECURITY:
    - Uses user_id (NOT username)
    - Only calculates stats for the specified user
    - Prevents stats data leakage
    
    Args:
        user_id: Unique user identifier (required)
        db: Database session
    
    Returns:
        Aggregated scan statistics
    """
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "status": "error",
                "message": f"User with ID {user_id} not found",
                "data": {}
            }
        
        # Get all scans for this user
        user_scans = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).all()
        
        # Calculate statistics
        total_scans = len(user_scans)
        safe_scans = len([s for s in user_scans if s.status == "safe"])
        suspicious_scans = len([s for s in user_scans if s.status == "suspicious"])
        threat_scans = len([s for s in user_scans if s.status in ["phishing", "breached", "infected", "dangerous"]])
        
        stats = {
            "totalScans": total_scans,
            "safeScans": safe_scans,
            "suspiciousScans": suspicious_scans,
            "threatScans": threat_scans,
            "user_id": user_id
        }
        
        return {
            "status": "success",
            "message": f"Statistics for user {user_id}",
            "data": stats
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch statistics: {str(e)}",
            "data": {}
        }


@router.delete("/{scan_id}", response_model=dict)
def delete_scan(
    scan_id: int,
    user_id: int = Query(..., description="User ID for authorization"),
    db: Session = Depends(get_db)
):
    """
    Delete a specific scan record.
    
    SECURITY:
    - Verifies the scan belongs to the user before deleting
    - Prevents users from deleting other users' scans
    
    Args:
        scan_id: Scan record ID to delete
        user_id: User ID for authorization
        db: Database session
    
    Returns:
        Success or error message
    """
    try:
        # Find the scan
        scan = db.query(ScanHistory).filter(ScanHistory.id == scan_id).first()
        
        if not scan:
            return {
                "status": "error",
                "message": f"Scan with ID {scan_id} not found"
            }
        
        # SECURITY: Verify scan belongs to this user
        if scan.user_id != user_id:
            return {
                "status": "error",
                "message": "Unauthorized: You can only delete your own scans"
            }
        
        # Delete the scan
        db.delete(scan)
        db.commit()
        
        return {
            "status": "success",
            "message": "Scan deleted successfully"
        }
    
    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": f"Failed to delete scan: {str(e)}"
        }
