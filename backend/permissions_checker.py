"""
Permission Checker - Backend Security
======================================
Checks if user has permission to access endpoints
VERY CAREFULLY IMPLEMENTED
"""
from fastapi import HTTPException, status, Depends
from typing import List, Optional
from functools import wraps
import logging
from datetime import datetime
import json

from auth import get_current_user
from database import get_db
from models import UserInDB

logger = logging.getLogger(__name__)


def log_unauthorized_access(db, user: UserInDB, endpoint: str, required_permission: str):
    """
    Log unauthorized access attempts to audit log
    """
    try:
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, 
                               entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        details = f"UNAUTHORIZED ACCESS ATTEMPT: User '{user.username}' tried to access '{endpoint}' but lacks permission '{required_permission}'"
        
        changes = {
            "user_id": user.user_id,
            "username": user.username,
            "role": user.role,
            "endpoint": endpoint,
            "required_permission": required_permission,
            "access_denied": True
        }
        
        db.execute_query(insert_query, (
            "Unauthorized Access Attempt",
            user.full_name,
            user.role,
            details,
            "security",
            user.user_id,
            json.dumps(changes),
            datetime.now()
        ))
        
        logger.warning(f"🚨 UNAUTHORIZED ACCESS: {user.username} ({user.role}) tried to access {endpoint}")
        
    except Exception as e:
        logger.error(f"Failed to log unauthorized access: {e}")


def get_user_permissions(user_role: str, db) -> List[str]:
    """
    Get permissions for a user's role from database
    Handles both old list format and new dict format
    """
    try:
        query = """
        SELECT permissions FROM role_permissions
        WHERE role = %s
        """
        result = db.execute_query(query, (user_role,))
        
        if result and len(result) > 0:
            permissions = result[0]['permissions']
            
            # Parse JSON if string
            if isinstance(permissions, str):
                permissions = json.loads(permissions)
            
            # Handle old list format: ['view_compliance', 'edit_compliance']
            if isinstance(permissions, list):
                return permissions
            
            # Handle new dict format: {'compliance': {'view': True, 'edit': True}}
            if isinstance(permissions, dict):
                # Convert dict format to list of permission strings
                permission_list = []
                for module, actions in permissions.items():
                    if isinstance(actions, dict):
                        for action, enabled in actions.items():
                            if enabled:
                                # Convert to permission string format
                                # e.g., {'compliance': {'view': True}} -> 'view_compliance'
                                permission_list.append(f"{action}_{module}")
                return permission_list
        
        return []
        
    except Exception as e:
        logger.error(f"Error getting permissions for role {user_role}: {e}")
        return []


def has_permission(user: UserInDB, required_permission: str, db) -> bool:
    """
    Check if user has a specific permission
    """
    try:
        # CRITICAL: Super Admin has all permissions
        if user.role == "Super Admin":
            return True
        
        # Get user's permissions from database
        user_permissions = get_user_permissions(user.role, db)
        
        # Check if user has the required permission
        return required_permission in user_permissions
        
    except Exception as e:
        logger.error(f"Error checking permission: {e}")
        return False


def require_permission(permission: str):
    """
    Decorator to protect endpoints with permission check
    
    Usage:
    @router.get("/users")
    @require_permission("view_users")
    async def get_users(current_user: UserInDB = Depends(get_current_user)):
        ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = kwargs.get('current_user')
            
            if not current_user:
                logger.error("No current_user found in endpoint")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Get database connection
            db = get_db()
            
            # Check permission
            if not has_permission(current_user, permission, db):
                # Log unauthorized access attempt
                endpoint = func.__name__
                log_unauthorized_access(db, current_user, endpoint, permission)
                
                # Return 403 Forbidden
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access Denied: You don't have permission to access this resource. Required permission: {permission}"
                )
            
            # Permission granted - execute function
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def check_permission_sync(user: UserInDB, required_permission: str) -> bool:
    """
    Synchronous permission check (for use in non-async contexts)
    """
    try:
        db = get_db()
        return has_permission(user, required_permission, db)
    except Exception as e:
        logger.error(f"Error in sync permission check: {e}")
        return False
