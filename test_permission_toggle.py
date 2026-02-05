#!/usr/bin/env python3
"""
Test permission toggle functionality
"""
import requests
import json

def test_permission_toggle():
    """Test toggling a permission and verifying the change"""
    
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
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print("✅ Login successful")
            
            # Test toggling Admin role's dashboard create permission (currently True -> False)
            print("\n🔄 Testing permission toggle: Admin.dashboard.create = False")
            
            toggle_data = {
                "role_name": "Admin",
                "module_name": "dashboard",
                "permission_type": "create",
                "is_granted": False
            }
            
            update_response = requests.put(
                "http://localhost:8003/api/v1/admin/permissions",
                json=toggle_data,
                headers=headers
            )
            
            print(f"📥 Update response status: {update_response.status_code}")
            
            if update_response.status_code == 200:
                result = update_response.json()
                print(f"✅ Permission updated: {result['message']}")
                
                # Verify the change by loading permissions again
                print("\n🔍 Verifying the change...")
                permissions_response = requests.get(
                    "http://localhost:8003/api/v1/admin/all-permissions",
                    headers=headers
                )
                
                if permissions_response.status_code == 200:
                    permissions_data = permissions_response.json()
                    admin_dashboard_create = permissions_data.get('Admin', {}).get('dashboard', {}).get('create', None)
                    
                    if admin_dashboard_create == False:
                        print("✅ Permission change verified: Admin.dashboard.create = False")
                    else:
                        print(f"❌ Permission change not reflected: Admin.dashboard.create = {admin_dashboard_create}")
                        
                    # Show current Admin dashboard permissions
                    admin_dashboard = permissions_data.get('Admin', {}).get('dashboard', {})
                    print(f"📊 Admin dashboard permissions: {admin_dashboard}")
                    
                else:
                    print(f"❌ Failed to verify change: {permissions_response.status_code}")
                    
            else:
                print(f"❌ Permission update failed: {update_response.status_code}")
                try:
                    error_data = update_response.json()
                    print(f"❌ Error details: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"❌ Error text: {update_response.text}")
                    
        else:
            print(f"❌ Login failed: {login_response.status_code}")
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection error: Backend server is not running on localhost:8003")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == "__main__":
    test_permission_toggle()