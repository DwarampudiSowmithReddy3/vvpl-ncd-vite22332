"""
NCD Management System - Create Authentication Tables
This script creates the users and audit_logs tables with proper constraints.
"""

import mysql.connector
from mysql.connector import Error

def create_tables():
    """Create users and audit_logs tables"""
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='sowmith',
            database='ncd_management'
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            # Create users table
            users_table = """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL UNIQUE,
                username VARCHAR(100) NOT NULL UNIQUE,
                email VARCHAR(255) NOT NULL UNIQUE,
                full_name VARCHAR(255) NOT NULL UNIQUE,
                phone VARCHAR(20) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_user_id (user_id),
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_is_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
            
            cursor.execute(users_table)
            print("✅ Users table created successfully")
            
            # Create audit_logs table
            audit_logs_table = """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(255) NOT NULL,
                entity_type VARCHAR(100) NULL,
                entity_id VARCHAR(255) NULL,
                details JSON NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45) NULL,
                INDEX idx_user_id (user_id),
                INDEX idx_action (action),
                INDEX idx_entity_type (entity_type),
                INDEX idx_timestamp (timestamp),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
            
            cursor.execute(audit_logs_table)
            print("✅ Audit logs table created successfully")
            
            # Show created tables
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"\n📋 Tables in database: {len(tables)}")
            for table in tables:
                print(f"   - {table[0]}")
            
            # Show users table structure
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            print(f"\n📋 Users table structure:")
            for column in columns:
                print(f"   - {column[0]}: {column[1]} {column[2]} {column[3]} {column[4]}")
            
            return True
            
    except Error as e:
        print(f"❌ Error: {e}")
        return False
        
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 MySQL connection closed")

if __name__ == "__main__":
    print("🚀 Creating Authentication Tables...")
    print("=" * 50)
    
    success = create_tables()
    
    if success:
        print("\n✅ Tables created successfully!")
        print("\nNext steps:")
        print("1. Update frontend Add User form")
        print("2. Add delete user functionality")
        print("3. Create backend APIs")
        print("4. Connect frontend to backend")
    else:
        print("\n❌ Table creation failed.")