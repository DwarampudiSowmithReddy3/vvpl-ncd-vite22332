#!/usr/bin/env python3
"""
Test database connection and diagnose issues
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def test_database_connection():
    """Test database connection and show details"""
    
    print("🔍 Testing database connection...")
    
    # Show connection details
    print(f"\n📋 Connection Details:")
    print(f"  Host: {os.getenv('MYSQL_HOST', 'localhost')}")
    print(f"  Database: {os.getenv('MYSQL_DATABASE', 'NCDManagement')}")
    print(f"  User: {os.getenv('MYSQL_USER', 'root')}")
    print(f"  Password: {'*' * len(os.getenv('MYSQL_PASSWORD', ''))}")
    print(f"  Port: {os.getenv('MYSQL_PORT', '3306')}")
    
    try:
        # Test basic connection
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_HOST', 'localhost'),
            user=os.getenv('MYSQL_USER', 'root'),
            password=os.getenv('MYSQL_PASSWORD', 'sowmith')
        )
        
        if connection.is_connected():
            print("\n✅ MySQL server connection successful")
            
            cursor = connection.cursor()
            
            # Check MySQL version
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()[0]
            print(f"📊 MySQL Version: {version}")
            
            # Check if database exists
            cursor.execute("SHOW DATABASES")
            databases = [db[0] for db in cursor.fetchall()]
            
            database_name = os.getenv('MYSQL_DATABASE', 'NCDManagement')
            if database_name in databases:
                print(f"✅ Database '{database_name}' exists")
                
                # Connect to specific database
                cursor.execute(f"USE {database_name}")
                
                # Check tables
                cursor.execute("SHOW TABLES")
                tables = [table[0] for table in cursor.fetchall()]
                
                print(f"📋 Tables in database ({len(tables)}):")
                for table in tables:
                    cursor.execute(f"SELECT COUNT(*) FROM `{table}`")
                    count = cursor.fetchone()[0]
                    print(f"  - {table}: {count} records")
                    
            else:
                print(f"❌ Database '{database_name}' does not exist")
                print(f"📋 Available databases: {databases}")
                
                # Create database if it doesn't exist
                print(f"\n🔨 Creating database '{database_name}'...")
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name}")
                print(f"✅ Database '{database_name}' created")
            
            cursor.close()
            connection.close()
            
        else:
            print("❌ Failed to connect to MySQL server")
            
    except Error as e:
        print(f"❌ Database connection error: {e}")
        print(f"❌ Error code: {e.errno}")
        print(f"❌ Error message: {e.msg}")
        
        # Common error solutions
        if e.errno == 1045:
            print("\n💡 Solution: Check username/password in backend/.env file")
        elif e.errno == 2003:
            print("\n💡 Solution: Make sure MySQL server is running")
        elif e.errno == 1049:
            print("\n💡 Solution: Database doesn't exist, will try to create it")
        else:
            print(f"\n💡 Check MySQL server status and credentials")

if __name__ == "__main__":
    test_database_connection()