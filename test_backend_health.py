import requests
try:
    response = requests.get('http://localhost:8003/health', timeout=5)
    print(f'Backend health: {response.status_code}')
    if response.status_code == 200:
        print('✅ Backend is running and responding')
        data = response.json()
        print(f'Database status: {data.get("database", "unknown")}')
    else:
        print('❌ Backend not responding properly')
except Exception as e:
    print(f'❌ Backend connection failed: {e}')