#!/usr/bin/env python3
"""
Very carefully populate permissions table with all roles and permissions
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def populate_permissions():
    """Very carefully populate permissions table"""
    try:
        db = get_db()
        
        logger.info("🔍 Step 1: Defining all roles and their permissions...")
        
        # Complete permissions structure from our current system
        PERMISSIONS = {
            'Finance Executive': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': False, 'create': False, 'edit': False, 'delete': False}
            },
            'Finance Manager': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': True, 'create': True, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': False, 'edit': False, 'delete': False}
            },
            'Compliance Base': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': True, 'edit': False, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': False, 'edit': False, 'delete': False}
            },
            'Compliance Officer': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'investors': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': True, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': False}
            },
            'Investor Relationship Executive': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': True, 'create': True, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': False}
            },
            'Investor Relationship Manager': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': False}
            },
            'Board Member Base': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': True, 'create': False, 'edit': False, 'delete': False}
            },
            'Board Member Head': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': False}
            },
            'Admin': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'investors': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'reports': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'compliance': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'interestPayout': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'communication': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': True, 'create': True, 'edit': True, 'delete': False},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': False}
            },
            'Super Admin': {
                'dashboard': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'ncdSeries': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'investors': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'reports': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'compliance': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'interestPayout': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'communication': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'administrator': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'approval': {'view': True, 'create': True, 'edit': True, 'delete': True},
                'grievanceManagement': {'view': True, 'create': True, 'edit': True, 'delete': True}
            },
            'Investor': {
                'dashboard': {'view': True, 'create': False, 'edit': False, 'delete': False},
                'ncdSeries': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'investors': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'reports': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'compliance': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'interestPayout': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'communication': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'administrator': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'approval': {'view': False, 'create': False, 'edit': False, 'delete': False},
                'grievanceManagement': {'view': False, 'create': False, 'edit': False, 'delete': False}
            }
        }
        
        logger.info(f"Defined permissions for {len(PERMISSIONS)} roles")
        
        logger.info("\n🔧 Step 2: Clearing existing permissions (if any)...")
        db.execute_query("DELETE FROM permissions")
        logger.info("✅ Cleared existing permissions")
        
        logger.info("\n📝 Step 3: Inserting all permissions into database...")
        
        insert_query = """
        INSERT INTO permissions 
        (role_name, module_name, action_name, description, is_allowed, is_active, priority, created_by_user) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        total_permissions = 0
        
        for role_name, modules in PERMISSIONS.items():
            logger.info(f"  Processing role: {role_name}")
            
            for module_name, actions in modules.items():
                for action_name, is_allowed in actions.items():
                    
                    # Create description
                    description = f"Allow {role_name} to {action_name} {module_name}"
                    
                    # Set priority based on role hierarchy
                    priority = 0
                    if role_name == 'Super Admin':
                        priority = 100
                    elif role_name == 'Admin':
                        priority = 90
                    elif 'Manager' in role_name:
                        priority = 80
                    elif 'Officer' in role_name:
                        priority = 70
                    elif 'Executive' in role_name:
                        priority = 60
                    elif 'Board Member' in role_name:
                        priority = 50
                    elif role_name == 'Investor':
                        priority = 10
                    
                    # Insert permission
                    db.execute_query(insert_query, (
                        role_name,
                        module_name,
                        action_name,
                        description,
                        is_allowed,
                        True,  # is_active
                        priority,
                        'system'  # created_by_user
                    ))
                    
                    total_permissions += 1
        
        logger.info(f"✅ Inserted {total_permissions} permissions successfully")
        
        logger.info("\n🔍 Step 4: Verifying inserted data...")
        
        # Count by role
        for role_name in PERMISSIONS.keys():
            count_result = db.execute_query(
                "SELECT COUNT(*) as count FROM permissions WHERE role_name = %s", 
                (role_name,)
            )
            logger.info(f"  {role_name}: {count_result[0]['count']} permissions")
        
        # Show sample permissions
        sample_result = db.execute_query(
            "SELECT role_name, module_name, action_name, is_allowed FROM permissions WHERE role_name = 'Super Admin' LIMIT 5"
        )
        logger.info("\nSample permissions (Super Admin):")
        for row in sample_result:
            status = "✅ ALLOWED" if row['is_allowed'] else "❌ DENIED"
            logger.info(f"  {row['role_name']} -> {row['module_name']}.{row['action_name']}: {status}")
        
        logger.info(f"\n🎉 Permissions population completed successfully!")
        logger.info(f"Total permissions inserted: {total_permissions}")
        logger.info(f"Roles configured: {len(PERMISSIONS)}")
        logger.info("All permissions are now stored in the database!")
        
    except Exception as e:
        logger.error(f"❌ Error populating permissions: {e}")
        raise

if __name__ == "__main__":
    populate_permissions()