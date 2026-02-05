#!/usr/bin/env python3
"""
Check database tables via the existing backend API
"""
import requests

def check_database_via_api():
    """Check database status via backend API"""
    
    print("🔍 Checking Database via Backend API")
    print("=" * 40)
    
    try:
        # Login first
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
                                     json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            print('✅ Login successful')
            
            # Test current audit logs endpoint
            print('\n📋 Testing current audit logs endpoint...')
            response = requests.get('http://localhost:8003/api/v1/admin/audit-logs', headers=headers)
            
            print(f'Status: {response.status_code}')
            if response.status_code == 200:
                logs = response.json()
                print(f'✅ Endpoint working - returned {len(logs)} logs')
                
                if len(logs) > 0:
                    print('📊 Sample log structure:')
                    import json
                    print(json.dumps(logs[0], indent=2))
                else:
                    print('📝 No audit logs found in database')
            else:
                print(f'❌ Endpoint failed: {response.text}')
            
            # Test creating a simple audit log via existing mechanisms
            print('\n📝 Testing if we can trigger audit log creation...')
            
            # Try to get users (this might create an audit log)
            response = requests.get('http://localhost:8003/api/v1/admin/users', headers=headers)
            if response.status_code == 200:
                print('✅ Users endpoint working')
                
                # Check if any audit logs were created
                response = requests.get('http://localhost:8003/api/v1/admin/audit-logs', headers=headers)
                if response.status_code == 200:
                    logs = response.json()
                    print(f'📊 After users call: {len(logs)} audit logs')
            
            # Test system health
            print('\n🏥 Testing system health...')
            response = requests.get('http://localhost:8003/api/v1/admin/system-health', headers=headers)
            if response.status_code == 200:
                health = response.json()
                print(f'✅ System health: {health}')
            else:
                print(f'❌ System health failed: {response.status_code}')
            
        else:
            print(f'❌ Login failed: {login_response.status_code}')
            print(f'Error: {login_response.text}')
            
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database_via_api()