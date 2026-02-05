#!/usr/bin/env python3
"""
Clean up database - Keep only essential tables for Administrator page
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def cleanup_database():
    """Keep only essential tables for Administrator page"""
    
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
            
            # Get all tables
            cursor.execute("SHOW TABLES")
            all_tables = [table[0] for table in cursor.fetchall()]
            print(f"\n📋 Found {len(all_tables)} tables in database")
            
            # Essential tables for Administrator page ONLY
            essential_tables = {
                'admin_users',           # For user management
                'role_permissions',      # For permission management  
                'audit_logs',           # For audit log display
                'alembic_version'       # For database migrations
            }
            
            # Tables to delete (everything except essential)
            tables_to_delete = [table for table in all_tables if table not in essential_tables]
            
            print(f"\n🗑️ Will delete {len(tables_to_delete)} unnecessary tables:")
            for table in tables_to_delete:
                print(f"  - {table}")
            
            print(f"\n✅ Will keep {len(essential_tables)} essential tables:")
            for table in essential_tables:
                if table in all_tables:
                    print(f"  - {table}")
            
            # Confirm deletion
            print(f"\n⚠️ This will delete {len(tables_to_delete)} tables permanently!")
            
            # Disable foreign key checks to avoid constraint issues
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # Delete unnecessary tables
            deleted_count = 0
            for table in tables_to_delete:
                try:
                    cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
                    print(f"🗑️ Deleted table: {table}")
                    deleted_count += 1
                except Exception as e:
                    print(f"⚠️ Could not delete {table}: {e}")
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            # Commit changes
            connection.commit()
            print(f"\n✅ Successfully deleted {deleted_count} unnecessary tables")
            
            # Show remaining tables
            cursor.execute("SHOW TABLES")
            remaining_tables = [table[0] for table in cursor.fetchall()]
            
            print(f"\n📊 Remaining tables ({len(remaining_tables)}):")
            for table in remaining_tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                count = cursor.fetchone()[0]
                print(f"  - {table}: {count} records")
                    
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
    print("🧹 Cleaning up database - keeping only Administrator page essentials...")
    cleanup_database()
    print("\n🎉 Database cleanup complete!")