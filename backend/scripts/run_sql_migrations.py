"""
SQL Migration Runner - Replaces Alembic
Runs SQL migration files in order and tracks which ones have been applied
"""
import os
import sys
from pathlib import Path

# Add backend directory to path so we can import app modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import get_db
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_migration_files():
    """Get all SQL migration files sorted by name"""
    # Migrations are in backend/migrations, not scripts/migrations
    migrations_dir = Path(__file__).parent.parent / "migrations"
    
    if not migrations_dir.exists():
        logger.error(f"❌ Migrations directory not found: {migrations_dir}")
        return []
    
    # Get all .sql files and sort them
    sql_files = sorted(migrations_dir.glob("*.sql"))
    return sql_files


def get_applied_migrations(db):
    """Get list of migrations that have already been applied"""
    try:
        # Check if schema_migrations table exists
        check_table = """
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'schema_migrations'
        """
        result = db.execute_query(check_table)
        
        if result[0]['count'] == 0:
            logger.info("📋 schema_migrations table doesn't exist yet")
            return []
        
        # Get applied migrations
        query = "SELECT migration_name FROM schema_migrations ORDER BY applied_at"
        result = db.execute_query(query)
        
        return [row['migration_name'] for row in result]
    
    except Exception as e:
        logger.warning(f"⚠️ Could not check applied migrations: {e}")
        return []


def mark_migration_applied(db, migration_name):
    """Mark a migration as applied in the database"""
    try:
        query = "INSERT INTO schema_migrations (migration_name) VALUES (%s)"
        db.execute_query(query, (migration_name,))
        logger.info(f"✅ Marked migration as applied: {migration_name}")
    except Exception as e:
        logger.error(f"❌ Failed to mark migration as applied: {e}")
        raise


def run_migration(db, migration_file):
    """Run a single SQL migration file"""
    migration_name = migration_file.name
    
    try:
        # Read SQL file
        with open(migration_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Skip empty files
        if not sql_content.strip():
            logger.warning(f"⚠️ Skipping empty migration: {migration_name}")
            return True
        
        logger.info(f"🔄 Running migration: {migration_name}")
        logger.info(f"📄 SQL Preview:\n{sql_content[:200]}...")
        
        # Split by semicolons to handle multiple statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        # Execute each statement
        for i, statement in enumerate(statements, 1):
            if statement:
                logger.info(f"   Executing statement {i}/{len(statements)}...")
                try:
                    db.execute_query(statement)
                except Exception as stmt_error:
                    # Check if it's a "column already exists" error (MySQL error 1060)
                    if "Duplicate column name" in str(stmt_error) or "1060" in str(stmt_error):
                        logger.warning(f"   ⚠️ Column already exists, skipping: {statement[:50]}...")
                        continue
                    # Check if it's a "table already exists" error (MySQL error 1050)
                    elif "Table" in str(stmt_error) and "already exists" in str(stmt_error) or "1050" in str(stmt_error):
                        logger.warning(f"   ⚠️ Table already exists, skipping: {statement[:50]}...")
                        continue
                    else:
                        # Re-raise other errors
                        raise stmt_error
        
        # Mark as applied
        mark_migration_applied(db, migration_name)
        
        logger.info(f"✅ Migration completed: {migration_name}")
        return True
    
    except Exception as e:
        logger.error(f"❌ Migration failed: {migration_name}")
        logger.error(f"❌ Error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False


def run_all_migrations():
    """Run all pending SQL migrations"""
    try:
        logger.info("=" * 60)
        logger.info("SQL MIGRATION RUNNER")
        logger.info("=" * 60)
        
        # Get database connection
        db = get_db()
        logger.info("✅ Database connected")
        
        # Get all migration files
        migration_files = get_migration_files()
        
        if not migration_files:
            logger.warning("⚠️ No migration files found")
            return
        
        logger.info(f"📋 Found {len(migration_files)} migration files")
        
        # Get already applied migrations
        applied_migrations = get_applied_migrations(db)
        logger.info(f"📋 {len(applied_migrations)} migrations already applied")
        
        # Run pending migrations
        pending_count = 0
        success_count = 0
        
        for migration_file in migration_files:
            migration_name = migration_file.name
            
            if migration_name in applied_migrations:
                logger.info(f"⏭️  Skipping (already applied): {migration_name}")
                continue
            
            pending_count += 1
            
            # Run the migration
            if run_migration(db, migration_file):
                success_count += 1
            else:
                logger.error(f"❌ Stopping due to migration failure: {migration_name}")
                break
        
        # Summary
        logger.info("=" * 60)
        logger.info("MIGRATION SUMMARY")
        logger.info("=" * 60)
        logger.info(f"Total migrations: {len(migration_files)}")
        logger.info(f"Already applied: {len(applied_migrations)}")
        logger.info(f"Pending: {pending_count}")
        logger.info(f"Successfully applied: {success_count}")
        
        if success_count == pending_count:
            logger.info("✅ All migrations completed successfully!")
        else:
            logger.error("❌ Some migrations failed!")
            sys.exit(1)
    
    except Exception as e:
        logger.error(f"❌ Migration runner failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    run_all_migrations()
