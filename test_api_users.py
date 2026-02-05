import requests
import json

# Test the users API endpoint
url = "http://localhost:8000/users/"

# First login to get token
login_url = "http://localhost:8000/auth/login"
login_data = {"username": "admin", "password": "admin123"}

try:
    # Login
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        print("✅ Login successful, got token")
        
        # Get users
        headers = {"Authorization": f"Bearer {token}"}
        users_response = requests.get(url, headers=headers)
        
        if users_response.status_code == 200:
            users = users_response.json()
            print(f"✅ Got {len(users)} users from API")
            
            if users:
                print("\n📋 First user structure:")
                first_user = users[0]
                for key, value in first_user.items():
                    print(f"  {key}: {value}")
            else:
                print("No users found in database")
        else:
            print(f"❌ Failed to get users: {users_response.status_code}")
            print(users_response.text)
    else:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")