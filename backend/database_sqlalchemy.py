"""
SQLAlchemy Database Configuration for Alembic Migrations
This file is used by Alembic for migrations
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings
import logging

logger = logging.getLogger(__name__)

# Create SQLAlchemy database URL
# Format: mysql+pymysql://user:password@host:port/database
SQLALCHEMY_DATABASE_URL = (
    f"mysql+pymysql://{settings.db_user}:{settings.db_password}"
    f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
)

# Create SQLAlchemy engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False           # Set to True to see SQL queries in logs
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()


def get_sqlalchemy_db():
    """
    Dependency to get SQLAlchemy database session
    Use this for operations that need SQLAlchemy ORM
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_connection():
    """Test database connection"""
    try:
        with engine.connect() as connection:
            logger.info("✅ SQLAlchemy database connection successful")
            return True
    except Exception as e:
        logger.error(f"❌ SQLAlchemy database connection failed: {e}")
        return False
