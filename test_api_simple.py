#!/usr/bin/env python3
import requests
import json

def test_api():
    print('🧪 Testing NCD Management API')
    print('=' * 40)
    
    # Test login
    print('🔐 Testing login...')
    try:
        response = requests.post('http://localhost:8000/auth/login', 
                               json={'username': 'admin', 'password': 'admin123'})
        if response.status_code == 200:
            data = response.json()
            token = data['access_token']
            user = data['user']
            print(f'✅ Login successful! User: {user["username"]} ({user["role"]})')
            
            # Test get users
            print('👥 Testing get users...')
            response = requests.get('http://localhost:8000/users/', 
                                  headers={'Authorization': f'Bearer {token}'})
            if response.status_code == 200:
                users = response.json()
                print(f'✅ Found {len(users)} users')
                for user_item in users:
                    print(f'  - {user_item["username"]} ({user_item["full_name"]}) - {user_item["role"]}')
                
                # Test create user
                print('➕ Testing create user...')
                user_data = {
                    'user_id': 'TEST001',
                    'username': 'testuser',
                    'full_name': 'Test User',
                    'email': 'test@example.com',
                    'phone': '+91 9876543210',
                    'role': 'Finance Executive',
                    'password': 'testpass123'
                }
                response = requests.post('http://localhost:8000/users/', 
                                       json=user_data, 
                                       headers={'Authorization': f'Bearer {token}'})
                if response.status_code == 200:
                    new_user = response.json()
                    user_id = new_user['id']
                    print(f'✅ User created! ID: {user_id}, Username: {new_user["username"]}')
                    
                    # Test update user
                    print(f'✏️ Testing update user {user_id}...')
                    update_data = {
                        'full_name': 'Updated Test User',
                        'role': 'Finance Manager'
                    }
                    response = requests.put(f'http://localhost:8000/users/{user_id}', 
                                          json=update_data, 
                                          headers={'Authorization': f'Bearer {token}'})
                    if response.status_code == 200:
                        updated_user = response.json()
                        print(f'✅ User updated! New name: {updated_user["full_name"]}, New role: {updated_user["role"]}')
                        
                        # Test delete user
                        print(f'🗑️ Testing delete user {user_id}...')
                        response = requests.delete(f'http://localhost:8000/users/{user_id}', 
                                                 headers={'Authorization': f'Bearer {token}'})
                        if response.status_code == 200:
                            result = response.json()
                            print(f'✅ User deleted! Message: {result["message"]}')
                            print('\n🎉 All tests passed! User operations are working correctly.')
                        else:
                            print(f'❌ Delete user failed: {response.status_code} - {response.text}')
                    else:
                        print(f'❌ Update user failed: {response.status_code} - {response.text}')
                else:
                    print(f'❌ Create user failed: {response.status_code} - {response.text}')
            else:
                print(f'❌ Get users failed: {response.status_code} - {response.text}')
        else:
            print(f'❌ Login failed: {response.status_code} - {response.text}')
    except Exception as e:
        print(f'❌ Test failed with exception: {e}')

if __name__ == '__main__':
    test_api()