#!/usr/bin/env python3
"""
Fix audit_logs table structure
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_audit_table():
    """Fix audit_logs table structure"""
    try:
        db = get_db()
        
        # Check current table structure
        try:
            result = db.execute_query("DESCRIBE audit_logs")
            logger.info("Current audit_logs table structure:")
            for row in result:
                logger.info(f"  {row}")
        except Exception as e:
            logger.info(f"Table doesn't exist or error: {e}")
        
        # Drop and recreate the table with correct structure
        logger.info("Recreating audit_logs table...")
        
        drop_query = "DROP TABLE IF EXISTS audit_logs"
        db.execute_query(drop_query)
        
        create_query = """
        CREATE TABLE audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action VARCHAR(255) NOT NULL,
            admin_name VARCHAR(255) NOT NULL,
            admin_role VARCHAR(255) NOT NULL,
            details TEXT NOT NULL,
            entity_type VARCHAR(255),
            entity_id VARCHAR(255),
            changes JSON,
            timestamp DATETIME NOT NULL,
            INDEX idx_timestamp (timestamp),
            INDEX idx_admin_name (admin_name),
            INDEX idx_entity_type (entity_type)
        )
        """
        
        db.execute_query(create_query)
        logger.info("✅ audit_logs table created successfully")
        
        # Verify the new structure
        result = db.execute_query("DESCRIBE audit_logs")
        logger.info("New audit_logs table structure:")
        for row in result:
            logger.info(f"  {row}")
        
    except Exception as e:
        logger.error(f"Error fixing audit table: {e}")
        raise

if __name__ == "__main__":
    fix_audit_table()