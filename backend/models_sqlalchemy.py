"""
SQLAlchemy ORM Models for Database Tables
These models are used by Alembic for migrations
"""
from sqlalchemy import (
    Column, Integer, String, Text, DECIMAL, Date, DateTime, 
    Boolean, Enum, ForeignKey, JSON, BigInteger, TIMESTAMP
)
from sqlalchemy.sql import func
from database_sqlalchemy import Base
import enum


# ============================================
# ENUMS
# ============================================

class UserRoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    admin = "admin"
    manager = "manager"
    viewer = "viewer"
    investor = "investor"


class SeriesStatusEnum(str, enum.Enum):
    draft = "draft"
    pending_approval = "pending_approval"
    approved = "approved"
    active = "active"
    matured = "matured"
    closed = "closed"


class InterestFrequencyEnum(str, enum.Enum):
    Monthly = "Monthly"
    Quarterly = "Quarterly"
    Half_Yearly = "Half-Yearly"
    Yearly = "Yearly"


class KYCStatusEnum(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class InvestorStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    deleted = "deleted"


class InvestmentStatusEnum(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"


class PayoutStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class ComplianceFrequencyEnum(str, enum.Enum):
    Monthly = "Monthly"
    Quarterly = "Quarterly"
    Half_Yearly = "Half-Yearly"
    Yearly = "Yearly"
    One_Time = "One-Time"


class ComplianceStatusEnum(str, enum.Enum):
    pending = "pending"
    completed = "completed"
    overdue = "overdue"


class GrievanceTypeEnum(str, enum.Enum):
    investor = "investor"
    internal = "internal"
    regulatory = "regulatory"


class GrievancePriorityEnum(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class GrievanceStatusEnum(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class CommunicationTypeEnum(str, enum.Enum):
    SMS = "SMS"
    Email = "Email"


class CommunicationStatusEnum(str, enum.Enum):
    Success = "Success"
    Failed = "Failed"
    Pending = "Pending"


class DocumentTypeEnum(str, enum.Enum):
    term_sheet = "term_sheet"
    offer_document = "offer_document"
    board_resolution = "board_resolution"
    other = "other"


class InvestorDocumentTypeEnum(str, enum.Enum):
    pan_card = "pan_card"
    aadhar_card = "aadhar_card"
    bank_proof = "bank_proof"
    photo = "photo"
    signature = "signature"
    other = "other"


class InvestorSeriesStatusEnum(str, enum.Enum):
    active = "active"
    exited = "exited"
    matured = "matured"


class ReportStatusEnum(str, enum.Enum):
    success = "success"
    failed = "failed"


# ============================================
# TABLE 1: USERS
# ============================================

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.viewer, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    last_login = Column(TIMESTAMP, nullable=True)
    last_activity = Column(TIMESTAMP, nullable=True)


# ============================================
# TABLE 2: ROLE PERMISSIONS
# ============================================

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    role_name = Column(String(50), nullable=False, index=True)
    permission_name = Column(String(100), nullable=False, index=True)
    is_granted = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


# ============================================
# TABLE 3: AUDIT LOGS
# ============================================

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(255), nullable=False, index=True)
    admin_name = Column(String(255), nullable=False, index=True)
    admin_role = Column(String(50), nullable=False)
    details = Column(Text)
    entity_type = Column(String(100), index=True)
    entity_id = Column(String(100), index=True)
    changes = Column(JSON)
    timestamp = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)
    ip_address = Column(String(45))


# ============================================
# TABLE 4: NCD SERIES
# ============================================

class NCDSeries(Base):
    __tablename__ = "ncd_series"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    series_code = Column(String(50), unique=True, nullable=False, index=True)
    issue_date = Column(Date, nullable=False, index=True)
    maturity_date = Column(Date, nullable=False, index=True)
    interest_rate = Column(DECIMAL(5, 2), nullable=False)
    face_value = Column(DECIMAL(15, 2), nullable=False)
    total_amount = Column(DECIMAL(20, 2), nullable=False)
    minimum_investment = Column(DECIMAL(15, 2), nullable=False)
    maximum_investment = Column(DECIMAL(15, 2))
    interest_frequency = Column(Enum(InterestFrequencyEnum), nullable=False)
    status = Column(Enum(SeriesStatusEnum), default=SeriesStatusEnum.draft, index=True)
    security_type = Column(String(100))
    credit_rating = Column(String(50))
    lock_in_period = Column(Integer)
    description = Column(Text)
    terms_conditions = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(255))
    approved_by = Column(String(255))
    approved_at = Column(TIMESTAMP, nullable=True)


# ============================================
# TABLE 5: SERIES DOCUMENTS
# ============================================

class SeriesDocument(Base):
    __tablename__ = "series_documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    document_type = Column(Enum(DocumentTypeEnum), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    uploaded_by = Column(String(255))


# ============================================
# TABLE 6: SERIES APPROVALS
# ============================================

class SeriesApproval(Base):
    __tablename__ = "series_approvals"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    approver_name = Column(String(255), nullable=False, index=True)
    approver_role = Column(String(50), nullable=False)
    action = Column(Enum('approved', 'rejected', name='approval_action'), nullable=False)
    comments = Column(Text)
    approved_at = Column(TIMESTAMP, server_default=func.current_timestamp())


# ============================================
# TABLE 7: INVESTORS
# ============================================

class Investor(Base):
    __tablename__ = "investors"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(String(50), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), index=True)
    phone = Column(String(20), index=True)
    pan_number = Column(String(20))
    aadhar_number = Column(String(20))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    bank_name = Column(String(255))
    account_number = Column(String(50))
    ifsc_code = Column(String(20))
    account_holder_name = Column(String(255))
    kyc_status = Column(Enum(KYCStatusEnum), default=KYCStatusEnum.pending, index=True)
    status = Column(Enum(InvestorStatusEnum), default=InvestorStatusEnum.active, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(255))


