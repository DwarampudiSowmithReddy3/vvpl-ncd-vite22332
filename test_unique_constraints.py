#!/usr/bin/env python3
"""
Test script to verify unique constraints for user data
"""
import requests
import json

# API base URL
API_BASE_URL = "http://localhost:8003/api/v1"

def test_unique_constraints():
    """Test unique constraints for email, phone, and PAN"""
    
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
        
        # Test data
        investor_data = {
            "investor_type": "individual",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "phone": "9876543210",
            "address_line1": "123 Test Street",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456",
            "pan_number": "ABCDE1234F"
        }
        
        print("🧪 Testing unique constraints...")
        
        # Test 1: Create first investor (should succeed)
        print("\n1. Creating first investor...")
        response = requests.post(f"{API_BASE_URL}/investors/", json=investor_data, headers=headers)
        if response.status_code == 200:
            print("✅ First investor created successfully")
            investor_id = response.json()["investor_id"]
            print(f"   Investor ID: {investor_id}")
        else:
            print(f"❌ Failed to create first investor: {response.status_code}")
            print(f"   Error: {response.text}")
            return
        
        # Test 2: Try to create investor with same email (should fail)
        print("\n2. Testing duplicate email...")
        duplicate_email_data = investor_data.copy()
        duplicate_email_data["phone"] = "9876543211"  # Different phone
        duplicate_email_data["pan_number"] = "ABCDE1234G"  # Different PAN
        
        response = requests.post(f"{API_BASE_URL}/investors/", json=duplicate_email_data, headers=headers)
        if response.status_code == 400:
            print("✅ Duplicate email correctly rejected")
            print(f"   Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Duplicate email should have been rejected but got: {response.status_code}")
        
        # Test 3: Try to create investor with same phone (should fail)
        print("\n3. Testing duplicate phone...")
        duplicate_phone_data = investor_data.copy()
        duplicate_phone_data["email"] = "test2@example.com"  # Different email
        duplicate_phone_data["pan_number"] = "ABCDE1234H"  # Different PAN
        
        response = requests.post(f"{API_BASE_URL}/investors/", json=duplicate_phone_data, headers=headers)
        if response.status_code == 400:
            print("✅ Duplicate phone correctly rejected")
            print(f"   Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Duplicate phone should have been rejected but got: {response.status_code}")
        
        # Test 4: Try to create investor with same PAN (should fail)
        print("\n4. Testing duplicate PAN...")
        duplicate_pan_data = investor_data.copy()
        duplicate_pan_data["email"] = "test3@example.com"  # Different email
        duplicate_pan_data["phone"] = "9876543212"  # Different phone
        
        response = requests.post(f"{API_BASE_URL}/investors/", json=duplicate_pan_data, headers=headers)
        if response.status_code == 400:
            print("✅ Duplicate PAN correctly rejected")
            print(f"   Error message: {response.json().get('detail', 'No detail')}")
        else:
            print(f"❌ Duplicate PAN should have been rejected but got: {response.status_code}")
        
        # Test 5: Create investor with all unique data (should succeed)
        print("\n5. Creating investor with all unique data...")
        unique_data = {
            "investor_type": "individual",
            "first_name": "Unique",
            "last_name": "User",
            "email": "unique@example.com",
            "phone": "9876543213",
            "address_line1": "456 Unique Street",
            "city": "Unique City",
            "state": "Unique State",
            "pincode": "654321",
            "pan_number": "ZYXWV9876A"
        }
        
        response = requests.post(f"{API_BASE_URL}/investors/", json=unique_data, headers=headers)
        if response.status_code == 200:
            print("✅ Unique investor created successfully")
            unique_investor_id = response.json()["investor_id"]
            print(f"   Investor ID: {unique_investor_id}")
        else:
            print(f"❌ Failed to create unique investor: {response.status_code}")
            print(f"   Error: {response.text}")
        
        print("\n🎉 Unique constraint testing completed!")
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to API server. Make sure the backend is running on localhost:8003")
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_unique_constraints()