#!/usr/bin/env python3
"""
Check if modules table exists
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_modules_table():
    """Check if modules table exists"""
    
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
            
            # Check if modules table exists
            cursor.execute("SHOW TABLES LIKE 'modules'")
            modules_table_exists = cursor.fetchone()
            
            if modules_table_exists:
                print("✅ modules table exists")
                
                # Check table structure
                cursor.execute("DESCRIBE modules")
                columns = cursor.fetchall()
                print("\n📋 modules table structure:")
                for column in columns:
                    print(f"  - {column[0]}: {column[1]} ({column[2]})")
                
                # Check if there's any data
                cursor.execute("SELECT COUNT(*) FROM modules")
                count = cursor.fetchone()[0]
                print(f"\n📊 Total modules: {count}")
                
                if count > 0:
                    # Show sample data
                    cursor.execute("SELECT * FROM modules LIMIT 10")
                    sample_data = cursor.fetchall()
                    print("\n📋 Sample modules:")
                    for row in sample_data:
                        print(f"  - {row}")
                        
                # Test the exact query from PermissionChecker
                print("\n🔍 Testing PermissionChecker query...")
                test_query = """
                    SELECT m.name as module_name, rp.permission_type, rp.is_granted
                    FROM modules m
                    LEFT JOIN role_permissions rp ON m.name = rp.module_name 
                        AND rp.role_name = %s
                    WHERE m.is_active = 1
                    ORDER BY m.name, rp.permission_type
                """
                cursor.execute(test_query, ("Super Admin",))
                test_results = cursor.fetchall()
                print(f"✅ Query returned {len(test_results)} results")
                for result in test_results[:5]:  # Show first 5 results
                    print(f"  - {result}")
                        
            else:
                print("❌ modules table does not exist")
                
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
    check_modules_table()