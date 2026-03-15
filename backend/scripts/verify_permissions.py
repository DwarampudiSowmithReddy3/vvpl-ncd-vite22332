"""
Verify Permissions Script
=========================
Checks if permissions are properly seeded in the database
"""

import sys
from pathlib import Path
import json

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def verify_permissions():
    """Verify permissions are in database"""
    try:
        db = get_db()
        
        logger.info("=" * 70)
        logger.info("VERIFYING PERMISSIONS")
        logger.info("=" * 70)
        
        # Get all permissions
        query = "SELECT role, permissions FROM role_permissions ORDER BY role"
        result = db.execute_query(query)
        
        if not result:
            logger.error("❌ No permissions found in database!")
            return False
        
        logger.info(f"✅ Found {len(result)} roles with permissions\n")
        
        for row in result:
            role = row['role']
            perms = json.loads(row['permissions'])
            
            logger.info(f"Role: {role}")
            logger.info(f"  Modules: {', '.join(perms.keys())}")
            
            # Count enabled permissions
            enabled_count = 0
            for module, actions in perms.items():
                for action, enabled in actions.items():
                    if enabled:
                        enabled_count += 1
            
            logger.info(f"  Enabled permissions: {enabled_count}")
            logger.info("")
        
        logger.info("=" * 70)
        logger.info("✅ PERMISSIONS VERIFIED SUCCESSFULLY!")
        logger.info("=" * 70)
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Error verifying permissions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = verify_permissions()
    sys.exit(0 if success else 1)
