#!/usr/bin/env python3
"""
Test permissions loading from clean database
"""
import requests
import json

def test_permissions_loading():
    """Test loading permissions from the clean database"""
    
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
            
            # Test getting all permissions
            permissions_url = "http://localhost:8003/api/v1/admin/all-permissions"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print("\n🔄 Testing all-permissions endpoint...")
            permissions_response = requests.get(permissions_url, headers=headers)
            
            print(f"📥 Permissions response status: {permissions_response.status_code}")
            
            if permissions_response.status_code == 200:
                permissions_data = permissions_response.json()
                print(f"✅ Permissions loaded successfully")
                print(f"📊 Found {len(permissions_data)} roles:")
                
                for role_name, role_permissions in permissions_data.items():
                    print(f"\n🎭 {role_name}:")
                    for module_name, module_permissions in role_permissions.items():
                        granted_permissions = [perm for perm, granted in module_permissions.items() if granted]
                        if granted_permissions:
                            print(f"  📁 {module_name}: {', '.join(granted_permissions)}")
                        
            else:
                print(f"❌ Permissions failed: {permissions_response.status_code}")
                try:
                    error_data = permissions_response.json()
                    print(f"❌ Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"❌ Error text: {permissions_response.text}")
                    
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
    test_permissions_loading()