#!/usr/bin/env python3
"""
Setup script to create the default admin user
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from auth import get_password_hash
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Create the default admin user"""
    try:
        db = get_db()
        
        # Check if admin user already exists
        check_query = "SELECT COUNT(*) as count FROM users WHERE username = 'admin'"
        result = db.execute_query(check_query)
        
        if result[0]['count'] > 0:
            logger.info("Admin user already exists")
            return
        
        # Create admin user with truncated password for bcrypt compatibility
        password = "admin123"[:72]  # Truncate to 72 bytes for bcrypt
        password_hash = get_password_hash(password)
        
        insert_query = """
        INSERT INTO users (user_id, username, full_name, email, phone, password_hash, role, created_at, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        db.execute_query(insert_query, (
            "ADMIN001",
            "admin",
            "System Administrator",
            "admin@ncdmanagement.com",
            "+91 9999999999",
            password_hash,
            "Super Admin",
            now,
            True
        ))
        
        logger.info("Admin user created successfully")
        logger.info("Username: admin")
        logger.info("Password: admin123")
        logger.info("Role: Super Admin")
        
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        raise

if __name__ == "__main__":
    create_admin_user()