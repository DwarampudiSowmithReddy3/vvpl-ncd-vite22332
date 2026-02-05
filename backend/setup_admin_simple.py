#!/usr/bin/env python3
"""
Simple setup script to create the default admin user with SHA256 hash
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_db
from datetime import datetime
import hashlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_admin_user():
    """Create the default admin user with SHA256 hashed password"""
    try:
        db = get_db()
        
        # Delete existing admin user if exists
        delete_query = "DELETE FROM users WHERE username = 'admin'"
        db.execute_query(delete_query)
        
        # Hash password using SHA256
        password_hash = hashlib.sha256("admin123".encode()).hexdigest()
        
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
        logger.info(f"Password Hash: {password_hash}")
        
    except Exception as e:
        logger.error(f"Error creating admin user: {e}")
        raise

if __name__ == "__main__":
    create_admin_user()