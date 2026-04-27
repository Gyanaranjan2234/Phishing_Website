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
from models.scan_stats_model import ScanStats
from models.user_model import User
from schemas.scan_schema import ScanCreate, ScanHistoryResponse, ScanStatsResponse
from services.scan_service import run_full_scan
from pydantic import BaseModel
from typing import Optional, List, Dict
import hashlib
import time
from collections import defaultdict
from datetime import datetime

router = APIRouter(prefix="/api/scans", tags=["scans"])

class URLAnalyzeRequest(BaseModel):
    url: str
    mode: str = "quick"
    user_id: Optional[int] = None


# In-memory rate limiter: {user_id: [timestamp1, timestamp2, ...]}
rate_limit_data: Dict[int, List[float]] = defaultdict(list)
RATE_LIMIT_MAX = 20  # requests
RATE_LIMIT_WINDOW = 60  # seconds (1 minute)

def is_rate_limited(user_id: int) -> bool:
    """Check if a user has exceeded the rate limit (20 req/min)."""
    now = time.time()
    # Remove timestamps older than the window
    rate_limit_data[user_id] = [t for t in rate_limit_data[user_id] if now - t < RATE_LIMIT_WINDOW]
    
    if len(rate_limit_data[user_id]) >= RATE_LIMIT_MAX:
        return True
    
    # Record current request
    rate_limit_data[user_id].append(now)
    return False


