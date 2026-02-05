#!/usr/bin/env python3
"""
Populate permissions tables with initial data
BABY-LIKE CARE: Gentle and careful data insertion
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def populate_permissions_data():
    """Populate permissions tables with initial data - baby steps"""
    try:
        db = get_db()
        
        logger.info("🍼 Populating permissions data with tender care...")
        
        # 1. Insert Modules (baby step 1)
        logger.info("Step 1: Inserting modules...")
        modules = [
            ('dashboard', 'Dashboard', 'Main dashboard with overview and metrics'),
            ('investors', 'Investors', 'Investor management and profiles'),
            ('ncdSeries', 'NCD Series', 'NCD Series management and configuration'),
            ('interestPayout', 'Interest Payout', 'Interest payout processing and management'),
            ('reports', 'Reports', 'Report generation and viewing'),
            ('compliance', 'Compliance', 'Compliance tracking and management'),
            ('communication', 'Communication', 'Communication with investors'),
            ('administrator', 'Administrator', 'User and system administration'),
            ('approval', 'Approval', 'Approval workflows and processes'),
            ('grievanceManagement', 'Grievance Management', 'Grievance handling and resolution')
        ]
        
        for name, display_name, description in modules:
            # Check if module already exists
            check_query = "SELECT COUNT(*) as count FROM modules WHERE name = %s"
            result = db.execute_query(check_query, (name,))
            
            if result[0]['count'] == 0:
                insert_query = """
                INSERT INTO modules (name, display_name, description) 
                VALUES (%s, %s, %s)
                """
                db.execute_query(insert_query, (name, display_name, description))
                logger.info(f"  ✅ Inserted module: {display_name}")
            else:
                logger.info(f"  ⏭️ Module already exists: {display_name}")
        
        # 2. Insert Actions (baby step 2)
        logger.info("Step 2: Inserting actions...")
        actions = [
            ('view', 'View', 'Permission to view/read data'),
            ('create', 'Create', 'Permission to create new records'),
            ('edit', 'Edit', 'Permission to modify existing records'),
            ('delete', 'Delete', 'Permission to delete records')
        ]
        
        for name, display_name, description in actions:
            # Check if action already exists
            check_query = "SELECT COUNT(*) as count FROM actions WHERE name = %s"
            result = db.execute_query(check_query, (name,))
            
            if result[0]['count'] == 0:
                insert_query = """
                INSERT INTO actions (name, display_name, description) 
                VALUES (%s, %s, %s)
                """
                db.execute_query(insert_query, (name, display_name, description))
                logger.info(f"  ✅ Inserted action: {display_name}")
            else:
                logger.info(f"  ⏭️ Action already exists: {display_name}")
        
        # 3. Insert Roles (baby step 3)
        logger.info("Step 3: Inserting roles...")
        roles = [
            ('Finance Executive', 'Finance Executive', 'Entry-level finance role with basic permissions'),
            ('Finance Manager', 'Finance Manager', 'Mid-level finance role with management permissions'),
            ('Compliance Base', 'Compliance Base', 'Entry-level compliance role'),
            ('Compliance Officer', 'Compliance Officer', 'Mid-level compliance role'),
            ('Investor Relationship Executive', 'Investor Relationship Executive', 'Entry-level investor relations role'),
            ('Investor Relationship Manager', 'Investor Relationship Manager', 'Mid-level investor relations role'),
            ('Board Member Base', 'Board Member Base', 'Basic board member role'),
            ('Board Member Head', 'Board Member Head', 'Senior board member role'),
            ('Admin', 'Admin', 'System administrator with elevated permissions'),
            ('Super Admin', 'Super Admin', 'Highest level administrator with full permissions'),
            ('Investor', 'Investor', 'External investor with limited access')
        ]
        
        for name, display_name, description in roles:
            # Check if role already exists
            check_query = "SELECT COUNT(*) as count FROM roles WHERE name = %s"
            result = db.execute_query(check_query, (name,))
            
            if result[0]['count'] == 0:
                insert_query = """
                INSERT INTO roles (name, display_name, description) 
                VALUES (%s, %s, %s)
                """
                db.execute_query(insert_query, (name, display_name, description))
                logger.info(f"  ✅ Inserted role: {display_name}")
            else:
                logger.info(f"  ⏭️ Role already exists: {display_name}")
        
        # 4. Insert Default Permissions (baby step 4 - the most delicate)
        logger.info("Step 4: Inserting default permissions (most delicate step)...")
        
        # Define the permissions matrix (same as frontend but now in database)
        permissions_matrix = {
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
            }
        }
        
        # Get role, module, and action IDs for efficient insertion
        roles_map = {}
        result = db.execute_query("SELECT id, name FROM roles")
        for row in result:
            roles_map[row['name']] = row['id']
        
        modules_map = {}
        result = db.execute_query("SELECT id, name FROM modules")
        for row in result:
            modules_map[row['name']] = row['id']
        
        actions_map = {}
        result = db.execute_query("SELECT id, name FROM actions")
        for row in result:
            actions_map[row['name']] = row['id']
        
        # Insert permissions with baby-like care
        for role_name, modules in permissions_matrix.items():
            if role_name not in roles_map:
                logger.warning(f"  ⚠️ Role not found: {role_name}")
                continue
                
            role_id = roles_map[role_name]
            logger.info(f"  🍼 Processing permissions for: {role_name}")
            
            for module_name, actions in modules.items():
                if module_name not in modules_map:
                    logger.warning(f"    ⚠️ Module not found: {module_name}")
                    continue
                    
                module_id = modules_map[module_name]
                
                for action_name, is_allowed in actions.items():
                    if action_name not in actions_map:
                        logger.warning(f"      ⚠️ Action not found: {action_name}")
                        continue
                        
                    action_id = actions_map[action_name]
                    
                    # Check if permission already exists
                    check_query = """
                    SELECT COUNT(*) as count FROM permissions 
                    WHERE role_id = %s AND module_id = %s AND action_id = %s
                    """
                    result = db.execute_query(check_query, (role_id, module_id, action_id))
                    
                    if result[0]['count'] == 0:
                        insert_query = """
                        INSERT INTO permissions (role_id, module_id, action_id, is_allowed) 
                        VALUES (%s, %s, %s, %s)
                        """
                        db.execute_query(insert_query, (role_id, module_id, action_id, is_allowed))
                        logger.info(f"    ✅ {module_name}.{action_name} = {is_allowed}")
                    else:
                        logger.info(f"    ⏭️ Permission exists: {module_name}.{action_name}")
        
        logger.info("🎉 All permissions data populated successfully!")
        
        # Summary report
        logger.info("\n📊 Summary Report:")
        
        # Count modules
        result = db.execute_query("SELECT COUNT(*) as count FROM modules WHERE is_active = 1")
        logger.info(f"  📁 Active Modules: {result[0]['count']}")
        
        # Count actions
        result = db.execute_query("SELECT COUNT(*) as count FROM actions WHERE is_active = 1")
        logger.info(f"  ⚡ Active Actions: {result[0]['count']}")
        
        # Count roles
        result = db.execute_query("SELECT COUNT(*) as count FROM roles WHERE is_active = 1")
        logger.info(f"  👥 Active Roles: {result[0]['count']}")
        
        # Count permissions
        result = db.execute_query("SELECT COUNT(*) as count FROM permissions")
        logger.info(f"  🔐 Total Permissions: {result[0]['count']}")
        
        # Count allowed permissions
        result = db.execute_query("SELECT COUNT(*) as count FROM permissions WHERE is_allowed = 1")
        logger.info(f"  ✅ Allowed Permissions: {result[0]['count']}")
        
        logger.info("🍼 Baby permissions system is ready to crawl!")
        
    except Exception as e:
        logger.error(f"💥 Error populating permissions data: {e}")
        raise

if __name__ == "__main__":
    populate_permissions_data()