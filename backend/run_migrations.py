"""
Alembic Migration Runner
Automatically runs database migrations on application startup
"""
import logging
from alembic.config import Config
from alembic import command
import os

logger = logging.getLogger(__name__)


def run_migrations():
    """
    Run Alembic migrations to upgrade database to latest version
    This is called automatically on FastAPI startup
    """
    try:
        logger.info("=" * 70)
        logger.info("🔄 RUNNING DATABASE MIGRATIONS")
        logger.info("=" * 70)
        logger.info("")
        
        # Get the directory where this script is located
        script_dir = os.path.dirname(os.path.abspath(__file__))
        
        # Path to alembic.ini
        alembic_ini_path = os.path.join(script_dir, "alembic.ini")
        
        # Create Alembic config
        alembic_cfg = Config(alembic_ini_path)
        
        # Set the script location (where alembic folder is)
        alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))
        
        logger.info("📊 Checking current database version...")
        
        # Run migrations to head (latest version)
        command.upgrade(alembic_cfg, "head")
        
        logger.info("")
        logger.info("✅ Database migrations completed successfully!")
        logger.info("=" * 70)
        logger.info("")
        
        return True
        
    except Exception as e:
        logger.error("=" * 70)
        logger.error("❌ DATABASE MIGRATION FAILED")
        logger.error("=" * 70)
        logger.error(f"Error: {e}")
        logger.error("")
        
        import traceback
        logger.error(traceback.format_exc())
        
        logger.error("=" * 70)
        logger.error("⚠️  APPLICATION CANNOT START WITHOUT DATABASE MIGRATIONS")
        logger.error("=" * 70)
        logger.error("")
        logger.error("Please check:")
        logger.error("1. Database connection settings in backend/.env")
        logger.error("2. Database server is running")
        logger.error("3. Database 'ncd_management' exists")
        logger.error("")
        logger.error("=" * 70)
        
        return False


def check_migration_status():
    """
    Check current migration status without running migrations
    Useful for debugging
    """
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(script_dir, "alembic.ini")
        alembic_cfg = Config(alembic_ini_path)
        alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))
        
        # Show current revision
        command.current(alembic_cfg)
        
        # Show migration history
        command.history(alembic_cfg)
        
        return True
        
    except Exception as e:
        logger.error(f"Failed to check migration status: {e}")
        return False


def create_new_migration(message: str):
    """
    Create a new migration file
    Use this when you modify SQLAlchemy models
    
    Args:
        message: Description of the migration (e.g., "add_new_column_to_users")
    """
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(script_dir, "alembic.ini")
        alembic_cfg = Config(alembic_ini_path)
        alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))
        
        # Generate new migration
        command.revision(alembic_cfg, message=message, autogenerate=True)
        
        logger.info(f"✅ New migration created: {message}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to create migration: {e}")
        return False


def rollback_migration(steps: int = 1):
    """
    Rollback database migrations
    
    Args:
        steps: Number of migrations to rollback (default: 1)
    """
    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_ini_path = os.path.join(script_dir, "alembic.ini")
        alembic_cfg = Config(alembic_ini_path)
        alembic_cfg.set_main_option("script_location", os.path.join(script_dir, "alembic"))
        
        # Downgrade by specified steps
        command.downgrade(alembic_cfg, f"-{steps}")
        
        logger.info(f"✅ Rolled back {steps} migration(s)")
        return True
        
    except Exception as e:
        logger.error(f"Failed to rollback migration: {e}")
        return False


if __name__ == "__main__":
    # For testing: run migrations directly
    run_migrations()
