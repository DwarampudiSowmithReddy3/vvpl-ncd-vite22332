#!/usr/bin/env python3
"""
Check and fix admin login credentials
"""
import sys
import os
import requests
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get('http://localhost:8003/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on http://localhost:8003")
            return True
        else:
            print(f"❌ Backend responded with status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running on http://localhost:8003")
        print("💡 Start the backend with: cd backend && python main.py")
        return False
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        return False

def test_admin_login():
    """Test admin login credentials"""
    try:
        login_data = {
            "username": "admin",
            "password": "admin123",
            "user_type": "admin"
        }
        
        response = requests.post(
            'http://localhost:8003/api/v1/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful!")
            print(f"   Access Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   User Info: {data.get('user_info', {})}")
            return True
        else:
            print(f"❌ Login failed with status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error testing login: {e}")
        return False

def initialize_database():
    """Initialize database with admin user"""
    try:
        print("🔄 Initializing database...")
        
        # Import and run the initialization
        from backend.scripts.simple_init_db import main as init_main
        
        success = init_main()
        if success:
            print("✅ Database initialized successfully")
            return True
        else:
            print("❌ Database initialization failed")
            return False
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        return False

def main():
    """Main function to check and fix admin login"""
    print("🔍 Checking Admin Login Setup")
    print("=" * 40)
    
    # Step 1: Check if backend is running
    if not test_backend_connection():
        print("\n📋 To fix:")
        print("1. cd backend")
        print("2. python -m uvicorn app.main:app --reload --port 8000")
        return
    
    # Step 2: Test admin login
    if test_admin_login():
        print("\n🎉 Admin login is working!")
        print("📋 Login Credentials:")
        print("   Username: admin")
        print("   Password: admin123")
        print("   User Type: admin")
        return
    
    # Step 3: Try to initialize database
    print("\n🔄 Login failed, trying to initialize database...")
    if initialize_database():
        print("\n🔄 Testing login again after database initialization...")
        if test_admin_login():
            print("\n🎉 Admin login is now working!")
            return
    
    print("\n❌ Could not fix admin login. Manual steps:")
    print("1. Check if MySQL/SQLite database is running")
    print("2. Run: cd backend && python scripts/simple_init_db.py")
    print("3. Check backend logs for errors")
    print("4. Verify database connection in backend/app/core/config.py")

if __name__ == "__main__":
    main()