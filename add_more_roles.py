#!/usr/bin/env python3
"""
Add more roles to the clean permissions system
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def add_more_roles():
    """Add more roles with different permission levels"""
    
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
            
            modules = ['dashboard', 'ncdSeries', 'investors', 'reports', 'compliance', 'interestPayout', 'communication', 'administrator', 'approval', 'grievanceManagement']
            permissions = ['view', 'create', 'edit', 'delete']
            
            # Define role permissions
            role_configs = {
                'Finance Manager': {
                    'dashboard': ['view'],
                    'ncdSeries': ['view'],
                    'investors': ['view'],
                    'reports': ['view'],
                    'compliance': ['view'],
                    'interestPayout': ['view', 'create'],
                    'communication': [],
                    'administrator': [],
                    'approval': [],
                    'grievanceManagement': ['view']
                },
                'Finance Executive': {
                    'dashboard': ['view'],
                    'ncdSeries': ['view'],
                    'investors': ['view'],
                    'reports': ['view'],
                    'compliance': ['view'],
                    'interestPayout': ['view'],
                    'communication': [],
                    'administrator': [],
                    'approval': [],
                    'grievanceManagement': ['view']
                },
                'Viewer': {
                    'dashboard': ['view'],
                    'ncdSeries': ['view'],
                    'investors': ['view'],
                    'reports': ['view'],
                    'compliance': ['view'],
                    'interestPayout': ['view'],
                    'communication': ['view'],
                    'administrator': [],
                    'approval': ['view'],
                    'grievanceManagement': ['view']
                }
            }
            
            # Add permissions for each role
            for role_name, role_permissions in role_configs.items():
                print(f"\n📝 Adding permissions for {role_name}...")
                
                for module in modules:
                    allowed_permissions = role_permissions.get(module, [])
                    
                    for permission in permissions:
                        is_granted = permission in allowed_permissions
                        
                        cursor.execute("""
                            INSERT INTO role_permissions (role_name, module_name, permission_type, is_granted)
                            VALUES (%s, %s, %s, %s)
                            ON DUPLICATE KEY UPDATE is_granted = VALUES(is_granted)
                        """, (role_name, module, permission, is_granted))
                
                print(f"✅ Added permissions for {role_name}")
            
            # Commit changes
            connection.commit()
            print("\n✅ All role permissions added successfully")
            
            # Show summary
            cursor.execute("SELECT role_name, COUNT(*) as total_permissions, SUM(is_granted) as granted_permissions FROM role_permissions GROUP BY role_name")
            summary = cursor.fetchall()
            
            print("\n📊 Permissions Summary:")
            for row in summary:
                print(f"  - {row[0]}: {row[2]}/{row[1]} permissions granted")
                    
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
    print("🚀 Adding more roles to permissions system...")
    add_more_roles()
    print("\n🎉 Additional roles added successfully!")