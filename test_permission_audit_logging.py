#!/usr/bin/env python3
"""
CRITICAL TEST: Permission Audit Logging Verification
This script tests if permission changes are being properly logged to audit_logs table.
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from database import get_db
import json
from datetime import datetime

def test_audit_logging():
    """Test if audit logging is working for permission changes"""
    print("🔍 TESTING PERMISSION AUDIT LOGGING")
    print("=" * 50)
    
    try:
        db = get_db()
        
        # Check if role_permissions table exists
        print("\n1. Checking role_permissions table...")
        try:
            result = db.execute_query("SHOW TABLES LIKE 'role_permissions'")
            if result:
                print("✅ role_permissions table exists")
                
                # Check table structure
                structure = db.execute_query("DESCRIBE role_permissions")
                print("📋 Table structure:")
                for column in structure:
                    print(f"   - {column['Field']}: {column['Type']}")
            else:
                print("❌ role_permissions table does NOT exist!")
                print("🔧 Creating role_permissions table...")
                
                create_table_sql = """
                CREATE TABLE role_permissions (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    role VARCHAR(100) NOT NULL,
                    permissions JSON NOT NULL,
                    updated_by VARCHAR(100),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
                db.execute_query(create_table_sql)
                print("✅ Created role_permissions table")
                
        except Exception as e:
            print(f"❌ Error checking role_permissions table: {e}")
        
        # Check recent audit logs for permission changes
        print("\n2. Checking recent audit logs for permission changes...")
        audit_query = """
        SELECT * FROM audit_logs 
        WHERE action LIKE '%Permission%' OR entity_type = 'Permission System' OR entity_type = 'Permissions'
        ORDER BY timestamp DESC 
        LIMIT 10
        """
        
        audit_logs = db.execute_query(audit_query)
        
        if audit_logs:
            print(f"✅ Found {len(audit_logs)} permission-related audit logs:")
            for log in audit_logs:
                print(f"   📝 {log['timestamp']}: {log['action']} by {log['admin_name']}")
                print(f"      Details: {log['details']}")
                print(f"      Entity: {log['entity_type']} - {log['entity_id']}")
                print()
        else:
            print("❌ No permission-related audit logs found!")
            print("   This means permission changes are NOT being logged.")
        
        # Check all recent audit logs
        print("\n3. Checking all recent audit logs...")
        all_recent_query = """
        SELECT action, admin_name, timestamp, entity_type 
        FROM audit_logs 
        ORDER BY timestamp DESC 
        LIMIT 5
        """
        
        recent_logs = db.execute_query(all_recent_query)
        
        if recent_logs:
            print(f"✅ Found {len(recent_logs)} recent audit logs:")
            for log in recent_logs:
                print(f"   📝 {log['timestamp']}: {log['action']} ({log['entity_type']}) by {log['admin_name']}")
        else:
            print("❌ No recent audit logs found at all!")
        
        # Test audit log creation
        print("\n4. Testing audit log creation...")
        test_audit_data = {
            "action": "TEST: Permission Update",
            "admin_name": "Test Admin",
            "admin_role": "Super Admin",
            "details": "Test permission change for audit logging verification",
            "entity_type": "Permissions",
            "entity_id": "Test Role.test_module.view",
            "changes": json.dumps({
                "test": "data",
                "timestamp": datetime.now().isoformat()
            }),
            "timestamp": datetime.now()
        }
        
        insert_query = """
        INSERT INTO audit_logs 
        (action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            test_audit_data["action"],
            test_audit_data["admin_name"],
            test_audit_data["admin_role"],
            test_audit_data["details"],
            test_audit_data["entity_type"],
            test_audit_data["entity_id"],
            test_audit_data["changes"],
            test_audit_data["timestamp"]
        ))
        
        print("✅ Test audit log created successfully!")
        
        # Verify the test log was created
        verify_query = """
        SELECT * FROM audit_logs 
        WHERE action = 'TEST: Permission Update'
        ORDER BY timestamp DESC 
        LIMIT 1
        """
        
        test_log = db.execute_query(verify_query)
        if test_log:
            print("✅ Test audit log verified in database!")
            
            # Clean up test log
            cleanup_query = "DELETE FROM audit_logs WHERE action = 'TEST: Permission Update'"
            db.execute_query(cleanup_query)
            print("🧹 Cleaned up test audit log")
        else:
            print("❌ Test audit log was not found in database!")
        
        print("\n" + "=" * 50)
        print("🎯 AUDIT LOGGING TEST COMPLETE")
        print("\nNext steps:")
        print("1. Toggle a permission in the Administrator page")
        print("2. Check if new audit logs appear")
        print("3. Refresh the audit log section to see updates")
        
    except Exception as e:
        print(f"❌ CRITICAL ERROR in audit logging test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_audit_logging()