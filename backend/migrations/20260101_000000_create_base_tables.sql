-- Create base tables (no foreign keys)
-- These tables have no dependencies on other tables

-- ============================================================================
-- Table: users (no foreign keys)
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


-- ============================================================================
-- Table: ncd_series (no foreign keys initially)
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
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: investors (no foreign keys)
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
  KEY `idx_investor_id` (`investor_id`),
  KEY `idx_email` (`email`),
  KEY `idx_kyc_status` (`kyc_status`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: audit_logs (no foreign keys)
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
-- Table: communication_templates (no foreign keys)
-- ============================================================================

CREATE TABLE `communication_templates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Communication type: SMS, Email, TXN, etc.',
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
-- Table: communication_history (no foreign keys)
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
-- Table: compliance_master_items (no foreign keys)
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
-- Table: role_permissions (no foreign keys)
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
-- Table: report_logs (no foreign keys initially)
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
  KEY `idx_report_date` (`report_name`,`generated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- Table: grievances (no foreign keys initially)
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
