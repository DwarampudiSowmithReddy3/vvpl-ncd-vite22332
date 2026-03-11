"""
Create User Script
==================
Creates a new user in the database with hashed password
"""

import sys
from pathlib import Path
import hashlib
import secrets

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
from app.core.auth import get_password_hash
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_user(username, password, full_name, email, phone, role):
    """Create a new user in the database"""
    try:
        db = get_db()
        
        # Generate user_id (10 random alphanumeric characters)
        import random
        import string
        chars = string.ascii_uppercase + string.digits
        user_id = ''.join(random.choice(chars) for _ in range(10))
        
        # Hash the password
        password_hash = get_password_hash(password)
        
        # Check if user already exists
        check_query = "SELECT id FROM users WHERE username = %s OR email = %s"
        existing = db.execute_query(check_query, (username, email))
        
        if existing:
            logger.error(f"❌ User already exists: {username}")
            return False
        
        # Insert user
        insert_query = """
        INSERT INTO users (
            user_id, username, email, full_name, phone, 
            password_hash, role, is_active
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s
        )
        """
        
        db.execute_query(insert_query, (
            user_id,
            username,
            email,
            full_name,
            phone,
            password_hash,
            role,
            True
        ))
        
        logger.info("=" * 60)
        logger.info("✅ USER CREATED SUCCESSFULLY!")
        logger.info("=" * 60)
        logger.info(f"User ID: {user_id}")
        logger.info(f"Username: {username}")
        logger.info(f"Email: {email}")
        logger.info(f"Full Name: {full_name}")
        logger.info(f"Phone: {phone}")
        logger.info(f"Role: {role}")
        logger.info("=" * 60)
        logger.info("You can now login with:")
        logger.info(f"  Username: {username}")
        logger.info(f"  Password: {password}")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating user: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    # Create user with provided credentials
    success = create_user(
        username="sowmith",
        password="sowmith",
        full_name="Sowmith",
        email="sowmith@ncd.com",
        phone="9876543210",
        role="Super Admin"
    )
    
    sys.exit(0 if success else 1)