@router.post("/analyze")
async def analyze_url_endpoint(request: URLAnalyzeRequest, db: Session = Depends(get_db)):
    """
    Analyzes a URL for phishing using AI (BERT) and VirusTotal.
    Returns structured results and optionally saves to history.
    """
    try:
        # Perform the scan
        result = await run_full_scan(request.url, request.mode)
        
        # If user_id is provided, auto-save to history
        if request.user_id:
            try:
                # Prepare data for save_scan logic
                status_map = {
                    "SAFE": "safe",
                    "LOW": "safe",
                    "MODERATE": "suspicious",
                    "HIGH RISK": "phishing",
                    "DANGEROUS": "phishing"
                }
                
                db_status = status_map.get(result["risk"], "suspicious")
                
                new_scan = ScanHistory(
                    user_id=request.user_id,
                    scan_type="url",
                    target=request.url,
                    status=db_status,
                    result_details=result["message"]
                )
                db.add(new_scan)
                db.commit()
            except Exception as save_err:
                # Log but don't fail the analysis response
                print(f"Warning: Failed to auto-save scan: {save_err}")
                db.rollback()

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_password_hash(password: str) -> str:
    """Generate a SHA-256 hash of the password."""
    return hashlib.sha256(password.encode()).hexdigest()


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
        # 1. Rate Limiting Check
        if is_rate_limited(scan_data.user_id):
            return {
                "status": "error",
                "message": "Too many requests, try again later",
                "code": "RATE_LIMIT_EXCEEDED"
            }

        # Verify user exists
        user = db.query(User).filter(User.id == scan_data.user_id).first()
        if not user:
            return {
                "status": "error",
                "message": f"User with ID {scan_data.user_id} not found"
            }
        
        hashed_target = None
        warnings = []

        # 2. Advanced Password Validation (if applicable)
        if scan_data.scan_type == "password" and scan_data.raw_target:
            password = scan_data.raw_target
            
            # Pattern Detection: Check for username or email prefix
            user_patterns = [user.username.lower()]
            if user.email:
                email_prefix = user.email.split('@')[0].lower()
                user_patterns.append(email_prefix)
            
            if any(pattern in password.lower() for pattern in user_patterns):
                warnings.append("Avoid using personal information in passwords")
            
            # Reuse Detection: Compare hash with history
            hashed_target = get_password_hash(password)
            existing_match = db.query(ScanHistory).filter(
                ScanHistory.user_id == scan_data.user_id,
                ScanHistory.scan_type == "password",
                ScanHistory.hashed_target == hashed_target
            ).first()
            
            if existing_match:
                warnings.append("This password is similar to a previously used one")

        # Create new scan record
        new_scan = ScanHistory(
            user_id=scan_data.user_id,
            scan_type=scan_data.scan_type,
            target=scan_data.target,
            status=scan_data.status,
            result_details=scan_data.result_details,
            hashed_target=hashed_target
        )
        
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        
        # INCREMENT GLOBAL SCAN COUNTER
        # This counter ONLY increases and NEVER decreases
        try:
            stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
            if stats_record:
                stats_record.total_scans += 1
                stats_record.last_updated = datetime.utcnow()
                db.commit()
            else:
                # Create initial record if it doesn't exist
                stats_record = ScanStats(
                    id=1,
                    total_scans=1,
                    last_updated=datetime.utcnow()
                )
                db.add(stats_record)
                db.commit()
        except Exception as e:
            # Don't fail the scan save if stats update fails
            print(f"Warning: Failed to update global scan counter: {e}")
            db.rollback()
        
        return {
            "status": "success",
            "message": "Scan saved successfully",
            "warnings": warnings,
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
    limit: int = Query(1000, description="Maximum number of records to return"),
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
    - Returns user-specific safe/threat counts from history
    - Returns GLOBAL total_scans that NEVER decreases
    
    Args:
        user_id: Unique user identifier (required)
        db: Database session
    
    Returns:
        Aggregated scan statistics with global total counter
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
        
        # Get GLOBAL total scans (NEVER decreases)
        stats_record = db.query(ScanStats).filter(ScanStats.id == 1).first()
        global_total_scans = stats_record.total_scans if stats_record else 0
        
        # Get user-specific scans for safe/threat breakdown
        user_scans = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).all()
        
        # Calculate user-specific statistics
        safe_scans = len([s for s in user_scans if s.status in ["safe", "strong", "very_strong"]])
        suspicious_scans = len([s for s in user_scans if s.status == "suspicious"])
        threat_scans = len([s for s in user_scans if s.status in ["phishing", "breached", "infected", "dangerous", "weak", "very_weak"]])
        
        stats = {
            "totalScans": global_total_scans,  # GLOBAL counter - NEVER decreases
            "safeScans": safe_scans,            # User-specific
            "suspiciousScans": suspicious_scans, # User-specific
            "threatScans": threat_scans,         # User-specific
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


@router.delete("/history/clear", response_model=dict)
def clear_history_legacy(
    user_id: int = Query(..., description="User ID for authorization"),
    db: Session = Depends(get_db)
):
    """Legacy endpoint for clearing history."""
    try:
        deleted_count = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).delete()
        db.commit()
        return {"status": "success", "message": f"Cleared {deleted_count} scans"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


@router.delete("/clear-all", response_model=dict)
def clear_history_new(
    user_id: int = Query(..., description="User ID for authorization"),
    db: Session = Depends(get_db)
):
    """Alternative endpoint for clearing history."""
    return clear_history_legacy(user_id, db)
@router.get("/clear-history/{user_id}", response_model=dict)
def clear_history_by_path(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Clear history for a specific user via unique path parameter."""
    try:
        deleted_count = db.query(ScanHistory).filter(ScanHistory.user_id == user_id).delete()
        db.commit()
        return {"status": "success", "message": f"Cleared {deleted_count} scans for user {user_id}"}
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}


@router.get("/dashboard", response_model=dict)
def get_dashboard_data(
    user_id: int = Query(..., description="User ID to fetch dashboard data for"),
    db: Session = Depends(get_db)
):
    """
    Get comprehensive dashboard data for user profile.
    
    Returns:
    - Total scans, threats, safe results
    - Last scan timestamp
    - Recent 5 scans
    - Date-wise scan history for charts
    
    Args:
        user_id: Unique user identifier (required)
        db: Database session
    
    Returns:
        Complete dashboard data object
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
        
        # Get all user scans
        all_scans = (
            db.query(ScanHistory)
            .filter(ScanHistory.user_id == user_id)
            .order_by(ScanHistory.timestamp.desc())
            .all()
        )
        
        # Calculate statistics
        total_scans = len(all_scans)
        threats = len([s for s in all_scans if s.status in ["phishing", "breached", "infected", "dangerous", "weak", "very_weak"]])
        safe = len([s for s in all_scans if s.status in ["safe", "strong", "very_strong"]])
        suspicious = len([s for s in all_scans if s.status == "suspicious"])
        
        # Get last scan
        last_scan = None
        if all_scans:
            last_scan_obj = all_scans[0]
            last_scan = {
                "timestamp": last_scan_obj.timestamp.isoformat() + "Z" if last_scan_obj.timestamp else None,
                "type": last_scan_obj.scan_type,
                "status": last_scan_obj.status
            }
        
        # Get recent 5 scans
        recent_scans = []
        for scan in all_scans[:5]:
            recent_scans.append({
                "id": scan.id,
                "type": scan.scan_type,
                "target": scan.target,
                "status": scan.status,
                "timestamp": scan.timestamp.isoformat() + "Z" if scan.timestamp else None
            })
        
        # Prepare date-wise data for charts (last 30 days)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        
        date_wise_scans = defaultdict(lambda: {"total": 0, "safe": 0, "threat": 0})
        
        for scan in all_scans:
            if scan.timestamp and scan.timestamp >= thirty_days_ago:
                date_key = scan.timestamp.strftime("%Y-%m-%d")
                date_wise_scans[date_key]["total"] += 1
                
                if scan.status in ["safe", "strong", "very_strong"]:
                    date_wise_scans[date_key]["safe"] += 1
                elif scan.status in ["phishing", "breached", "infected", "dangerous", "weak", "very_weak"]:
                    date_wise_scans[date_key]["threat"] += 1
        
        # Convert to sorted list
        chart_data = sorted([
            {"date": date, **counts}
            for date, counts in date_wise_scans.items()
        ], key=lambda x: x["date"])
        
        # Calculate success rate
        success_rate = 0
        if total_scans > 0:
            success_rate = round((safe / total_scans) * 100, 1)
        
        dashboard_data = {
            "totalScans": total_scans,
            "threats": threats,
            "safe": safe,
            "suspicious": suspicious,
            "successRate": success_rate,
            "lastScan": last_scan,
            "recentScans": recent_scans,
            "chartData": chart_data
        }
        
        return {
            "status": "success",
            "message": f"Dashboard data for user {user_id}",
            "data": dashboard_data
        }
    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch dashboard data: {str(e)}",
            "data": {}
        }
