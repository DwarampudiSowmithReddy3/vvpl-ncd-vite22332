import mysql.connector
import json

try:
    connection = mysql.connector.connect(
        host='localhost',
        port=3306,
        user='root',
        password='sowmith',
        database='ncd_management'
    )
    
    cursor = connection.cursor()
    cursor.execute('SELECT role, permissions FROM role_permissions WHERE role = %s', ('Finance Executive',))
    result = cursor.fetchone()
    
    if result:
        role, permissions_json = result
        permissions = json.loads(permissions_json)
        print('Current Finance Executive Reports permissions in database:')
        reports = permissions['reports']
        print(f'View: {reports["view"]}')
        print(f'Create: {reports["create"]}')
        print(f'Edit: {reports["edit"]}')
        print(f'Delete: {reports["delete"]}')
    else:
        print('No Finance Executive found in database')
        
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f'Error: {e}')