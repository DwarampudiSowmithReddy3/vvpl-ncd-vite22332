from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


# User Models
class UserRole(str, Enum):
    FINANCE_EXECUTIVE = "Finance Executive"
    FINANCE_MANAGER = "Finance Manager"
    COMPLIANCE_BASE = "Compliance Base"
    COMPLIANCE_OFFICER = "Compliance Officer"
    INVESTOR_RELATIONSHIP_EXECUTIVE = "Investor Relationship Executive"
    INVESTOR_RELATIONSHIP_MANAGER = "Investor Relationship Manager"
    BOARD_MEMBER_BASE = "Board Member Base"
    BOARD_MEMBER_HEAD = "Board Member Head"
    ADMIN = "Admin"
    SUPER_ADMIN = "Super Admin"
    INVESTOR = "Investor"


class UserBase(BaseModel):
    user_id: str
    username: str
    full_name: str
    email: EmailStr
    phone: str
    role: UserRole


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    is_active: bool = True


class UserInDB(UserResponse):
    password_hash: str


# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


# Audit Log Models
class AuditLogCreate(BaseModel):
    action: str
    admin_name: str
    admin_role: str
    details: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None


class AuditLogResponse(BaseModel):
    id: int
    action: str
    admin_name: str
    admin_role: str
    details: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    timestamp: datetime


# Response Models
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    message: str
    success: bool = False
    error_code: Optional[str] = None


# NCD Series Models
class SecurityType(str, Enum):
    SECURED = "Secured"
    UNSECURED = "Unsecured"


class SeriesStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    UPCOMING = "upcoming"
    ACCEPTING = "accepting"
    ACTIVE = "active"
    MATURED = "matured"


class DocumentType(str, Enum):
    TERM_SHEET = "term_sheet"
    OFFER_DOCUMENT = "offer_document"
    BOARD_RESOLUTION = "board_resolution"
    OTHER = "other"


class SeriesCreate(BaseModel):
    name: str
    series_code: str
    security_type: SecurityType
    status: SeriesStatus
    debenture_trustee_name: str
    investors_size: int
    issue_date: str
    tenure: int
    maturity_date: str
    lock_in_date: Optional[str] = None
    subscription_start_date: str
    subscription_end_date: str
    release_date: Optional[str] = None
    series_start_date: Optional[str] = None  # NEW FIELD
    min_subscription_percentage: float
    face_value: float
    min_investment: float
    target_amount: float
    total_issue_size: float
    interest_rate: float
    credit_rating: str
    interest_frequency: str
    interest_payment_day: int = 15  # NEW FIELD - Day of month when interest is paid (1-31)
    description: Optional[str] = None
    created_by: str


class SeriesUpdate(BaseModel):
    name: Optional[str] = None
    security_type: Optional[SecurityType] = None
    status: Optional[SeriesStatus] = None
    debenture_trustee_name: Optional[str] = None
    investors_size: Optional[int] = None
    issue_date: Optional[str] = None
    tenure: Optional[int] = None
    maturity_date: Optional[str] = None
    lock_in_date: Optional[str] = None
    subscription_start_date: Optional[str] = None
    subscription_end_date: Optional[str] = None
    release_date: Optional[str] = None
    series_start_date: Optional[str] = None  # NEW FIELD
    min_subscription_percentage: Optional[float] = None
    face_value: Optional[float] = None
    min_investment: Optional[float] = None
    target_amount: Optional[float] = None
    total_issue_size: Optional[float] = None
    interest_rate: Optional[float] = None
    credit_rating: Optional[str] = None
    interest_frequency: Optional[str] = None
    interest_payment_day: Optional[int] = None  # NEW FIELD - Day of month when interest is paid
    description: Optional[str] = None


class SeriesResponse(BaseModel):
    id: int
    name: str
    series_code: str
    security_type: str
    status: str
    debenture_trustee_name: str
    investors_size: int
    issue_date: str
    tenure: int
    maturity_date: str
    lock_in_date: Optional[str] = None
    subscription_start_date: str
    subscription_end_date: str
    release_date: Optional[str] = None
    series_start_date: Optional[str] = None  # NEW FIELD
    min_subscription_percentage: float
    face_value: float
    min_investment: float
    target_amount: float
    total_issue_size: float
    interest_rate: float
    credit_rating: str
    interest_frequency: str
    interest_payment_day: int = 15  # NEW FIELD - Day of month when interest is paid
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    is_active: bool
    funds_raised: float
    progress_percentage: float


class SeriesEnhancedResponse(SeriesResponse):
    investor_count: int
    days_until_maturity: Optional[int] = None
    days_until_lock_in: Optional[int] = None
    subscription_open: bool


class SeriesDocumentCreate(BaseModel):
    series_id: int
    document_type: DocumentType
    file_name: str
    file_path: str
    uploaded_by: str


