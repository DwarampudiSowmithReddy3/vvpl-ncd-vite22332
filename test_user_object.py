#!/usr/bin/env python3
"""
Test user object retrieval
"""
import sys
import os

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.auth import AdminUser
from app.core.config import settings

def test_user_object():
    """Test user object retrieval"""
    
    try:
        # Create database connection
        DATABASE_URL = f"mysql+pymysql://{settings.MYSQL_USER}:{settings.MYSQL_PASSWORD}@{settings.MYSQL_HOST}:{settings.MYSQL_PORT}/{settings.MYSQL_DATABASE}"
        
        engine = create_engine(DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        db = SessionLocal()
        
        print("✅ Connected to database")
        
        # Get the admin user (ID 1)
        user = db.query(AdminUser).filter(AdminUser.id == 1).first()
        
        if user:
            print(f"✅ Found user: {user.username}")
            print(f"📋 User attributes:")
            print(f"  - ID: {user.id}")
            print(f"  - Username: {user.username}")
            print(f"  - Email: {user.email}")
            print(f"  - Full Name: {user.full_name}")
            
            # Check if role attribute exists
            if hasattr(user, 'role'):
                print(f"  - Role: {user.role}")
                print(f"  - Role type: {type(user.role)}")
            else:
                print("  - ❌ No 'role' attribute found!")
                
            # Check all attributes
            print(f"\n📋 All user attributes:")
            for attr in dir(user):
                if not attr.startswith('_'):
                    try:
                        value = getattr(user, attr)
                        if not callable(value):
                            print(f"  - {attr}: {value} ({type(value)})")
                    except Exception as e:
                        print(f"  - {attr}: Error accessing - {e}")
                        
        else:
            print("❌ User not found")
            
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_object()