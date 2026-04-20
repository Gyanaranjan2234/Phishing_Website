"""
Database Migration: Add Scan History Table
===========================================
This script adds the scan_history table to the existing database.
It safely checks if the table exists before creating it.

Run this script ONCE to create the table:
    python migrate_add_scan_history.py
"""

import sqlite3
import os

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "apgs.db")


def migrate_database():
    """
    Add scan_history table to the database.
    Preserves all existing data.
    """
    print("=" * 60)
    print("🔧 APGS Database Migration: Add Scan History Table")
    print("=" * 60)
    print()
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database not found at: {DB_PATH}")
        print("💡 Please run the backend server first to create the database.")
        return False
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if scan_history table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='scan_history';
        """)
        table_exists = cursor.fetchone()
        
        if table_exists:
            print("✅ 'scan_history' table already exists!")
            print()
            
            # Show table structure
            cursor.execute("PRAGMA table_info(scan_history);")
            columns = cursor.fetchall()
            print("📋 Table structure:")
            for col in columns:
                print(f"   - {col[1]} ({col[2]})")
            print()
            
            # Count existing records
            cursor.execute("SELECT COUNT(*) FROM scan_history;")
            count = cursor.fetchone()[0]
            print(f"📊 Existing scan records: {count}")
            print()
            print("✨ No migration needed!")
            
        else:
            print("📝 Creating 'scan_history' table...")
            print()
            
            # Create scan_history table
            cursor.execute("""
                CREATE TABLE scan_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    scan_type VARCHAR(50) NOT NULL,
                    target VARCHAR(500) NOT NULL,
                    status VARCHAR(50) NOT NULL,
                    result_details VARCHAR(5000),
                    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            """)
            
            # Create index on user_id for faster queries
            cursor.execute("""
                CREATE INDEX idx_scan_history_user_id 
                ON scan_history(user_id);
            """)
            
            conn.commit()
            print("✅ Table created successfully!")
            print()
            
            # Verify table was created
            cursor.execute("""
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name='scan_history';
            """)
            if cursor.fetchone():
                print("✅ Verification: Table exists in database")
                
                # Show table structure
                cursor.execute("PRAGMA table_info(scan_history);")
                columns = cursor.fetchall()
                print()
                print("📋 Table structure:")
                for col in columns:
                    print(f"   - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else ''}")
                
                print()
                print("📊 Initial scan records: 0")
            else:
                print("❌ Verification failed: Table not found!")
                return False
        
        conn.close()
        print()
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Restart your backend server")
        print("2. Login and perform a scan")
        print("3. Check API docs: http://localhost:8000/docs")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        print()
        print("Troubleshooting:")
        print("1. Make sure the backend server is not running")
        print("2. Check database file permissions")
        print("3. Verify SQLite is installed")
        return False


if __name__ == "__main__":
    migrate_database()
