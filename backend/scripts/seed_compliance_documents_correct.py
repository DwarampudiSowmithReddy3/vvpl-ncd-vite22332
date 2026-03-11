"""
Seed Correct Compliance Master Items Script
============================================
Populates compliance_master_items with EXACT document titles from RBI requirements
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


# EXACT COMPLIANCE ITEMS AS PROVIDED
COMPLIANCE_ITEMS = [
    # PRE-COMPLIANCE PHASE (26 items)
    ("pre", "Accepted copy of our consent letter", "Consent letter from company", "RBI Master Circular", "One-time", 1),
    ("pre", "CTC of Memorandum and Articles of Association of the company", "Certified True Copy of M&A", "RBI Master Circular", "One-time", 2),
    ("pre", "CTC of Board Resolution appointing Debenture Trustees along with authority to create the security", "Board Resolution for Trustee Appointment", "RBI Master Circular", "One-time", 3),
    ("pre", "Certified True Copy of resolution passed by the board of directors under Section 179(3)(c) of the Companies Act, 2013 for the issue of Debentures", "Board Resolution under Section 179(3)(c)", "RBI Master Circular", "One-time", 4),
    ("pre", "CTC of Special resolution passed under Section 180(1)(c) of the Companies Act 2013, authorizing the BOD to borrow money", "Special Resolution under Section 180(1)(c)", "RBI Master Circular", "One-time", 5),
    ("pre", "CTC of Special resolution passed under Section 180(1)(a) of the Companies Act 2013, authorizing the BOD to charge the security providers assets as security", "Special Resolution under Section 180(1)(a)", "RBI Master Circular", "One-time", 6),
    ("pre", "CTC of Special Resolution under section 42 of Companies Act, 2013, read with Rule 14(2)a of Companies (Prospectus and Allotment of Securities) Rules, 2014", "Special Resolution under Section 42", "RBI Master Circular", "One-time", 7),
    ("pre", "CTC of Authorized, issued, subscribed & paid up capital structure of the Issuer company/third party security provider", "Capital Structure Certificate", "RBI Master Circular", "One-time", 8),
    ("pre", "A copy of the latest Annual Report of the company for last 3 years", "Annual Reports (Last 3 Years)", "RBI Master Circular", "One-time", 9),
    ("pre", "Finalized copy of shelf prospectus / Information Memorandum / Subscription Agreement", "Prospectus/Information Memorandum", "RBI Master Circular", "One-time", 10),
    ("pre", "Debenture Trustee Agreement to be executed at least one day prior to Issue opening date", "Debenture Trustee Agreement", "RBI Master Circular", "One-time", 11),
    ("pre", "No objection for ceding charge in our favour from the existing charge holders", "No Objection from Existing Charge Holders", "RBI Master Circular", "One-time", 12),
    ("pre", "Permission under Section 281(1)(ii) of the Income Tax Act, 1961 for creating charge", "Income Tax Permission under Section 281(1)(ii)", "RBI Master Circular", "One-time", 13),
    ("pre", "RBI approval for issue of Bonds/Debentures, if applicable", "RBI Approval for Bonds/Debentures", "RBI Master Circular", "One-time", 14),
    ("pre", "ROC Search report from practicing Company Secretary or practicing Chartered Accountant", "ROC Search Report", "RBI Master Circular", "One-time", 15),
    ("pre", "Declaration that borrowings are within the limit sanctioned u/s 180(1)c of the Companies Act, 2013", "Borrowing Limit Declaration", "RBI Master Circular", "One-time", 16),
    ("pre", "Practicing CA/Statutory Auditor Certificate", "CA/Auditor Certificate", "RBI Master Circular", "One-time", 17),
    ("pre", "Copy of PAN cards/Passport duly certified by compliance officer for all executants", "PAN/Passport Copies (Certified)", "RBI Master Circular", "One-time", 18),
    ("pre", "Passport size photographs of all executants", "Passport Size Photographs", "RBI Master Circular", "One-time", 19),
    ("pre", "CTC of Specimen signature of all the executants duly certified by Director or authorized signatory", "Specimen Signatures (Certified)", "RBI Master Circular", "One-time", 20),
    ("pre", "Submission of TSR wherever security provided includes immovable property/ies", "Title Search Report (TSR)", "RBI Master Circular", "One-time", 21),
    ("pre", "Submission of Valuation report wherever security provided includes immovable property/ies", "Valuation Report", "RBI Master Circular", "One-time", 22),
    ("pre", "Confirmation from KMP of the Issuer on timely serving of all existing debts", "KMP Confirmation on Debt Servicing", "RBI Master Circular", "One-time", 23),
    ("pre", "In case of personal guarantee is offered as security", "Personal Guarantee Documentation", "RBI Master Circular", "One-time", 24),
    ("pre", "In case of corporate guarantee is offered as security", "Corporate Guarantee Documentation", "RBI Master Circular", "One-time", 25),
    ("pre", "In case shares are pledged as security", "Share Pledge Documentation", "RBI Master Circular", "One-time", 26),
    
    # POST-COMPLIANCE PHASE (11 items)
    ("post", "Execution of Debenture Trust Deed (within 2 months from closure of Issue)", "Debenture Trust Deed Execution", "RBI Master Circular", "One-time", 27),
    ("post", "Security Document (within 3 months from closure of Issue)", "Security Document Execution", "RBI Master Circular", "One-time", 28),
    ("post", "Form CHG-9 to be filed with MCA (within 30 days after execution of Security documents)", "Form CHG-9 Filing with MCA", "RBI Master Circular", "One-time", 29),
    ("post", "E-form PAS-3 (Return of Allotment) under Companies (Prospectus and Allotment of Securities) Rules, 2014", "E-form PAS-3 Filing", "RBI Master Circular", "One-time", 30),
    ("post", "CERSAI registration on charged assets (within 30 days after execution of Security documents)", "CERSAI Registration", "RBI Master Circular", "One-time", 31),
    ("post", "List of allottees / Debenture holders (Benpos)", "Allottees/Debenture Holders List", "RBI Master Circular", "One-time", 32),
    ("post", "Credit corporate action (NSDL & CDSL)", "Corporate Action Credit (NSDL & CDSL)", "RBI Master Circular", "One-time", 33),
    ("post", "Copy of allotment letters / Resolution", "Allotment Letters/Resolution", "RBI Master Circular", "One-time", 34),
    ("post", "Confirmation on payment of stamp duty on the Issue of Bonds", "Stamp Duty Payment Confirmation", "RBI Master Circular", "One-time", 35),
    ("post", "E-form PAS-4 and PAS-5 under Rule 14(3) of the Companies (Prospectus and Allotment of Securities) Rules, 2014", "E-form PAS-4 and PAS-5 Filing", "RBI Master Circular", "One-time", 36),
    ("post", "Utilization certificate from practicing chartered accountant", "Utilization Certificate from CA", "RBI Master Circular", "One-time", 37),
]


def seed_compliance_items():
    """Seed correct compliance master items into database"""
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("Seeding CORRECT Compliance Master Items")
        logger.info("=" * 80)
        
        # Delete existing items first
        logger.info("\n🗑️  Clearing existing compliance items...")
        delete_query = "DELETE FROM compliance_master_items"
        db.execute_query(delete_query)
        logger.info("✅ Cleared existing items")
        
        logger.info(f"\n📝 Inserting {len(COMPLIANCE_ITEMS)} compliance items...\n")
        
        insert_query = """
        INSERT INTO compliance_master_items 
        (section, title, description, legal_reference, frequency, display_order, is_active, created_at)
        VALUES (%s, %s, %s, %s, %s, %s, 1, %s)
        """
        
        for section, title, description, legal_ref, frequency, order in COMPLIANCE_ITEMS:
            db.execute_query(insert_query, (
                section,
                title,
                description,
                legal_ref,
                frequency,
                order,
                datetime.now()
            ))
            logger.info(f"✅ {order:2d}. [{section:5s}] {title[:60]}")
        
        logger.info("\n" + "=" * 80)
        logger.info("✅ Compliance Items Seeded Successfully!")
        logger.info("=" * 80)
        
        # Verify
        verify_query = """
        SELECT section, COUNT(*) as count
        FROM compliance_master_items
        WHERE is_active = 1
        GROUP BY section
        ORDER BY section
        """
        verify_result = db.execute_query(verify_query)
        
        logger.info("\n📊 Summary:")
        for row in verify_result:
            logger.info(f"   {row['section']:10s}: {row['count']:2d} items")
        
        total_query = "SELECT COUNT(*) as count FROM compliance_master_items WHERE is_active = 1"
        total_result = db.execute_query(total_query)
        total = total_result[0]['count'] if total_result else 0
        logger.info(f"   {'TOTAL':10s}: {total:2d} items")
        
        logger.info("\n" + "=" * 80)
        logger.info("\n✅ Ready for Recurring Compliance items in next round!")
        logger.info("=" * 80)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error seeding compliance items: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = seed_compliance_items()
    sys.exit(0 if success else 1)
