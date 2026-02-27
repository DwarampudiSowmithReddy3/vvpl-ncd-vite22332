-- ============================================
-- SIMPLIFIED COMMUNICATION SYSTEM TABLES
-- All logic in backend, frontend is just UI
-- ============================================

-- Table 1: Communication Templates
-- Stores predefined message templates
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 2: Communication Variables
-- Stores available variables for message personalization
CREATE TABLE IF NOT EXISTS communication_variables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    variable_name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    example_value VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table 3: Communication History (ALREADY EXISTS - just documenting)
-- Stores all sent communications
-- CREATE TABLE IF NOT EXISTS communication_history (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     type ENUM('SMS', 'Email') NOT NULL,
--     recipient_name VARCHAR(255) NOT NULL,
--     recipient_contact VARCHAR(255) NOT NULL,
--     investor_id VARCHAR(50) NULL,
--     series_name VARCHAR(255) NULL,
--     subject VARCHAR(500) NULL,
--     message TEXT NOT NULL,
--     status ENUM('Success', 'Failed', 'Pending') DEFAULT 'Pending',
--     error_message TEXT NULL,
--     message_id VARCHAR(255) NULL,
--     sent_by VARCHAR(255) NOT NULL,
--     sent_by_role VARCHAR(50) NOT NULL,
--     sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     INDEX idx_type (type),
--     INDEX idx_status (status),
--     INDEX idx_investor (investor_id),
--     INDEX idx_sent_at (sent_at)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERT DEFAULT TEMPLATES
-- ============================================

-- SMS Templates
INSERT INTO communication_templates (name, type, subject, content, created_by) VALUES
('Interest Payment Notification', 'SMS', NULL, 
'Dear {InvestorName}, your interest of {Amount} for {SeriesName} has been processed to account {BankAccountNumber}. - VVPL', 
'System'),

('Payment Confirmation', 'SMS', NULL,
'Dear {InvestorName}, payment of {Amount} for {SeriesName} confirmed. Investor ID: {InvestorID}. Thank you - VVPL',
'System'),

('General Update', 'SMS', NULL,
'Dear {InvestorName}, important update regarding {SeriesName}. Please contact us for details. - VVPL',
'System');

-- Email Templates
INSERT INTO communication_templates (name, type, subject, content, created_by) VALUES
('Interest Payment Notification', 'Email', 'Interest Payment Processed - {SeriesName}',
'Dear {InvestorName},

We are pleased to inform you that your interest payment of {Amount} for {SeriesName} has been successfully processed.

Investor ID: {InvestorID}
Bank Account: {BankAccountNumber}
Series: {SeriesName}

The amount has been credited to your registered bank account.

Thank you for investing with us.

Best regards,
Vaibhav Vyapaar Private Limited',
'System'),

('Payment Confirmation', 'Email', 'Payment Confirmation - {SeriesName}',
'Dear {InvestorName},

This is to confirm that we have received your payment of {Amount} for {SeriesName}.

Investor ID: {InvestorID}
Series: {SeriesName}
Amount: {Amount}

Your investment has been recorded successfully.

Thank you for your trust in us.

Best regards,
Vaibhav Vyapaar Private Limited',
'System'),

('General Update', 'Email', 'Important Update - {SeriesName}',
'Dear {InvestorName},

We have an important update regarding your investment in {SeriesName}.

Investor ID: {InvestorID}

Please contact us at your earliest convenience for more details.

Best regards,
Vaibhav Vyapaar Private Limited',
'System');

-- ============================================
-- INSERT DEFAULT VARIABLES
-- ============================================

INSERT INTO communication_variables (variable_name, display_name, description, example_value) VALUES
('{InvestorName}', 'Investor Name', 'Full name of the investor', 'Rajesh Kumar'),
('{InvestorID}', 'Investor ID', 'Unique investor identification number', 'INV001'),
('{SeriesName}', 'Series Name', 'Name of the NCD series', 'Series A - 2024'),
('{Amount}', 'Amount', 'Payment or investment amount', '₹10,000'),
('{BankAccountNumber}', 'Bank Account Number', 'Investor bank account number', 'XXXX1234'),
('{InterestMonth}', 'Interest Month', 'Month for which interest is paid', 'January 2024'),
('{Status}', 'Status', 'Payment or transaction status', 'has been');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check templates
-- SELECT * FROM communication_templates WHERE is_active = TRUE;

-- Check variables
-- SELECT * FROM communication_variables WHERE is_active = TRUE;

-- Check communication history
-- SELECT * FROM communication_history ORDER BY sent_at DESC LIMIT 10;
