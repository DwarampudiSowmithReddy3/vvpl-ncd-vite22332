#!/usr/bin/env python3
"""
Reset permissions system - Drop existing table and start fresh
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def reset_permissions_system():
    """Drop existing role_permissions table and start fresh"""
    
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
            
            # Drop existing role_permissions table
            print("\n🗑️ Dropping existing role_permissions table...")
            cursor.execute("DROP TABLE IF EXISTS role_permissions")
            print("✅ Dropped role_permissions table")
            
            # Drop modules table if exists
            print("\n🗑️ Dropping existing modules table...")
            cursor.execute("DROP TABLE IF EXISTS modules")
            print("✅ Dropped modules table")
            
            # Drop roles table if exists
            print("\n🗑️ Dropping existing roles table...")
            cursor.execute("DROP TABLE IF EXISTS roles")
            print("✅ Dropped roles table")
            
            # Create simple role_permissions table
            print("\n🔨 Creating new simple role_permissions table...")
            create_table_sql = """
            CREATE TABLE role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) NOT NULL,
                module_name VARCHAR(100) NOT NULL,
                permission_type ENUM('view', 'create', 'edit', 'delete') NOT NULL,
                is_granted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role_module_permission (role_name, module_name, permission_type)
            )
            """
            cursor.execute(create_table_sql)
            print("✅ Created new role_permissions table")
            
            # Insert basic permissions for Super Admin
            print("\n📝 Inserting basic permissions for Super Admin...")
            modules = ['dashboard', 'ncdSeries', 'investors', 'reports', 'compliance', 'interestPayout', 'communication', 'administrator', 'approval', 'grievanceManagement']
            permissions = ['view', 'create', 'edit', 'delete']
            
            for module in modules:
                for permission in permissions:
                    cursor.execute("""
                        INSERT INTO role_permissions (role_name, module_name, permission_type, is_granted)
                        VALUES (%s, %s, %s, %s)
                    """, ('Super Admin', module, permission, True))
            
            print(f"✅ Inserted {len(modules) * len(permissions)} permissions for Super Admin")
            
            # Insert basic permissions for Admin
            print("\n📝 Inserting basic permissions for Admin...")
            for module in modules:
                for permission in permissions:
                    # Admin gets all permissions except administrator module
                    is_granted = True if module != 'administrator' else (permission == 'view')
                    cursor.execute("""
                        INSERT INTO role_permissions (role_name, module_name, permission_type, is_granted)
                        VALUES (%s, %s, %s, %s)
                    """, ('Admin', module, permission, is_granted))
            
            print(f"✅ Inserted {len(modules) * len(permissions)} permissions for Admin")
            
            # Commit changes
            connection.commit()
            print("\n✅ All changes committed successfully")
            
            # Verify the new table
            cursor.execute("SELECT COUNT(*) FROM role_permissions")
            count = cursor.fetchone()[0]
            print(f"\n📊 Total permissions in new table: {count}")
            
            # Show sample data
            cursor.execute("SELECT * FROM role_permissions LIMIT 5")
            sample_data = cursor.fetchall()
            print("\n📋 Sample permissions:")
            for row in sample_data:
                print(f"  - {row[1]}.{row[2]}.{row[3]} = {row[4]}")
                    
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
    print("🚀 Resetting permissions system from scratch...")
    reset_permissions_system()
    print("\n🎉 Permissions system reset complete!")