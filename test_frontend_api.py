#!/usr/bin/env python3
"""
Test Frontend API Connection
"""

import requests
import json

def test_frontend_api():
    print("🧪 Testing Frontend API Connection")
    print("=" * 40)
    
    # Login first
    login_data = {
        'username': 'admin', 
        'password': 'admin123', 
        'user_type': 'admin'
    }
    
    try:
        response = requests.post('http://localhost:8003/api/v1/auth/login', json=login_data)
        if response.status_code == 200:
            token = response.json()['access_token']
            print('✅ Login successful')
            
            # Get series data
            headers = {'Authorization': f'Bearer {token}'}
            series_response = requests.get('http://localhost:8003/api/v1/series/', headers=headers)
            
            if series_response.status_code == 200:
                series_data = series_response.json()
                print(f'✅ Found {len(series_data)} series in backend')
                
                for i, s in enumerate(series_data, 1):
                    name = s.get('series_name', 'Unknown')
                    code = s.get('series_code', 'Unknown')
                    status = s.get('status', 'Unknown')
                    print(f'   {i}. {name} ({code}) - Status: {status}')
                    
                return True
            else:
                print(f'❌ Failed to get series: {series_response.status_code}')
                return False
        else:
            print(f'❌ Login failed: {response.status_code}')
            return False
            
    except Exception as e:
        print(f'❌ Connection error: {e}')
        return False

if __name__ == "__main__":
    test_frontend_api()