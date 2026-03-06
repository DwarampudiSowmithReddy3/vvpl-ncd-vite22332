"""add s3_url columns to document tables

Revision ID: add_s3_url_columns
Revises: c10e6a475783
Create Date: 2026-03-03 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_s3_url_columns'
down_revision = 'c10e6a475783'
branch_labels = None
depends_on = None


def upgrade():
    """Add s3_url and s3_bucket columns to tables that store S3 documents"""
    
    # Get connection to check existing columns
    conn = op.get_bind()
    
    # Helper function to check if column exists
    def column_exists(table_name, column_name):
        result = conn.execute(sa.text(
            f"SELECT COUNT(*) as count FROM information_schema.COLUMNS "
            f"WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '{table_name}' "
            f"AND COLUMN_NAME = '{column_name}'"
        ))
        return result.fetchone()[0] > 0
    
    # Add columns to investor_documents table
    if not column_exists('investor_documents', 's3_url'):
        op.add_column('investor_documents', 
            sa.Column('s3_url', mysql.VARCHAR(length=1000), nullable=True, comment='S3 signed URL for document access')
        )
    
    if not column_exists('investor_documents', 's3_bucket'):
        op.add_column('investor_documents', 
            sa.Column('s3_bucket', mysql.VARCHAR(length=255), nullable=True, comment='S3 bucket name')
        )
    
    if not column_exists('investor_documents', 'content_type'):
        op.add_column('investor_documents', 
            sa.Column('content_type', mysql.VARCHAR(length=100), nullable=True, server_default='application/pdf', comment='MIME type of document')
        )
    
    # Add columns to series_documents table
    if not column_exists('series_documents', 's3_url'):
        op.add_column('series_documents', 
            sa.Column('s3_url', mysql.VARCHAR(length=1000), nullable=True, comment='S3 signed URL for document access')
        )
    
    if not column_exists('series_documents', 's3_bucket'):
        op.add_column('series_documents', 
            sa.Column('s3_bucket', mysql.VARCHAR(length=255), nullable=True, comment='S3 bucket name')
        )
    
    if not column_exists('series_documents', 'content_type'):
        op.add_column('series_documents', 
            sa.Column('content_type', mysql.VARCHAR(length=100), nullable=True, server_default='application/pdf', comment='MIME type of document')
        )
    
    # Add columns to investments table for payment documents
    if not column_exists('investments', 'payment_document_url'):
        op.add_column('investments', 
            sa.Column('payment_document_url', mysql.VARCHAR(length=1000), nullable=True, comment='S3 signed URL for payment document')
        )
    
    if not column_exists('investments', 'payment_document_bucket'):
        op.add_column('investments', 
            sa.Column('payment_document_bucket', mysql.VARCHAR(length=255), nullable=True, comment='S3 bucket name for payment document')
        )


def downgrade():
    """Remove s3_url and s3_bucket columns"""
    
    # Remove from investments table
    op.drop_column('investments', 'payment_document_bucket')
    op.drop_column('investments', 'payment_document_url')
    
    # Remove from series_documents table
    op.drop_column('series_documents', 'content_type')
    op.drop_column('series_documents', 's3_bucket')
    op.drop_column('series_documents', 's3_url')
    
    # Remove from investor_documents table
    op.drop_column('investor_documents', 'content_type')
    op.drop_column('investor_documents', 's3_bucket')
    op.drop_column('investor_documents', 's3_url')
