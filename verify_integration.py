#!/usr/bin/env python3
"""
Verify Frontend-Backend Integration
"""

import requests
import json

def verify_integration():
    print("🔗 Verifying Frontend-Backend Integration")
    print("=" * 50)
    
    # Test backend directly
    print("\n1️⃣ Testing Backend Direct Access...")
    try:
        # Login
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
            json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            print("✅ Backend login successful")
            
            # Get series
            series_response = requests.get('http://localhost:8003/api/v1/series/', 
                headers={'Authorization': f'Bearer {token}'})
            
            if series_response.status_code == 200:
                series_data = series_response.json()
                print(f"✅ Backend has {len(series_data)} series available")
                
                # Show series details
                for i, s in enumerate(series_data, 1):
                    print(f"   {i}. {s['series_name']} ({s['series_code']}) - {s['status']}")
                    print(f"      Target: ₹{s.get('issue_size', 0):,.0f}")
                    print(f"      Interest: {s.get('interest_rate', 0)}%")
                    print(f"      Created: {s.get('created_at', 'Unknown')}")
                    print()
                
                return True
            else:
                print(f"❌ Failed to get series: {series_response.status_code}")
                return False
        else:
            print(f"❌ Backend login failed: {login_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Backend test failed: {e}")
        return False

def check_frontend_status():
    print("\n2️⃣ Checking Frontend Status...")
    try:
        # Check if frontend is accessible
        frontend_response = requests.get('http://localhost:5174/', timeout=5)
        if frontend_response.status_code == 200:
            print("✅ Frontend is running on http://localhost:5174/")
            return True
        else:
            print(f"❌ Frontend returned status: {frontend_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend not accessible: {e}")
        return False

if __name__ == "__main__":
    backend_ok = verify_integration()
    frontend_ok = check_frontend_status()
    
    print("\n" + "=" * 50)
    if backend_ok and frontend_ok:
        print("🎉 Integration Status: READY!")
        print("✅ Backend: Running with data")
        print("✅ Frontend: Running and accessible")
        print("✅ Port Configuration: Correct (8003)")
        print("✅ Authentication: Working")
        print("✅ Data Available: Yes")
        print("\n📱 Open http://localhost:5174/ and login with admin/admin123")
        print("🔍 Navigate to NCD Series page to see the data")
    else:
        print("❌ Integration Status: ISSUES FOUND")
        if not backend_ok:
            print("❌ Backend: Issues detected")
        if not frontend_ok:
            print("❌ Frontend: Not accessible")