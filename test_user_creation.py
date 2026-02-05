#!/usr/bin/env python3
"""
Test user creation endpoint
"""
import requests
import json

def test_user_creation():
    """Test creating a new user"""
    
    # Login first
    login_url = "http://localhost:8003/api/v1/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        print("🔐 Logging in...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            
            # Test user creation
            create_url = "http://localhost:8003/api/v1/admin/users"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Test user data
            new_user_data = {
                "user_id": "USR999",
                "username": "testuser123",
                "fullName": "Test User 123",
                "email": "testuser123@example.com",
                "password": "password123",
                "role": "Finance Executive",
                "phone": "+91 9876543210"
            }
            
            print("📝 Creating new user...")
            print(f"📤 User data: {json.dumps(new_user_data, indent=2)}")
            
            create_response = requests.post(create_url, json=new_user_data, headers=headers)
            
            print(f"📥 Create response status: {create_response.status_code}")
            print(f"📥 Response headers: {dict(create_response.headers)}")
            
            if create_response.status_code == 200:
                result = create_response.json()
                print(f"✅ User created successfully!")
                print(f"📊 Response: {json.dumps(result, indent=2)}")
            else:
                print(f"❌ User creation failed: {create_response.status_code}")
                try:
                    error_data = create_response.json()
                    print(f"❌ Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"❌ Error text: {create_response.text}")
                    
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_user_creation()