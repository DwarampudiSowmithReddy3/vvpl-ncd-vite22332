from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import settings
from models import TokenData, UserInDB
from database import get_db
import logging

logger = logging.getLogger(__name__)

# JWT token scheme
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using SHA256"""
    # Create hash of plain password
    password_hash = hashlib.sha256(plain_password.encode()).hexdigest()
    return password_hash == hashed_password

def get_password_hash(password: str) -> str:
    """Hash a password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    """Verify JWT token and return token data"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
        return token_data
    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        return None

def get_user_by_username(username: str) -> Optional[UserInDB]:
    """Get user from database by username"""
    try:
        db = get_db()
        query = """
        SELECT id, user_id, username, full_name, email, phone, password_hash, role, 
               created_at, updated_at, last_login, is_active
        FROM users 
        WHERE username = %s AND is_active = 1
        """
        result = db.execute_query(query, (username,))
        
        if result:
            user_data = result[0]
            return UserInDB(
                id=user_data['id'],
                user_id=user_data['user_id'],
                username=user_data['username'],
                full_name=user_data['full_name'],
                email=user_data['email'],
                phone=user_data['phone'],
                password_hash=user_data['password_hash'],
                role=user_data['role'],
                created_at=user_data['created_at'],
                updated_at=user_data['updated_at'],
                last_login=user_data['last_login'],
                is_active=bool(user_data['is_active'])
            )
        return None
        
    except Exception as e:
        logger.error(f"Error getting user by username: {e}")
        return None

def authenticate_user(username: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with username and password"""
    user = get_user_by_username(username)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserInDB:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        token_data = verify_token(token)
        if token_data is None:
            raise credentials_exception
        
        user = get_user_by_username(token_data.username)
        if user is None:
            raise credentials_exception
        
        return user
        
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise credentials_exception

def update_last_login(username: str):
    """Update user's last login timestamp"""
    try:
        db = get_db()
        query = "UPDATE users SET last_login = %s WHERE username = %s"
        db.execute_query(query, (datetime.now(), username))
    except Exception as e:
        logger.error(f"Error updating last login: {e}")