"""remove unused compliance columns

Revision ID: 20260305_173808
Revises: create_investment_docs
Create Date: 2026-03-05 17:38:08

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260305_173808'
down_revision = 'create_investment_docs'
branch_labels = None
depends_on = None


def upgrade():
    """
    Remove master_item_id, year, and month columns from compliance_documents table
    These columns are not needed for general compliance document storage
    
    IMPORTANT: Must drop foreign key constraint first before dropping master_item_id column
    """
    # Use raw SQL to handle this carefully
    from sqlalchemy import text
    
    connection = op.get_bind()
    
    # Check if foreign key exists before dropping
    result = connection.execute(text("""
        SELECT CONSTRAINT_NAME 
        FROM information_schema.TABLE_CONSTRAINTS 
        WHERE TABLE_SCHEMA = 'ncd_management' 
        AND TABLE_NAME = 'compliance_documents' 
        AND CONSTRAINT_NAME = 'compliance_documents_ibfk_2'
    """))
    
    if result.fetchone():
        # Foreign key exists, drop it
        connection.execute(text("ALTER TABLE compliance_documents DROP FOREIGN KEY compliance_documents_ibfk_2"))
    
    # Now remove the three columns
    op.drop_column('compliance_documents', 'master_item_id')
    op.drop_column('compliance_documents', 'year')
    op.drop_column('compliance_documents', 'month')


def downgrade():
    """
    Add back master_item_id, year, and month columns if needed
    """
    # Add back the columns in reverse order
    op.add_column('compliance_documents', 
                  sa.Column('month', mysql.INTEGER(), nullable=True))
    op.add_column('compliance_documents', 
                  sa.Column('year', mysql.INTEGER(), nullable=True))
    op.add_column('compliance_documents', 
                  sa.Column('master_item_id', mysql.INTEGER(), nullable=True))
    
    # Recreate the foreign key constraint (this will also create the index)
    op.create_foreign_key('compliance_documents_ibfk_2', 'compliance_documents', 
                          'compliance_master_items', ['master_item_id'], ['id'])
