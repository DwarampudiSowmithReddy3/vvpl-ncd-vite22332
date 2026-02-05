#!/usr/bin/env python3
"""
Debug permission update issue
"""
import requests
import json

def debug_permission_update():
    """Debug the permission update API call"""
    
    # Test data that should work
    test_data = {
        "role_name": "Admin",
        "module_name": "dashboard",
        "permission_type": "create",
        "is_granted": True
    }
    
    print("🔍 Debugging Permission Update...")
    print(f"📤 Sending data: {json.dumps(test_data, indent=2)}")
    
    try:
        response = requests.put(
            "http://localhost:8003/api/v1/admin/permissions",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📥 Response Status: {response.status_code}")
        print(f"📥 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📥 Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📥 Response Text: {response.text}")
            
        # Test with different data to see if it's a validation issue
        print("\n🔍 Testing with minimal data...")
        minimal_data = {
            "role_name": "Admin",
            "module_name": "dashboard", 
            "permission_type": "view",
            "is_granted": False
        }
        
        response2 = requests.put(
            "http://localhost:8003/api/v1/admin/permissions",
            json=minimal_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📥 Minimal Test Status: {response2.status_code}")
        try:
            response2_data = response2.json()
            print(f"📥 Minimal Test Data: {json.dumps(response2_data, indent=2)}")
        except:
            print(f"📥 Minimal Test Text: {response2.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_permission_update()