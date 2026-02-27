"""
Database Initialization Module
Creates all required tables automatically on application startup
"""
import logging
from database import get_db

logger = logging.getLogger(__name__)

def check_tables_exist():
    """
    Check if database tables already exist
    Returns True if tables exist, False if they need to be created
    """
    try:
        db = get_db()
        check_query = "SHOW TABLES LIKE 'users'"
        result = db.execute_query(check_query)
        return len(result) > 0
    except Exception as e:
        logger.error(f"Error checking tables: {e}")
        return False


def initialize_database(auto_confirm=False):
    """
    Initialize database by creating all required tables
    
    Args:
        auto_confirm: If True, skip confirmation prompt (for automated deployments)
    
    Returns:
        True if tables created/exist, False if user declined or error occurred
    """
    try:
        db = get_db()
        
        # Check if tables already exist
        if check_tables_exist():
            logger.info("✅ Database tables already exist - skipping initialization")
            return True
        
        # Tables don't exist - ask for confirmation
        logger.warning("=" * 70)
        logger.warning("⚠️  DATABASE TABLES NOT FOUND!")
        logger.warning("=" * 70)
        logger.warning("")
        logger.warning("The application needs to create 18 database tables:")
        logger.warning("  - users, role_permissions, audit_logs")
        logger.warning("  - ncd_series, series_documents, series_approvals")
        logger.warning("  - investors, investments, investor_documents")
        logger.warning("  - investor_series, interest_payouts")
        logger.warning("  - compliance_master_items, series_compliance_status")
        logger.warning("  - compliance_documents, grievances")
        logger.warning("  - communication_history, communication_templates")
        logger.warning("  - report_logs")
        logger.warning("")
        logger.warning("This will also create:")
        logger.warning("  - Default admin user (username: admin, password: admin123)")
        logger.warning("  - Default communication templates")
        logger.warning("")
        logger.warning("=" * 70)
        
        if not auto_confirm:
            # Ask for user confirmation
            logger.warning("⚠️  Do you want to create these tables now?")
            logger.warning("")
            logger.warning("Type 'yes' to create tables, or 'no' to exit:")
            logger.warning("")
            
            # Read user input
            try:
                user_input = input(">>> ").strip().lower()
                
                if user_input != 'yes':
                    logger.error("=" * 70)
                    logger.error("❌ TABLE CREATION CANCELLED BY USER")
                    logger.error("=" * 70)
                    logger.error("")
                    logger.error("The application cannot start without database tables.")
                    logger.error("Please run the application again and type 'yes' to create tables.")
                    logger.error("")
                    logger.error("Exiting application...")
                    logger.error("=" * 70)
                    return False
                
                logger.info("")
                logger.info("=" * 70)
                logger.info("✅ User confirmed - Creating database tables...")
                logger.info("=" * 70)
                logger.info("")
                
            except Exception as e:
                logger.error(f"Error reading user input: {e}")
                logger.error("Assuming 'yes' for automated deployment")
        
        logger.info("🔧 Initializing database tables...")
        
        # List of all table creation queries
        tables = [
            # 1. Users table
            """
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role ENUM('super_admin', 'admin', 'manager', 'viewer', 'investor') NOT NULL DEFAULT 'viewer',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                last_activity TIMESTAMP NULL,
                INDEX idx_username (username),
                INDEX idx_email (email),
                INDEX idx_role (role)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 2. Role Permissions table
            """
            CREATE TABLE IF NOT EXISTS role_permissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_name VARCHAR(50) NOT NULL,
                permission_name VARCHAR(100) NOT NULL,
                is_granted BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_role_permission (role_name, permission_name),
                INDEX idx_role (role_name),
                INDEX idx_permission (permission_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 3. Audit Logs table
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                action VARCHAR(255) NOT NULL,
                admin_name VARCHAR(255) NOT NULL,
                admin_role VARCHAR(50) NOT NULL,
                details TEXT,
                entity_type VARCHAR(100),
                entity_id VARCHAR(100),
                changes JSON,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ip_address VARCHAR(45),
                INDEX idx_action (action),
                INDEX idx_admin (admin_name),
                INDEX idx_timestamp (timestamp),
                INDEX idx_entity (entity_type, entity_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 4. NCD Series table
            """
            CREATE TABLE IF NOT EXISTS ncd_series (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                series_code VARCHAR(50) UNIQUE NOT NULL,
                issue_date DATE NOT NULL,
                maturity_date DATE NOT NULL,
                interest_rate DECIMAL(5,2) NOT NULL,
                face_value DECIMAL(15,2) NOT NULL,
                total_amount DECIMAL(20,2) NOT NULL,
                minimum_investment DECIMAL(15,2) NOT NULL,
                maximum_investment DECIMAL(15,2),
                interest_frequency ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly') NOT NULL,
                status ENUM('draft', 'pending_approval', 'approved', 'active', 'matured', 'closed') DEFAULT 'draft',
                security_type VARCHAR(100),
                credit_rating VARCHAR(50),
                lock_in_period INT,
                description TEXT,
                terms_conditions TEXT,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                approved_by VARCHAR(255),
                approved_at TIMESTAMP NULL,
                INDEX idx_series_code (series_code),
                INDEX idx_status (status),
                INDEX idx_issue_date (issue_date),
                INDEX idx_maturity_date (maturity_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 5. Series Documents table
            """
            CREATE TABLE IF NOT EXISTS series_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                series_id INT NOT NULL,
                document_type ENUM('term_sheet', 'offer_document', 'board_resolution', 'other') NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uploaded_by VARCHAR(255),
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                INDEX idx_series (series_id),
                INDEX idx_type (document_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 6. Series Approvals table
            """
            CREATE TABLE IF NOT EXISTS series_approvals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                series_id INT NOT NULL,
                approver_name VARCHAR(255) NOT NULL,
                approver_role VARCHAR(50) NOT NULL,
                action ENUM('approved', 'rejected') NOT NULL,
                comments TEXT,
                approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                INDEX idx_series (series_id),
                INDEX idx_approver (approver_name)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 7. Investors table
            """
            CREATE TABLE IF NOT EXISTS investors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investor_id VARCHAR(50) UNIQUE NOT NULL,
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(20),
                pan_number VARCHAR(20),
                aadhar_number VARCHAR(20),
                address TEXT,
                city VARCHAR(100),
                state VARCHAR(100),
                pincode VARCHAR(10),
                bank_name VARCHAR(255),
                account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                account_holder_name VARCHAR(255),
                kyc_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                status ENUM('active', 'inactive', 'deleted') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                INDEX idx_investor_id (investor_id),
                INDEX idx_email (email),
                INDEX idx_phone (phone),
                INDEX idx_kyc_status (kyc_status),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 8. Investments table
            """
            CREATE TABLE IF NOT EXISTS investments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investor_id INT NOT NULL,
                series_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                units INT NOT NULL,
                investment_date DATE NOT NULL,
                date_transferred DATE,
                date_received DATE,
                status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
                payment_mode VARCHAR(50),
                transaction_reference VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                INDEX idx_investor (investor_id),
                INDEX idx_series (series_id),
                INDEX idx_status (status),
                INDEX idx_investment_date (investment_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 9. Investor Documents table
            """
            CREATE TABLE IF NOT EXISTS investor_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investor_id INT NOT NULL,
                document_type ENUM('pan_card', 'aadhar_card', 'bank_proof', 'photo', 'signature', 'other') NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uploaded_by VARCHAR(255),
                FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
                INDEX idx_investor (investor_id),
                INDEX idx_type (document_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 10. Investor Series table (for series-specific documents)
            """
            CREATE TABLE IF NOT EXISTS investor_series (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investor_id INT NOT NULL,
                series_id INT NOT NULL,
                status ENUM('active', 'exited', 'matured') DEFAULT 'active',
                exit_date DATE NULL,
                exit_amount DECIMAL(15,2) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                UNIQUE KEY unique_investor_series (investor_id, series_id),
                INDEX idx_investor (investor_id),
                INDEX idx_series (series_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 11. Interest Payouts table
            """
            CREATE TABLE IF NOT EXISTS interest_payouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investor_id INT NOT NULL,
                series_id INT NOT NULL,
                investment_id INT NOT NULL,
                payout_date DATE NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                payment_reference VARCHAR(255),
                remarks TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                processed_by VARCHAR(255),
                processed_at TIMESTAMP NULL,
                FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                FOREIGN KEY (investment_id) REFERENCES investments(id) ON DELETE CASCADE,
                INDEX idx_investor (investor_id),
                INDEX idx_series (series_id),
                INDEX idx_status (status),
                INDEX idx_payout_date (payout_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 12. Compliance Master Items table
            """
            CREATE TABLE IF NOT EXISTS compliance_master_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                item_name VARCHAR(255) NOT NULL,
                description TEXT,
                frequency ENUM('Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'One-Time') NOT NULL,
                category VARCHAR(100),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_frequency (frequency),
                INDEX idx_category (category)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 13. Series Compliance Status table
            """
            CREATE TABLE IF NOT EXISTS series_compliance_status (
                id INT AUTO_INCREMENT PRIMARY KEY,
                series_id INT NOT NULL,
                compliance_item_id INT NOT NULL,
                due_date DATE NOT NULL,
                status ENUM('pending', 'completed', 'overdue') DEFAULT 'pending',
                completed_date DATE NULL,
                remarks TEXT,
                completed_by VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                FOREIGN KEY (compliance_item_id) REFERENCES compliance_master_items(id) ON DELETE CASCADE,
                INDEX idx_series (series_id),
                INDEX idx_status (status),
                INDEX idx_due_date (due_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 14. Compliance Documents table
            """
            CREATE TABLE IF NOT EXISTS compliance_documents (
                id INT AUTO_INCREMENT PRIMARY KEY,
                series_id INT NOT NULL,
                compliance_status_id INT NOT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                file_size BIGINT,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uploaded_by VARCHAR(255),
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE CASCADE,
                FOREIGN KEY (compliance_status_id) REFERENCES series_compliance_status(id) ON DELETE CASCADE,
                INDEX idx_series (series_id),
                INDEX idx_compliance (compliance_status_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 15. Grievances table
            """
            CREATE TABLE IF NOT EXISTS grievances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                grievance_type ENUM('investor', 'internal', 'regulatory') NOT NULL,
                investor_id INT NULL,
                series_id INT NULL,
                category VARCHAR(100),
                priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
                subject VARCHAR(500) NOT NULL,
                description TEXT NOT NULL,
                status ENUM('open', 'in_progress', 'resolved', 'closed') DEFAULT 'open',
                resolution TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(255),
                assigned_to VARCHAR(255),
                resolved_at TIMESTAMP NULL,
                resolved_by VARCHAR(255),
                FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE SET NULL,
                FOREIGN KEY (series_id) REFERENCES ncd_series(id) ON DELETE SET NULL,
                INDEX idx_type (grievance_type),
                INDEX idx_status (status),
                INDEX idx_priority (priority),
                INDEX idx_investor (investor_id),
                INDEX idx_series (series_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 16. Communication History table
            """
            CREATE TABLE IF NOT EXISTS communication_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                type ENUM('SMS', 'Email') NOT NULL,
                recipient_name VARCHAR(255) NOT NULL,
                recipient_contact VARCHAR(255) NOT NULL,
                investor_id VARCHAR(50) NULL,
                series_name VARCHAR(255) NULL,
                subject VARCHAR(500) NULL,
                message TEXT NOT NULL,
                status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
                error_message TEXT NULL,
                message_id VARCHAR(255) NULL,
                sent_by VARCHAR(255) NOT NULL,
                sent_by_role VARCHAR(50) NOT NULL,
                sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_type (type),
                INDEX idx_status (status),
                INDEX idx_investor (investor_id),
                INDEX idx_sent_at (sent_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 17. Communication Templates table
            """
            CREATE TABLE IF NOT EXISTS communication_templates (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('SMS', 'Email') NOT NULL,
                subject VARCHAR(500) NULL COMMENT 'For emails only',
                content TEXT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_by VARCHAR(255) NULL,
                INDEX idx_type (type),
                INDEX idx_active (is_active)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """,
            
            # 18. Report Logs table
            """
            CREATE TABLE IF NOT EXISTS report_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                report_type VARCHAR(100) NOT NULL,
                report_name VARCHAR(255) NOT NULL,
                generated_by VARCHAR(255) NOT NULL,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                parameters JSON,
                file_path VARCHAR(500),
                status ENUM('success', 'failed') DEFAULT 'success',
                error_message TEXT,
                INDEX idx_type (report_type),
                INDEX idx_generated_by (generated_by),
                INDEX idx_generated_at (generated_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """
        ]
        
        # Execute each table creation query
        for i, table_query in enumerate(tables, 1):
            try:
                db.execute_query(table_query)
                logger.info(f"✅ Table {i}/{len(tables)} created/verified")
            except Exception as e:
                logger.error(f"❌ Error creating table {i}: {e}")
                raise
        
        logger.info("✅ All database tables initialized successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def insert_default_data():
    """
    Insert default data (admin user, default templates, etc.)
    """
    try:
        db = get_db()
        logger.info("🔧 Inserting default data...")
        
        # Check if admin user exists
        check_admin = "SELECT COUNT(*) as count FROM users WHERE username = 'admin'"
        result = db.execute_query(check_admin)
        
        if result[0]['count'] == 0:
            # Create default admin user (password: admin123)
            # Hash: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqPQKqHu
            insert_admin = """
            INSERT INTO users (username, full_name, email, hashed_password, role, is_active)
            VALUES ('admin', 'System Administrator', 'admin@ncd.com', 
                    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7qXqPQKqHu', 
                    'super_admin', TRUE)
            """
            db.execute_query(insert_admin)
            logger.info("✅ Default admin user created (username: admin, password: admin123)")
        
        # Insert default communication templates
        check_templates = "SELECT COUNT(*) as count FROM communication_templates"
        result = db.execute_query(check_templates)
        
        if result[0]['count'] == 0:
            templates = [
                ("Interest Payment Notification", "SMS", None, 
                 "Dear {InvestorName}, your interest of {Amount} for {SeriesName} has been processed to account {BankAccountNumber}. - VVPL"),
                ("Payment Confirmation", "SMS", None,
                 "Dear {InvestorName}, payment of {Amount} for {SeriesName} confirmed. Investor ID: {InvestorID}. Thank you - VVPL"),
                ("General Update", "SMS", None,
                 "Dear {InvestorName}, important update regarding {SeriesName}. Please contact us for details. - VVPL"),
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
            
            logger.info("✅ Default communication templates created")
        
        logger.info("✅ Default data inserted successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to insert default data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False
