#!/usr/bin/env python3
"""
Direct API test for permissions system
This will test the backend permissions API directly to verify it's working
"""

import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin123"

def test_login():
    """Test login and get token"""
    print("🔄 Testing login...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": USERNAME, "password": PASSWORD},
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user = data.get("user", {})
            print(f"✅ Login successful!")
            print(f"   User: {user.get('username')}")
            print(f"   Role: {user.get('role')}")
            print(f"   Token: {token[:20]}..." if token else "   Token: None")
            return token
        else:
            print(f"❌ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_get_permissions(token):
    """Test getting permissions"""
    print("\n🔄 Testing GET permissions...")
    
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
        
        if response.status_code == 200:
            permissions = response.json()
            print("✅ GET permissions successful!")
            
            # Check key roles
            super_admin = permissions.get("Super Admin", {})
            ire = permissions.get("Investor Relationship Executive", {})
            
            print(f"   Super Admin dashboard: {super_admin.get('dashboard', {})}")
            print(f"   IRE dashboard: {ire.get('dashboard', {})}")
            print(f"   IRE investors: {ire.get('investors', {})}")
            print(f"   Total roles: {len(permissions)}")
            
            return permissions
        else:
            print(f"❌ GET permissions failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ GET permissions error: {e}")
        return None

def test_update_permissions(token, current_permissions):
    """Test updating permissions"""
    print("\n🔄 Testing PUT permissions...")
    
    if not current_permissions:
        print("❌ Cannot test PUT without current permissions")
        return False
    
    try:
        # Make a test change - toggle IRE dashboard view
        test_permissions = current_permissions.copy()
        ire_perms = test_permissions.get("Investor Relationship Executive", {})
        dashboard_perms = ire_perms.get("dashboard", {})
        
        old_view = dashboard_perms.get("view", True)
        new_view = not old_view
        
        test_permissions["Investor Relationship Executive"]["dashboard"]["view"] = new_view
        
        print(f"   Making test change: IRE dashboard view {old_view} → {new_view}")
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.put(
            f"{BASE_URL}/permissions/",
            json=test_permissions,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ PUT permissions successful!")
            print(f"   Message: {result.get('message')}")
            
            # Verify the change
            verify_response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
            if verify_response.status_code == 200:
                updated_permissions = verify_response.json()
                actual_view = updated_permissions["Investor Relationship Executive"]["dashboard"]["view"]
                
                if actual_view == new_view:
                    print(f"✅ Verification successful: IRE dashboard view = {actual_view}")
                    
                    # Restore original value
                    test_permissions["Investor Relationship Executive"]["dashboard"]["view"] = old_view
                    restore_response = requests.put(
                        f"{BASE_URL}/permissions/",
                        json=test_permissions,
                        headers=headers
                    )
                    if restore_response.status_code == 200:
                        print(f"✅ Restored original value: IRE dashboard view = {old_view}")
                    
                    return True
                else:
                    print(f"❌ Verification failed: expected {new_view}, got {actual_view}")
                    return False
            else:
                print(f"⚠️ Could not verify changes: {verify_response.status_code}")
                return False
        else:
            print(f"❌ PUT permissions failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ PUT permissions error: {e}")
        return False

def test_backend_health():
    """Test if backend is running"""
    print("🔄 Testing backend health...")
    
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"✅ Backend is running!")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:100]}...")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running or not accessible!")
        print("   Make sure the backend is started on port 8000")
        return False
    except Exception as e:
        print(f"❌ Backend health check error: {e}")
        return False

def main():
    print("🔍 Direct Permissions API Test")
    print("=" * 50)
    
    # Test 1: Backend health
    if not test_backend_health():
        print("\n❌ Backend is not accessible. Please start the backend first.")
        sys.exit(1)
    
    # Test 2: Login
    token = test_login()
    if not token:
        print("\n❌ Login failed. Cannot proceed with permissions tests.")
        sys.exit(1)
    
    # Test 3: Get permissions
    permissions = test_get_permissions(token)
    if not permissions:
        print("\n❌ GET permissions failed.")
        sys.exit(1)
    
    # Test 4: Update permissions
    if test_update_permissions(token, permissions):
        print("\n✅ All tests passed! Backend permissions API is working correctly.")
        print("\n🔍 CONCLUSION:")
        print("   - Backend is running and accessible")
        print("   - Authentication is working")
        print("   - Permissions can be retrieved from database")
        print("   - Permissions can be updated and saved to database")
        print("   - The issue is likely in the frontend not calling the API correctly")
    else:
        print("\n❌ PUT permissions test failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()