# ============================================
# TABLE 8: INVESTMENTS
# ============================================

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey('investors.id', ondelete='CASCADE'), nullable=False, index=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(DECIMAL(15, 2), nullable=False)
    units = Column(Integer, nullable=False)
    investment_date = Column(Date, nullable=False, index=True)
    date_transferred = Column(Date)
    date_received = Column(Date)
    status = Column(Enum(InvestmentStatusEnum), default=InvestmentStatusEnum.pending, index=True)
    payment_mode = Column(String(50))
    transaction_reference = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


# ============================================
# TABLE 9: INVESTOR DOCUMENTS
# ============================================

class InvestorDocument(Base):
    __tablename__ = "investor_documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey('investors.id', ondelete='CASCADE'), nullable=False, index=True)
    document_type = Column(Enum(InvestorDocumentTypeEnum), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    uploaded_by = Column(String(255))


# ============================================
# TABLE 10: INVESTOR SERIES
# ============================================

class InvestorSeries(Base):
    __tablename__ = "investor_series"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey('investors.id', ondelete='CASCADE'), nullable=False, index=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    status = Column(Enum(InvestorSeriesStatusEnum), default=InvestorSeriesStatusEnum.active, index=True)
    exit_date = Column(Date, nullable=True)
    exit_amount = Column(DECIMAL(15, 2), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


# ============================================
# TABLE 11: INTEREST PAYOUTS
# ============================================

class InterestPayout(Base):
    __tablename__ = "interest_payouts"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investor_id = Column(Integer, ForeignKey('investors.id', ondelete='CASCADE'), nullable=False, index=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    investment_id = Column(Integer, ForeignKey('investments.id', ondelete='CASCADE'), nullable=False)
    payout_date = Column(Date, nullable=False, index=True)
    amount = Column(DECIMAL(15, 2), nullable=False)
    status = Column(Enum(PayoutStatusEnum), default=PayoutStatusEnum.pending, index=True)
    payment_reference = Column(String(255))
    remarks = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    processed_by = Column(String(255))
    processed_at = Column(TIMESTAMP, nullable=True)


# ============================================
# TABLE 12: COMPLIANCE MASTER ITEMS
# ============================================

class ComplianceMasterItem(Base):
    __tablename__ = "compliance_master_items"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    item_name = Column(String(255), nullable=False)
    description = Column(Text)
    frequency = Column(Enum(ComplianceFrequencyEnum), nullable=False, index=True)
    category = Column(String(100), index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


# ============================================
# TABLE 13: SERIES COMPLIANCE STATUS
# ============================================

class SeriesComplianceStatus(Base):
    __tablename__ = "series_compliance_status"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    compliance_item_id = Column(Integer, ForeignKey('compliance_master_items.id', ondelete='CASCADE'), nullable=False)
    due_date = Column(Date, nullable=False, index=True)
    status = Column(Enum(ComplianceStatusEnum), default=ComplianceStatusEnum.pending, index=True)
    completed_date = Column(Date, nullable=True)
    remarks = Column(Text)
    completed_by = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())


# ============================================
# TABLE 14: COMPLIANCE DOCUMENTS
# ============================================

class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='CASCADE'), nullable=False, index=True)
    compliance_status_id = Column(Integer, ForeignKey('series_compliance_status.id', ondelete='CASCADE'), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)
    uploaded_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    uploaded_by = Column(String(255))


# ============================================
# TABLE 15: GRIEVANCES
# ============================================

class Grievance(Base):
    __tablename__ = "grievances"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    grievance_type = Column(Enum(GrievanceTypeEnum), nullable=False, index=True)
    investor_id = Column(Integer, ForeignKey('investors.id', ondelete='SET NULL'), nullable=True, index=True)
    series_id = Column(Integer, ForeignKey('ncd_series.id', ondelete='SET NULL'), nullable=True, index=True)
    category = Column(String(100))
    priority = Column(Enum(GrievancePriorityEnum), default=GrievancePriorityEnum.medium, index=True)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(GrievanceStatusEnum), default=GrievanceStatusEnum.open, index=True)
    resolution = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(255))
    assigned_to = Column(String(255))
    resolved_at = Column(TIMESTAMP, nullable=True)
    resolved_by = Column(String(255))


