# SQL Migrations

This folder contains pure SQL migration files for database schema changes.

## How to Run Migrations

```bash
cd backend
python run_sql_migrations.py
```

## Migration File Naming Convention

Format: `YYYYMMDD_HHMMSS_description.sql`

Example: `20260310_120000_add_template_id_column.sql`

## Migration Tracking

Migrations are tracked in the `schema_migrations` table in the database.
Each migration is run only once.

## Creating New Migrations

1. Create a new `.sql` file in this folder
2. Use the naming convention above
3. Write your SQL statements
4. Run `python run_sql_migrations.py`

## Important Notes

- Migrations run in alphabetical order (by filename)
- Each migration runs in a transaction
- Failed migrations will rollback automatically
- Already-run migrations are skipped
