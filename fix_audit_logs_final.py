#!/usr/bin/env python3
"""
Final fix for audit logs - clean up and create proper table
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.core.database import engine
    from sqlalchemy import text
    from sqlalchemy.orm import sessionmaker
    
    def fix_audit_logs_final():
        """Clean up and create proper audit_logs table"""
        
        print("🔧 Final Audit Logs Fix")
        print("=" * 30)
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # 1. Check what audit tables exist
            print("1. Checking existing audit tables...")
            result = db.execute(text("SHOW TABLES LIKE '%audit%'"))
            tables = [row[0] for row in result.fetchall()]
            print(f"   Found tables: {tables}")
            
            # 2. Drop all audit tables to start clean
            print("2. Cleaning up existing audit tables...")
            for table in tables:
                print(f"   Dropping {table}...")
                db.execute(text(f"DROP TABLE IF EXISTS {table}"))
            
            # 3. Create the correct audit_logs table
            print("3. Creating proper audit_logs table...")
            create_sql = text("""
                CREATE TABLE audit_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    user_type VARCHAR(20) DEFAULT 'admin',
                    action VARCHAR(200) NOT NULL,
                    resource_type VARCHAR(200) NOT NULL,
                    resource_id VARCHAR(200),
                    description TEXT,
                    old_values TEXT,
                    new_values TEXT,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_user_id (user_id),
                    INDEX idx_timestamp (timestamp),
                    INDEX idx_action (action),
                    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
                )
            """)
            
            db.execute(create_sql)
            db.commit()
            print("   ✅ Created audit_logs table")
            
            # 4. Verify table structure
            print("4. Verifying table structure...")
            result = db.execute(text("DESCRIBE audit_logs"))
            columns = result.fetchall()
            print("   Columns:")
            for col in columns:
                print(f"     {col[0]} - {col[1]}")
            
            # 5. Add some test data
            print("5. Adding test audit logs...")
            
            # Get admin user ID
            result = db.execute(text("SELECT id FROM admin_users WHERE username = 'admin' LIMIT 1"))
            admin_user = result.fetchone()
            
            if admin_user:
                admin_id = admin_user[0]
                print(f"   Found admin user ID: {admin_id}")
                
                # Insert test logs
                test_logs = [
                    (admin_id, 'System Startup', 'System', 'system', 'Audit logging system initialized'),
                    (admin_id, 'User Login', 'Authentication', 'admin', 'Administrator logged into the system'),
                    (admin_id, 'View Dashboard', 'Dashboard', 'main', 'Accessed main dashboard')
                ]
                
                for user_id, action, resource_type, resource_id, description in test_logs:
                    db.execute(text("""
                        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, description)
                        VALUES (:user_id, :action, :resource_type, :resource_id, :description)
                    """), {
                        'user_id': user_id,
                        'action': action,
                        'resource_type': resource_type,
                        'resource_id': resource_id,
                        'description': description
                    })
                
                db.commit()
                print("   ✅ Added test audit logs")
                
                # Verify data
                result = db.execute(text("SELECT COUNT(*) FROM audit_logs"))
                count = result.fetchone()[0]
                print(f"   📊 Total audit logs: {count}")
                
                # Show sample data
                result = db.execute(text("""
                    SELECT id, action, resource_type, description, timestamp 
                    FROM audit_logs 
                    ORDER BY timestamp DESC 
                    LIMIT 3
                """))
                samples = result.fetchall()
                print("   📋 Sample logs:")
                for sample in samples:
                    print(f"     {sample[0]}: {sample[1]} - {sample[2]} - {sample[4]}")
            else:
                print("   ⚠️ Admin user not found - skipping test data")
            
            print("\n✅ Audit logs system fixed successfully!")
            print("💡 Now restart the backend server to pick up the changes")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.rollback()
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    
    if __name__ == "__main__":
        fix_audit_logs_final()
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure you're in the correct directory")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()