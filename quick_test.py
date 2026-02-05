import requests
import json

# Test login
try:
    response = requests.post('http://localhost:8000/auth/login', 
                           json={'username': 'admin', 'password': 'admin123'})
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        print("✅ LOGIN SUCCESS!")
        print(f"User: {data['user']['username']}")
        print(f"Role: {data['user']['role']}")
        print(f"Token: {data['access_token'][:20]}...")
    else:
        print("❌ LOGIN FAILED!")
        
except Exception as e:
    print(f"❌ ERROR: {e}")