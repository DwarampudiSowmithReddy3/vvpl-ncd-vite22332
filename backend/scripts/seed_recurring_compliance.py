"""
Seed Recurring Compliance Items Script
=======================================
Populates recurring compliance items with EXACT document titles
"""

import sys
from pathlib import Path
from datetime import datetime

# Add backend directory to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# EXACT RECURRING COMPLIANCE ITEMS AS PROVIDED
RECURRING_ITEMS = [
    ("recurring", "Interest payment confirmation along with proof (applicable for every Tranche)", "Interest payment confirmation and supporting proof", "RBI Master Circular", "Every Tranche", 1),
    ("recurring", "Redemption payment confirmation along with proof (applicable for every Tranche)", "Redemption payment confirmation and supporting proof", "RBI Master Circular", "Every Tranche", 2),
    ("recurring", "Quarterly report to Trustee (format shared by Trustee)", "Quarterly report to Debenture Trustee", "RBI Master Circular", "Quarterly", 3),
    ("recurring", "Calendar of Interest and Redemptions (within 7 days of starting of every Financial Year)", "Interest and Redemption Calendar", "RBI Master Circular", "Annual", 4),
    ("recurring", "Confirmation on creation of Debenture/Bond Redemption Reserve - Annually (certified by Statutory Auditor)", "Debenture/Bond Redemption Reserve Confirmation", "RBI Master Circular", "Annual", 5),
]


def seed_recurring_compliance():
    """Seed recurring compliance items into database"""
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("Seeding Recurring Compliance Items")
        logger.info("=" * 80)
        
        # Check if recurring items already exist
        check_query = "SELECT COUNT(*) as count FROM compliance_master_items WHERE section = 'recurring'"
        result = db.execute_query(check_query)
        existing_count = result[0]['count'] if result else 0
        
        if existing_count > 0:
            logger.warning(f"⚠️  Database already has {existing_count} recurring compliance items")
            logger.info("Deleting old recurring items...")
            delete_query = "DELETE FROM compliance_master_items WHERE section = 'recurring'"
            db.execute_query(delete_query)
            logger.info("✅ Old recurring items deleted")
        
        logger.info(f"\n📝 Inserting {len(RECURRING_ITEMS)} recurring compliance items...\n")
        
        insert_query = """
        INSERT INTO compliance_master_items 
        (section, title, description, legal_reference, frequency, display_order, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, 1, %s)
        """
        
        for section, title, description, legal_ref, frequency, order in RECURRING_ITEMS:
            db.execute_query(insert_query, (
                section,
                title,
                description,
                legal_ref,
                frequency,
                order,
                datetime.now()
            ))
            logger.info(f"✅ {order}. {title[:70]}")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ Recurring Compliance Items Seeded Successfully!")
        logger.info("=" * 80)
        
        # Verify all compliance items
        verify_query = """
        SELECT section, COUNT(*) as count
        FROM compliance_master_items
        WHERE is_active = 1
        GROUP BY section
        ORDER BY section
        """
        verify_result = db.execute_query(verify_query)
        
        logger.info("\n📊 Complete Compliance Summary:")
        total = 0
        for row in verify_result:
            logger.info(f"   {row['section']:10s}: {row['count']:2d} items")
            total += row['count']
        
        logger.info(f"   {'TOTAL':10s}: {total:2d} items")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ All Compliance Items Ready!")
        logger.info("=" * 80)
        
        # Show breakdown
        logger.info("\n📋 Compliance Phases:")
        logger.info("   Pre-Compliance Phase: 26 items")
        logger.info("   Post-Compliance Phase: 11 items")
        logger.info("   Recurring Compliance: 5 items")
        logger.info("   TOTAL: 42 items")
        
        logger.info("\n" + "=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error seeding recurring compliance items: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = seed_recurring_compliance()
    sys.exit(0 if success else 1)
