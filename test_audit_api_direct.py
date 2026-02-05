#!/usr/bin/env python3
"""
Direct test of audit logging API to debug 422 errors
"""

import requests
import json
from datetime import datetime

API_BASE_URL = 'http://localhost:8000'

def test_audit_logging():
    print("🔄 Testing Audit Logging API...")
    
    try:
        # Step 1: Login to get token
        print("🔄 Step 1: Logging in...")
        login_response = requests.post(f"{API_BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return
        
        login_data = login_response.json()
        token = login_data['access_token']
        print(f"✅ Login successful, token: {token[:20]}...")
        
        # Step 2: Test audit log creation
        print("🔄 Step 2: Creating audit log...")
        
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        
        # Test with minimal required data
        audit_data = {
            "action": "Test Action",
            "admin_name": "Test Admin",
            "admin_role": "Super Admin", 
            "details": "This is a test audit log entry"
        }
        
        print(f"🔄 Sending audit data: {json.dumps(audit_data, indent=2)}")
        
        audit_response = requests.post(f"{API_BASE_URL}/audit/", 
                                     headers=headers, 
                                     json=audit_data)
        
        print(f"📡 Audit response status: {audit_response.status_code}")
        
        if audit_response.status_code == 422:
            print("❌ 422 Unprocessable Entity Error!")
            print(f"Response: {audit_response.text}")
            
            # Try to parse the error details
            try:
                error_data = audit_response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                print("Could not parse error response as JSON")
            return
        
        if audit_response.status_code != 200:
            print(f"❌ Audit log creation failed: {audit_response.status_code}")
            print(f"Response: {audit_response.text}")
            return
        
        audit_result = audit_response.json()
        print(f"✅ Audit log created successfully!")
        print(f"Result: {json.dumps(audit_result, indent=2)}")
        
        # Step 3: Test with optional fields
        print("🔄 Step 3: Testing with optional fields...")
        
        audit_data_full = {
            "action": "Test Action with Optional Fields",
            "admin_name": "Test Admin",
            "admin_role": "Super Admin",
            "details": "This is a test audit log entry with optional fields",
            "entity_type": "Test Entity",
            "entity_id": "test-123",
            "changes": {
                "field1": "value1",
                "field2": "value2",
                "timestamp": datetime.now().isoformat()
            }
        }
        
        print(f"🔄 Sending full audit data: {json.dumps(audit_data_full, indent=2)}")
        
        audit_response_full = requests.post(f"{API_BASE_URL}/audit/", 
                                          headers=headers, 
                                          json=audit_data_full)
        
        print(f"📡 Full audit response status: {audit_response_full.status_code}")
        
        if audit_response_full.status_code == 422:
            print("❌ 422 Unprocessable Entity Error with full data!")
            print(f"Response: {audit_response_full.text}")
            return
        
        if audit_response_full.status_code != 200:
            print(f"❌ Full audit log creation failed: {audit_response_full.status_code}")
            print(f"Response: {audit_response_full.text}")
            return
        
        audit_result_full = audit_response_full.json()
        print(f"✅ Full audit log created successfully!")
        print(f"Result: {json.dumps(audit_result_full, indent=2)}")
        
        # Step 4: Get audit logs to verify
        print("🔄 Step 4: Retrieving audit logs...")
        
        get_response = requests.get(f"{API_BASE_URL}/audit/?limit=5", headers=headers)
        
        if get_response.status_code == 200:
            logs = get_response.json()
            print(f"✅ Retrieved {len(logs)} audit logs")
            for log in logs:
                print(f"  - {log['timestamp']}: {log['action']} by {log['admin_name']}")
        else:
            print(f"❌ Failed to retrieve audit logs: {get_response.status_code}")
        
        print("🎉 All tests completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_audit_logging()