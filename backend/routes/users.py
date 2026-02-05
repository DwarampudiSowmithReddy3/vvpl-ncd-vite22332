from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from models import UserCreate, UserUpdate, UserResponse, MessageResponse, UserInDB
from auth import get_current_user, get_password_hash
from database import get_db
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users", tags=["User Management"])

def create_audit_log(db, action: str, admin_name: str, admin_role: str, details: str, entity_type: str, entity_id: str, changes: dict = None):
    """Helper function to create audit log entries"""
    try:
        changes_json = json.dumps(changes) if changes else None
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            action,
            admin_name,
            admin_role,
            details,
            entity_type,
            entity_id,
            changes_json,
            datetime.now()
        ))
        
        logger.info(f"Audit log created: {action} by {admin_name}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        # Don't fail the main operation if audit logging fails

@router.get("/", response_model=List[UserResponse])
async def get_all_users(current_user: UserInDB = Depends(get_current_user)):
    """Get all active users"""
    try:
        db = get_db()
        query = """
        SELECT id, user_id, username, full_name, email, phone, role, 
               created_at, updated_at, last_login, is_active
        FROM users 
        WHERE is_active = 1
        ORDER BY created_at DESC
        """
        
        result = db.execute_query(query)
        
        users = []
        for user_data in result:
            users.append(UserResponse(
                id=user_data['id'],
                user_id=user_data['user_id'],
                username=user_data['username'],
                full_name=user_data['full_name'],
                email=user_data['email'],
                phone=user_data['phone'],
                role=user_data['role'],
                created_at=user_data['created_at'],
                updated_at=user_data['updated_at'],
                last_login=user_data['last_login'],
                is_active=bool(user_data['is_active'])
            ))
        
        return users
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving users"
        )

