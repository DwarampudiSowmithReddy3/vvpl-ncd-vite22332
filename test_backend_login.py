import requests
import json

# Test backend login directly
url = "http://localhost:8000/auth/login"
data = {
    "username": "admin",
    "password": "admin123"
}

print("🔄 Testing backend login directly...")
print(f"URL: {url}")
print(f"Data: {data}")

try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Login successful!")
        print(f"User: {result['user']['full_name']}")
        print(f"Role: {result['user']['role']}")
        print(f"Token: {result['access_token'][:50]}...")
    else:
        print("❌ Login failed!")
        try:
            error = response.json()
            print(f"Error: {error}")
        except:
            print(f"Raw response: {response.text}")
            
except Exception as e:
    print(f"❌ Request failed: {e}")