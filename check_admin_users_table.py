#!/usr/bin/env python3
"""
Check admin_users table structure
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_admin_users_table():
    """Check admin_users table structure"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            database=os.getenv('MYSQL_DATABASE', 'NCDManagement'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', 'sowmith')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("✅ Connected to MySQL database")
            
            # Check admin_users table structure
            cursor.execute("DESCRIBE admin_users")
            columns = cursor.fetchall()
            print("\n📋 admin_users table structure:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]} ({column[2]})")
                
            # Check sample data
            cursor.execute("SELECT * FROM admin_users LIMIT 1")
            sample_data = cursor.fetchone()
            if sample_data:
                print(f"\n📋 Sample admin user:")
                column_names = [desc[0] for desc in cursor.description]
                for i, value in enumerate(sample_data):
                    print(f"  - {column_names[i]}: {value}")
            else:
                print("\n⚠️ No admin users found")
                    
    except Error as e:
        print(f"❌ Database error: {e}")
        connection = None
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    check_admin_users_table()