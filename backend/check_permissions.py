#!/usr/bin/env python3
"""
Check permissions in database
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_permissions():
    """Check permissions in database"""
    try:
        db = get_db()
        
        # Check permissions count
        result = db.execute_query("SELECT COUNT(*) as count FROM permissions")
        print(f"Total permissions in database: {result[0]['count']}")
        
        # Check sample permissions
        result = db.execute_query("SELECT * FROM permissions LIMIT 5")
        print("\nSample permissions:")
        for row in result:
            print(f"  Role: {row['role_name']}, Module: {row['module_name']}, Action: {row['action_name']}, Allowed: {row['is_allowed']}")
        
        # Check specific role permissions
        result = db.execute_query("SELECT * FROM permissions WHERE role_name = 'Super Admin' LIMIT 5")
        print(f"\nSuper Admin permissions (first 5):")
        for row in result:
            print(f"  Module: {row['module_name']}, Action: {row['action_name']}, Allowed: {row['is_allowed']}")
        
    except Exception as e:
        logger.error(f"Error checking permissions: {e}")
        raise

if __name__ == "__main__":
    check_permissions()