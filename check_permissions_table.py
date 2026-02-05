import sys
sys.path.append('backend')
from database import get_db

try:
    db = get_db()
    
    # Check if permissions table exists
    result = db.execute_query('SHOW TABLES LIKE "permissions"')
    if result:
        print('✅ Permissions table exists')
        
        # Check table structure
        structure = db.execute_query('DESCRIBE permissions')
        print('\n📋 Table structure:')
        for row in structure:
            print(f'  {row["Field"]} - {row["Type"]} - {row["Null"]} - {row["Key"]} - {row["Default"]}')
        
        # Check if there's any data
        count = db.execute_query('SELECT COUNT(*) as count FROM permissions')[0]['count']
        print(f'\n📊 Records in permissions table: {count}')
        
        if count > 0:
            # Show sample data
            sample = db.execute_query('SELECT * FROM permissions LIMIT 5')
            print('\n📝 Sample data:')
            for row in sample:
                print(f'  {row["role_name"]} - {row["module_name"]} - {row["action_name"]} - {row["is_allowed"]}')
    else:
        print('❌ Permissions table does not exist')
        
        # Show all tables
        tables = db.execute_query('SHOW TABLES')
        print('\n📋 Available tables:')
        for table in tables:
            print(f'  {list(table.values())[0]}')
            
except Exception as e:
    print(f'❌ Error: {e}')