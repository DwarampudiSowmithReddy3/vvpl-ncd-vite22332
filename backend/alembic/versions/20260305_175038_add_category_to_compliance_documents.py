"""add category to compliance_documents

Revision ID: 20260305_175038
Revises: 20260305_173808
Create Date: 2026-03-05 17:50:38

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20260305_175038'
down_revision = '20260305_173808'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add category column to compliance_documents table
    Category can be: pre-compliance, post-compliance, recurring, other
    """
    # Add category column
    op.add_column('compliance_documents',
                  sa.Column('category', sa.String(50), nullable=True))


def downgrade():
    """
    Remove category column from compliance_documents table
    """
    op.drop_column('compliance_documents', 'category')
