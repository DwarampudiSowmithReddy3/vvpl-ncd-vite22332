"""
Create Communication Templates Script
======================================
Creates default SMS and Email templates in the database
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


def create_templates():
    """Create default communication templates"""
    try:
        db = get_db()
        
        logger.info("=" * 70)
        logger.info("Creating Communication Templates")
        logger.info("=" * 70)
        
        # SMS Template
        sms_template = {
            'name': 'Investment Confirmation',
            'type': 'SMS',
            'subject': 'Investment Confirmation',
            'content': 'Dear {InvestorName}, Your investment of ₹{Amount} in {SeriesName} has been confirmed. Investor ID: {InvestorID}. Thank you!',
            'template_id': '1107177208876038744',  # Kaleyra DLT Template ID
            'message_type_code': 'TXN',  # Transactional SMS
            'is_active': 1
        }
        
        # Email Template
        email_template = {
            'name': 'Investment Confirmation Email',
            'type': 'Email',
            'subject': 'Investment Confirmation - {SeriesName}',
            'content': '''Dear {InvestorName},

Your investment has been successfully confirmed.

Investment Details:
- Series: {SeriesName}
- Amount: ₹{Amount}
- Investor ID: {InvestorID}
- Bank Account: {BankAccountNumber}

Thank you for investing with us!

Best regards,
NCD Management Team''',
            'template_id': None,
            'message_type_code': 'TXN',  # Transactional Email
            'is_active': 1
        }
        
        templates = [sms_template, email_template]
        
        for template in templates:
            # Check if template already exists
            check_query = "SELECT id FROM communication_templates WHERE name = %s AND type = %s"
            existing = db.execute_query(check_query, (template['name'], template['type']))
            
            if existing:
                logger.info(f"⏭️  Template already exists: {template['name']} ({template['type']})")
                continue
            
            # Insert template
            insert_query = """
            INSERT INTO communication_templates 
            (name, type, subject, content, template_id, message_type_code, is_active, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            db.execute_query(insert_query, (
                template['name'],
                template['type'],
                template['subject'],
                template['content'],
                template['template_id'],
                template['message_type_code'],
                template['is_active'],
                datetime.now(),
                datetime.now()
            ))
            
            logger.info(f"✅ Created template: {template['name']} ({template['type']})")
        
        logger.info("=" * 70)
        
        # Show all templates
        logger.info("\n📊 All Communication Templates:\n")
        query = """
        SELECT 
            id,
            name,
            type,
            is_active,
            template_id,
            message_type_code
        FROM communication_templates
        ORDER BY type, name
        """
        
        result = db.execute_query(query)
        for row in result:
            status = "✅" if row['is_active'] else "❌"
            template_id_str = f" (Template ID: {row['template_id']})" if row['template_id'] else ""
            msg_type_str = f" [Type: {row['message_type_code']}]" if row['message_type_code'] else ""
            logger.info(f"{status} {row['type']:6} | {row['name']}{template_id_str}{msg_type_str}")
        
        logger.info("\n" + "=" * 70)
        logger.info("✅ Template creation complete!")
        logger.info("=" * 70)
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creating templates: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


if __name__ == "__main__":
    success = create_templates()
    sys.exit(0 if success else 1)
