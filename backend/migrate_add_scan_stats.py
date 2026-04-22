"""
Migration: Add Global Scan Statistics Table
=============================================
This migration creates the scan_stats table with a global counter
that ONLY increases and NEVER decreases.

Run this script once to add the table to your database.
"""

import sys
import os

# Add parent directory to path so we can import backend modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.db import engine, SessionLocal, Base
from models.scan_stats_model import ScanStats
from models.scan_model import ScanHistory
from sqlalchemy import text

def migrate():
    """Create scan_stats table and initialize with current scan count."""
    
    print("🚀 Starting migration: Add Global Scan Statistics Table")
    print("=" * 60)
    
    # Create the table
    print("\n📦 Creating scan_stats table...")
    ScanStats.__table__.create(engine, checkfirst=True)
    print("✅ scan_stats table created successfully")
    
    # Initialize with current scan count
    db = SessionLocal()
    try:
        # Count existing scans
        current_count = db.query(ScanHistory).count()
        print(f"\n📊 Found {current_count} existing scans in database")
        
        # Check if stats row already exists
        existing_stats = db.query(ScanStats).filter(ScanStats.id == 1).first()
        
        if existing_stats:
            print(f"📝 Existing stats found: total_scans = {existing_stats.total_scans}")
            print("ℹ️  Skipping initialization (table already initialized)")
        else:
            # Create initial stats record
            print(f"📝 Initializing global counter to {current_count}...")
            initial_stats = ScanStats(
                id=1,
                total_scans=current_count,
                last_updated=__import__('datetime').datetime.utcnow()
            )
            db.add(initial_stats)
            db.commit()
            print(f"✅ Global counter initialized to {current_count}")
        
        print("\n" + "=" * 60)
        print("✅ Migration completed successfully!")
        print("\n📋 Summary:")
        print(f"   - scan_stats table created")
        print(f"   - Global counter set to: {current_count}")
        print(f"   - Counter will ONLY increase from now on")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ Migration failed: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
