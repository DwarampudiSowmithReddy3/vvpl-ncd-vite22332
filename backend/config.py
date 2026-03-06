from pydantic_settings import BaseSettings
from typing import Optional
import secrets
import os
from pathlib import Path

# Get the directory where this config.py file is located (backend folder)
BACKEND_DIR = Path(__file__).parent
ENV_FILE = BACKEND_DIR / ".env"

class Settings(BaseSettings):
    # Database settings - READ FROM ENVIRONMENT ONLY
    db_host: str
    db_port: int = 3306
    db_user: str
    db_password: str
    db_name: str
    
    # JWT settings - READ FROM ENVIRONMENT ONLY
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30  # 30 minutes
    
    # Security settings
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"
    
    class Config:
        env_file = str(ENV_FILE)  # Explicitly use backend/.env
        extra = "ignore"  # Ignore extra environment variables
        case_sensitive = False  # Allow case-insensitive env var names

# Create settings instance
settings = Settings()

# Validate critical settings on startup
if not settings.secret_key or settings.secret_key == "your-super-secret-jwt-key-change-this-in-production":
    raise ValueError(
        "❌ SECURITY ERROR: SECRET_KEY must be set in .env file with a strong random value. "
        "Generate one using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
    )

if len(settings.secret_key) < 32:
    raise ValueError(
        "❌ SECURITY ERROR: SECRET_KEY is too weak. It must be at least 32 characters long. "
        "Current key is insecure."
    )

if not settings.db_password:
    raise ValueError("❌ SECURITY ERROR: DB_PASSWORD must be set in .env file")