-- ============================================
-- CREATE COMMUNICATION TEMPLATES TABLE
-- Run this SQL script in your MySQL database
-- ============================================

USE ncd_management;

-- Create communication_templates table
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

-- Create communication_variables table
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

-- ============================================
-- INSERT DEFAULT SMS TEMPLATES
-- ============================================

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

-- ============================================
-- INSERT DEFAULT EMAIL TEMPLATES
-- ============================================

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

-- Check SMS templates
SELECT * FROM communication_templates WHERE type = 'SMS' AND is_active = TRUE;

-- Check Email templates
SELECT * FROM communication_templates WHERE type = 'Email' AND is_active = TRUE;

-- Check variables
SELECT * FROM communication_variables WHERE is_active = TRUE;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT 'Communication templates and variables created successfully!' AS Status;
