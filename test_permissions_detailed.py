#!/usr/bin/env python3
"""
Detailed test of permissions endpoints
"""
import requests
import json

def test_permissions_detailed():
    """Test permissions endpoints with detailed output"""
    
    base_url = "http://localhost:8003"
    
    # Test different endpoints
    endpoints = [
        "/api/v1/admin/permissions",
        "/api/v1/admin/permissions-data", 
        "/api/v1/admin/public/permissions"
    ]
    
    print("🔍 Testing permissions endpoints...")
    
    for endpoint in endpoints:
        url = f"{base_url}{endpoint}"
        print(f"\n📍 Testing: {url}")
        
        try:
            # Test without authentication
            response = requests.get(url, timeout=10)
            print(f"   Status: {response.status_code}")
            print(f"   Headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    print(f"   ✅ Success! Response type: {type(data)}")
                    if isinstance(data, dict):
                        print(f"   📊 Keys: {list(data.keys())}")
                        if data:
                            first_key = list(data.keys())[0]
                            print(f"   📋 Sample role '{first_key}': {list(data[first_key].keys()) if isinstance(data[first_key], dict) else 'Not a dict'}")
                    else:
                        print(f"   📊 Data: {data}")
                except json.JSONDecodeError as e:
                    print(f"   ❌ JSON decode error: {e}")
                    print(f"   📄 Raw response: {response.text[:200]}...")
            else:
                print(f"   ❌ Error response: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ Connection failed - backend not running on {base_url}")
        except requests.exceptions.Timeout:
            print(f"   ❌ Request timeout")
        except Exception as e:
            print(f"   ❌ Unexpected error: {e}")
    
    # Test if backend is running at all
    print(f"\n🔍 Testing if backend is accessible...")
    try:
        response = requests.get(f"{base_url}/docs", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Backend is running - FastAPI docs accessible")
        else:
            print(f"   ⚠️ Backend responded with status: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Backend not accessible: {e}")

if __name__ == "__main__":
    test_permissions_detailed()