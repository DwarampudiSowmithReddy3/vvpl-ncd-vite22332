#!/usr/bin/env python3
"""
Verify permission system is working correctly
"""
import requests
import json

def verify_permission_system():
    """Verify all permission endpoints are working"""
    
    base_url = "http://localhost:8003/api/v1/admin"
    
    print("🔍 Verifying Permission System...")
    print("=" * 50)
    
    # Test 1: Check if backend is running
    print("\n1. 🔍 Checking backend status...")
    try:
        response = requests.get("http://localhost:8003/docs", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is running")
        else:
            print(f"   ❌ Backend issue: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")
        return
    
    # Test 2: Check permission reading endpoints
    print("\n2. 📖 Testing permission reading endpoints...")
    
    read_endpoints = [
        "/permissions",
        "/permissions-data", 
        "/public/permissions"
    ]
    
    for endpoint in read_endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                data = response.json()
                roles_count = len(data) if isinstance(data, dict) else 0
                print(f"   ✅ {endpoint} - {roles_count} roles found")
            elif response.status_code == 403:
                print(f"   ⚠️ {endpoint} - Requires authentication")
            else:
                print(f"   ❌ {endpoint} - Status: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {e}")
    
    # Test 3: Check permission update endpoints (will require auth)
    print("\n3. 🔄 Testing permission update endpoints...")
    
    update_endpoints = [
        ("PUT", "/permissions"),
        ("POST", "/permissions/bulk-update")
    ]
    
    test_data = {
        "role_name": "Admin",
        "module_name": "dashboard",
        "permission_type": "view", 
        "is_granted": True
    }
    
    for method, endpoint in update_endpoints:
        try:
            if method == "PUT":
                response = requests.put(f"{base_url}{endpoint}", 
                                      json=test_data, timeout=10)
            else:
                response = requests.post(f"{base_url}{endpoint}",
                                       json=[test_data], timeout=10)
            
            if response.status_code == 401 or response.status_code == 403:
                print(f"   ✅ {method} {endpoint} - Requires authentication (expected)")
            elif response.status_code == 404:
                print(f"   ❌ {method} {endpoint} - Not found (backend needs restart)")
            elif response.status_code == 422:
                print(f"   ✅ {method} {endpoint} - Validation working (expected)")
            else:
                print(f"   ⚠️ {method} {endpoint} - Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {method} {endpoint} - Error: {e}")
    
    # Test 4: Check database connection
    print("\n4. 🗄️ Testing database connection...")
    try:
        # This will test if the permissions service can connect to database
        response = requests.get(f"{base_url}/permissions-data", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data and isinstance(data, dict):
                print("   ✅ Database connection working")
                print(f"   📊 Available roles: {', '.join(data.keys())}")
            else:
                print("   ⚠️ Database connected but no permissions found")
        else:
            print(f"   ❌ Database connection issue: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Database test failed: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 NEXT STEPS:")
    print("1. If any endpoints show 404 - restart the backend")
    print("2. Login as Super Admin in the frontend")
    print("3. Go to Administrator page and test permission toggles")
    print("4. Check browser console for API call logs")
    print("5. Verify database updates in role_permissions table")

if __name__ == "__main__":
    verify_permission_system()