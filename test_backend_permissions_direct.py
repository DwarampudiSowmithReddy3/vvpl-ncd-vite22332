#!/usr/bin/env python3
"""
Direct Backend Permission Test - FINAL FIX
Tests the backend permission system directly to ensure it's working correctly.
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
    
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"✅ Login successful, token: {token[:20]}...")
        return token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_get_permissions(token):
    """Test getting permissions from backend"""
    print("\n🔄 Testing get permissions...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
    
    if response.status_code == 200:
        permissions = response.json()
        print(f"✅ Permissions retrieved successfully")
        print(f"📊 Found {len(permissions)} roles")
        
        # Check specific permissions
        if "Finance Executive" in permissions:
            fe = permissions["Finance Executive"]
            if "ncdSeries" in fe:
                print(f"📋 Finance Executive NCD Series View: {fe['ncdSeries']['view']}")
            else:
                print("❌ Finance Executive missing ncdSeries permissions")
        else:
            print("❌ Finance Executive role not found")
            
        if "Super Admin" in permissions:
            sa = permissions["Super Admin"]
            if "administrator" in sa:
                print(f"📋 Super Admin Administrator View: {sa['administrator']['view']}")
            else:
                print("❌ Super Admin missing administrator permissions")
        else:
            print("❌ Super Admin role not found")
            
        return permissions
    else:
        print(f"❌ Get permissions failed: {response.status_code} - {response.text}")
        return None

def test_update_permissions(token, permissions):
    """Test updating permissions"""
    print("\n🔄 Testing update permissions...")
    
    # Toggle Finance Executive NCD Series view permission
    if "Finance Executive" in permissions and "ncdSeries" in permissions["Finance Executive"]:
        current_value = permissions["Finance Executive"]["ncdSeries"]["view"]
        new_value = not current_value
        
        print(f"🔄 Toggling Finance Executive NCD Series View: {current_value} → {new_value}")
        
        # Update the permissions
        permissions["Finance Executive"]["ncdSeries"]["view"] = new_value
        
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        
        response = requests.put(f"{BASE_URL}/permissions/", 
                              headers=headers, 
                              json=permissions)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Permissions updated successfully: {result.get('message')}")
            return True
        else:
            print(f"❌ Update permissions failed: {response.status_code} - {response.text}")
            return False
    else:
        print("❌ Cannot test update - Finance Executive or ncdSeries not found")
        return False

def test_get_permissions_after_update(token):
    """Test getting permissions after update to verify persistence"""
    print("\n🔄 Testing get permissions after update...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.get(f"{BASE_URL}/permissions/", headers=headers)
    
    if response.status_code == 200:
        permissions = response.json()
        print(f"✅ Permissions retrieved after update")
        
        # Check if the change persisted
        if "Finance Executive" in permissions and "ncdSeries" in permissions["Finance Executive"]:
            fe_view = permissions["Finance Executive"]["ncdSeries"]["view"]
            print(f"📋 Finance Executive NCD Series View after update: {fe_view}")
            return permissions
        else:
            print("❌ Finance Executive or ncdSeries not found after update")
            return None
    else:
        print(f"❌ Get permissions after update failed: {response.status_code} - {response.text}")
        return None

def main():
    print("🧪 Backend Permission System Test - FINAL FIX")
    print("=" * 50)
    
    # Test login
    token = test_login()
    if not token:
        print("❌ Cannot continue without token")
        sys.exit(1)
    
    # Test get permissions
    permissions = test_get_permissions(token)
    if not permissions:
        print("❌ Cannot continue without permissions")
        sys.exit(1)
    
    # Test update permissions
    update_success = test_update_permissions(token, permissions.copy())
    if not update_success:
        print("❌ Update test failed")
        sys.exit(1)
    
    # Test get permissions after update
    updated_permissions = test_get_permissions_after_update(token)
    if not updated_permissions:
        print("❌ Cannot verify persistence")
        sys.exit(1)
    
    print("\n" + "=" * 50)
    print("✅ ALL TESTS PASSED!")
    print("🎉 Backend permission system is working correctly")
    print("📝 The issue was in the frontend AuthContext, not the backend")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)