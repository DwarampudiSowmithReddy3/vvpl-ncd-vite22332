#!/usr/bin/env python3
"""
Test audit log creation directly
"""
import requests
import json

def test_audit_log_creation():
    """Test creating audit logs via API"""
    
    print("🔍 Testing Audit Log Creation")
    print("=" * 40)
    
    try:
        # Login
        login_response = requests.post('http://localhost:8003/api/v1/auth/login', 
                                     json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            print('✅ Login successful')
            
            # Check current audit logs
            print('\n1. Checking current audit logs...')
            response = requests.get('http://localhost:8003/api/v1/admin/audit-logs', 
                                  headers={'Authorization': f'Bearer {token}'})
            
            if response.status_code == 200:
                logs = response.json()
                print(f'📊 Current audit logs: {len(logs)}')
            else:
                print(f'❌ Failed to get audit logs: {response.status_code}')
                print(f'Error: {response.text}')
                return
            
            # Test creating audit log
            print('\n2. Testing audit log creation...')
            test_log = {
                "action": "Test Action",
                "entityType": "Test Entity",
                "entityId": "test123",
                "details": "This is a test audit log entry",
                "userAgent": "Test Script"
            }
            
            response = requests.post('http://localhost:8003/api/v1/admin/audit-logs', 
                                   headers=headers, json=test_log)
            
            print(f'POST Status: {response.status_code}')
            if response.status_code == 200:
                result = response.json()
                print('✅ Audit log created successfully!')
                print(f'📝 Result: {result}')
                
                # Verify it was saved
                print('\n3. Verifying audit log was saved...')
                response = requests.get('http://localhost:8003/api/v1/admin/audit-logs', 
                                      headers={'Authorization': f'Bearer {token}'})
                
                if response.status_code == 200:
                    logs = response.json()
                    print(f'📊 Audit logs after creation: {len(logs)}')
                    
                    if len(logs) > 0:
                        latest_log = logs[0]
                        print('📋 Latest log:')
                        print(json.dumps(latest_log, indent=2))
                        
                        if latest_log.get('action') == 'Test Action':
                            print('✅ SUCCESS: Audit log was properly saved and retrieved!')
                        else:
                            print('⚠️ WARNING: Latest log doesn\'t match what we created')
                    else:
                        print('❌ ERROR: No audit logs found after creation')
                else:
                    print(f'❌ Failed to verify: {response.status_code}')
                    
            elif response.status_code == 405:
                print('⚠️ Method Not Allowed - Backend needs restart to pick up POST endpoint')
            else:
                print(f'❌ Failed to create audit log: {response.status_code}')
                print(f'Error: {response.text}')
            
            # Test multiple audit log creation
            if response.status_code == 200:
                print('\n4. Testing multiple audit log creation...')
                test_logs = [
                    {"action": "Created User", "entityType": "User", "entityId": "user123", "details": "Created new user"},
                    {"action": "Updated Permission", "entityType": "Permission", "entityId": "perm456", "details": "Updated user permissions"},
                    {"action": "Downloaded Report", "entityType": "Report", "entityId": "report789", "details": "Downloaded monthly report"}
                ]
                
                created_count = 0
                for i, log_data in enumerate(test_logs, 1):
                    response = requests.post('http://localhost:8003/api/v1/admin/audit-logs', 
                                           headers=headers, json=log_data)
                    if response.status_code == 200:
                        created_count += 1
                        print(f'✅ Log {i}: {log_data["action"]} - Created')
                    else:
                        print(f'❌ Log {i}: {log_data["action"]} - Failed')
                
                print(f'📊 Created {created_count}/{len(test_logs)} additional logs')
                
                # Final verification
                response = requests.get('http://localhost:8003/api/v1/admin/audit-logs', 
                                      headers={'Authorization': f'Bearer {token}'})
                if response.status_code == 200:
                    logs = response.json()
                    print(f'📊 Total audit logs now: {len(logs)}')
                    
                    if len(logs) >= created_count + 1:
                        print('✅ SUCCESS: All audit logs were created and saved!')
                    else:
                        print('⚠️ WARNING: Some audit logs may not have been saved')
            
        else:
            print(f'❌ Login failed: {login_response.status_code}')
            print(f'Error: {login_response.text}')
            
    except Exception as e:
        print(f'❌ Error: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_audit_log_creation()