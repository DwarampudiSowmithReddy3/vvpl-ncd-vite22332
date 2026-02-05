"""
NCD Management System - Database Setup
This script creates the database and initial tables for authentication.
"""

import mysql.connector
from mysql.connector import Error

def create_database():
    """Create the NCD management database"""
    try:
        # Connect to MySQL server (without specifying database)
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='sowmith'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create database
            cursor.execute("CREATE DATABASE IF NOT EXISTS ncd_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print("✅ Database 'ncd_management' created successfully")
            
            # Use the database
            cursor.execute("USE ncd_management")
            print("✅ Connected to ncd_management database")
            
            # Show existing tables (should be empty initially)
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"📋 Current tables: {len(tables)} tables found")
            for table in tables:
                print(f"   - {table[0]}")
            
            return True
            
    except Error as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("🔌 MySQL connection closed")

if __name__ == "__main__":
    print("🚀 Setting up NCD Management Database...")
    print("=" * 50)
    
    success = create_database()
    
    if success:
        print("\n✅ Database setup completed successfully!")
        print("\nNext steps:")
        print("1. Update MySQL credentials in this script")
        print("2. Run this script to create the database")
        print("3. Proceed with table creation")
    else:
        print("\n❌ Database setup failed. Please check your MySQL credentials.")