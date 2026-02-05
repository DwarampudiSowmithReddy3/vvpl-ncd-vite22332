#!/usr/bin/env python3
"""
Create permissions tables in the database
TREATING THIS LIKE A NEWBORN BABY - EXTREME CARE
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_permissions_tables():
    """Create permissions tables with extreme care"""
    try:
        db = get_db()
        
        logger.info("🍼 Creating permissions tables with baby-like care...")
        
        # 1. Modules table - defines all available modules
        logger.info("Creating modules table...")
        modules_table = """
        CREATE TABLE IF NOT EXISTS modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_active (is_active)
        )
        """
        db.execute_query(modules_table)
        logger.info("✅ Modules table created successfully")
        
        # 2. Actions table - defines all available actions
        logger.info("Creating actions table...")
        actions_table = """
        CREATE TABLE IF NOT EXISTS actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(50) NOT NULL UNIQUE,
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_active (is_active)
        )
        """
        db.execute_query(actions_table)
        logger.info("✅ Actions table created successfully")
        
        # 3. Roles table - defines all available roles
        logger.info("Creating roles table...")
        roles_table = """
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_name (name),
            INDEX idx_active (is_active)
        )
        """
        db.execute_query(roles_table)
        logger.info("✅ Roles table created successfully")
        
        # 4. Permissions table - the main permissions matrix
        logger.info("Creating permissions table...")
        permissions_table = """
        CREATE TABLE IF NOT EXISTS permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_id INT NOT NULL,
            module_id INT NOT NULL,
            action_id INT NOT NULL,
            is_allowed BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            updated_by INT,
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
            FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
            UNIQUE KEY unique_permission (role_id, module_id, action_id),
            INDEX idx_role_module (role_id, module_id),
            INDEX idx_role_action (role_id, action_id),
            INDEX idx_module_action (module_id, action_id)
        )
        """
        db.execute_query(permissions_table)
        logger.info("✅ Permissions table created successfully")
        
        # 5. Permission history table - for audit trail
        logger.info("Creating permission_history table...")
        permission_history_table = """
        CREATE TABLE IF NOT EXISTS permission_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            permission_id INT NOT NULL,
            role_name VARCHAR(100) NOT NULL,
            module_name VARCHAR(100) NOT NULL,
            action_name VARCHAR(50) NOT NULL,
            old_value BOOLEAN,
            new_value BOOLEAN,
            changed_by INT,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            reason TEXT,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
            FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_permission (permission_id),
            INDEX idx_changed_at (changed_at),
            INDEX idx_changed_by (changed_by)
        )
        """
        db.execute_query(permission_history_table)
        logger.info("✅ Permission history table created successfully")
        
        logger.info("🎉 All permissions tables created successfully!")
        
        # Verify tables exist
        tables = ['modules', 'actions', 'roles', 'permissions', 'permission_history']
        for table in tables:
            result = db.execute_query(f"SHOW TABLES LIKE '{table}'")
            if result:
                logger.info(f"✅ Verified: {table} table exists")
            else:
                logger.error(f"❌ Error: {table} table not found!")
                
    except Exception as e:
        logger.error(f"💥 Error creating permissions tables: {e}")
        raise

if __name__ == "__main__":
    create_permissions_tables()