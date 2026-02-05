#!/usr/bin/env python3
"""
Check database structure for role_permissions table
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_database():
    """Check the database structure"""
    
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
            
            # Check if role_permissions table exists
            cursor.execute("SHOW TABLES LIKE 'role_permissions'")
            table_exists = cursor.fetchone()
            
            if table_exists:
                print("✅ role_permissions table exists")
                
                # Check table structure
                cursor.execute("DESCRIBE role_permissions")
                columns = cursor.fetchall()
                print("\n📋 Table structure:")
                for column in columns:
                    print(f"  - {column[0]}: {column[1]} ({column[2]})")
                
                # Check if there's any data
                cursor.execute("SELECT COUNT(*) FROM role_permissions")
                count = cursor.fetchone()[0]
                print(f"\n📊 Total records: {count}")
                
                if count > 0:
                    # Show sample data
                    cursor.execute("SELECT * FROM role_permissions LIMIT 5")
                    sample_data = cursor.fetchall()
                    print("\n📋 Sample data:")
                    for row in sample_data:
                        print(f"  - {row}")
                        
                # Test a simple query similar to what the API does
                print("\n🔍 Testing query similar to API...")
                test_query = """
                    SELECT COUNT(*) FROM role_permissions 
                    WHERE role_name = %s 
                    AND module_name = %s 
                    AND permission_type = %s
                """
                cursor.execute(test_query, ("Admin", "dashboard", "view"))
                test_result = cursor.fetchone()[0]
                print(f"✅ Test query result: {test_result}")
                
            else:
                print("❌ role_permissions table does not exist")
                
                # Show all tables
                cursor.execute("SHOW TABLES")
                tables = cursor.fetchall()
                print("\n📋 Available tables:")
                for table in tables:
                    print(f"  - {table[0]}")
                    
    except Error as e:
        print(f"❌ Database error: {e}")
        connection = None
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    check_database()