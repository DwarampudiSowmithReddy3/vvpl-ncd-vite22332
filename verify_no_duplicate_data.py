#!/usr/bin/env python3
"""
Verify No Duplicate Data - Professional Corporate Application
"""

import requests

def verify_clean_data():
    print("🔍 PROFESSIONAL DATA VERIFICATION")
    print("=" * 50)
    
    # Login
    login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
        json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        print("✅ Authentication successful")
        
        # Verify Series Data
        print("\n📊 SERIES DATA VERIFICATION:")
        series_response = requests.get('http://localhost:8003/api/v1/series/', headers=headers)
        if series_response.status_code == 200:
            series_data = series_response.json()
            
            # Calculate real totals
            total_outstanding = 0
            active_series_count = 0
            
            print(f"   Total Series: {len(series_data)}")
            for s in series_data:
                if s['status'].upper() in ['ACTIVE', 'ACCEPTING']:
                    total_outstanding += s.get('issue_size', 0) or 0
                    active_series_count += 1
                    print(f"   ✅ {s['series_name']}: ₹{s.get('issue_size', 0):,.0f} ({s['status']})")
                else:
                    print(f"   ⏸️ {s['series_name']}: ₹{s.get('issue_size', 0):,.0f} ({s['status']} - not counted)")
            
            print(f"\n💰 REAL TOTAL OUTSTANDING: ₹{total_outstanding:,.0f}")
            print(f"💰 REAL TOTAL OUTSTANDING: ₹{total_outstanding/10000000:.2f} Cr")
            print(f"📈 ACTIVE SERIES COUNT: {active_series_count}")
            
        # Verify Admin Users (no duplicates)
        print("\n👤 ADMIN USERS VERIFICATION:")
        users_response = requests.get('http://localhost:8003/api/v1/admin/users', headers=headers)
        if users_response.status_code == 200:
            users_data = users_response.json()
            usernames = [u['username'] for u in users_data]
            
            duplicates = []
            for username in set(usernames):
                if usernames.count(username) > 1:
                    duplicates.append(username)
            
            if duplicates:
                print(f"   ❌ DUPLICATE USERNAMES: {duplicates}")
            else:
                print(f"   ✅ No duplicate usernames ({len(users_data)} users)")
        
        # Verify Investors
        print("\n👥 INVESTORS DATA VERIFICATION:")
        investors_response = requests.get('http://localhost:8003/api/v1/investors/', headers=headers)
        if investors_response.status_code == 200:
            investors_data = investors_response.json()
            print(f"   Total Investors: {len(investors_data)}")
            
            if len(investors_data) == 0:
                print("   ✅ No investors - satisfaction metrics should be 0%")
            else:
                print(f"   📊 {len(investors_data)} investors found")
        
        print("\n" + "=" * 50)
        print("🎯 EXPECTED DASHBOARD VALUES:")
        print(f"   Total Outstanding NCD: ₹{total_outstanding/10000000:.2f} Cr")
        print(f"   Active Series: {active_series_count}")
        print("   Average Coupon Rate: Based on active series only")
        print("   Investor Satisfaction: 0% (no real activity data)")
        print("   Maturity Distribution: Based on real maturity dates")
        print("   Lock-In Distribution: Based on real issue dates")
        print("\n✅ ALL DATA SHOULD BE REAL - NO FAKE/DUPLICATE DATA")
        
    else:
        print("❌ Authentication failed")

if __name__ == "__main__":
    verify_clean_data()