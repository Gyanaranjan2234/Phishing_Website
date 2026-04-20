"""
Database Migration Script
=========================
This script safely adds the 'username' column to the existing users table.
It preserves all existing data and only adds the new column if it doesn't exist.

Run this ONCE after updating the User model:
    python migrate_add_username.py
"""

import sqlite3
import os

DB_PATH = "apgs.db"

def migrate_database():
    """
    Add username column to existing users table.
    This is safe and won't delete any existing data.
    """
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file '{DB_PATH}' not found!")
        print("   Start the server first to create the database.")
        return False
    
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("\n" + "="*70)
        print("🔄 DATABASE MIGRATION: Adding 'username' column")
        print("="*70)
        
        # Check if username column already exists
        cursor.execute("PRAGMA table_info(users);")
        columns = [col[1] for col in cursor.fetchall()]
        
        if "username" in columns:
            print("\n✅ 'username' column already exists!")
            print("   No migration needed.\n")
            conn.close()
            return True
        
        # Add username column
        print("\n📝 Adding 'username' column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN username VARCHAR NOT NULL DEFAULT 'user';")
        conn.commit()
        
        print("✅ Column added successfully!")
        
        # Verify the migration
        cursor.execute("PRAGMA table_info(users);")
        columns = [col[1] for col in cursor.fetchall()]
        print(f"\n📊 Current columns: {', '.join(columns)}")
        
        # Count users
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        print(f"👥 Existing users preserved: {user_count}")
        
        conn.close()
        print("\n✅ Migration completed successfully!\n")
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}\n")
        return False


if __name__ == "__main__":
    success = migrate_database()
    
    if success:
        print("🎉 You can now use the username field in signup/login!")
    else:
        print("⚠️  Please fix the error and try again.")
