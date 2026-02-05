#!/usr/bin/env python3
"""
Test the users endpoint that the frontend is trying to call
"""
import requests
import json

def test_users_endpoint():
    """Test the admin users endpoint"""
    
    # First, login to get a token
    login_url = "http://localhost:8003/api/v1/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        print("🔐 Attempting to login...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            user_info = login_result.get('user_info', {})
            
            print(f"✅ Login successful")
            print(f"👤 User: {user_info.get('username')} ({user_info.get('role')})")
            
            # Test getting users (what the frontend is trying to do)
            users_url = "http://localhost:8003/api/v1/admin/users"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print("\n🔄 Testing users endpoint...")
            users_response = requests.get(users_url, headers=headers)
            
            print(f"📥 Users response status: {users_response.status_code}")
            
            if users_response.status_code == 200:
                users_data = users_response.json()
                print(f"✅ Users loaded successfully")
                print(f"📊 Found {len(users_data)} users:")
                
                for user in users_data[:3]:  # Show first 3 users
                    print(f"  - {user.get('username', 'N/A')} ({user.get('role', 'N/A')}) - ID: {user.get('id', 'N/A')}")
                        
            else:
                print(f"❌ Users endpoint failed: {users_response.status_code}")
                try:
                    error_data = users_response.json()
                    print(f"❌ Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"❌ Error text: {users_response.text}")
                    
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            try:
                error_data = login_response.json()
                print(f"❌ Login error: {json.dumps(error_data, indent=2)}")
            except:
                print(f"❌ Login error text: {login_response.text}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Backend server is not running on localhost:8003")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_users_endpoint()