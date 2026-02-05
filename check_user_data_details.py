#!/usr/bin/env python3
"""
Check detailed user data to see what fields are missing
"""
import requests
import json

def check_user_data():
    """Check what user data is being returned by the API"""
    
    # Login first
    login_url = "http://localhost:8003/api/v1/auth/login"
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        print("🔐 Logging in...")
        login_response = requests.post(login_url, json=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            
            # Get users data
            users_url = "http://localhost:8003/api/v1/admin/users"
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            print("📊 Getting users data...")
            users_response = requests.get(users_url, headers=headers)
            
            if users_response.status_code == 200:
                users_data = users_response.json()
                print(f"✅ Got {len(users_data)} users")
                
                # Show detailed data for first few users
                print("\n📋 Detailed user data:")
                for i, user in enumerate(users_data[:3]):
                    print(f"\n👤 User {i+1}:")
                    for key, value in user.items():
                        print(f"  {key}: {value}")
                        
                # Check specifically for user_id and last_used fields
                print(f"\n🔍 Checking specific fields:")
                for i, user in enumerate(users_data[:5]):
                    user_id = user.get('user_id', 'MISSING')
                    last_used = user.get('last_used', 'MISSING')
                    username = user.get('username', 'N/A')
                    print(f"  {username}: user_id={user_id}, last_used={last_used}")
                        
            else:
                print(f"❌ Failed to get users: {users_response.status_code}")
                print(f"Error: {users_response.text}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_user_data()