# ============================================
# TABLE 16: COMMUNICATION HISTORY
# ============================================

class CommunicationHistory(Base):
    __tablename__ = "communication_history"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(Enum(CommunicationTypeEnum), nullable=False, index=True)
    recipient_name = Column(String(255), nullable=False)
    recipient_contact = Column(String(255), nullable=False)
    investor_id = Column(String(50), nullable=True, index=True)
    series_name = Column(String(255), nullable=True)
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(Enum(CommunicationStatusEnum), default=CommunicationStatusEnum.Pending, index=True)
    error_message = Column(Text, nullable=True)
    message_id = Column(String(255), nullable=True)
    sent_by = Column(String(255), nullable=False)
    sent_by_role = Column(String(50), nullable=False)
    sent_at = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)


# ============================================
# TABLE 17: COMMUNICATION TEMPLATES
# ============================================

class CommunicationTemplate(Base):
    __tablename__ = "communication_templates"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(Enum(CommunicationTypeEnum), nullable=False, index=True)
    subject = Column(String(500), nullable=True, comment='For emails only')
    content = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())
    updated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), onupdate=func.current_timestamp())
    created_by = Column(String(255), nullable=True)


# ============================================
# TABLE 18: REPORT LOGS
# ============================================

class ReportLog(Base):
    __tablename__ = "report_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    report_type = Column(String(100), nullable=False, index=True)
    report_name = Column(String(255), nullable=False)
    generated_by = Column(String(255), nullable=False, index=True)
    generated_at = Column(TIMESTAMP, server_default=func.current_timestamp(), index=True)
    parameters = Column(JSON)
    file_path = Column(String(500))
    status = Column(Enum(ReportStatusEnum), default=ReportStatusEnum.success)
    error_message = Column(Text)
