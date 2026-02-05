#!/usr/bin/env python3
"""
Restore original role_permissions table structure
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def restore_original_tables():
    """Restore the original role_permissions table structure"""
    
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
            
            # Drop the new simple table I created
            print("\n🗑️ Dropping the new simple role_permissions table...")
            cursor.execute("DROP TABLE IF EXISTS role_permissions")
            print("✅ Dropped new role_permissions table")
            
            # Restore original role_permissions table structure
            print("\n🔨 Restoring original role_permissions table...")
            create_original_table = """
            CREATE TABLE role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(100) NOT NULL,
                module_name VARCHAR(100) NOT NULL,
                permission_type ENUM('view', 'create', 'edit', 'delete') NOT NULL,
                is_granted TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_role_module (role_name, module_name),
                UNIQUE KEY unique_permission (role_name, module_name, permission_type)
            )
            """
            cursor.execute(create_original_table)
            print("✅ Created original role_permissions table")
            
            # Restore original data from your previous system
            print("\n📝 Restoring original permission data...")
            
            # Your original roles and permissions
            original_permissions = [
                # Super Admin - full access
                ('Super Admin', 'dashboard', 'view', 1),
                ('Super Admin', 'dashboard', 'create', 1),
                ('Super Admin', 'dashboard', 'edit', 1),
                ('Super Admin', 'dashboard', 'delete', 1),
                ('Super Admin', 'ncdSeries', 'view', 1),
                ('Super Admin', 'ncdSeries', 'create', 1),
                ('Super Admin', 'ncdSeries', 'edit', 1),
                ('Super Admin', 'ncdSeries', 'delete', 1),
                ('Super Admin', 'investors', 'view', 1),
                ('Super Admin', 'investors', 'create', 1),
                ('Super Admin', 'investors', 'edit', 1),
                ('Super Admin', 'investors', 'delete', 1),
                ('Super Admin', 'reports', 'view', 1),
                ('Super Admin', 'reports', 'create', 1),
                ('Super Admin', 'reports', 'edit', 1),
                ('Super Admin', 'reports', 'delete', 1),
                ('Super Admin', 'compliance', 'view', 1),
                ('Super Admin', 'compliance', 'create', 1),
                ('Super Admin', 'compliance', 'edit', 1),
                ('Super Admin', 'compliance', 'delete', 1),
                ('Super Admin', 'interestPayout', 'view', 1),
                ('Super Admin', 'interestPayout', 'create', 1),
                ('Super Admin', 'interestPayout', 'edit', 1),
                ('Super Admin', 'interestPayout', 'delete', 1),
                ('Super Admin', 'communication', 'view', 1),
                ('Super Admin', 'communication', 'create', 1),
                ('Super Admin', 'communication', 'edit', 1),
                ('Super Admin', 'communication', 'delete', 1),
                ('Super Admin', 'administrator', 'view', 1),
                ('Super Admin', 'administrator', 'create', 1),
                ('Super Admin', 'administrator', 'edit', 1),
                ('Super Admin', 'administrator', 'delete', 1),
                ('Super Admin', 'approval', 'view', 1),
                ('Super Admin', 'approval', 'create', 1),
                ('Super Admin', 'approval', 'edit', 1),
                ('Super Admin', 'approval', 'delete', 1),
                ('Super Admin', 'grievanceManagement', 'view', 1),
                ('Super Admin', 'grievanceManagement', 'create', 1),
                ('Super Admin', 'grievanceManagement', 'edit', 1),
                ('Super Admin', 'grievanceManagement', 'delete', 1),
                
                # Admin - limited access
                ('Admin', 'dashboard', 'view', 1),
                ('Admin', 'dashboard', 'create', 0),
                ('Admin', 'dashboard', 'edit', 0),
                ('Admin', 'dashboard', 'delete', 0),
                ('Admin', 'ncdSeries', 'view', 1),
                ('Admin', 'ncdSeries', 'create', 1),
                ('Admin', 'ncdSeries', 'edit', 1),
                ('Admin', 'ncdSeries', 'delete', 0),
                ('Admin', 'investors', 'view', 1),
                ('Admin', 'investors', 'create', 1),
                ('Admin', 'investors', 'edit', 1),
                ('Admin', 'investors', 'delete', 0),
                ('Admin', 'reports', 'view', 1),
                ('Admin', 'reports', 'create', 1),
                ('Admin', 'reports', 'edit', 1),
                ('Admin', 'reports', 'delete', 0),
                ('Admin', 'compliance', 'view', 1),
                ('Admin', 'compliance', 'create', 1),
                ('Admin', 'compliance', 'edit', 1),
                ('Admin', 'compliance', 'delete', 0),
                ('Admin', 'interestPayout', 'view', 1),
                ('Admin', 'interestPayout', 'create', 1),
                ('Admin', 'interestPayout', 'edit', 1),
                ('Admin', 'interestPayout', 'delete', 0),
                ('Admin', 'communication', 'view', 1),
                ('Admin', 'communication', 'create', 1),
                ('Admin', 'communication', 'edit', 1),
                ('Admin', 'communication', 'delete', 0),
                ('Admin', 'administrator', 'view', 0),
                ('Admin', 'administrator', 'create', 0),
                ('Admin', 'administrator', 'edit', 0),
                ('Admin', 'administrator', 'delete', 0),
                ('Admin', 'approval', 'view', 1),
                ('Admin', 'approval', 'create', 1),
                ('Admin', 'approval', 'edit', 1),
                ('Admin', 'approval', 'delete', 0),
                ('Admin', 'grievanceManagement', 'view', 1),
                ('Admin', 'grievanceManagement', 'create', 1),
                ('Admin', 'grievanceManagement', 'edit', 1),
                ('Admin', 'grievanceManagement', 'delete', 0),
            ]
            
            # Insert original permissions
            for permission in original_permissions:
                cursor.execute("""
                    INSERT INTO role_permissions (role_name, module_name, permission_type, is_granted)
                    VALUES (%s, %s, %s, %s)
                """, permission)
            
            print(f"✅ Inserted {len(original_permissions)} original permissions")
            
            # Commit changes
            connection.commit()
            print("\n✅ Original table structure restored successfully")
            
            # Show summary
            cursor.execute("SELECT role_name, COUNT(*) as total FROM role_permissions GROUP BY role_name")
            summary = cursor.fetchall()
            
            print("\n📊 Restored Permissions Summary:")
            for row in summary:
                print(f"  - {row[0]}: {row[1]} permissions")
                    
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
    print("🔄 Restoring original role_permissions table...")
    restore_original_tables()
    print("\n✅ Original table structure restored!")