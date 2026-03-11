-- Complete Database Schema
-- Generated on: 2026-03-10 15:50:37
-- Total Tables: 19
--
-- This file shows the complete structure of the NCD Management database
-- for easy review by the technical team.

-- Initial database schema
-- This file contains all existing tables from the original database
-- Generated automatically from existing database structure


-- ============================================================================
-- Table: audit_logs
-- ============================================================================

CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `entity_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `entity_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `changes` json DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `idx_timestamp` (`timestamp`),
  KEY `idx_admin_name` (`admin_name`),
  KEY `idx_entity_type` (`entity_type`)
) ENGINE=InnoDB AUTO_INCREMENT=5572 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: communication_history
-- ============================================================================

CREATE TABLE `communication_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('SMS','Email') COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_contact` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `investor_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `series_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('Success','Failed','Pending') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_by_role` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_series_name` (`series_name`),
  KEY `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: communication_templates
-- ============================================================================

CREATE TABLE `communication_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('SMS','Email') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'For emails only',
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `template_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'DLT Template ID from Kaleyra',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: compliance_documents
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
-- Table: compliance_master_items
-- ============================================================================

CREATE TABLE `compliance_master_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section` enum('pre','post','recurring') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `legal_reference` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT 'Internal Protocol',
  `frequency` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_section` (`section`),
  KEY `idx_display_order` (`display_order`),
  KEY `idx_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master template of 42 compliance items - shared across all series';


-- ============================================================================
-- Table: grievances
-- ============================================================================

CREATE TABLE `grievances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grievance_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grievance_type` enum('investor','trustee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `investor_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trustee_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `investor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `series_id` int DEFAULT NULL,
  `series_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `priority` enum('low','medium','high','critical') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('pending','in-progress','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `resolution_comment` text COLLATE utf8mb4_unicode_ci,
  `resolved_at` datetime DEFAULT NULL,
  `resolved_by` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by_role` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `grievance_id` (`grievance_id`),
  KEY `idx_grievance_type` (`grievance_type`),
  KEY `idx_status` (`status`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_series_id` (`series_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_priority` (`priority`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: interest_payouts
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
-- Table: investments
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
-- Table: investor_documents
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
-- Table: investor_investment_documents
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
-- Table: investor_series
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
-- Table: investors
-- ============================================================================

CREATE TABLE `investors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `investor_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dob` date NOT NULL,
  `residential_address` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `correspondence_address` text COLLATE utf8mb4_unicode_ci,
  `pan` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ifsc_code` varchar(11) COLLATE utf8mb4_unicode_ci NOT NULL,
  `occupation` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kyc_status` enum('Pending','Completed','Rejected') COLLATE utf8mb4_unicode_ci DEFAULT 'Pending',
  `source_of_funds` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `nominee_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nominee_relationship` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nominee_mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nominee_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nominee_address` text COLLATE utf8mb4_unicode_ci,
  `total_investment` decimal(15,2) DEFAULT '0.00',
  `date_joined` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','deleted') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `investor_id` (`investor_id`),
  UNIQUE KEY `unique_email` (`email`),
  UNIQUE KEY `unique_phone` (`phone`),
  UNIQUE KEY `unique_pan` (`pan`),
  UNIQUE KEY `unique_aadhaar` (`aadhaar`),
  UNIQUE KEY `unique_account_number` (`account_number`),
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_kyc_status` (`kyc_status`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: ncd_series
-- ============================================================================

CREATE TABLE `ncd_series` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `series_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `security_type` enum('Secured','Unsecured') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('DRAFT','REJECTED','upcoming','accepting','active','matured') COLLATE utf8mb4_unicode_ci DEFAULT 'DRAFT',
  `debenture_trustee_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `investors_size` bigint NOT NULL,
  `issue_date` date NOT NULL,
  `tenure` bigint NOT NULL,
  `maturity_date` date NOT NULL,
  `lock_in_date` date DEFAULT NULL,
  `subscription_start_date` date NOT NULL,
  `subscription_end_date` date NOT NULL,
  `release_date` date NOT NULL,
  `series_start_date` date DEFAULT NULL,
  `min_subscription_percentage` decimal(20,2) NOT NULL,
  `face_value` decimal(20,2) NOT NULL,
  `min_investment` decimal(20,2) NOT NULL,
  `target_amount` decimal(20,2) NOT NULL,
  `total_issue_size` bigint NOT NULL,
  `interest_rate` decimal(20,2) NOT NULL,
  `credit_rating` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `interest_frequency` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `approved_at` datetime DEFAULT NULL,
  `approved_by` int DEFAULT NULL,
  `approval_notes` text COLLATE utf8mb4_unicode_ci,
  `rejected_at` datetime DEFAULT NULL,
  `rejected_by` int DEFAULT NULL,
  `rejection_reason` text COLLATE utf8mb4_unicode_ci,
  `last_modified_by` int DEFAULT NULL,
  `last_modified_at` datetime DEFAULT NULL,
  `interest_payment_day` int DEFAULT '15' COMMENT 'Day of month when interest is paid (1-31)',
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `series_code` (`series_code`),
  KEY `idx_status` (`status`),
  KEY `idx_series_code` (`series_code`),
  KEY `idx_dates` (`issue_date`,`maturity_date`,`subscription_start_date`,`subscription_end_date`,`release_date`),
  KEY `idx_is_active` (`is_active`),
  KEY `fk_approved_by` (`approved_by`),
  KEY `fk_rejected_by` (`rejected_by`),
  KEY `fk_last_modified_by` (`last_modified_by`),
  CONSTRAINT `fk_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_last_modified_by` FOREIGN KEY (`last_modified_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: report_logs
-- ============================================================================

CREATE TABLE `report_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_type` enum('PDF','Excel','CSV') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_filters` json DEFAULT NULL,
  `record_count` int DEFAULT '0',
  `file_size_kb` decimal(10,2) DEFAULT NULL,
  `generation_time_ms` int DEFAULT NULL,
  `status` enum('success','failed','in_progress') COLLATE utf8mb4_unicode_ci DEFAULT 'success',
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_report_name` (`report_name`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_generated_at` (`generated_at`),
  KEY `idx_status` (`status`),
  KEY `idx_report_type` (`report_type`),
  KEY `idx_user_date` (`user_id`,`generated_at`),
  KEY `idx_report_date` (`report_name`,`generated_at`),
  CONSTRAINT `report_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: role_permissions
-- ============================================================================

CREATE TABLE `role_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissions` json NOT NULL,
  `updated_by` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role` (`role`),
  KEY `idx_role` (`role`),
  KEY `idx_updated_at` (`updated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: series_approvals
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
-- Table: series_compliance_status
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
-- Table: series_documents
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
-- Table: users
-- ============================================================================

CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `full_name` (`full_name`),
  UNIQUE KEY `phone` (`phone`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

