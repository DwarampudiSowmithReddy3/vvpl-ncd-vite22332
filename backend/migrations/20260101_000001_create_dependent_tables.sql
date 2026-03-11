-- Create tables with foreign key dependencies
-- These tables reference other tables created in the previous migration

-- ============================================================================
-- Table: series_documents (references ncd_series)
-- ============================================================================

CREATE TABLE `series_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `document_type` enum('term_sheet','offer_document','board_resolution') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `s3_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3_bucket` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `s3_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'application/pdf',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_series_document` (`series_id`,`document_type`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_document_type` (`document_type`),
  CONSTRAINT `series_documents_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: compliance_documents (references ncd_series)
-- ============================================================================

CREATE TABLE `compliance_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `document_title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `s3_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3_bucket` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `s3_key` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_series_category` (`series_id`),
  KEY `idx_uploaded_at` (`uploaded_at`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `compliance_documents_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: investor_documents (references investors)
-- ============================================================================

CREATE TABLE `investor_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investor_id` int NOT NULL,
  `document_type` enum('pan_document','aadhaar_document','cancelled_cheque','form_15g_15h','digital_signature') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` int DEFAULT NULL,
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `s3_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `s3_bucket` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'S3 bucket name',
  `content_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'application/pdf' COMMENT 'MIME type of document',
  PRIMARY KEY (`id`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_document_type` (`document_type`),
  CONSTRAINT `investor_documents_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: investments (references investors and ncd_series)
-- ============================================================================

CREATE TABLE `investments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investor_id` int NOT NULL,
  `series_id` int NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `date_transferred` date NOT NULL,
  `date_received` date NOT NULL,
  `payment_document_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('pending','confirmed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'confirmed',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `exit_date` date DEFAULT NULL COMMENT 'Date when investor exited/withdrew from series',
  `payment_document_url` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'S3 signed URL for payment document',
  `payment_document_bucket` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'S3 bucket name for payment document',
  PRIMARY KEY (`id`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `investments_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `investments_ibfk_2` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: investor_series (references investors and ncd_series)
-- ============================================================================

CREATE TABLE `investor_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investor_id` int NOT NULL,
  `series_id` int NOT NULL,
  `total_invested` decimal(15,2) DEFAULT '0.00',
  `investment_count` int DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `first_investment_date` datetime DEFAULT NULL,
  `last_investment_date` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_investor_series` (`investor_id`,`series_id`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_series_id` (`series_id`),
  CONSTRAINT `investor_series_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `investor_series_ibfk_2` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: investor_investment_documents (references investments, investors, ncd_series)
-- ============================================================================

CREATE TABLE `investor_investment_documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investment_id` int NOT NULL,
  `investor_id` int NOT NULL,
  `series_id` int NOT NULL,
  `document_type` varchar(50) NOT NULL DEFAULT 'payment_document',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL COMMENT 'S3 key without credentials',
  `s3_bucket` varchar(255) DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `content_type` varchar(100) DEFAULT 'application/pdf',
  `uploaded_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_investment_id` (`investment_id`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_series_id` (`series_id`),
  CONSTRAINT `investor_investment_documents_ibfk_1` FOREIGN KEY (`investment_id`) REFERENCES `investments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `investor_investment_documents_ibfk_2` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `investor_investment_documents_ibfk_3` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Payment documents for investor investments';


-- ============================================================================
-- Table: interest_payouts (references investors and ncd_series)
-- ============================================================================

CREATE TABLE `interest_payouts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investor_id` int NOT NULL,
  `series_id` int NOT NULL,
  `payout_month` varchar(50) NOT NULL COMMENT 'e.g., February 2026',
  `payout_date` varchar(20) NOT NULL COMMENT 'e.g., 15-Feb-2026',
  `amount` decimal(15,2) NOT NULL COMMENT 'Interest amount in rupees',
  `status` enum('Paid','Pending','Scheduled') DEFAULT 'Scheduled',
  `paid_date` date DEFAULT NULL COMMENT 'Actual date when payment was made',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_payout` (`investor_id`,`series_id`,`payout_month`),
  KEY `idx_investor` (`investor_id`),
  KEY `idx_series` (`series_id`),
  KEY `idx_status` (`status`),
  KEY `idx_payout_month` (`payout_month`),
  CONSTRAINT `interest_payouts_ibfk_1` FOREIGN KEY (`investor_id`) REFERENCES `investors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `interest_payouts_ibfk_2` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Interest payout records for investors';


-- ============================================================================
-- Table: series_compliance_status (references ncd_series and compliance_master_items)
-- ============================================================================

CREATE TABLE `series_compliance_status` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `master_item_id` int NOT NULL,
  `section` enum('pre','post','recurring') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `month` int DEFAULT NULL,
  `status` enum('pending','received','submitted','not-applicable') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT NULL,
  `submitted_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_series_item_month` (`series_id`,`master_item_id`,`year`,`month`),
  UNIQUE KEY `unique_series_item_period` (`series_id`,`master_item_id`,`year`,`month`),
  KEY `master_item_id` (`master_item_id`),
  KEY `idx_series_year_month` (`series_id`,`year`,`month`),
  KEY `idx_series_status` (`series_id`,`status`),
  KEY `idx_period` (`year`,`month`),
  CONSTRAINT `series_compliance_status_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `series_compliance_status_ibfk_2` FOREIGN KEY (`master_item_id`) REFERENCES `compliance_master_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Compliance status per series per month - like role_permissions pattern';


-- ============================================================================
-- Table: series_approvals (references ncd_series and users)
-- ============================================================================

CREATE TABLE `series_approvals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `series_id` int NOT NULL,
  `action_type` enum('APPROVED','REJECTED','EDITED') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `approval_notes` text COLLATE utf8mb4_unicode_ci,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `changes_made` json DEFAULT NULL,
  `previous_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_action_timestamp` (`action_timestamp`),
  KEY `idx_series_action` (`series_id`,`action_timestamp`),
  CONSTRAINT `series_approvals_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `ncd_series` (`id`) ON DELETE CASCADE,
  CONSTRAINT `series_approvals_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Add foreign keys to ncd_series (references users)
-- ============================================================================

ALTER TABLE `ncd_series`
ADD CONSTRAINT `fk_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_last_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;


-- ============================================================================
-- Add foreign key to report_logs (references users)
-- ============================================================================

ALTER TABLE `report_logs`
ADD CONSTRAINT `report_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
