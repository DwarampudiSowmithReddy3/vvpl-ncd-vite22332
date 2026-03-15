"""
Seed Permissions Script
=======================
Populates the role_permissions table with default permissions for each role
Run this after running migrations
"""

import sys
from pathlib import Path
import json
from datetime import datetime

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# Define permissions for each role
# Super Admin and Admin have FULL permissions
# All other 9 roles have NO permissions (to be configured later)
ROLE_PERMISSIONS = {
    "Super Admin": {
        "dashboard": {"view": True, "create": True, "edit": True, "delete": True},
        "ncdSeries": {"view": True, "create": True, "edit": True, "delete": True},
        "investors": {"view": True, "create": True, "edit": True, "delete": True},
        "reports": {"view": True, "create": True, "edit": True, "delete": True},
        "compliance": {"view": True, "create": True, "edit": True, "delete": True},
        "interestPayout": {"view": True, "create": True, "edit": True, "delete": True},
        "communication": {"view": True, "create": True, "edit": True, "delete": True},
        "administrator": {"view": True, "create": True, "edit": True, "delete": True},
        "approval": {"view": True, "create": True, "edit": True, "delete": True},
        "grievanceManagement": {"view": True, "create": True, "edit": True, "delete": True}
    },
    "Admin": {
        "dashboard": {"view": True, "create": True, "edit": True, "delete": True},
        "ncdSeries": {"view": True, "create": True, "edit": True, "delete": True},
        "investors": {"view": True, "create": True, "edit": True, "delete": True},
        "reports": {"view": True, "create": True, "edit": True, "delete": True},
        "compliance": {"view": True, "create": True, "edit": True, "delete": True},
        "interestPayout": {"view": True, "create": True, "edit": True, "delete": True},
        "communication": {"view": True, "create": True, "edit": True, "delete": True},
        "administrator": {"view": True, "create": True, "edit": True, "delete": True},
        "approval": {"view": True, "create": True, "edit": True, "delete": True},
        "grievanceManagement": {"view": True, "create": True, "edit": True, "delete": True}
    },
    "Finance Executive": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Finance Manager": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Compliance Base": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Compliance Officer": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Investor Relationship Executive": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Investor Relationship Manager": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Board Member Base": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Board Member Head": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    },
    "Investor": {
        "dashboard": {"view": False, "create": False, "edit": False, "delete": False},
        "ncdSeries": {"view": False, "create": False, "edit": False, "delete": False},
        "investors": {"view": False, "create": False, "edit": False, "delete": False},
        "reports": {"view": False, "create": False, "edit": False, "delete": False},
        "compliance": {"view": False, "create": False, "edit": False, "delete": False},
        "interestPayout": {"view": False, "create": False, "edit": False, "delete": False},
        "communication": {"view": False, "create": False, "edit": False, "delete": False},
        "administrator": {"view": False, "create": False, "edit": False, "delete": False},
        "approval": {"view": False, "create": False, "edit": False, "delete": False},
        "grievanceManagement": {"view": False, "create": False, "edit": False, "delete": False}
    }
}


def seed_permissions():
    """Seed the role_permissions table with default permissions"""
    try:
        db = get_db()
        
        logger.info("=" * 70)
        logger.info("SEEDING PERMISSIONS")
        logger.info("=" * 70)
        
        # Check if permissions already exist
        check_query = "SELECT COUNT(*) as count FROM role_permissions"
        result = db.execute_query(check_query)
        
        if result and result[0]['count'] > 0:
            logger.info(f"⏭️  Permissions already exist ({result[0]['count']} roles)")
            logger.info("Skipping seed...")
            return True
        
        # Insert permissions for each role
        insert_query = """
        INSERT INTO role_permissions (role, permissions, updated_by, updated_at)
        VALUES (%s, %s, %s, %s)
        """
        
        for role, permissions in ROLE_PERMISSIONS.items():
            try:
                permissions_json = json.dumps(permissions)
                
                db.execute_query(insert_query, (
                    role,
                    permissions_json,
                    "System",
                    datetime.now()
                ))
                
                logger.info(f"✅ Seeded permissions for role: {role}")
            
            except Exception as e:
                logger.error(f"❌ Failed to seed permissions for {role}: {e}")
                raise
        
        logger.info("=" * 70)
        logger.info("✅ PERMISSIONS SEEDED SUCCESSFULLY!")
        logger.info("=" * 70)
        logger.info(f"Total roles: {len(ROLE_PERMISSIONS)}")
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Error seeding permissions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = seed_permissions()
    sys.exit(0 if success else 1)
