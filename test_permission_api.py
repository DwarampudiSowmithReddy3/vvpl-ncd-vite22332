#!/usr/bin/env python3
"""
Test script to check permission API endpoint
"""
import requests
import json

def test_permission_update():
    """Test the permission update API"""
    
    # First, try to login to get a token
    login_url = "http://localhost:8003/api/v1/auth/login"
    login_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "admin123",  # Replace with actual admin password
        "user_type": "admin"
    }
    
    try:
        print("🔐 Attempting to login...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            print(f"✅ Login successful, got token: {token[:20]}...")
            
            # Test permission update
            permission_url = "http://localhost:8003/api/v1/admin/permissions"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Test data - Use Super Admin role since that's what the user is
            permission_data = {
                "role_name": "Super Admin",
                "module_name": "dashboard",
                "permission_type": "view",
                "is_granted": True
            }
            
            print("🔄 Testing permission update...")
            print(f"📤 Request data: {json.dumps(permission_data, indent=2)}")
            
            permission_response = requests.put(permission_url, json=permission_data, headers=headers)
            
            print(f"📥 Response status: {permission_response.status_code}")
            print(f"📥 Response headers: {dict(permission_response.headers)}")
            
            if permission_response.status_code == 200:
                result = permission_response.json()
                print(f"✅ Permission update successful: {result}")
            else:
                print(f"❌ Permission update failed: {permission_response.status_code}")
                try:
                    error_data = permission_response.json()
                    print(f"❌ Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"❌ Error text: {permission_response.text}")
                    
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
    test_permission_update()