#!/usr/bin/env python3
"""
Fix Duplicate Admin Users
"""

import requests

def fix_duplicate_admin():
    print("🔧 Fixing Duplicate Admin Users")
    print("=" * 40)
    
    # Login
    login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
        json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
    
    if login_response.status_code == 200:
        token = login_response.json()['access_token']
        headers = {'Authorization': f'Bearer {token}'}
        
        # Get all users
        users_response = requests.get('http://localhost:8003/api/v1/admin/users', headers=headers)
        if users_response.status_code == 200:
            users_data = users_response.json()
            
            # Find duplicate sowmith users
            sowmith_users = [u for u in users_data if u['username'] == 'sowmith']
            
            if len(sowmith_users) > 1:
                print(f"Found {len(sowmith_users)} duplicate 'sowmith' users")
                
                # Keep the first one, delete the rest
                for i, user in enumerate(sowmith_users[1:], 1):
                    print(f"Deleting duplicate user {i}: ID {user['id']}")
                    delete_response = requests.delete(
                        f"http://localhost:8003/api/v1/admin/users/{user['id']}", 
                        headers=headers
                    )
                    if delete_response.status_code == 200:
                        print(f"✅ Deleted duplicate user {user['id']}")
                    else:
                        print(f"❌ Failed to delete user {user['id']}: {delete_response.status_code}")
                
                print("✅ Duplicate admin users cleaned")
            else:
                print("✅ No duplicate sowmith users found")

if __name__ == "__main__":
    fix_duplicate_admin()