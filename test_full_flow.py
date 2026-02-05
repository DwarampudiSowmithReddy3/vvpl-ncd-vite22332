#!/usr/bin/env python3
"""
Test Full Frontend-Backend Flow
"""

import requests
import json

def test_full_flow():
    print("🔄 Testing Full Frontend-Backend Flow")
    print("=" * 50)
    
    # Step 1: Clear any existing data
    print("\n1️⃣ Clearing existing localStorage data...")
    # This would be done in browser: localStorage.clear()
    
    # Step 2: Test backend authentication
    print("\n2️⃣ Testing Backend Authentication...")
    try:
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
            json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            token = login_data['access_token']
            user_info = login_data['user_info']
            
            print("✅ Backend authentication successful")
            print(f"   User: {user_info['full_name']} ({user_info['role']})")
            print(f"   Token: {token[:20]}...")
            
            # Step 3: Test series data fetch
            print("\n3️⃣ Testing Series Data Fetch...")
            series_response = requests.get('http://localhost:8003/api/v1/series/', 
                headers={'Authorization': f'Bearer {token}'})
            
            if series_response.status_code == 200:
                series_data = series_response.json()
                print(f"✅ Series data fetched: {len(series_data)} series")
                
                # Step 4: Test data transformation (like frontend does)
                print("\n4️⃣ Testing Data Transformation...")
                transformed_series = []
                for s in series_data:
                    transformed = {
                        'id': s['id'],
                        'name': s['series_name'],
                        'seriesCode': s['series_code'],
                        'interestRate': s['interest_rate'],
                        'status': s['status'],
                        'targetAmount': s.get('targetAmount', s.get('issue_size', 0)),
                        'fundsRaised': s.get('fundsRaised', s.get('total_subscribed', 0)),
                        'investors': s.get('investors', 0)
                    }
                    transformed_series.append(transformed)
                
                print(f"✅ Data transformation successful: {len(transformed_series)} series")
                
                # Show transformed data
                for i, series in enumerate(transformed_series, 1):
                    print(f"   {i}. {series['name']} ({series['seriesCode']})")
                    print(f"      Status: {series['status']}")
                    print(f"      Interest: {series['interestRate']}%")
                    print(f"      Target: ₹{series['targetAmount']:,.0f}")
                    print()
                
                # Step 5: Simulate localStorage storage
                print("5️⃣ Simulating localStorage Storage...")
                user_data = {
                    'username': user_info['username'],
                    'role': user_info['role'],
                    'name': user_info['full_name'],
                    'displayRole': user_info['role'],
                    'email': user_info['email'],
                    'id': user_info['id']
                }
                
                print("✅ User data prepared for localStorage:")
                print(f"   {json.dumps(user_data, indent=2)}")
                
                print("\n🎉 Full flow test successful!")
                print("📋 Next steps:")
                print("   1. Open http://localhost:5174/ in browser")
                print("   2. Login with admin/admin123")
                print("   3. Navigate to /debug-data to see DataContext status")
                print("   4. Check browser console for DataContext logs")
                print("   5. Navigate to /ncd-series to see actual data")
                
                return True
                
            else:
                print(f"❌ Series fetch failed: {series_response.status_code}")
                return False
                
        else:
            print(f"❌ Authentication failed: {login_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_full_flow()
    if not success:
        print("\n❌ Flow test failed - check backend and try again")