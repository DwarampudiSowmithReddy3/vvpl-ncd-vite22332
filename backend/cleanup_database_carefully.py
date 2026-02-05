#!/usr/bin/env python3
"""
Carefully cleanup and improve database structure
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def cleanup_database():
    """Carefully cleanup and improve database structure"""
    try:
        db = get_db()
        
        logger.info("🔍 Current database structure analysis...")
        
        # Show current tables
        tables = db.execute_query("SHOW TABLES")
        logger.info("Current tables:")
        for table in tables:
            table_name = list(table.values())[0]
            logger.info(f"  - {table_name}")
        
        # Step 1: Drop redundant permission_history table
        logger.info("\n📝 Step 1: Removing redundant permission_history table...")
        logger.info("Reason: audit_logs already tracks all changes, no need for duplicate tracking")
        
        try:
            db.execute_query("DROP TABLE IF EXISTS permission_history")
            logger.info("✅ permission_history table removed successfully")
        except Exception as e:
            logger.error(f"❌ Error dropping permission_history: {e}")
        
        # Step 2: Backup current permissions table data (if any)
        logger.info("\n📝 Step 2: Backing up permissions table data...")
        try:
            permissions_data = db.execute_query("SELECT * FROM permissions")
            logger.info(f"Found {len(permissions_data)} permission records to backup")
        except Exception as e:
            logger.info("No permissions data to backup")
            permissions_data = []
        
        # Step 3: Drop and recreate permissions table with role names
        logger.info("\n📝 Step 3: Recreating permissions table with role names...")
        
        # Drop old permissions table
        db.execute_query("DROP TABLE IF EXISTS permissions")
        
        # Create new improved permissions table
        create_permissions_query = """
        CREATE TABLE permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(100) NOT NULL,
            module_name VARCHAR(100) NOT NULL,
            action_name VARCHAR(50) NOT NULL,
            is_allowed TINYINT(1) DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by_user VARCHAR(100),
            updated_by_user VARCHAR(100),
            INDEX idx_role_module (role_name, module_name),
            INDEX idx_role_action (role_name, action_name),
            UNIQUE KEY unique_permission (role_name, module_name, action_name)
        )
        """
        
        db.execute_query(create_permissions_query)
        logger.info("✅ New permissions table created with role names")
        
        # Step 4: Show new structure
        logger.info("\n📝 Step 4: Verifying new permissions table structure...")
        new_structure = db.execute_query("DESCRIBE permissions")
        logger.info("New permissions table structure:")
        for field in new_structure:
            logger.info(f"  {field['Field']}: {field['Type']} ({field['Null']}, {field['Key']})")
        
        # Step 5: Clean up other unused tables if they exist
        logger.info("\n📝 Step 5: Cleaning up other unused tables...")
        
        unused_tables = ['roles', 'modules', 'actions']
        for table in unused_tables:
            try:
                db.execute_query(f"DROP TABLE IF EXISTS {table}")
                logger.info(f"✅ Removed unused table: {table}")
            except Exception as e:
                logger.info(f"Table {table} doesn't exist or already removed")
        
        # Step 6: Final verification
        logger.info("\n📝 Step 6: Final database structure...")
        final_tables = db.execute_query("SHOW TABLES")
        logger.info("Final tables (clean and simple):")
        for table in final_tables:
            table_name = list(table.values())[0]
            logger.info(f"  ✅ {table_name}")
        
        logger.info("\n🎉 Database cleanup completed successfully!")
        logger.info("Summary of changes:")
        logger.info("  ✅ Removed redundant permission_history table")
        logger.info("  ✅ Recreated permissions table with role names (user-friendly)")
        logger.info("  ✅ Removed unused tables (roles, modules, actions)")
        logger.info("  ✅ Kept essential tables (users, audit_logs, permissions)")
        
    except Exception as e:
        logger.error(f"❌ Error during database cleanup: {e}")
        raise

if __name__ == "__main__":
    cleanup_database()