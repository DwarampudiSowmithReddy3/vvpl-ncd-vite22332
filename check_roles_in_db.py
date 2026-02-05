#!/usr/bin/env python3
"""
Check what roles are actually in the database
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def check_roles():
    """Check the roles in database"""
    
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
            
            # Check admin_users table roles
            print("\n📋 Roles in admin_users table:")
            cursor.execute("SELECT DISTINCT role FROM admin_users")
            admin_roles = cursor.fetchall()
            for role in admin_roles:
                print(f"  - {role[0]}")
            
            # Check role_permissions table roles
            print("\n📋 Roles in role_permissions table:")
            cursor.execute("SELECT DISTINCT role_name FROM role_permissions")
            permission_roles = cursor.fetchall()
            for role in permission_roles:
                print(f"  - {role[0]}")
            
            # Check if there's a roles table
            cursor.execute("SHOW TABLES LIKE 'roles'")
            roles_table_exists = cursor.fetchone()
            
            if roles_table_exists:
                print("\n📋 Roles in roles table:")
                cursor.execute("SELECT * FROM roles")
                roles = cursor.fetchall()
                for role in roles:
                    print(f"  - {role}")
            else:
                print("\n⚠️ No 'roles' table found")
            
            # Check a specific user's role
            print("\n📋 Sample admin user roles:")
            cursor.execute("SELECT username, role FROM admin_users LIMIT 5")
            users = cursor.fetchall()
            for user in users:
                print(f"  - {user[0]}: {user[1]}")
                    
    except Error as e:
        print(f"❌ Database error: {e}")
        connection = None
        
    finally:
        if 'connection' in locals() and connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    check_roles()