#!/usr/bin/env python3
"""
Test permissions service directly
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.core.database import get_db
from app.services.permissions import PermissionService

def test_permissions_service():
    """Test permissions service directly"""
    
    try:
        # Get database session
        db = next(get_db())
        
        # Create permission service
        permission_service = PermissionService(db)
        
        # Test getting permissions structure
        print("🔄 Testing permissions service...")
        result = permission_service.get_permissions_structure()
        
        print(f"✅ Got permissions structure:")
        print(f"   Roles: {len(result.get('roles', []))}")
        print(f"   Modules: {len(result.get('modules', []))}")
        print(f"   Permissions: {len(result.get('permissions', {}))}")
        
        if result.get('permissions'):
            print(f"   Available roles: {list(result['permissions'].keys())}")
        
        # If no permissions, initialize default data
        if not result.get('permissions'):
            print("🔄 No permissions found, initializing default data...")
            permission_service.initialize_default_data()
            result = permission_service.get_permissions_structure()
            print(f"✅ After initialization:")
            print(f"   Roles: {len(result.get('roles', []))}")
            print(f"   Modules: {len(result.get('modules', []))}")
            print(f"   Permissions: {len(result.get('permissions', {}))}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_permissions_service()