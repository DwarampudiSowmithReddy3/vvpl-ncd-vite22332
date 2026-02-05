#!/usr/bin/env python3
"""
Test direct permission update bypassing FastAPI dependencies
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def test_direct_update():
    """Test direct permission update"""
    
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
            
            # Test the exact same logic as in the API
            role_name = "Admin"
            module_name = "dashboard"
            permission_type = "view"
            is_granted = True
            
            print(f"\n🔄 Testing permission update: {role_name}.{module_name}.{permission_type} = {is_granted}")
            
            # Check if permission exists
            check_query = """
                SELECT COUNT(*) FROM role_permissions 
                WHERE role_name = %s 
                AND module_name = %s 
                AND permission_type = %s
            """
            
            cursor.execute(check_query, (role_name, module_name, permission_type))
            exists = cursor.fetchone()[0]
            print(f"✅ Permission exists: {exists}")
            
            if exists:
                # Update existing permission
                update_query = """
                    UPDATE role_permissions 
                    SET is_granted = %s, updated_at = NOW()
                    WHERE role_name = %s 
                    AND module_name = %s 
                    AND permission_type = %s
                """
                
                cursor.execute(update_query, (is_granted, role_name, module_name, permission_type))
                print(f"✅ Update executed, affected rows: {cursor.rowcount}")
                
            else:
                # Insert new permission
                insert_query = """
                    INSERT INTO role_permissions 
                    (role_name, module_name, permission_type, is_granted)
                    VALUES (%s, %s, %s, %s)
                """
                
                cursor.execute(insert_query, (role_name, module_name, permission_type, is_granted))
                print(f"✅ Insert executed, affected rows: {cursor.rowcount}")
            
            # Don't commit - just test
            connection.rollback()
            print("✅ Transaction rolled back (test only)")
            
            # Now test with a try-catch to see if there are any exceptions
            print("\n🔍 Testing with exception handling...")
            try:
                cursor.execute(check_query, (role_name, module_name, permission_type))
                exists = cursor.fetchone()[0]
                
                if exists:
                    cursor.execute(update_query, (is_granted, role_name, module_name, permission_type))
                else:
                    cursor.execute(insert_query, (role_name, module_name, permission_type, is_granted))
                    
                connection.rollback()
                print("✅ No exceptions occurred in database operations")
                
            except Exception as db_error:
                print(f"❌ Database operation error: {db_error}")
                print(f"❌ Error type: {type(db_error)}")
                connection.rollback()
                    
    except Error as e:
        print(f"❌ Database connection error: {e}")
        connection = None
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    test_direct_update()