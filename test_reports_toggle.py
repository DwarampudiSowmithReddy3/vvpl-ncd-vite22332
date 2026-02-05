import requests
import json

print('🔄 Testing Reports permission toggle for Finance Executive...')

try:
    # Login
    login_response = requests.post('http://localhost:8000/auth/login', 
                                 json={'username': 'admin', 'password': 'admin123'})
    
    if login_response.status_code != 200:
        print('❌ Login failed')
        exit(1)
    
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get current permissions
    get_response = requests.get('http://localhost:8000/permissions/', headers=headers)
    permissions = get_response.json()
    
    # Show current Finance Executive Reports permissions
    fe_reports = permissions['Finance Executive']['reports']
    print('📊 Current Finance Executive Reports permissions:')
    print(f'   View: {fe_reports["view"]}')
    print(f'   Create: {fe_reports["create"]}')
    print(f'   Edit: {fe_reports["edit"]}')
    print(f'   Delete: {fe_reports["delete"]}')
    
    # Toggle the view permission (from True to False as per your test)
    original_view = fe_reports['view']
    new_view = False  # You changed it to disabled (False)
    
    print(f'\n🔄 Toggling Finance Executive Reports View: {original_view} → {new_view}')
    
    permissions['Finance Executive']['reports']['view'] = new_view
    
    # Update permissions
    update_response = requests.put('http://localhost:8000/permissions/', 
                                  headers=headers, json=permissions)
    
    if update_response.status_code == 200:
        print('✅ Permission update API call successful')
        
        # Verify persistence by getting fresh data
        verify_response = requests.get('http://localhost:8000/permissions/', headers=headers)
        fresh_permissions = verify_response.json()
        fresh_view = fresh_permissions['Finance Executive']['reports']['view']
        
        print(f'📊 Fresh data from database: Reports View = {fresh_view}')
        
        if fresh_view == new_view:
            print('✅ SUCCESS! Permission change was saved to database!')
        else:
            print(f'❌ FAILED! Expected {new_view}, but database shows {fresh_view}')
            
    else:
        print(f'❌ API call failed with status {update_response.status_code}')
        print(update_response.text)
        
except Exception as e:
    print(f'❌ Error: {e}')