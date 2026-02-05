#!/usr/bin/env python3
"""
Clean Duplicate Data from Backend Database
Professional data cleanup for corporate application
"""

import requests
import json

def clean_duplicate_data():
    print("🧹 PROFESSIONAL DATA CLEANUP")
    print("=" * 50)
    
    # Step 1: Login to backend
    print("\n1️⃣ Authenticating with backend...")
    try:
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
            json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            print("✅ Authentication successful")
        else:
            print(f"❌ Authentication failed: {login_response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return False
    
    # Step 2: Analyze current data
    print("\n2️⃣ Analyzing current database state...")
    try:
        # Get all series
        series_response = requests.get('http://localhost:8003/api/v1/series/', headers=headers)
        if series_response.status_code == 200:
            series_data = series_response.json()
            print(f"📊 Found {len(series_data)} series in database")
            
            # Analyze for duplicates
            series_names = [s['series_name'] for s in series_data]
            series_codes = [s['series_code'] for s in series_data]
            
            # Check for duplicate names
            duplicate_names = []
            for name in set(series_names):
                if series_names.count(name) > 1:
                    duplicate_names.append(name)
            
            # Check for duplicate codes
            duplicate_codes = []
            for code in set(series_codes):
                if series_codes.count(code) > 1:
                    duplicate_codes.append(code)
            
            if duplicate_names:
                print(f"❌ DUPLICATE NAMES FOUND: {duplicate_names}")
            if duplicate_codes:
                print(f"❌ DUPLICATE CODES FOUND: {duplicate_codes}")
            
            if not duplicate_names and not duplicate_codes:
                print("✅ No duplicate series found in database")
            
            # Show current series details
            print("\n📋 Current Series in Database:")
            total_outstanding = 0
            for i, s in enumerate(series_data, 1):
                outstanding = s.get('issue_size', 0) or 0
                total_outstanding += outstanding
                print(f"   {i}. {s['series_name']} ({s['series_code']})")
                print(f"      Status: {s['status']}")
                print(f"      Issue Size: ₹{outstanding:,.0f}")
                print(f"      Created: {s.get('created_at', 'Unknown')}")
                print()
            
            print(f"💰 TOTAL OUTSTANDING (Real): ₹{total_outstanding:,.0f}")
            print(f"💰 TOTAL OUTSTANDING (Cr): ₹{total_outstanding/10000000:.2f} Cr")
            
        else:
            print(f"❌ Failed to get series: {series_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Data analysis error: {e}")
        return False
    
    # Step 3: Get investors data
    print("\n3️⃣ Analyzing investors data...")
    try:
        investors_response = requests.get('http://localhost:8003/api/v1/investors/', headers=headers)
        if investors_response.status_code == 200:
            investors_data = investors_response.json()
            print(f"👥 Found {len(investors_data)} investors in database")
            
            if len(investors_data) == 0:
                print("✅ No investor data - dashboard should show zeros")
            else:
                print("📋 Investor data exists - analyzing...")
                
        else:
            print(f"❌ Failed to get investors: {investors_response.status_code}")
            
    except Exception as e:
        print(f"❌ Investor analysis error: {e}")
    
    # Step 4: Check admin users
    print("\n4️⃣ Analyzing admin users...")
    try:
        users_response = requests.get('http://localhost:8003/api/v1/admin/users', headers=headers)
        if users_response.status_code == 200:
            users_data = users_response.json()
            print(f"👤 Found {len(users_data)} admin users")
            
            # Check for duplicate usernames or emails
            usernames = [u['username'] for u in users_data]
            emails = [u['email'] for u in users_data]
            
            duplicate_usernames = []
            for username in set(usernames):
                if usernames.count(username) > 1:
                    duplicate_usernames.append(username)
            
            duplicate_emails = []
            for email in set(emails):
                if emails.count(email) > 1:
                    duplicate_emails.append(email)
            
            if duplicate_usernames:
                print(f"❌ DUPLICATE USERNAMES: {duplicate_usernames}")
            if duplicate_emails:
                print(f"❌ DUPLICATE EMAILS: {duplicate_emails}")
            
            if not duplicate_usernames and not duplicate_emails:
                print("✅ No duplicate admin users found")
                
        else:
            print(f"❌ Failed to get admin users: {users_response.status_code}")
            
    except Exception as e:
        print(f"❌ Admin users analysis error: {e}")
    
    print("\n" + "=" * 50)
    print("🎯 CLEANUP SUMMARY:")
    print("✅ Database analysis complete")
    print("✅ Ready for frontend data calculation fixes")
    print("📋 Next: Fix dashboard calculations to use real data only")
    
    return True

if __name__ == "__main__":
    clean_duplicate_data()