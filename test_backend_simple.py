#!/usr/bin/env python3
"""
Simple test to verify backend functionality
"""
import requests
import json

def test_backend():
    """Test backend endpoints"""
    base_url = "http://localhost:8000"
    
    print("🧪 Testing NCD Management System Backend")
    print("=" * 50)
    
    # Test 1: Health check
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            print("✅ Health check: PASSED")
            print(f"   Response: {response.json()}")
        else:
            print("❌ Health check: FAILED")
            return False
    except Exception as e:
        print(f"❌ Health check: FAILED - {e}")
        return False
    
    # Test 2: Login
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{base_url}/auth/login", json=login_data)
        if response.status_code == 200:
            print("✅ Login: PASSED")
            data = response.json()
            token = data.get("access_token")
            print(f"   Token received: {token[:20]}...")
            
            # Test 3: Get current user
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(f"{base_url}/auth/me", headers=headers)
            if response.status_code == 200:
                print("✅ Get current user: PASSED")
                user_data = response.json()
                print(f"   User: {user_data['username']} ({user_data['role']})")
                
                # Test 4: Get users
                response = requests.get(f"{base_url}/users/", headers=headers)
                if response.status_code == 200:
                    print("✅ Get users: PASSED")
                    users = response.json()
                    print(f"   Found {len(users)} users")
                    
                    # Test 5: Get audit logs
                    response = requests.get(f"{base_url}/audit/", headers=headers)
                    if response.status_code == 200:
                        print("✅ Get audit logs: PASSED")
                        logs = response.json()
                        print(f"   Found {len(logs)} audit logs")
                        
                        print("\n🎉 All tests PASSED!")
                        print("Backend is working correctly!")
                        return True
                    else:
                        print("❌ Get audit logs: FAILED")
                else:
                    print("❌ Get users: FAILED")
            else:
                print("❌ Get current user: FAILED")
        else:
            print("❌ Login: FAILED")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Login test: FAILED - {e}")
    
    return False

if __name__ == "__main__":
    test_backend()