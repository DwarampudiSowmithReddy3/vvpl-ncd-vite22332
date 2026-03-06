"""create investor_investment_documents table

Revision ID: create_investment_docs
Revises: add_s3_url_columns
Create Date: 2026-03-05 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'create_investment_docs'
down_revision = 'add_s3_url_columns'
branch_labels = None
depends_on = None


def upgrade():
    """Create investor_investment_documents table for payment documents"""
    
    op.create_table(
        'investor_investment_documents',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('investment_id', sa.Integer(), nullable=False),
        sa.Column('investor_id', sa.Integer(), nullable=False),
        sa.Column('series_id', sa.Integer(), nullable=False),
        sa.Column('document_type', mysql.VARCHAR(length=50), nullable=False, server_default='payment_document'),
        sa.Column('file_name', mysql.VARCHAR(length=255), nullable=False),
        sa.Column('file_path', mysql.VARCHAR(length=500), nullable=False, comment='S3 key without credentials'),
        sa.Column('s3_bucket', mysql.VARCHAR(length=255), nullable=True),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('content_type', mysql.VARCHAR(length=100), nullable=True, server_default='application/pdf'),
        sa.Column('uploaded_at', sa.DateTime(), nullable=True, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('uploaded_by', mysql.VARCHAR(length=100), nullable=True),
        sa.Column('is_active', mysql.TINYINT(1), nullable=True, server_default='1'),
        
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['investment_id'], ['investments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['investor_id'], ['investors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['series_id'], ['ncd_series.id'], ondelete='CASCADE'),
        
        mysql_engine='InnoDB',
        mysql_charset='utf8mb4',
        mysql_comment='Payment documents for investor investments'
    )
    
    # Create indexes
    op.create_index('idx_investment_id', 'investor_investment_documents', ['investment_id'])
    op.create_index('idx_investor_id', 'investor_investment_documents', ['investor_id'])
    op.create_index('idx_series_id', 'investor_investment_documents', ['series_id'])


def downgrade():
    """Drop investor_investment_documents table"""
    
    op.drop_index('idx_series_id', 'investor_investment_documents')
    op.drop_index('idx_investor_id', 'investor_investment_documents')
    op.drop_index('idx_investment_id', 'investor_investment_documents')
    op.drop_table('investor_investment_documents')
