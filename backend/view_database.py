"""
Database Viewer - Simple GUI to view SQLite database
=====================================================
This script lets you view all users in the database.
Run this script anytime you want to check the database.

Usage:
    python view_database.py
"""

import sqlite3
import os
from datetime import datetime

# Database file path
DB_PATH = "apgs.db"

def view_database():
    """View all data in the database"""
    
    # Check if database exists
    if not os.path.exists(DB_PATH):
        print(f"❌ Database file '{DB_PATH}' not found!")
        print("   The database will be created when you start the server.")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print("\n" + "="*70)
        print("📊 APGS DATABASE VIEWER")
        print("="*70)
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"\n📁 Tables in database: {len(tables)}")
        for table in tables:
            print(f"   - {table[0]}")
        
        # View users table
        if tables:
            print("\n" + "="*70)
            print("👥 USERS TABLE")
            print("="*70)
            
            # Get column names
            cursor.execute("PRAGMA table_info(users);")
            columns = [col[1] for col in cursor.fetchall()]
            print(f"\nColumns: {', '.join(columns)}\n")
            
            # Get all users
            cursor.execute("SELECT * FROM users;")
            users = cursor.fetchall()
            
            if users:
                print(f"Total users: {len(users)}\n")
                print("-" * 70)
                
                for user in users:
                    for i, col_name in enumerate(columns):
                        value = user[i]
                        # Hide password for security
                        if 'password' in col_name.lower():
                            value = "****(hashed)****"
                        print(f"{col_name:20} : {value}")
                    print("-" * 70)
            else:
                print("⚠️  No users in database yet.")
                print("   Sign up through the API to add users.")
        
        # Get statistics
        print("\n" + "="*70)
        print("📈 DATABASE STATISTICS")
        print("="*70)
        
        cursor.execute("SELECT COUNT(*) FROM users;")
        user_count = cursor.fetchone()[0]
        print(f"Total users registered: {user_count}")
        
        # Database file size
        db_size = os.path.getsize(DB_PATH)
        if db_size < 1024:
            size_str = f"{db_size} bytes"
        elif db_size < 1024 * 1024:
            size_str = f"{db_size / 1024:.2f} KB"
        else:
            size_str = f"{db_size / (1024 * 1024):.2f} MB"
        
        print(f"Database file size: {size_str}")
        
        conn.close()
        print("\n✅ Database viewer closed.\n")
        
    except Exception as e:
        print(f"\n❌ Error viewing database: {str(e)}\n")


def delete_all_users():
    """Delete all users from database (for testing)"""
    print("\n⚠️  WARNING: This will delete ALL users from the database!")
    confirm = input("Are you sure? Type 'YES' to confirm: ")
    
    if confirm == "YES":
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users;")
            conn.commit()
            conn.close()
            print("✅ All users deleted successfully!\n")
        except Exception as e:
            print(f"❌ Error: {str(e)}\n")
    else:
        print("❌ Operation cancelled.\n")


if __name__ == "__main__":
    print("\n🔍 APGS Database Viewer")
    print("="*70)
    print("1. View database contents")
    print("2. Delete all users (for testing)")
    print("3. Exit")
    print("="*70)
    
    choice = input("\nEnter your choice (1/2/3): ").strip()
    
    if choice == "1":
        view_database()
    elif choice == "2":
        delete_all_users()
    elif choice == "3":
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice!")
