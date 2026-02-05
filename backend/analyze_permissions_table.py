#!/usr/bin/env python3
"""
Analyze current permissions table structure
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def analyze_permissions_table():
    """Analyze current permissions table structure"""
    try:
        db = get_db()
        
        logger.info("🔍 Current permissions table structure:")
        result = db.execute_query('DESCRIBE permissions')
        
        for row in result:
            logger.info(f"  {row['Field']}: {row['Type']} - Null: {row['Null']} - Key: {row['Key']}")
        
        # Check if table has any data
        count_result = db.execute_query('SELECT COUNT(*) as count FROM permissions')
        logger.info(f"\nCurrent records in permissions table: {count_result[0]['count']}")
        
        # Show sample data if any
        if count_result[0]['count'] > 0:
            sample_data = db.execute_query('SELECT * FROM permissions LIMIT 5')
            logger.info("\nSample data:")
            for row in sample_data:
                logger.info(f"  {row}")
        
        logger.info("\n🤔 Analysis: What fields might be missing?")
        logger.info("Current fields: id, role_name, module_name, action_name, is_allowed, created_at, updated_at, created_by_user, updated_by_user")
        logger.info("\nPossible additional fields needed:")
        logger.info("  - description: To explain what this permission does")
        logger.info("  - is_active: To enable/disable permissions without deleting")
        logger.info("  - priority: For permission hierarchy")
        logger.info("  - conditions: For conditional permissions (JSON field)")
        
    except Exception as e:
        logger.error(f"Error analyzing permissions table: {e}")
        raise

if __name__ == "__main__":
    analyze_permissions_table()