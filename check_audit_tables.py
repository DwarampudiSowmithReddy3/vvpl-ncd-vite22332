#!/usr/bin/env python3
"""
Check and clean up audit log tables in MySQL
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_audit_tables():
    """Check what audit tables exist and their structure"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'ncd_management'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Checking audit-related tables...")
            
            # Check what tables exist
            cursor.execute("SHOW TABLES LIKE '%audit%'")
            audit_tables = cursor.fetchall()
            
            print(f"📊 Found {len(audit_tables)} audit-related tables:")
            for table in audit_tables:
                table_name = table[0]
                print(f"   - {table_name}")
                
                # Show table structure
                cursor.execute(f"DESCRIBE {table_name}")
                columns = cursor.fetchall()
                print(f"     Columns: {[col[0] for col in columns]}")
                
                # Show row count
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                count = cursor.fetchone()[0]
                print(f"     Rows: {count}")
                
                # Show sample data if exists
                if count > 0:
                    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
                    samples = cursor.fetchall()
                    print(f"     Sample data: {len(samples)} rows")
                    for i, sample in enumerate(samples, 1):
                        print(f"       Row {i}: {sample}")
                print()
            
            # Check if there are any other log-related tables
            cursor.execute("SHOW TABLES LIKE '%log%'")
            log_tables = cursor.fetchall()
            
            print(f"📊 Found {len(log_tables)} log-related tables:")
            for table in log_tables:
                table_name = table[0]
                if 'audit' not in table_name.lower():
                    print(f"   - {table_name}")
                    
                    # Show row count
                    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                    count = cursor.fetchone()[0]
                    print(f"     Rows: {count}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

def clean_audit_tables():
    """Clean up unnecessary audit tables"""
    
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'ncd_management'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🧹 Cleaning up audit tables...")
            
            # Check what tables exist
            cursor.execute("SHOW TABLES LIKE '%audit%'")
            audit_tables = [table[0] for table in cursor.fetchall()]
            
            if len(audit_tables) > 1:
                print(f"⚠️ Found multiple audit tables: {audit_tables}")
                print("We should keep only one: 'audit_logs'")
                
                # Keep audit_logs, drop others
                for table in audit_tables:
                    if table != 'audit_logs':
                        print(f"🗑️ Dropping table: {table}")
                        cursor.execute(f"DROP TABLE IF EXISTS {table}")
                        connection.commit()
                        print(f"✅ Dropped {table}")
            
            # Create the correct audit_logs table
            print("📝 Creating proper audit_logs table...")
            
            cursor.execute("DROP TABLE IF EXISTS audit_logs")
            
            create_table_sql = """
            CREATE TABLE audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                user_type VARCHAR(20) DEFAULT 'admin',
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(100) NOT NULL,
                resource_id VARCHAR(100),
                description TEXT,
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_id (user_id),
                INDEX idx_timestamp (timestamp),
                INDEX idx_action (action),
                FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
            )
            """
            
            cursor.execute(create_table_sql)
            connection.commit()
            print("✅ Created proper audit_logs table")
            
            # Show final structure
            cursor.execute("DESCRIBE audit_logs")
            columns = cursor.fetchall()
            print("📋 Final audit_logs table structure:")
            for col in columns:
                print(f"   {col[0]} - {col[1]} - {col[2]} - {col[3]}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection:
            connection.rollback()
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Audit Tables Cleanup")
    print("=" * 40)
    
    print("\n1. Checking current state...")
    check_audit_tables()
    
    print("\n2. Cleaning up...")
    clean_audit_tables()
    
    print("\n3. Verifying cleanup...")
    check_audit_tables()
    
    print("\n✅ Cleanup completed!")