@router.post("/", response_model=UserResponse)
async def create_user(user_data: UserCreate, current_user: UserInDB = Depends(get_current_user)):
    """Create a new user"""
    try:
        db = get_db()
        
        # Check if user_id, username, or email already exists
        check_query = """
        SELECT COUNT(*) as count FROM users 
        WHERE user_id = %s OR username = %s OR email = %s
        """
        result = db.execute_query(check_query, (user_data.user_id, user_data.username, user_data.email))
        
        if result[0]['count'] > 0:
            # Find which field is duplicate
            duplicate_check = """
            SELECT user_id, username, email FROM users 
            WHERE user_id = %s OR username = %s OR email = %s
            """
            duplicates = db.execute_query(duplicate_check, (user_data.user_id, user_data.username, user_data.email))
            
            for dup in duplicates:
                if dup['user_id'] == user_data.user_id:
                    raise HTTPException(status_code=400, detail="User ID already exists")
                if dup['username'] == user_data.username:
                    raise HTTPException(status_code=400, detail="Username already exists")
                if dup['email'] == user_data.email:
                    raise HTTPException(status_code=400, detail="Email already exists")
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Insert new user
        insert_query = """
        INSERT INTO users (user_id, username, full_name, email, phone, password_hash, role, created_at, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        db.execute_query(insert_query, (
            user_data.user_id,
            user_data.username,
            user_data.full_name,
            user_data.email,
            user_data.phone,
            password_hash,
            user_data.role.value,
            now,
            True
        ))
        
        # Get the created user
        get_user_query = """
        SELECT id, user_id, username, full_name, email, phone, role, 
               created_at, updated_at, last_login, is_active
        FROM users 
        WHERE username = %s
        """
        
        result = db.execute_query(get_user_query, (user_data.username,))
        
        if result:
            user_record = result[0]
            
            # Create audit log for user creation
            create_audit_log(
                db=db,
                action="Created User",
                admin_name=current_user.full_name,
                admin_role=current_user.role,
                details=f"Created new user \"{user_data.username}\" ({user_data.full_name}) with role \"{user_data.role.value}\"",
                entity_type="User",
                entity_id=user_data.username,
                changes={
                    "userId": user_data.user_id,
                    "username": user_data.username,
                    "fullName": user_data.full_name,
                    "role": user_data.role.value,
                    "email": user_data.email,
                    "phone": user_data.phone,
                    "action": "user_created"
                }
            )
            
            return UserResponse(
                id=user_record['id'],
                user_id=user_record['user_id'],
                username=user_record['username'],
                full_name=user_record['full_name'],
                email=user_record['email'],
                phone=user_record['phone'],
                role=user_record['role'],
                created_at=user_record['created_at'],
                updated_at=user_record['updated_at'],
                last_login=user_record['last_login'],
                is_active=bool(user_record['is_active'])
            )
        
        raise HTTPException(status_code=500, detail="User created but could not retrieve")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating user"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, current_user: UserInDB = Depends(get_current_user)):
    """Get a specific user by ID"""
    try:
        db = get_db()
        query = """
        SELECT id, user_id, username, full_name, email, phone, role, 
               created_at, updated_at, last_login, is_active
        FROM users 
        WHERE id = %s AND is_active = 1
        """
        
        result = db.execute_query(query, (user_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = result[0]
        return UserResponse(
            id=user_data['id'],
            user_id=user_data['user_id'],
            username=user_data['username'],
            full_name=user_data['full_name'],
            email=user_data['email'],
            phone=user_data['phone'],
            role=user_data['role'],
            created_at=user_data['created_at'],
            updated_at=user_data['updated_at'],
            last_login=user_data['last_login'],
            is_active=bool(user_data['is_active'])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving user"
        )

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: int, user_data: UserUpdate, current_user: UserInDB = Depends(get_current_user)):
    """Update a user"""
    try:
        db = get_db()
        
        # Check if user exists
        check_query = "SELECT id FROM users WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (user_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        
        if user_data.full_name is not None:
            update_fields.append("full_name = %s")
            update_values.append(user_data.full_name)
        
        if user_data.email is not None:
            # Check if email already exists for another user
            email_check = "SELECT id FROM users WHERE email = %s AND id != %s"
            email_result = db.execute_query(email_check, (user_data.email, user_id))
            if email_result:
                raise HTTPException(status_code=400, detail="Email already exists")
            
            update_fields.append("email = %s")
            update_values.append(user_data.email)
        
        if user_data.phone is not None:
            update_fields.append("phone = %s")
            update_values.append(user_data.phone)
        
        if user_data.role is not None:
            update_fields.append("role = %s")
            update_values.append(user_data.role.value)
        
        if user_data.password is not None:
            password_hash = get_password_hash(user_data.password)
            update_fields.append("password_hash = %s")
            update_values.append(password_hash)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add updated_at timestamp
        update_fields.append("updated_at = %s")
        update_values.append(datetime.now())
        
        # Add user_id for WHERE clause
        update_values.append(user_id)
        
        update_query = f"UPDATE users SET {', '.join(update_fields)} WHERE id = %s"
        db.execute_query(update_query, update_values)
        
        # Get user info for audit log
        user_info_query = "SELECT username, full_name FROM users WHERE id = %s"
        user_info = db.execute_query(user_info_query, (user_id,))
        
        if user_info:
            username = user_info[0]['username']
            full_name = user_info[0]['full_name']
            
            # Create audit log for user update
            changed_fields = []
            if user_data.full_name is not None:
                changed_fields.append("full name")
            if user_data.email is not None:
                changed_fields.append("email")
            if user_data.phone is not None:
                changed_fields.append("phone")
            if user_data.role is not None:
                changed_fields.append("role")
            if user_data.password is not None:
                changed_fields.append("password")
            
            create_audit_log(
                db=db,
                action="Updated User",
                admin_name=current_user.full_name,
                admin_role=current_user.role,
                details=f"Updated {', '.join(changed_fields)} for user \"{username}\"",
                entity_type="User",
                entity_id=username,
                changes={
                    "fields": changed_fields,
                    "userId": user_id,
                    "userFullName": full_name,
                    "action": "user_updated"
                }
            )
        
        # Return updated user
        return await get_user(user_id, current_user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating user"
        )

@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: int, current_user: UserInDB = Depends(get_current_user)):
    """Soft delete a user (mark as inactive)"""
    try:
        db = get_db()
        
        # Check if user exists
        check_query = "SELECT id, username, full_name FROM users WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (user_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        username = result[0]['username']
        full_name = result[0]['full_name']
        
        # Soft delete (mark as inactive)
        delete_query = "UPDATE users SET is_active = 0, updated_at = %s WHERE id = %s"
        db.execute_query(delete_query, (datetime.now(), user_id))
        
        # Create audit log for user deletion
        create_audit_log(
            db=db,
            action="Deleted User",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Deleted user \"{username}\" ({full_name})",
            entity_type="User",
            entity_id=username,
            changes={
                "userId": user_id,
                "username": username,
                "fullName": full_name,
                "action": "user_deleted"
            }
        )
        
        return MessageResponse(message=f"User {username} deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting user"
        )