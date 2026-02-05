#!/usr/bin/env python3
"""
Remove alembic table - not needed for simple Administrator page
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def remove_alembic():
    """Remove alembic_version table"""
    
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
            
            # Check what's in alembic_version table
            cursor.execute("SELECT * FROM alembic_version")
            alembic_data = cursor.fetchall()
            print(f"\n📋 alembic_version table contains: {alembic_data}")
            
            # Drop alembic_version table
            cursor.execute("DROP TABLE IF EXISTS alembic_version")
            print("🗑️ Dropped alembic_version table")
            
            # Commit changes
            connection.commit()
            print("✅ Alembic table removed successfully")
            
            # Show remaining tables
            cursor.execute("SHOW TABLES")
            remaining_tables = [table[0] for table in cursor.fetchall()]
            
            print(f"\n📊 Final remaining tables ({len(remaining_tables)}):")
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
    print("🗑️ Removing alembic table...")
    remove_alembic()
    print("\n🎉 Database is now ultra-minimal!")