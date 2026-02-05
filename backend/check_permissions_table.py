#!/usr/bin/env python3
"""
Check if permissions table exists and has data
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_permissions_table():
    """Check permissions table structure and data"""
    
    try:
        db = get_db()
        
        logger.info("🔍 Checking permissions table...")
        
        # Check if role_permissions table exists
        try:
            result = db.execute_query("SHOW TABLES LIKE 'role_permissions'")
            if result:
                logger.info("✅ role_permissions table exists")
            else:
                logger.error("❌ role_permissions table does NOT exist")
                return
        except Exception as e:
            logger.error(f"❌ Error checking table existence: {e}")
            return
        
        # Check table structure
        try:
            result = db.execute_query("DESCRIBE role_permissions")
            logger.info("📋 Table structure:")
            for row in result:
                logger.info(f"  - {row['Field']}: {row['Type']}")
        except Exception as e:
            logger.error(f"❌ Error checking table structure: {e}")
        
        # Check if table has data
        try:
            result = db.execute_query("SELECT COUNT(*) as count FROM role_permissions")
            count = result[0]['count']
            logger.info(f"📊 Total records in role_permissions: {count}")
            
            if count == 0:
                logger.warning("⚠️ role_permissions table is EMPTY!")
                logger.info("💡 You need to populate the permissions table")
            else:
                # Show sample data
                result = db.execute_query("SELECT role, LEFT(permissions, 100) as permissions_preview FROM role_permissions LIMIT 5")
                logger.info("📋 Sample data:")
                for row in result:
                    logger.info(f"  - {row['role']}: {row['permissions_preview']}...")
                    
        except Exception as e:
            logger.error(f"❌ Error checking table data: {e}")
            
        # Check if Super Admin exists
        try:
            result = db.execute_query("SELECT * FROM role_permissions WHERE role = 'Super Admin'")
            if result:
                logger.info("✅ Super Admin permissions found")
            else:
                logger.error("❌ Super Admin permissions NOT found")
        except Exception as e:
            logger.error(f"❌ Error checking Super Admin: {e}")
            
    except Exception as e:
        logger.error(f"💥 Error checking permissions table: {e}")
        raise

if __name__ == "__main__":
    check_permissions_table()