from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import timedelta, datetime
from models import LoginRequest, LoginResponse, UserResponse, Token
from auth import authenticate_user, create_access_token, get_current_user, update_last_login
from config import settings
from database import get_db
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

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

@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Authenticate user and return JWT token"""
    try:
        # Authenticate user
        user = authenticate_user(login_data.username, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Update last login
        update_last_login(user.username)
        
        # Create audit log for login
        db = get_db()
        create_audit_log(
            db=db,
            action="User Login",
            admin_name=user.full_name,
            admin_role=user.role,
            details=f"User {user.username} logged in successfully",
            entity_type="Authentication",
            entity_id=user.username,
            changes={
                "action": "login",
                "username": user.username,
                "timestamp": datetime.now().isoformat()
            }
        )
        
        # Prepare user response (without password hash)
        user_response = UserResponse(
            id=user.id,
            user_id=user.user_id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at,
            last_login=user.last_login,
            is_active=user.is_active
        )
        
        return LoginResponse(
            access_token=access_token,
            token_type="bearer",
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during login"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current authenticated user information"""
    return UserResponse(
        id=current_user.id,
        user_id=current_user.user_id,
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at,
        last_login=current_user.last_login,
        is_active=current_user.is_active
    )

@router.post("/verify-token")
async def verify_token(current_user: UserResponse = Depends(get_current_user)):
    """Verify if the provided token is valid"""
    return {"valid": True, "username": current_user.username}