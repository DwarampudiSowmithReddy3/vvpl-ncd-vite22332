#!/usr/bin/env python3
"""
Test script to verify user_id functionality in admin user creation
"""
import requests
import json

# API base URL
API_BASE_URL = "http://localhost:8003/api/v1"

def test_user_id_functionality():
    """Test user_id field in admin user creation"""
    
    # First, login to get token
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        # Login
        response = requests.post(f"{API_BASE_URL}/auth/login", json=login_data)
        if response.status_code != 200:
            print("❌ Login failed")
            return
        
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("🧪 Testing user_id functionality...")
        
        # Test 1: Create user with custom user_id (should succeed)
        print("\n1. Creating user with custom user_id...")
        user_data = {
            "user_id": "EMP001",
            "username": "testuser001",
            "full_name": "Test User One",
            "email": "testuser001@example.com",
            "password": "password123",
            "role": "viewer",
            "phone": "9876543210"
        }
        
        response = requests.post(f"{API_BASE_URL}/admin/users", json=user_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ User created successfully")
            print(f"   User ID: {result.get('user_id')}")
            print(f"   Username: {result.get('username')}")
            print(f"   Database ID: {result.get('id')}")
        else:
            print(f"❌ Failed to create user: {response.status_code}")
            print(f"   Error: {response.text}")
            return
        
        # Test 2: Try to create user with duplicate user_id (should fail)
        print("\n2. Testing duplicate user_id...")
        duplicate_user_data = {
            "user_id": "EMP001",  # Same user_id
            "username": "testuser002",
            "full_name": "Test User Two",
            "email": "testuser002@example.com",
            "password": "password123",
            "role": "viewer",
            "phone": "9876543211"
        }
        
        response = requests.post(f"{API_BASE_URL}/admin/users", json=duplicate_user_data, headers=headers)
        if response.status_code == 400:
            print("✅ Duplicate user_id correctly rejected")
            print(f"   Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Duplicate user_id should have been rejected but got: {response.status_code}")
        
        # Test 3: Create user with different user_id (should succeed)
        print("\n3. Creating user with different user_id...")
        unique_user_data = {
            "user_id": "EMP002",
            "username": "testuser002",
            "full_name": "Test User Two",
            "email": "testuser002@example.com",
            "password": "password123",
            "role": "viewer",
            "phone": "9876543211"
        }
        
        response = requests.post(f"{API_BASE_URL}/admin/users", json=unique_user_data, headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ User with unique user_id created successfully")
            print(f"   User ID: {result.get('user_id')}")
            print(f"   Username: {result.get('username')}")
        else:
            print(f"❌ Failed to create user with unique user_id: {response.status_code}")
            print(f"   Error: {response.text}")
        
        # Test 4: Get users list to verify user_id is returned
        print("\n4. Verifying user_id in users list...")
        response = requests.get(f"{API_BASE_URL}/admin/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print("✅ Users list retrieved successfully")
            for user in users[-2:]:  # Show last 2 users (our test users)
                print(f"   User ID: {user.get('user_id')}, Username: {user.get('username')}")
        else:
            print(f"❌ Failed to get users list: {response.status_code}")
        
        print("\n🎉 User ID functionality testing completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure the backend is running on localhost:8003")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_user_id_functionality()