class SeriesDocumentResponse(BaseModel):
    id: int
    series_id: int
    document_type: str
    file_name: str
    file_path: str
    uploaded_by: str
    uploaded_at: datetime
    # Signed URL for downloading the document
    download_url: Optional[str] = None


class SeriesWithDocuments(SeriesResponse):
    documents: list[SeriesDocumentResponse]


class SeriesComplete(SeriesEnhancedResponse):
    documents: list[SeriesDocumentResponse]


# Utility Models for Series
class StatusInfo(BaseModel):
    status: str
    label: str
    color: str


class FormattedCurrency(BaseModel):
    value: float
    formatted: str


class FormattedDate(BaseModel):
    value: str
    formatted: str


# Investor Models
class KYCStatus(str, Enum):
    PENDING = "Pending"
    COMPLETED = "Completed"
    REJECTED = "Rejected"


class InvestorStatus(str, Enum):
    ACTIVE = "active"
    DELETED = "deleted"


class DocumentTypeEnum(str, Enum):
    PAN_DOCUMENT = "pan_document"
    AADHAAR_DOCUMENT = "aadhaar_document"
    CANCELLED_CHEQUE = "cancelled_cheque"
    FORM_15G_15H = "form_15g_15h"
    DIGITAL_SIGNATURE = "digital_signature"


class InvestmentStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class InvestorCreate(BaseModel):
    investor_id: str
    full_name: str
    email: EmailStr
    phone: str
    dob: str
    residential_address: str
    correspondence_address: Optional[str] = None
    pan: str
    aadhaar: str
    bank_name: str
    account_number: str
    ifsc_code: str
    occupation: str
    kyc_status: KYCStatus = KYCStatus.PENDING
    source_of_funds: str
    is_active: bool = True
    nominee_name: Optional[str] = None
    nominee_relationship: Optional[str] = None
    nominee_mobile: Optional[str] = None
    nominee_email: Optional[EmailStr] = None
    nominee_address: Optional[str] = None


class InvestorUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    residential_address: Optional[str] = None
    correspondence_address: Optional[str] = None
    pan: Optional[str] = None
    aadhaar: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    occupation: Optional[str] = None
    kyc_status: Optional[KYCStatus] = None
    source_of_funds: Optional[str] = None
    is_active: Optional[bool] = None
    nominee_name: Optional[str] = None
    nominee_relationship: Optional[str] = None
    nominee_mobile: Optional[str] = None
    nominee_email: Optional[EmailStr] = None
    nominee_address: Optional[str] = None


class InvestorResponse(BaseModel):
    id: int
    investor_id: str
    full_name: str
    email: str
    phone: str
    dob: str
    residential_address: str
    correspondence_address: Optional[str] = None
    pan: str
    aadhaar: str
    bank_name: str
    account_number: str
    ifsc_code: str
    occupation: str
    kyc_status: str
    source_of_funds: str
    is_active: bool
    nominee_name: Optional[str] = None
    nominee_relationship: Optional[str] = None
    nominee_mobile: Optional[str] = None
    nominee_email: Optional[str] = None
    nominee_address: Optional[str] = None
    total_investment: float
    date_joined: datetime
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class InvestorDocumentResponse(BaseModel):
    id: int
    investor_id: int
    document_type: str
    file_name: str
    file_path: str
    file_size: Optional[int] = None
    uploaded_at: datetime
    # Signed URL for downloading the document
    download_url: Optional[str] = None


class InvestmentCreate(BaseModel):
    investor_id: int
    series_id: int
    amount: float
    date_transferred: str
    date_received: str
    payment_document_path: Optional[str] = None


class InvestmentCreateRequest(BaseModel):
    """Investment creation without investor_id (comes from URL path)"""
    series_id: int
    amount: float
    date_transferred: str
    date_received: str


class InvestmentResponse(BaseModel):
    id: int
    investor_id: int
    series_id: int
    amount: float
    date_transferred: str
    date_received: str
    payment_document_path: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None


class InvestorWithDetails(InvestorResponse):
    documents: list[InvestorDocumentResponse] = []
    investments: list[InvestmentResponse] = []
    series: list[str] = []


class InvestmentValidationRequest(BaseModel):
    investor_id: str
    series_id: int
    amount: float


class InvestorSeriesResponse(BaseModel):
    id: int
    investor_id: int
    series_id: int
    total_invested: float
    investment_count: int
    first_investment_date: Optional[datetime] = None
    last_investment_date: Optional[datetime] = None


# Communication Models
class CommunicationType(str, Enum):
    SMS = "SMS"
    EMAIL = "Email"


class CommunicationStatus(str, Enum):
    SUCCESS = "Success"
    FAILED = "Failed"
    PENDING = "Pending"


class SendMessageRequest(BaseModel):
    type: CommunicationType
    series_ids: list[int]
    investor_ids: list[str]  # List of investor_id strings
    message: str
    subject: Optional[str] = None  # For emails


