# Permission Error Fix Summary

## The Original Issue
- Error: "Update permission error: 'role'"
- Frontend permission toggles were failing

## Root Cause
The startup script `start-backend.bat` was running the wrong server:
- **WRONG:** `python mysql_api.py` (expects: role, module, permission, granted)
- **CORRECT:** `python main.py` (expects: role_name, module_name, permission_type, is_granted)

## The Minimal Fix Required

### 1. Fix Startup Script
In `start-backend.bat`, change:
```bat
python mysql_api.py
```
to:
```bat
python main.py
```

### 2. Fix AdminUser Model
The AdminUser model had columns that don't exist in your database. Update `backend/app/models/auth.py`:

```python
class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(20), unique=True, nullable=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # String, not Enum
    status = Column(String(20), nullable=False, default="active")  # String, not Enum
    
    # Match your actual database columns
    phone_number = Column(String(20))  # Not 'phone'
    department = Column(String(50))
    employee_id = Column(String(20))
    last_login = Column(DateTime(timezone=True))
    failed_login_attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(String(50))
    last_used = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    deleted_at = Column(DateTime(timezone=True))
    deleted_by = Column(String(100))
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
```

### 3. Fix Pydantic Schema
In `backend/app/schemas/investor.py`, change `regex=` to `pattern=`:
```python
gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
```

## Status
- ✅ Original role_permissions table restored
- ✅ Backend code reverted to work with original structure  
- ✅ Only the minimal necessary changes made
- ⚠️ Backend server needs to be restarted with correct application

## Next Steps
1. Start the backend server with: `python backend/main.py`
2. Test the frontend permission toggles
3. The error should be resolved

The permission system will work with your original table structure, just with the correct backend server running.