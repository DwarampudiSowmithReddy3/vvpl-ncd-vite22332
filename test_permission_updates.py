#!/usr/bin/env python3
"""
Test permission update endpoints
"""
import requests
import json

def test_permission_updates():
    """Test the permission update API endpoints"""
    
    base_url = "http://localhost:8003/api/v1/admin"
    
    # First, try to get a token (you'll need to login first)
    print("🔍 Testing permission update endpoints...")
    print("Note: You need to be logged in as Super Admin to test updates")
    
    # Test data
    test_permission = {
        "role_name": "Admin",
        "module_name": "dashboard", 
        "permission_type": "create",
        "is_granted": True
    }
    
    # Test single permission update
    print(f"\n📍 Testing single permission update: {test_permission}")
    
    try:
        # This will fail without authentication, but we can see if the endpoint exists
        response = requests.put(f"{base_url}/permissions", 
                              json=test_permission,
                              timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401 or response.status_code == 403:
            print("   ✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("   ❌ Endpoint not found - backend needs restart")
        else:
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Backend not running")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test bulk update endpoint
    print(f"\n📍 Testing bulk permission update endpoint")
    
    try:
        response = requests.post(f"{base_url}/permissions/bulk-update",
                               json=[test_permission],
                               timeout=10)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401 or response.status_code == 403:
            print("   ✅ Endpoint exists but requires authentication (expected)")
        elif response.status_code == 404:
            print("   ❌ Endpoint not found - backend needs restart")
        else:
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("   ❌ Backend not running")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Check if backend is running
    print(f"\n🔍 Checking backend status...")
    try:
        response = requests.get(f"http://localhost:8003/docs", timeout=5)
        if response.status_code == 200:
            print("   ✅ Backend is running")
            print("   💡 To test permission updates:")
            print("      1. Login as Super Admin in the frontend")
            print("      2. Go to Administrator page")
            print("      3. Toggle permission switches")
            print("      4. Check browser console for API call logs")
        else:
            print(f"   ⚠️ Backend responded with status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")

if __name__ == "__main__":
    test_permission_updates()