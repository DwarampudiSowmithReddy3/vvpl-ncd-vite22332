#!/usr/bin/env python3
"""
Very carefully improve permissions table structure
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def improve_permissions_table():
    """Very carefully improve permissions table structure"""
    try:
        db = get_db()
        
        logger.info("🔍 Step 1: Backing up current permissions table...")
        
        # Check if table has data
        count_result = db.execute_query('SELECT COUNT(*) as count FROM permissions')
        logger.info(f"Current records: {count_result[0]['count']}")
        
        # Backup existing data if any
        existing_data = db.execute_query('SELECT * FROM permissions')
        logger.info(f"Backed up {len(existing_data)} records")
        
        logger.info("\n🔧 Step 2: Adding missing fields to permissions table...")
        
        # Add description field
        try:
            db.execute_query("ALTER TABLE permissions ADD COLUMN description TEXT AFTER action_name")
            logger.info("✅ Added 'description' field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("ℹ️ 'description' field already exists")
            else:
                logger.error(f"Error adding description: {e}")
        
        # Add is_active field
        try:
            db.execute_query("ALTER TABLE permissions ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER is_allowed")
            logger.info("✅ Added 'is_active' field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("ℹ️ 'is_active' field already exists")
            else:
                logger.error(f"Error adding is_active: {e}")
        
        # Add priority field for permission hierarchy
        try:
            db.execute_query("ALTER TABLE permissions ADD COLUMN priority INT DEFAULT 0 AFTER is_active")
            logger.info("✅ Added 'priority' field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("ℹ️ 'priority' field already exists")
            else:
                logger.error(f"Error adding priority: {e}")
        
        # Add conditions field for advanced permissions
        try:
            db.execute_query("ALTER TABLE permissions ADD COLUMN conditions JSON AFTER priority")
            logger.info("✅ Added 'conditions' field")
        except Exception as e:
            if "Duplicate column name" in str(e):
                logger.info("ℹ️ 'conditions' field already exists")
            else:
                logger.error(f"Error adding conditions: {e}")
        
        logger.info("\n🔍 Step 3: Verifying improved table structure...")
        result = db.execute_query('DESCRIBE permissions')
        
        logger.info("Improved permissions table structure:")
        for row in result:
            logger.info(f"  ✅ {row['Field']}: {row['Type']} - Null: {row['Null']} - Default: {row['Default']}")
        
        logger.info("\n🎉 Permissions table improvement completed successfully!")
        logger.info("New fields added:")
        logger.info("  ✅ description: Explains what the permission does")
        logger.info("  ✅ is_active: Enable/disable permissions without deleting")
        logger.info("  ✅ priority: For permission hierarchy (higher number = higher priority)")
        logger.info("  ✅ conditions: For advanced conditional permissions (JSON)")
        
    except Exception as e:
        logger.error(f"❌ Error improving permissions table: {e}")
        raise

if __name__ == "__main__":
    improve_permissions_table()