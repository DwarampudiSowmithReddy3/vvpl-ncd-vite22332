#!/usr/bin/env python3
"""
Check audit_logs table structure and add some test data
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('backend/.env')

def check_audit_logs():
    """Check audit_logs table and add test data"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            database=os.getenv('MYSQL_DATABASE', 'ncdmanagement'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', 'sowmith')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            print("✅ Connected to MySQL database")
            
            # Check audit_logs table structure
            cursor.execute("DESCRIBE audit_logs")
            columns = cursor.fetchall()
            print("\n📋 audit_logs table structure:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]} ({column[2]})")
            
            # Check current data
            cursor.execute("SELECT COUNT(*) FROM audit_logs")
            count = cursor.fetchone()[0]
            print(f"\n📊 Current audit logs count: {count}")
            
            if count == 0:
                print("\n📝 Adding some test audit logs...")
                
                # Add test audit logs with correct structure
                test_logs = [
                    (1, "admin", None, "LOGIN", "admin_users", "1", None, None, "User admin logged into the system", "127.0.0.1", "Mozilla/5.0", datetime.now()),
                    (1, "admin", None, "UPDATE", "role_permissions", None, None, None, "Updated permission for Admin role", "127.0.0.1", "Mozilla/5.0", datetime.now()),
                    (1, "admin", None, "CREATE", "admin_users", "3", None, None, "Created new user testuser", "127.0.0.1", "Mozilla/5.0", datetime.now()),
                    (1, "admin", None, "READ", "admin_users", None, None, None, "Viewed admin users list", "127.0.0.1", "Mozilla/5.0", datetime.now()),
                    (1, "admin", None, "EXPORT", "audit_logs", None, None, None, "Exported audit logs", "127.0.0.1", "Mozilla/5.0", datetime.now()),
                ]
                
                for log in test_logs:
                    cursor.execute("""
                        INSERT INTO audit_logs (user_id, user_type, session_id, action, resource_type, resource_id, old_values, new_values, description, ip_address, user_agent, timestamp)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """, log)
                
                connection.commit()
                print(f"✅ Added {len(test_logs)} test audit logs")
                
                # Check again
                cursor.execute("SELECT COUNT(*) FROM audit_logs")
                new_count = cursor.fetchone()[0]
                print(f"📊 New audit logs count: {new_count}")
                
                # Show sample data
                cursor.execute("SELECT * FROM audit_logs LIMIT 3")
                sample_logs = cursor.fetchall()
                print("\n📋 Sample audit logs:")
                for log in sample_logs:
                    print(f"  - {log[4]} {log[5]} by user_id {log[1]} at {log[12]}")
            else:
                # Show existing data
                cursor.execute("SELECT * FROM audit_logs LIMIT 5")
                existing_logs = cursor.fetchall()
                print("\n📋 Existing audit logs:")
                for log in existing_logs:
                    print(f"  - {log[4]} {log[5]} by user_id {log[1]} at {log[12]}")
                    
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection:
            connection.rollback()
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    check_audit_logs()