import requests

login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
    json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})

if login_response.status_code == 200:
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    series_response = requests.get('http://localhost:8003/api/v1/series/', headers=headers)
    
    if series_response.status_code == 200:
        series_data = series_response.json()
        for s in series_data:
            print(f'Series: {s["series_name"]}')
            print(f'  Status: "{s["status"]}"')
            print(f'  Issue Size: {s.get("issue_size", 0)}')
            print(f'  Active check: {s["status"] in ["active", "accepting"]}')
            print(f'  Status == "ACTIVE": {s["status"] == "ACTIVE"}')
            print()