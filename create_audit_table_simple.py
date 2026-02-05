#!/usr/bin/env python3
"""
Create audit_logs table using SQLAlchemy (same as backend)
"""
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

try:
    from app.core.database import engine, Base
    from app.models.audit import AuditLog
    from app.models.auth import AdminUser
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy import text
    
    def create_audit_table():
        """Create audit_logs table and add test data"""
        
        print("🔧 Creating audit_logs table using SQLAlchemy...")
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully")
        
        # Create session
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            # Check if admin user exists
            admin_user = db.query(AdminUser).filter(AdminUser.username == "admin").first()
            if not admin_user:
                print("❌ Admin user not found - cannot create test audit logs")
                return
            
            print(f"✅ Found admin user: {admin_user.username} (ID: {admin_user.id})")
            
            # Check current audit logs
            current_logs = db.query(AuditLog).count()
            print(f"📊 Current audit logs in database: {current_logs}")
            
            # Add some test audit logs
            test_logs = [
                {
                    "user_id": admin_user.id,
                    "action": "System Startup",
                    "resource_type": "System",
                    "resource_id": "system",
                    "description": "System started and audit logging initialized"
                },
                {
                    "user_id": admin_user.id,
                    "action": "Login",
                    "resource_type": "Authentication",
                    "resource_id": admin_user.username,
                    "description": f"User {admin_user.username} logged into the system"
                },
                {
                    "user_id": admin_user.id,
                    "action": "View Users",
                    "resource_type": "User Management",
                    "resource_id": "all_users",
                    "description": "Accessed user management page"
                }
            ]
            
            created_count = 0
            for log_data in test_logs:
                # Check if similar log already exists
                existing = db.query(AuditLog).filter(
                    AuditLog.action == log_data["action"],
                    AuditLog.resource_type == log_data["resource_type"]
                ).first()
                
                if not existing:
                    new_log = AuditLog(**log_data)
                    db.add(new_log)
                    created_count += 1
                    print(f"✅ Created: {log_data['action']}")
                else:
                    print(f"⏭️ Skipped: {log_data['action']} (already exists)")
            
            if created_count > 0:
                db.commit()
                print(f"✅ Committed {created_count} new audit logs")
            
            # Verify final count
            final_count = db.query(AuditLog).count()
            print(f"📊 Total audit logs now: {final_count}")
            
            # Show sample logs
            if final_count > 0:
                print("\n📋 Sample audit logs:")
                sample_logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(3).all()
                for i, log in enumerate(sample_logs, 1):
                    print(f"  {i}. {log.action} - {log.resource_type} - {log.timestamp}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            db.rollback()
            import traceback
            traceback.print_exc()
        finally:
            db.close()
    
    if __name__ == "__main__":
        print("🚀 Audit Table Creation")
        print("=" * 30)
        create_audit_table()
        print("\n✅ Done!")
        
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("💡 Make sure the backend dependencies are installed")
    print("💡 Run: pip install -r backend/requirements.txt")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()