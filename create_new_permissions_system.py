#!/usr/bin/env python3
"""
NEW PERMISSIONS SYSTEM - COMPLETE FROM SCRATCH
This creates a brand new permissions system without disturbing existing functionality
"""

import mysql.connector
from datetime import datetime
import json
import hashlib

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'sowmith',
    'database': 'ncd_management'
}

def get_connection():
    """Get database connection"""
    return mysql.connector.connect(**DB_CONFIG)

def create_new_permissions_tables():
    """Create new permissions system tables"""
    conn = get_connection()
    cursor = conn.cursor()
    
    print("🔧 Creating new permissions system tables...")
    
    # 1. Create new_roles table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(100) NOT NULL UNIQUE,
            role_display_name VARCHAR(100) NOT NULL,
            role_description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(100),
            INDEX idx_role_name (role_name),
            INDEX idx_active (is_active)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_roles table")
    
    # 2. Create new_modules table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_modules (
            id INT AUTO_INCREMENT PRIMARY KEY,
            module_name VARCHAR(100) NOT NULL UNIQUE,
            module_display_name VARCHAR(100) NOT NULL,
            module_description TEXT,
            module_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_module_name (module_name),
            INDEX idx_active (is_active),
            INDEX idx_order (module_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_modules table")
    
    # 3. Create new_actions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            action_name VARCHAR(50) NOT NULL UNIQUE,
            action_display_name VARCHAR(50) NOT NULL,
            action_description TEXT,
            action_order INT DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_action_name (action_name),
            INDEX idx_active (is_active),
            INDEX idx_order (action_order)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_actions table")
    
    # 4. Create new_permissions table (main permissions table)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_permissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_id INT NOT NULL,
            module_id INT NOT NULL,
            action_id INT NOT NULL,
            is_allowed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by VARCHAR(100),
            updated_by VARCHAR(100),
            FOREIGN KEY (role_id) REFERENCES new_roles(id) ON DELETE CASCADE,
            FOREIGN KEY (module_id) REFERENCES new_modules(id) ON DELETE CASCADE,
            FOREIGN KEY (action_id) REFERENCES new_actions(id) ON DELETE CASCADE,
            UNIQUE KEY unique_permission (role_id, module_id, action_id),
            INDEX idx_role_module (role_id, module_id),
            INDEX idx_allowed (is_allowed)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_permissions table")
    
    # 5. Create new_permission_audit table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_permission_audit (
            id INT AUTO_INCREMENT PRIMARY KEY,
            role_name VARCHAR(100) NOT NULL,
            module_name VARCHAR(100) NOT NULL,
            action_name VARCHAR(50) NOT NULL,
            old_value BOOLEAN,
            new_value BOOLEAN NOT NULL,
            changed_by VARCHAR(100) NOT NULL,
            changed_by_role VARCHAR(100),
            change_reason TEXT,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_role_module (role_name, module_name),
            INDEX idx_changed_by (changed_by),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_permission_audit table")
    
    # 6. Create new_permission_cache table (for performance)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS new_permission_cache (
            id INT AUTO_INCREMENT PRIMARY KEY,
            cache_key VARCHAR(255) NOT NULL UNIQUE,
            cache_data JSON NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_cache_key (cache_key),
            INDEX idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    """)
    print("✅ Created new_permission_cache table")
    
    conn.commit()
    cursor.close()
    conn.close()
    print("🎉 All new permissions tables created successfully!")

d