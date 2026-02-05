from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

# User Models
class UserRole(str, Enum):
    FINANCE_EXECUTIVE = "Finance Executive"
    FINANCE_MANAGER = "Finance Manager"
    COMPLIANCE_BASE = "Compliance Base"
    COMPLIANCE_OFFICER = "Compliance Officer"
    INVESTOR_RELATIONSHIP_EXECUTIVE = "Investor Relationship Executive"
    INVESTOR_RELATIONSHIP_MANAGER = "Investor Relationship Manager"
    BOARD_MEMBER_BASE = "Board Member Base"
    BOARD_MEMBER_HEAD = "Board Member Head"
    ADMIN = "Admin"
    SUPER_ADMIN = "Super Admin"
    INVESTOR = "Investor"

class UserBase(BaseModel):
    user_id: str
    username: str
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    is_active: bool = True

class UserInDB(UserResponse):
    password_hash: str

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Audit Log Models
class AuditLogCreate(BaseModel):
    action: str
    admin_name: str
    admin_role: str
    details: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None

class AuditLogResponse(BaseModel):
    id: int
    action: str
    admin_name: str
    admin_role: str
    details: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    timestamp: datetime

# Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True

class ErrorResponse(BaseModel):
    message: str
    success: bool = False
    error_code: Optional[str] = None