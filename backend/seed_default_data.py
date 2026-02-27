"""
Database Seeder - Insert Default Data
This script inserts default admin user and communication templates
Run this after migrations complete
"""
import logging
from database import get_db

logger = logging.getLogger(__name__)


def seed_default_data():
    """
    Insert default data into database:
    - Default admin user (admin/admin123)
    - Default communication templates (6 templates)
    """
    try:
        db = get_db()
        logger.info("🌱 Seeding default data...")
        
        # ============================================
        # 1. CREATE DEFAULT ADMIN USER
        # ============================================
        
        check_admin = "SELECT COUNT(*) as count FROM users WHERE username = 'admin'"
        result = db.execute_query(check_admin)
        
        if result[0]['count'] == 0:
            # Create default admin user
            # Password: admin123
            # Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqPQKqHu
            insert_admin = """
            INSERT INTO users (username, full_name, email, hashed_password, role, is_active)
            VALUES ('admin', 'System Administrator', 'admin@ncd.com', 
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqPQKqHu', 
                    'super_admin', TRUE)
            """
            db.execute_query(insert_admin)
            logger.info("✅ Default admin user created")
            logger.info("   Username: admin")
            logger.info("   Password: admin123")
            logger.info("   ⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!")
        else:
            logger.info("ℹ️  Admin user already exists - skipping")
        
        # ============================================
        # 2. CREATE DEFAULT COMMUNICATION TEMPLATES
        # ============================================
        
        check_templates = "SELECT COUNT(*) as count FROM communication_templates"
        result = db.execute_query(check_templates)
        
        if result[0]['count'] == 0:
            templates = [
                # SMS Templates
                ("Interest Payment Notification", "SMS", None, 
                 "Dear {InvestorName}, your interest of {Amount} for {SeriesName} has been processed to account {BankAccountNumber}. - VVPL"),
                
                ("Payment Confirmation", "SMS", None,
                 "Dear {InvestorName}, payment of {Amount} for {SeriesName} confirmed. Investor ID: {InvestorID}. Thank you - VVPL"),
                
                ("General Update", "SMS", None,
                 "Dear {InvestorName}, important update regarding {SeriesName}. Please contact us for details. - VVPL"),
                
                # Email Templates
                ("Interest Payment Notification", "Email", "Interest Payment Processed - {SeriesName}",
                 "Dear {InvestorName},\n\nWe are pleased to inform you that your interest payment of {Amount} for {SeriesName} has been successfully processed.\n\nInvestor ID: {InvestorID}\nBank Account: {BankAccountNumber}\nSeries: {SeriesName}\n\nThe amount has been credited to your registered bank account.\n\nThank you for investing with us.\n\nBest regards,\nVaibhav Vyapaar Private Limited"),
                
                ("Payment Confirmation", "Email", "Payment Confirmation - {SeriesName}",
                 "Dear {InvestorName},\n\nThis is to confirm that we have received your payment of {Amount} for {SeriesName}.\n\nInvestor ID: {InvestorID}\nSeries: {SeriesName}\nAmount: {Amount}\n\nYour investment has been recorded successfully.\n\nThank you for your trust in us.\n\nBest regards,\nVaibhav Vyapaar Private Limited"),
                
                ("General Update", "Email", "Important Update - {SeriesName}",
                 "Dear {InvestorName},\n\nWe have an important update regarding your investment in {SeriesName}.\n\nInvestor ID: {InvestorID}\n\nPlease contact us at your earliest convenience for more details.\n\nBest regards,\nVaibhav Vyapaar Private Limited")
            ]
            
            for name, type, subject, content in templates:
                insert_template = """
                INSERT INTO communication_templates (name, type, subject, content, created_by)
                VALUES (%s, %s, %s, %s, 'System')
                """
                db.execute_query(insert_template, (name, type, subject, content))
            
            logger.info("✅ Default communication templates created (6 templates)")
        else:
            logger.info("ℹ️  Communication templates already exist - skipping")
        
        logger.info("✅ Default data seeding completed!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to seed default data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    # For testing: run seeder directly
    seed_default_data()
