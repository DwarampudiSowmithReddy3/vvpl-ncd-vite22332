"""
Reset Permissions Script
========================
Clears all existing permissions and re-seeds with the correct 11 roles
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def reset_permissions():
    """Clear and re-seed permissions"""
    try:
        db = get_db()
        
        logger.info("=" * 70)
        logger.info("RESETTING PERMISSIONS")
        logger.info("=" * 70)
        
        # Delete all existing permissions
        logger.info("🗑️  Deleting all existing permissions...")
        delete_query = "DELETE FROM role_permissions"
        db.execute_query(delete_query)
        logger.info("✅ All permissions deleted")
        
        logger.info("=" * 70)
        logger.info("✅ PERMISSIONS RESET COMPLETE!")
        logger.info("=" * 70)
        logger.info("")
        logger.info("Next step: Run seed_permissions.py to populate with new roles")
        logger.info("")
        
        return True
    
    except Exception as e:
        logger.error(f"❌ Error resetting permissions: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = reset_permissions()
    sys.exit(0 if success else 1)
