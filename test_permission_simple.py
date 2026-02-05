import requests
import json

print('🔄 Testing permission persistence directly...')

try:
    # Login
    login_response = requests.post('http://localhost:8000/auth/login', 
                                 json={'username': 'admin', 'password': 'admin123'})
    
    if login_response.status_code != 200:
        print('❌ Backend not running or login failed')
        exit(1)
    
    token = login_response.json()['access_token']
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    # Get current permissions
    get_response = requests.get('http://localhost:8000/permissions/', headers=headers)
    permissions = get_response.json()
    
    # Show current Finance Executive NCD Series permissions
    fe_ncd = permissions['Finance Executive']['ncdSeries']
    print('📊 Finance Executive NCD Series permissions:')
    print(f'   View: {fe_ncd["view"]}')
    print(f'   Create: {fe_ncd["create"]}')
    print(f'   Edit: {fe_ncd["edit"]}')
    print(f'   Delete: {fe_ncd["delete"]}')
    
    # Toggle the view permission
    original_view = fe_ncd['view']
    new_view = not original_view
    
    print(f'\n🔄 Toggling Finance Executive NCD Series View: {original_view} → {new_view}')
    
    permissions['Finance Executive']['ncdSeries']['view'] = new_view
    
    # Update permissions
    update_response = requests.put('http://localhost:8000/permissions/', 
                                  headers=headers, json=permissions)
    
    if update_response.status_code == 200:
        print('✅ Permission updated in backend')
        
        # Verify persistence
        verify_response = requests.get('http://localhost:8000/permissions/', headers=headers)
        fresh_permissions = verify_response.json()
        fresh_view = fresh_permissions['Finance Executive']['ncdSeries']['view']
        
        if fresh_view == new_view:
            print(f'✅ PERMISSION PERSISTENCE WORKS! Value is now {fresh_view}')
            
            # Restore original value
            permissions['Finance Executive']['ncdSeries']['view'] = original_view
            requests.put('http://localhost:8000/permissions/', headers=headers, json=permissions)
            print(f'✅ Restored original value: {original_view}')
            
        else:
            print(f'❌ Persistence failed. Expected {new_view}, got {fresh_view}')
    else:
        print('❌ Failed to update permissions')
        
except Exception as e:
    print(f'❌ Error: {e}')