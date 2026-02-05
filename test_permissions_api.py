import requests
import json

# Test the permissions API
BASE_URL = "http://localhost:8000"

def test_permissions_api():
    try:
        # First, login to get a token
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        print("🔄 Testing login...")
        login_response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            token = login_response.json()["access_token"]
            print("✅ Login successful, token obtained")
            
            # Test get permissions
            headers = {"Authorization": f"Bearer {token}"}
            
            print("\n🔄 Testing GET /permissions/...")
            permissions_response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
            
            if permissions_response.status_code == 200:
                permissions = permissions_response.json()
                print("✅ GET permissions successful")
                print(f"📊 Found {len(permissions)} roles")
                
                # Check Super Admin permissions
                if "Super Admin" in permissions:
                    super_admin = permissions["Super Admin"]
                    print(f"📋 Super Admin has {len(super_admin)} modules")
                    
                    if "administrator" in super_admin:
                        admin_perms = super_admin["administrator"]
                        print(f"🔑 Super Admin administrator permissions: {admin_perms}")
                    else:
                        print("❌ Super Admin administrator permissions missing!")
                else:
                    print("❌ Super Admin role missing!")
                
                # Test update permissions (small change)
                print("\n🔄 Testing PUT /permissions/...")
                
                # Make a small test change
                test_permissions = permissions.copy()
                if "Investor Relationship Executive" in test_permissions:
                    # Toggle a permission for testing
                    current_value = test_permissions["Investor Relationship Executive"]["dashboard"]["create"]
                    test_permissions["Investor Relationship Executive"]["dashboard"]["create"] = not current_value
                    print(f"🔄 Testing: IRE dashboard create {current_value} → {not current_value}")
                    
                    update_response = requests.put(f"{BASE_URL}/permissions/", json=test_permissions, headers=headers)
                    
                    if update_response.status_code == 200:
                        result = update_response.json()
                        print("✅ PUT permissions successful")
                        print(f"📊 Updated {result.get('updated_count', 0)} permissions")
                        
                        # Verify the change
                        print("\n🔄 Verifying change...")
                        verify_response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
                        if verify_response.status_code == 200:
                            updated_permissions = verify_response.json()
                            new_value = updated_permissions["Investor Relationship Executive"]["dashboard"]["create"]
                            if new_value == (not current_value):
                                print("✅ Permission change verified successfully")
                            else:
                                print(f"❌ Permission change failed: expected {not current_value}, got {new_value}")
                        
                        # Revert the change
                        test_permissions["Investor Relationship Executive"]["dashboard"]["create"] = current_value
                        revert_response = requests.put(f"{BASE_URL}/permissions/", json=test_permissions, headers=headers)
                        if revert_response.status_code == 200:
                            print("✅ Permission reverted successfully")
                        
                    else:
                        print(f"❌ PUT permissions failed: {update_response.status_code}")
                        print(f"❌ Error: {update_response.text}")
                
            else:
                print(f"❌ GET permissions failed: {permissions_response.status_code}")
                print(f"❌ Error: {permissions_response.text}")
                
        else:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"❌ Error: {login_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to backend server. Is it running on http://localhost:8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_permissions_api()