class CommunicationHistoryResponse(BaseModel):
    id: int
    type: str
    recipient_name: str
    recipient_contact: str
    investor_id: Optional[str] = None
    series_name: Optional[str] = None
    subject: Optional[str] = None
    message: str
    status: str
    error_message: Optional[str] = None
    message_id: Optional[str] = None
    sent_by: str
    sent_by_role: Optional[str] = None
    sent_at: datetime


class BulkMessageResponse(BaseModel):
    total_sent: int
    successful: int
    failed: int
    details: list[dict]


# Report Log Models
class ReportType(str, Enum):
    PDF = "PDF"
    EXCEL = "Excel"
    CSV = "CSV"


class ReportStatus(str, Enum):
    SUCCESS = "success"
    FAILED = "failed"
    IN_PROGRESS = "in_progress"


class ReportLogCreate(BaseModel):
    report_name: str
    report_type: ReportType
    user_id: int
    user_name: str
    user_role: str
    report_filters: Optional[Dict[str, Any]] = None
    record_count: Optional[int] = 0
    file_size_kb: Optional[float] = None
    generation_time_ms: Optional[int] = None
    status: ReportStatus = ReportStatus.SUCCESS
    error_message: Optional[str] = None


class ReportLogResponse(BaseModel):
    id: int
    report_name: str
    report_type: str
    user_id: int
    user_name: str
    user_role: str
    report_filters: Optional[Dict[str, Any]] = None
    record_count: int
    file_size_kb: Optional[float] = None
    generation_time_ms: Optional[int] = None
    status: str
    error_message: Optional[str] = None
    generated_at: datetime


# Grievance Management Models
class GrievanceType(str, Enum):
    INVESTOR = "investor"
    TRUSTEE = "trustee"


class GrievanceStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class GrievancePriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class GrievanceCategory(str, Enum):
    GENERAL = "General"
    PAYMENT_ISSUE = "Payment Issue"
    ACCOUNT_ACCESS = "Account Access"
    DOCUMENTATION = "Documentation"
    INTEREST_CALCULATION = "Interest Calculation"
    KYC_RELATED = "KYC Related"
    TECHNICAL_ISSUE = "Technical Issue"
    OTHER = "Other"


class GrievanceCreate(BaseModel):
    grievance_type: GrievanceType
    investor_id: Optional[str] = None  # Required for investor grievances
    trustee_name: Optional[str] = None  # Required for trustee grievances
    series_id: Optional[int] = None
    subject: str
    description: Optional[str] = None
    category: GrievanceCategory
    priority: GrievancePriority = GrievancePriority.MEDIUM


class GrievanceUpdate(BaseModel):
    subject: Optional[str] = None
    description: Optional[str] = None
    category: Optional[GrievanceCategory] = None
    priority: Optional[GrievancePriority] = None


class GrievanceStatusUpdate(BaseModel):
    status: GrievanceStatus
    resolution_comment: Optional[str] = None


class GrievanceResponse(BaseModel):
    id: int
    grievance_id: str
    grievance_type: str
    investor_id: Optional[str] = None
    trustee_name: Optional[str] = None
    investor_name: Optional[str] = None
    series_id: Optional[int] = None
    series_name: Optional[str] = None
    subject: str
    description: Optional[str] = None
    category: str
    priority: str
    status: str
    resolution_comment: Optional[str] = None
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    created_by: str
    created_by_role: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    is_active: bool


class GrievanceStatsResponse(BaseModel):
    total: int
    pending: int
    in_progress: int
    resolved: int
    closed: int
    resolution_rate: float
    by_category: dict
    by_priority: dict


# ============================================
# INTEREST PAYOUT MODELS
# ============================================

class PayoutStatus(str, Enum):
    PAID = "Paid"
    PENDING = "Pending"
    SCHEDULED = "Scheduled"


class PayoutCreate(BaseModel):
    investor_id: int
    series_id: int
    payout_month: str  # e.g., "February 2026"
    payout_date: str  # e.g., "15-Feb-2026"
    amount: float
    status: PayoutStatus = PayoutStatus.SCHEDULED


class PayoutUpdate(BaseModel):
    status: Optional[PayoutStatus] = None
    payout_month: Optional[str] = None
    payout_date: Optional[str] = None
    paid_date: Optional[str] = None


class PayoutResponse(BaseModel):
    id: int
    investor_id: int
    investor_name: str
    investor_code: str
    series_id: int
    series_name: str
    payout_month: str
    payout_date: str
    amount: float
    status: str
    paid_date: Optional[str] = None
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class PayoutImportRow(BaseModel):
    investor_id: str  # Investor code like "INV001"
    series_name: str
    status: str
    interest_month: Optional[str] = None
    interest_date: Optional[str] = None


class PayoutImportResponse(BaseModel):
    success: bool
    message: str
    updated_count: int
    error_count: int
    errors: list = []
