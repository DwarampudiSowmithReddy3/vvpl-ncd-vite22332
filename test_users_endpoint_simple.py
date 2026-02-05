#!/usr/bin/env python3
"""
Test users endpoint
"""
import requests

def test_users_endpoint():
    try:
        # Login
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
                                     json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            print('✅ Login successful')
            
            # Get users
            users_response = requests.get('http://localhost:8003/api/v1/admin/users', 
                                        headers={'Authorization': f'Bearer {token}'})
            
            print(f'📊 Users endpoint status: {users_response.status_code}')
            
            if users_response.status_code == 200:
                users = users_response.json()
                print(f'✅ Loaded {len(users)} users from backend')
                
                if len(users) > 0:
                    print('\n👥 Users found:')
                    for user in users[:5]:  # Show first 5
                        print(f'  - ID: {user.get("id")}, Username: {user.get("username")}, Role: {user.get("role")}')
                        print(f'    Full Name: {user.get("fullName")}, Email: {user.get("email")}')
                        print(f'    Last Used: {user.get("lastUsed")}, Created: {user.get("createdAt")}')
                        print()
                else:
                    print('⚠️ No users found in database')
            else:
                print(f'❌ Failed to load users: {users_response.status_code}')
                print(f'Response: {users_response.text}')
        else:
            print(f'❌ Login failed: {login_response.status_code}')
            
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == "__main__":
    test_users_endpoint()