"""
Database Reset Script
=====================
Drops and recreates the database with the updated schema
USE WITH CAUTION - This will delete all data!
"""

import mysql.connector
from mysql.connector import Error
import os
import sys
from pathlib import Path

# Add parent directory to path to import config
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings

def reset_database():
    """
    Drop and recreate the database
    WARNING: This will delete ALL data!
    """
    try:
        print("=" * 70)
        print("🚨 DATABASE RESET SCRIPT")
        print("=" * 70)
        print()
        print("⚠️  WARNING: This will DELETE ALL DATA in the database!")
        print(f"Database: {settings.db_name}")
        print()
        
        # Ask for confirmation
        confirm = input("Type 'YES' to confirm database reset: ").strip().upper()
        if confirm != "YES":
            print("❌ Reset cancelled")
            return False
        
        print()
        print("🔄 Connecting to MySQL server...")
        
        # Connect to MySQL (without database)
        connection = mysql.connector.connect(
            host=settings.db_host,
            port=settings.db_port,
            user=settings.db_user,
            password=settings.db_password,
            autocommit=True
        )
        
        if connection.is_connected():
            print("✅ Connected to MySQL server")
            cursor = connection.cursor()
            
            # Drop database
            print(f"🗑️  Dropping database '{settings.db_name}'...")
            cursor.execute(f"DROP DATABASE IF EXISTS `{settings.db_name}`")
            print(f"✅ Database dropped")
            
            # Create database
            print(f"📦 Creating database '{settings.db_name}'...")
            cursor.execute(f"CREATE DATABASE `{settings.db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"✅ Database created")
            
            # Close cursor
            cursor.close()
            connection.close()
            
            print()
            print("=" * 70)
            print("✅ DATABASE RESET COMPLETE!")
            print("=" * 70)
            print()
            print("Next steps:")
            print("1. Run: python scripts/run_sql_migrations.py")
            print("2. This will apply all migrations in order")
            print()
            
            return True
            
    except Error as e:
        print(f"❌ Error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = reset_database()
    sys.exit(0 if success else 1)
