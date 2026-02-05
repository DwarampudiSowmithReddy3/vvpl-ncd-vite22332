from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database settings
    db_host: str = "localhost"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "sowmith"
    db_name: str = "ncd_management"
    
    # JWT settings
    secret_key: str = "your-super-secret-jwt-key-change-this-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables

# Create settings instance
settings = Settings()