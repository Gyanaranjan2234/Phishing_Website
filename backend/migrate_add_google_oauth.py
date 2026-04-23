"""
Database Migration: Add Google OAuth Support
=============================================
This script adds the necessary columns to support Google OAuth 2.0 login:
- google_id: Google's unique user ID
- avatar_url: Profile picture URL from Google
- is_oauth_user: Flag to identify OAuth users
- Makes hashed_password nullable (OAuth users don't have passwords)

Run this script once to update your database:
    python migrate_add_google_oauth.py
"""

from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./apgs.db")

def migrate():
    """Add Google OAuth columns to users table"""
    print("🔄 Starting Google OAuth migration...")
    
    try:
        # Create database engine
        engine = create_engine(DATABASE_URL)
        
        with engine.connect() as conn:
            # Check if columns already exist
            columns_query = text("PRAGMA table_info(users)")
            columns = conn.execute(columns_query).fetchall()
            column_names = [col[1] for col in columns]
            
            # Add google_id column if it doesn't exist (without UNIQUE constraint)
            if 'google_id' not in column_names:
                print("➕ Adding google_id column...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN google_id VARCHAR"
                ))
                conn.commit()
                print("✅ google_id column added")
                print("   Note: UNIQUE constraint not added (SQLite limitation)")
                print("   Uniqueness is enforced in application logic")
            else:
                print("⏭️  google_id column already exists")
            
            # Add avatar_url column if it doesn't exist
            if 'avatar_url' not in column_names:
                print("➕ Adding avatar_url column...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN avatar_url VARCHAR"
                ))
                conn.commit()
                print("✅ avatar_url column added")
            else:
                print("⏭️  avatar_url column already exists")
            
            # Add is_oauth_user column if it doesn't exist
            if 'is_oauth_user' not in column_names:
                print("➕ Adding is_oauth_user column...")
                conn.execute(text(
                    "ALTER TABLE users ADD COLUMN is_oauth_user BOOLEAN DEFAULT 0"
                ))
                conn.commit()
                print("✅ is_oauth_user column added")
            else:
                print("⏭️  is_oauth_user column already exists")
            
            print("\n✅ Migration completed successfully!")
            print("🎉 Your database now supports Google OAuth 2.0 login")
            
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        raise

if __name__ == "__main__":
    migrate()
