from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

# Permission Models - Handle with baby-like care

class ModuleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool = True

class ModuleResponse(ModuleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class ActionBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool = True

class ActionResponse(ActionBase):
    id: int
    created_at: datetime

class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    is_active: bool = True

class RoleResponse(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class PermissionBase(BaseModel):
    role_id: int
    module_id: int
    action_id: int
    is_allowed: bool = False

class PermissionCreate(PermissionBase):
    pass

class PermissionUpdate(BaseModel):
    is_allowed: bool
    reason: Optional[str] = None

class PermissionResponse(PermissionBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

class PermissionWithDetails(BaseModel):
    id: int
    role_name: str
    role_display_name: str
    module_name: str
    module_display_name: str
    action_name: str
    action_display_name: str
    is_allowed: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

class RolePermissionsMatrix(BaseModel):
    role_name: str
    role_display_name: str
    permissions: Dict[str, Dict[str, bool]]  # {module_name: {action_name: is_allowed}}

class PermissionHistoryResponse(BaseModel):
    id: int
    permission_id: int
    role_name: str
    module_name: str
    action_name: str
    old_value: Optional[bool]
    new_value: bool
    changed_by: Optional[int] = None
    changed_at: datetime
    reason: Optional[str] = None

class BulkPermissionUpdate(BaseModel):
    role_name: str
    permissions: Dict[str, Dict[str, bool]]  # {module_name: {action_name: is_allowed}}
    reason: Optional[str] = None

class PermissionSummary(BaseModel):
    total_roles: int
    total_modules: int
    total_actions: int
    total_permissions: int
    allowed_permissions: int
    denied_permissions: int