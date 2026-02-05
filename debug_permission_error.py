#!/usr/bin/env python3
"""
Debug the permission update error
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def debug_permission_update():
    """Debug the permission update process"""
    
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
            
            # Test the exact query that the API is trying to execute
            role_name = "Admin"
            module_name = "dashboard"
            permission_type = "view"
            
            print(f"\n🔍 Testing query with: role_name='{role_name}', module_name='{module_name}', permission_type='{permission_type}'")
            
            # Check if permission exists (same query as in API)
            check_query = """
                SELECT COUNT(*) FROM role_permissions 
                WHERE role_name = %s 
                AND module_name = %s 
                AND permission_type = %s
            """
            
            try:
                cursor.execute(check_query, (role_name, module_name, permission_type))
                exists = cursor.fetchone()[0]
                print(f"✅ Permission exists check: {exists}")
                
                # If it exists, try to update it
                if exists:
                    update_query = """
                        UPDATE role_permissions 
                        SET is_granted = %s, updated_at = NOW()
                        WHERE role_name = %s 
                        AND module_name = %s 
                        AND permission_type = %s
                    """
                    
                    cursor.execute(update_query, (True, role_name, module_name, permission_type))
                    print(f"✅ Update query executed successfully")
                    connection.rollback()  # Don't actually commit the change
                    
                else:
                    # Try to insert new permission
                    insert_query = """
                        INSERT INTO role_permissions 
                        (role_name, module_name, permission_type, is_granted)
                        VALUES (%s, %s, %s, %s)
                    """
                    
                    cursor.execute(insert_query, (role_name, module_name, permission_type, True))
                    print(f"✅ Insert query executed successfully")
                    connection.rollback()  # Don't actually commit the change
                    
            except Exception as query_error:
                print(f"❌ Query error: {query_error}")
                print(f"❌ Query error type: {type(query_error)}")
                
            # Check what roles actually exist in role_permissions for this module
            print(f"\n📋 Roles that have permissions for '{module_name}' module:")
            cursor.execute("SELECT DISTINCT role_name FROM role_permissions WHERE module_name = %s", (module_name,))
            roles_for_module = cursor.fetchall()
            for role in roles_for_module:
                print(f"  - {role[0]}")
                
            # Check what modules exist for the 'Admin' role
            print(f"\n📋 Modules that '{role_name}' role has permissions for:")
            cursor.execute("SELECT DISTINCT module_name FROM role_permissions WHERE role_name = %s", (role_name,))
            modules_for_role = cursor.fetchall()
            for module in modules_for_role:
                print(f"  - {module[0]}")
                    
    except Error as e:
        print(f"❌ Database error: {e}")
        print(f"❌ Error type: {type(e)}")
        connection = None
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    debug_permission_update()