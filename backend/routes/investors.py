"""
Investor management routes
Handles investor CRUD operations, KYC documents, and investments
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Request
from typing import List, Optional
from datetime import datetime
from database import get_db
from models import (
    InvestorCreate, InvestorUpdate, InvestorResponse, InvestorWithDetails,
    InvestmentCreate, InvestmentResponse, InvestorDocumentResponse,
    MessageResponse, InvestmentValidationRequest
)
from auth import get_current_user
import logging
import json

router = APIRouter(prefix="/investors", tags=["investors"])
logger = logging.getLogger(__name__)


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    if request.client:
        return request.client.host
    return "unknown"


def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")


def create_audit_log(db, action: str, admin_name: str, admin_role: str, 
                     details: str, entity_type: str, entity_id: str, 
                     changes: dict = None, ip_address: str = None, user_agent: str = None):
    """Helper function to create audit log entries with IP tracking"""
    try:
        changes_json = json.dumps(changes) if changes else None
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, 
                               entity_type, entity_id, changes, timestamp, ip_address, user_agent)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            action,
            admin_name,
            admin_role,
            details,
            entity_type,
            entity_id,
            changes_json,
            datetime.now(),
            ip_address,
            user_agent
        ))
        
        logger.info(f"✅ Audit log created: {action} by {admin_name} from IP {ip_address}")
        
    except Exception as e:
        logger.error(f"❌ Failed to create audit log: {e}")
        # Don't fail the main operation if audit logging fails


# Helper function to convert date strings
def date_to_str(date_obj):
    """Convert date object to string format"""
    if date_obj is None:
        return None
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime('%d/%m/%Y')

@router.post("", response_model=InvestorResponse)
async def create_investor(
    investor: InvestorCreate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Create a new investor"""
    try:
        # COMPREHENSIVE DUPLICATE CHECKS - Check all unique fields
        
        # Check if investor_id already exists
        check_investor_id = "SELECT id, full_name FROM investors WHERE investor_id = %s"
        existing_id = db.execute_query(check_investor_id, (investor.investor_id,))
        if existing_id:
            raise HTTPException(
                status_code=400,
                detail=f"Investor ID '{investor.investor_id}' already exists (used by {existing_id[0]['full_name']})"
            )
        
        # Check if email already exists
        check_email = "SELECT id, full_name, investor_id FROM investors WHERE email = %s"
        existing_email = db.execute_query(check_email, (investor.email,))
        if existing_email:
            raise HTTPException(
                status_code=400,
                detail=f"Email '{investor.email}' already exists (used by {existing_email[0]['full_name']}, ID: {existing_email[0]['investor_id']})"
            )
        
        # Check if phone already exists
        check_phone = "SELECT id, full_name, investor_id FROM investors WHERE phone = %s"
        existing_phone = db.execute_query(check_phone, (investor.phone,))
        if existing_phone:
            raise HTTPException(
                status_code=400,
                detail=f"Phone number '{investor.phone}' already exists (used by {existing_phone[0]['full_name']}, ID: {existing_phone[0]['investor_id']})"
            )
        
        # Check if PAN already exists
        check_pan = "SELECT id, full_name, investor_id FROM investors WHERE pan = %s"
        existing_pan = db.execute_query(check_pan, (investor.pan,))
        if existing_pan:
            raise HTTPException(
                status_code=400,
                detail=f"PAN '{investor.pan}' already exists (used by {existing_pan[0]['full_name']}, ID: {existing_pan[0]['investor_id']})"
            )
        
        # Check if Aadhaar already exists
        check_aadhaar = "SELECT id, full_name, investor_id FROM investors WHERE aadhaar = %s"
        existing_aadhaar = db.execute_query(check_aadhaar, (investor.aadhaar,))
        if existing_aadhaar:
            raise HTTPException(
                status_code=400,
                detail=f"Aadhaar number already exists (used by {existing_aadhaar[0]['full_name']}, ID: {existing_aadhaar[0]['investor_id']})"
            )
        
        # Check if bank account number already exists
        check_account = "SELECT id, full_name, investor_id FROM investors WHERE account_number = %s"
        existing_account = db.execute_query(check_account, (investor.account_number,))
        if existing_account:
            raise HTTPException(
                status_code=400,
                detail=f"Bank account number '{investor.account_number}' already exists (used by {existing_account[0]['full_name']}, ID: {existing_account[0]['investor_id']})"
            )
        
        # Insert investor
        insert_query = """
        INSERT INTO investors (
            investor_id, full_name, email, phone, dob,
            residential_address, correspondence_address,
            pan, aadhaar, bank_name, account_number, ifsc_code,
            occupation, kyc_status, source_of_funds, is_active,
            nominee_name, nominee_relationship, nominee_mobile,
            nominee_email, nominee_address
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """
        
        db.execute_query(insert_query, (
            investor.investor_id, investor.full_name, investor.email,
            investor.phone, investor.dob, investor.residential_address,
            investor.correspondence_address, investor.pan, investor.aadhaar,
            investor.bank_name, investor.account_number, investor.ifsc_code,
            investor.occupation, investor.kyc_status.value, investor.source_of_funds,
            investor.is_active, investor.nominee_name, investor.nominee_relationship,
            investor.nominee_mobile, investor.nominee_email, investor.nominee_address
        ))
        
        # Get the created investor
        select_query = "SELECT * FROM investors WHERE investor_id = %s"
        result = db.execute_query(select_query, (investor.investor_id,))
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to create investor")
        
        investor_data = result[0]
        
        # CREATE AUDIT LOG
        create_audit_log(
            db=db,
            action="Created Investor",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Created new investor \"{investor.full_name}\" (ID: {investor.investor_id})",
            entity_type="Investor",
            entity_id=investor.investor_id,
            changes={
                "investor_id": investor.investor_id,
                "full_name": investor.full_name,
                "email": investor.email,
                "phone": investor.phone,
                "kyc_status": investor.kyc_status.value,
                "action": "investor_create"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        # Convert dates to strings
        investor_data['dob'] = date_to_str(investor_data['dob'])
        investor_data['date_joined'] = investor_data['date_joined'].isoformat() if investor_data['date_joined'] else None
        investor_data['created_at'] = investor_data['created_at'].isoformat() if investor_data['created_at'] else None
        investor_data['updated_at'] = investor_data['updated_at'].isoformat() if investor_data['updated_at'] else None
        
        logger.info(f"Created investor: {investor.investor_id}")
        return InvestorResponse(**investor_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating investor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("", response_model=List[InvestorResponse])
async def get_investors(
    status: Optional[str] = None,
    kyc_status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all investors with optional filters"""
    try:
        query = "SELECT * FROM investors WHERE 1=1"
        params = []
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        if kyc_status:
            query += " AND kyc_status = %s"
            params.append(kyc_status)
        
        query += " ORDER BY created_at DESC"
        
        results = db.execute_query(query, tuple(params) if params else None)
        
        # Convert dates to strings for each investor
        investors = []
        for inv in results:
            inv['dob'] = date_to_str(inv['dob'])
            inv['date_joined'] = inv['date_joined'].isoformat() if inv['date_joined'] else None
            inv['created_at'] = inv['created_at'].isoformat() if inv['created_at'] else None
            inv['updated_at'] = inv['updated_at'].isoformat() if inv['updated_at'] else None
            investors.append(InvestorResponse(**inv))
        
        return investors
        
    except Exception as e:
        logger.error(f"Error fetching investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SPECIFIC ROUTES (must come before /{investor_id})
# ============================================

@router.get("/generate-id")
async def generate_investor_id(
    current_user: dict = Depends(get_current_user)
):
    """
    Generate a unique investor ID
    Format: 10 random alphanumeric characters
    Ensures uniqueness by checking database
    """
    import random
    import string
    
    try:
        db = get_db()
        max_attempts = 10
        for attempt in range(max_attempts):
            # Generate random 10-character ID
            chars = string.ascii_uppercase + string.digits
            investor_id = ''.join(random.choice(chars) for _ in range(10))
            
            # Check if ID already exists
            check_query = "SELECT id FROM investors WHERE investor_id = %s"
            existing = db.execute_query(check_query, (investor_id,))
            
            if not existing:
                logger.info(f"Generated unique investor ID: {investor_id}")
                return {"investor_id": investor_id}
        
        # If we couldn't generate unique ID after max attempts
        raise HTTPException(
            status_code=500,
            detail="Failed to generate unique investor ID. Please try again."
        )
        
    except Exception as e:
        logger.error(f"Error generating investor ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def search_investors(
    q: Optional[str] = None,
    kyc_status: Optional[str] = None,
    series_name: Optional[str] = None,
    status: Optional[str] = "active",
    limit: Optional[int] = 100,
    offset: Optional[int] = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Advanced search and filter investors
    
    Parameters:
    - q: Search term (searches in name, email, investor_id)
    - kyc_status: Filter by KYC status (Completed, Pending, Rejected)
    - series_name: Filter by series name
    - status: Filter by status (active, inactive, deleted)
    - limit: Number of results to return
    - offset: Pagination offset
    
    Returns: Filtered list of investors with their series and investment data
    """
    try:
        db = get_db()
        
        # Build dynamic query - calculate LIFETIME total_investment from investments table
        # Show ALL series (including exited ones) in series_names
        base_query = """
        SELECT 
            i.id, i.investor_id, i.full_name, i.email, i.phone,
            i.kyc_status, i.status, i.is_active, i.date_joined,
            COALESCE((SELECT SUM(inv.amount) FROM investments inv WHERE inv.investor_id = i.id AND inv.status IN ('confirmed', 'cancelled')), 0) as total_investment,
            GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ',') as series_names
        FROM investors i
        LEFT JOIN investor_series isr ON i.id = isr.investor_id
        LEFT JOIN ncd_series s ON isr.series_id = s.id
        WHERE 1=1
        """
        
        params = []
        
        # Status filter
        if status and status != "all":
            if status == "active":
                base_query += " AND i.is_active = 1 AND i.status != 'deleted'"
            elif status == "inactive":
                base_query += " AND i.is_active = 0"
            elif status == "deleted":
                base_query += " AND i.status = 'deleted'"
        
        # Search filter
        if q:
            base_query += """ AND (
                i.full_name LIKE %s OR 
                i.email LIKE %s OR 
                i.investor_id LIKE %s
            )"""
            search_term = f"%{q}%"
            params.extend([search_term, search_term, search_term])
        
        # KYC status filter
        if kyc_status and kyc_status != "all":
            base_query += " AND i.kyc_status = %s"
            params.append(kyc_status)
        
        # Series filter
        if series_name and series_name != "all":
            base_query += " AND s.name = %s"
            params.append(series_name)
        
        # Group by and order
        base_query += """
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone,
                 i.kyc_status, i.status, i.is_active, i.date_joined
        ORDER BY i.date_joined DESC
        """
        
        # Add pagination
        base_query += " LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute query
        result = db.execute_query(base_query, tuple(params))
        
        # Transform results
        investors = []
        for row in result:
            # Parse series names
            series_list = []
            if row['series_names']:
                series_list = row['series_names'].split(',')
            
            investors.append({
                "id": row['id'],
                "investorId": row['investor_id'],  # Frontend expects investorId
                "investor_id": row['investor_id'],  # Keep for compatibility
                "name": row['full_name'],  # Frontend expects name
                "full_name": row['full_name'],  # Keep for compatibility
                "email": row['email'],
                "phone": row['phone'],
                "kycStatus": row['kyc_status'],  # Frontend expects kycStatus
                "kyc_status": row['kyc_status'],  # Keep for compatibility
                "status": row['status'],
                "is_active": bool(row['is_active']),
                "dateJoined": row['date_joined'].strftime('%d/%m/%Y') if row['date_joined'] else None,  # Frontend format
                "date_joined": row['date_joined'].isoformat() if row['date_joined'] else None,  # Keep for compatibility
                "investment": float(row['total_investment']) if row['total_investment'] else 0.0,  # Frontend expects investment
                "total_investment": float(row['total_investment']) if row['total_investment'] else 0.0,  # Keep for compatibility
                "series": series_list
            })
        
        # Get total count for pagination
        count_query = """
        SELECT COUNT(DISTINCT i.id) as total
        FROM investors i
        LEFT JOIN investor_series isr ON i.id = isr.investor_id
        LEFT JOIN ncd_series s ON isr.series_id = s.id
        WHERE 1=1
        """
        
        count_params = []
        
        if status and status != "all":
            if status == "active":
                count_query += " AND i.is_active = 1 AND i.status != 'deleted'"
            elif status == "inactive":
                count_query += " AND i.is_active = 0"
            elif status == "deleted":
                count_query += " AND i.status = 'deleted'"
        
        if q:
            count_query += """ AND (
                i.full_name LIKE %s OR 
                i.email LIKE %s OR 
                i.investor_id LIKE %s
            )"""
            search_term = f"%{q}%"
            count_params.extend([search_term, search_term, search_term])
        
        if kyc_status and kyc_status != "all":
            count_query += " AND i.kyc_status = %s"
            count_params.append(kyc_status)
        
        if series_name and series_name != "all":
            count_query += " AND s.name = %s"
            count_params.append(series_name)
        
        count_result = db.execute_query(count_query, tuple(count_params))
        total_count = count_result[0]['total'] if count_result else 0
        
        logger.info(f"Search returned {len(investors)} investors (total: {total_count})")
        return {
            "investors": investors,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + len(investors)) < total_count
        }
        
    except Exception as e:
        logger.error(f"Error searching investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# PATH PARAMETER ROUTES (must come after specific routes)
# ============================================

@router.get("/{investor_id}")
async def get_investor(
    investor_id: str,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Get investor details with documents and investments
    Returns data in BOTH snake_case (backend) and camelCase (frontend) formats
    Frontend should use this data directly without any transformation
    """
    try:
        # Get investor by investor_id (string like "INV001")
        investor_query = "SELECT * FROM investors WHERE investor_id = %s"
        investor_result = db.execute_query(investor_query, (investor_id,))
        
        if not investor_result:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        investor_data = investor_result[0]
        
        # Get the database ID for querying related tables
        db_id = investor_data['id']
        
        # Calculate LIFETIME total_investment from investments table (source of truth)
        # This includes both 'confirmed' (active) and 'cancelled' (exited) investments
        total_investment_query = """
        SELECT COALESCE(SUM(amount), 0) as total_investment
        FROM investments
        WHERE investor_id = %s AND status IN ('confirmed', 'cancelled')
        """
        total_investment_result = db.execute_query(total_investment_query, (db_id,))
        calculated_total_investment = float(total_investment_result[0]['total_investment']) if total_investment_result else 0.0
        
        # Override the stored total_investment with calculated value (source of truth)
        investor_data['total_investment'] = calculated_total_investment
        db_id = investor_data['id']
        
        # Get documents
        docs_query = "SELECT * FROM investor_documents WHERE investor_id = %s"
        docs_result = db.execute_query(docs_query, (investor_id,))
        documents = []
        
        # Import S3 service for generating signed URLs
        from s3_service import s3_service
        
        for doc in docs_result:
            documents.append({
                "id": doc['id'],
                "investor_id": doc['investor_id'],
                "document_type": doc['document_type'],
                "file_name": doc['file_name'],
                "file_path": doc.get('file_path', ''),
                "file_size": doc.get('file_size'),
                "uploaded_at": doc['uploaded_at'].isoformat() if doc['uploaded_at'] else None,
                "download_url": None  # TODO: Generate signed URL if needed
            })
        
        # Get AGGREGATED investments from investor_series table (one row per series)
        # This shows total invested per series, not individual installments
        # INCLUDES exited series for Recent Transactions history
        # CRITICAL: Use status field to determine if active or exited (NOT total_invested)
        investments_query = """
        SELECT 
            isr.id,
            isr.investor_id,
            isr.series_id,
            s.name as series_name,
            isr.total_invested as amount,
            isr.investment_count,
            isr.first_investment_date,
            isr.last_investment_date,
            isr.created_at,
            isr.updated_at,
            isr.status
        FROM investor_series isr
        LEFT JOIN ncd_series s ON isr.series_id = s.id
        WHERE isr.investor_id = %s 
        ORDER BY isr.last_investment_date DESC
        """
        investments_result = db.execute_query(investments_query, (db_id,))
        investments = []
        for inv in investments_result:
            investments.append({
                "id": inv['id'],
                "investor_id": inv['investor_id'],
                "series_id": inv['series_id'],
                "series_name": inv.get('series_name', 'Unknown'),
                "amount": float(inv['amount']) if inv['amount'] else 0.0,
                "investment_count": inv['investment_count'],  # Number of installments
                "date_transferred": inv['first_investment_date'].strftime('%Y-%m-%d') if inv['first_investment_date'] else None,
                "date_received": inv['first_investment_date'].strftime('%Y-%m-%d') if inv['first_investment_date'] else None,
                "first_investment_date": inv['first_investment_date'].strftime('%Y-%m-%d') if inv['first_investment_date'] else None,
                "last_investment_date": inv['last_investment_date'].strftime('%Y-%m-%d') if inv['last_investment_date'] else None,
                "payment_document_path": None,  # Not applicable for aggregated view
                "status": inv['status'],
                "created_at": inv['created_at'].isoformat() if inv['created_at'] else None,
                "updated_at": inv['updated_at'].isoformat() if inv['updated_at'] else None
            })
        
        # Get series names (use database ID) - ONLY active series (exclude exited)
        series_query = """
        SELECT DISTINCT s.name 
        FROM investor_series isr
        JOIN ncd_series s ON isr.series_id = s.id
        WHERE isr.investor_id = %s AND isr.status = 'active'
        """
        series_result = db.execute_query(series_query, (db_id,))
        series = [s['name'] for s in series_result]
        
        # Format dates for display
        date_joined_formatted = investor_data['date_joined'].strftime('%d/%m/%Y') if investor_data['date_joined'] else 'N/A'
        dob_formatted = investor_data['dob'].strftime('%d/%m/%Y') if investor_data['dob'] else 'N/A'
        
        # Calculate active holdings (exclude exited series where amount = 0)
        active_holdings = len([inv for inv in investments if inv['status'] == 'confirmed' and inv['amount'] > 0])
        
        # Transform KYC documents for frontend
        kyc_documents = []
        for doc in documents:
            kyc_documents.append({
                "name": doc['document_type'].replace('_', ' ').title(),
                "uploadedDate": doc['uploaded_at'][:10] if doc['uploaded_at'] else 'N/A',
                "status": investor_data['kyc_status'],
                "fileName": doc['file_name']
            })
        
        # Transform investments to holdings for frontend with lock-in and maturity status
        # ONLY show active holdings (exclude exited series using status field)
        holdings = []
        for inv in investments:
            if inv['status'] == 'active':
                # Get series details for lock-in and maturity calculations
                series_detail_query = """
                SELECT 
                    lock_in_date,
                    maturity_date,
                    status as series_status
                FROM ncd_series
                WHERE id = %s
                """
                series_detail = db.execute_query(series_detail_query, (inv['series_id'],))
                
                if series_detail and len(series_detail) > 0:
                    series_info = series_detail[0]
                    lock_in_date = series_info['lock_in_date']
                    maturity_date = series_info['maturity_date']
                    series_status = series_info['series_status']
                    
                    # Calculate if lock-in period is completed
                    from datetime import datetime, date
                    today = date.today()
                    
                    is_lock_in_completed = False
                    if lock_in_date:
                        if isinstance(lock_in_date, str):
                            lock_in_date_obj = datetime.strptime(lock_in_date, '%Y-%m-%d').date()
                        else:
                            lock_in_date_obj = lock_in_date
                        is_lock_in_completed = today > lock_in_date_obj
                    else:
                        # If no lock-in date, consider it completed
                        is_lock_in_completed = True
                    
                    # Calculate if series has matured
                    is_matured = False
                    if maturity_date:
                        if isinstance(maturity_date, str):
                            maturity_date_obj = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                        else:
                            maturity_date_obj = maturity_date
                        is_matured = today >= maturity_date_obj
                    
                    # Format lock-in date for display
                    lock_in_date_str = None
                    if lock_in_date:
                        if isinstance(lock_in_date, str):
                            lock_in_date_str = lock_in_date
                        else:
                            lock_in_date_str = lock_in_date.strftime('%Y-%m-%d')
                    
                    holdings.append({
                        "series": inv['series_name'],
                        "purchaseDate": inv['first_investment_date'] or 'N/A',
                        "investment": inv['amount'],
                        "investmentCount": inv['investment_count'],  # Number of installments
                        "firstInvestmentDate": inv['first_investment_date'],
                        "lastInvestmentDate": inv['last_investment_date'],
                        "nextPayout": 'N/A',  # TODO: Calculate based on series data
                        "status": 'Active',
                        "isLockInCompleted": is_lock_in_completed,
                        "lockInDate": lock_in_date_str,
                        "isMatured": is_matured,
                        "maturityDate": maturity_date.strftime('%Y-%m-%d') if maturity_date else None
                    })
                else:
                    # Fallback if series not found
                    holdings.append({
                        "series": inv['series_name'],
                        "purchaseDate": inv['first_investment_date'] or 'N/A',
                        "investment": inv['amount'],
                        "investmentCount": inv['investment_count'],
                        "firstInvestmentDate": inv['first_investment_date'],
                        "lastInvestmentDate": inv['last_investment_date'],
                        "nextPayout": 'N/A',
                        "status": 'Active',
                        "isLockInCompleted": True,  # Default to true if no series data
                        "lockInDate": None,
                        "isMatured": False,
                        "maturityDate": None
                    })
        
        # Transform aggregated investments to transactions for frontend
        # SHOW ALL transactions including exited series (for Recent Transactions history)
        transactions = []
        for inv in investments:
            # Show transaction type based on status field
            transactions.append({
                "type": "Investment" if inv['status'] == 'active' else "Exit",
                "series": inv['series_name'],
                "date": inv['first_investment_date'],
                "amount": inv['amount']
            })
        
        # Return data in BOTH formats - backend (snake_case) AND frontend (camelCase)
        # Frontend can use this directly without any transformation
        return {
            # Backend format (snake_case) - for compatibility
            "id": investor_data['id'],
            "investor_id": investor_data['investor_id'],
            "full_name": investor_data['full_name'],
            "email": investor_data['email'],
            "phone": investor_data['phone'],
            "dob": investor_data['dob'].strftime('%Y-%m-%d') if investor_data['dob'] else None,
            "residential_address": investor_data['residential_address'],
            "correspondence_address": investor_data.get('correspondence_address'),
            "pan": investor_data['pan'],
            "aadhaar": investor_data['aadhaar'],
            "bank_name": investor_data['bank_name'],
            "account_number": investor_data['account_number'],
            "ifsc_code": investor_data['ifsc_code'],
            "occupation": investor_data['occupation'],
            "kyc_status": investor_data['kyc_status'],
            "source_of_funds": investor_data['source_of_funds'],
            "is_active": bool(investor_data['is_active']),
            "nominee_name": investor_data.get('nominee_name'),
            "nominee_relationship": investor_data.get('nominee_relationship'),
            "nominee_mobile": investor_data.get('nominee_mobile'),
            "nominee_email": investor_data.get('nominee_email'),
            "nominee_address": investor_data.get('nominee_address'),
            "total_investment": float(investor_data['total_investment']) if investor_data['total_investment'] else 0.0,
            "date_joined": investor_data['date_joined'].isoformat() if investor_data['date_joined'] else None,
            "status": investor_data['status'],
            "created_at": investor_data['created_at'].isoformat() if investor_data['created_at'] else None,
            "updated_at": investor_data['updated_at'].isoformat() if investor_data['updated_at'] else None,
            
            # Frontend format (camelCase) - ready to use directly
            "investorId": investor_data['investor_id'],
            "name": investor_data['full_name'],
            "kycStatus": investor_data['kyc_status'],
            "dateJoined": date_joined_formatted,
            "address": investor_data['residential_address'] or 'N/A',
            "residentialAddress": investor_data['residential_address'],
            "correspondenceAddress": investor_data.get('correspondence_address'),
            "bankAccount": f"{investor_data['bank_name']} - ****{investor_data['account_number'][-4:]}" if investor_data['bank_name'] and investor_data['account_number'] else 'N/A',
            "bankName": investor_data['bank_name'],
            "bankAccountNumber": investor_data['account_number'],
            "accountNumber": investor_data['account_number'],
            "ifscCode": investor_data['ifsc_code'],
            "totalInvestment": float(investor_data['total_investment']) if investor_data['total_investment'] else 0.0,
            "activeHoldings": active_holdings,
            "active": bool(investor_data['is_active']),
            "sourceOfFunds": investor_data['source_of_funds'],
            "nomineeName": investor_data.get('nominee_name'),
            "nomineeRelationship": investor_data.get('nominee_relationship'),
            "nomineeMobile": investor_data.get('nominee_mobile'),
            "nomineeEmail": investor_data.get('nominee_email'),
            "nomineeAddress": investor_data.get('nominee_address'),
            
            # Formatted data ready for frontend display
            "kycDocuments": kyc_documents,
            "holdings": holdings,
            "transactions": transactions,
            
            # Raw data arrays
            "documents": documents,
            "investments": investments,
            "series": series
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching investor details: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
        investments_result = db.execute_query(investments_query, (investor_id,))
        investments = []
        for inv in investments_result:
            inv['date_transferred'] = date_to_str(inv['date_transferred'])
            inv['date_received'] = date_to_str(inv['date_received'])
            inv['created_at'] = inv['created_at'].isoformat() if inv['created_at'] else None
            inv['updated_at'] = inv['updated_at'].isoformat() if inv['updated_at'] else None
            investments.append(InvestmentResponse(**inv))
        
        # Get series names
        series_query = """
        SELECT DISTINCT s.name 
        FROM investor_series isr
        JOIN ncd_series s ON isr.series_id = s.id
        WHERE isr.investor_id = %s
        """
        series_result = db.execute_query(series_query, (investor_id,))
        series = [s['name'] for s in series_result]
        
        return InvestorWithDetails(
            **investor_data,
            documents=documents,
            investments=investments,
            series=series
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching investor details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{investor_id}", response_model=InvestorResponse)
async def update_investor(
    investor_id: int,
    updates: InvestorUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Update investor information"""
    try:
        # Check if investor exists and get old data
        check_query = "SELECT * FROM investors WHERE id = %s"
        existing = db.execute_query(check_query, (investor_id,))
        
        if not existing:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        old_data = existing[0]
        
        # Build update query dynamically
        update_fields = []
        params = []
        changed_fields = {}
        
        for field, value in updates.dict(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = %s")
                params.append(value)
                # Track changes for audit log
                old_value = old_data.get(field)
                if old_value != value:
                    changed_fields[field] = {"old": str(old_value), "new": str(value)}
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        params.append(investor_id)
        update_query = f"UPDATE investors SET {', '.join(update_fields)} WHERE id = %s"
        
        db.execute_query(update_query, tuple(params))
        
        # Get updated investor
        select_query = "SELECT * FROM investors WHERE id = %s"
        result = db.execute_query(select_query, (investor_id,))
        
        investor_data = result[0]
        
        # CREATE AUDIT LOG
        create_audit_log(
            db=db,
            action="Updated Investor",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Updated investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']}) - Modified: {', '.join(changed_fields.keys())}",
            entity_type="Investor",
            entity_id=investor_data['investor_id'],
            changes={
                "investor_id": investor_data['investor_id'],
                "full_name": investor_data['full_name'],
                "changed_fields": changed_fields,
                "action": "investor_update"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        investor_data['dob'] = date_to_str(investor_data['dob'])
        investor_data['date_joined'] = investor_data['date_joined'].isoformat() if investor_data['date_joined'] else None
        investor_data['created_at'] = investor_data['created_at'].isoformat() if investor_data['created_at'] else None
        investor_data['updated_at'] = investor_data['updated_at'].isoformat() if investor_data['updated_at'] else None
        
        logger.info(f"Updated investor: {investor_id}")
        return InvestorResponse(**investor_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating investor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{investor_id}", response_model=MessageResponse)
async def delete_investor(
    investor_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Soft delete an investor (set status to 'deleted')"""
    try:
        # Check if investor exists and get data for audit log
        check_query = "SELECT * FROM investors WHERE id = %s"
        existing = db.execute_query(check_query, (investor_id,))
        
        if not existing:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        investor_data = existing[0]
        
        # Soft delete
        delete_query = "UPDATE investors SET status = 'deleted', is_active = 0 WHERE id = %s"
        db.execute_query(delete_query, (investor_id,))
        
        # CREATE AUDIT LOG
        create_audit_log(
            db=db,
            action="Deleted Investor",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Deleted investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']})",
            entity_type="Investor",
            entity_id=investor_data['investor_id'],
            changes={
                "investor_id": investor_data['investor_id'],
                "full_name": investor_data['full_name'],
                "email": investor_data['email'],
                "total_investment": str(investor_data.get('total_investment', 0)),
                "action": "investor_delete"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"Deleted investor: {investor_id}")
        return MessageResponse(message="Investor deleted successfully", success=True)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting investor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{investor_id}/investments", response_model=InvestmentResponse)
async def add_investment(
    investor_id: int,
    series_id: int = Form(...),
    amount: float = Form(...),
    date_transferred: str = Form(...),
    date_received: str = Form(...),
    payment_document: UploadFile = File(None),
    request: Request = None,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Add a new investment for an investor with payment document upload to S3"""
    try:
        # Verify investor exists and get investor details for audit log
        investor_check = "SELECT id, investor_id, full_name FROM investors WHERE id = %s AND status = 'active'"
        investor_result = db.execute_query(investor_check, (investor_id,))
        
        if not investor_result:
            raise HTTPException(status_code=404, detail="Investor not found or inactive")
        
        investor_data = investor_result[0]
        
        # Verify series exists and get series details for audit log
        series_check = "SELECT id, name, series_code, target_amount, total_issue_size FROM ncd_series WHERE id = %s"
        series_result = db.execute_query(series_check, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = series_result[0]
        
        # CRITICAL VALIDATION: Check if investment would exceed target amount
        # Calculate current funds raised for this series
        funds_raised_query = """
        SELECT COALESCE(SUM(amount), 0) as total_raised
        FROM investments
        WHERE series_id = %s AND status = 'confirmed'
        """
        funds_result = db.execute_query(funds_raised_query, (series_id,))
        current_funds_raised = float(funds_result[0]['total_raised']) if funds_result else 0.0
        
        # Get target amount
        target_amount = float(series_data['target_amount'])
        
        # Calculate remaining capacity
        remaining_capacity = target_amount - current_funds_raised
        
        # Check if new investment would exceed target
        if amount > remaining_capacity:
            if remaining_capacity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Series '{series_data['name']}' has reached its target amount of ₹{target_amount:,.2f}. No more investments can be accepted."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Investment amount ₹{amount:,.2f} exceeds remaining capacity of ₹{remaining_capacity:,.2f} for series '{series_data['name']}'. Maximum allowed investment is ₹{remaining_capacity:,.2f}."
                )
        
        # Handle payment document upload to S3 (OPTIONAL - won't fail if S3 not configured)
        payment_document_path = None
        if payment_document and payment_document.filename:
            try:
                from s3_service import upload_file_to_s3, s3_service
                
                # Check if S3 is configured
                if s3_service is None:
                    logger.warning("⚠️ S3 not configured - payment document will not be uploaded")
                    payment_document_path = None
                else:
                    # Generate S3 key: investments/{investor_id}/{series_code}/payment_{timestamp}_{filename}
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    file_extension = payment_document.filename.split('.')[-1] if '.' in payment_document.filename else 'pdf'
                    s3_key = f"investments/{investor_data['investor_id']}/{series_data['series_code']}/payment_{timestamp}.{file_extension}"
                    
                    # Upload to S3
                    file_content = await payment_document.read()
                    s3_url = upload_file_to_s3(
                        file_content=file_content,
                        s3_key=s3_key,
                        content_type=payment_document.content_type or 'application/pdf'
                    )
                    
                    payment_document_path = s3_url
                    logger.info(f"✅ Payment document uploaded to S3: {s3_key}")
                
            except Exception as e:
                # Log error but don't fail the investment creation
                logger.error(f"❌ Error uploading payment document to S3: {e}")
                logger.warning("⚠️ Continuing investment creation without payment document upload")
                payment_document_path = None
        
        # Insert investment
        insert_query = """
        INSERT INTO investments (
            investor_id, series_id, amount, date_transferred,
            date_received, payment_document_path, status
        ) VALUES (%s, %s, %s, %s, %s, %s, 'confirmed')
        """
        
        db.execute_query(insert_query, (
            investor_id, series_id, amount,
            date_transferred, date_received,
            payment_document_path
        ))
        
        # Update investor total investment
        update_total = """
        UPDATE investors 
        SET total_investment = total_investment + %s 
        WHERE id = %s
        """
        db.execute_query(update_total, (amount, investor_id))
        
        # Update or create investor_series record
        check_investor_series = """
        SELECT id, total_invested, investment_count 
        FROM investor_series 
        WHERE investor_id = %s AND series_id = %s
        """
        existing_relation = db.execute_query(check_investor_series, (investor_id, series_id))
        
        if existing_relation:
            # Update existing relation
            update_relation = """
            UPDATE investor_series 
            SET total_invested = total_invested + %s,
                investment_count = investment_count + 1,
                last_investment_date = NOW()
            WHERE investor_id = %s AND series_id = %s
            """
            db.execute_query(update_relation, (amount, investor_id, series_id))
        else:
            # Create new relation
            insert_relation = """
            INSERT INTO investor_series (
                investor_id, series_id, total_invested, investment_count,
                first_investment_date, last_investment_date
            ) VALUES (%s, %s, %s, 1, NOW(), NOW())
            """
            db.execute_query(insert_relation, (investor_id, series_id, amount))
        
        # Get the created investment
        get_investment = """
        SELECT * FROM investments 
        WHERE investor_id = %s AND series_id = %s 
        ORDER BY created_at DESC LIMIT 1
        """
        result = db.execute_query(get_investment, (investor_id, series_id))
        
        investment_data = result[0]
        
        # CREATE AUDIT LOG FOR INVESTMENT CREATION
        create_audit_log(
            db=db,
            action="Investment Created",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Created investment of ₹{float(amount):,.2f} for investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']}) in series \"{series_data['name']}\"",
            entity_type="Investment",
            entity_id=f"{investor_data['investor_id']}-{series_data['name']}",
            changes={
                "investor_id": investor_data['investor_id'],
                "investor_name": investor_data['full_name'],
                "series_id": series_id,
                "series_name": series_data['name'],
                "amount": float(amount),
                "date_transferred": str(date_transferred) if date_transferred else None,
                "date_received": str(date_received) if date_received else None,
                "payment_document_uploaded": payment_document_path is not None,
                "status": "confirmed",
                "action": "investment_create"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        investment_data['date_transferred'] = date_to_str(investment_data['date_transferred'])
        investment_data['date_received'] = date_to_str(investment_data['date_received'])
        investment_data['created_at'] = investment_data['created_at'].isoformat() if investment_data['created_at'] else None
        investment_data['updated_at'] = investment_data['updated_at'].isoformat() if investment_data['updated_at'] else None
        
        logger.info(f"✅ Added investment for investor {investor_id} in series {series_id}")
        return InvestmentResponse(**investment_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding investment: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{investor_id}/investments", response_model=List[InvestmentResponse])
async def get_investor_investments(
    investor_id: int,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all investments for an investor"""
    try:
        query = """
        SELECT * FROM investments 
        WHERE investor_id = %s 
        ORDER BY created_at DESC
        """
        results = db.execute_query(query, (investor_id,))
        
        investments = []
        for inv in results:
            inv['date_transferred'] = date_to_str(inv['date_transferred'])
            inv['date_received'] = date_to_str(inv['date_received'])
            inv['created_at'] = inv['created_at'].isoformat() if inv['created_at'] else None
            inv['updated_at'] = inv['updated_at'].isoformat() if inv['updated_at'] else None
            investments.append(InvestmentResponse(**inv))
        
        return investments
        
    except Exception as e:
        logger.error(f"Error fetching investments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{investor_id}/series/{series_id}/exit")
async def exit_investor_from_series(
    investor_id: int,
    series_id: int,
    request: Request,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Exit investor from specific series
    RULES:
    - Can only exit AFTER lock-in period
    - Can exit anytime between lock-in end and maturity
    - Cannot exit BEFORE lock-in period
    - Cannot exit AFTER maturity (series ended)
    """
    try:
        logger.info(f"🚪 Exit request: Investor {investor_id} from Series {series_id}")
        
        # 1. Verify investor exists and is active
        investor_check = "SELECT id, investor_id, full_name FROM investors WHERE id = %s AND status = 'active'"
        investor_result = db.execute_query(investor_check, (investor_id,))
        
        if not investor_result:
            raise HTTPException(status_code=404, detail="Investor not found or inactive")
        
        investor_data = investor_result[0]
        
        # 2. Get series details with dates
        series_check = """
        SELECT id, name, series_code, status, lock_in_date, maturity_date 
        FROM ncd_series 
        WHERE id = %s
        """
        series_result = db.execute_query(series_check, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = series_result[0]
        
        # 3. Check if series is matured
        if series_data['status'] == 'matured':
            raise HTTPException(
                status_code=400, 
                detail="Cannot exit from matured series. Series has already ended."
            )
        
        # 4. Check lock-in period
        today = datetime.now().date()
        lock_in_date = series_data['lock_in_date']
        maturity_date = series_data['maturity_date']
        
        if lock_in_date and today < lock_in_date:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot exit during lock-in period. Lock-in ends on {lock_in_date.strftime('%d/%m/%Y')}"
            )
        
        # 5. Find the confirmed investment
        investment_check = """
        SELECT id, amount, date_transferred, date_received 
        FROM investments 
        WHERE investor_id = %s AND series_id = %s AND status = 'confirmed'
        """
        investment_result = db.execute_query(investment_check, (investor_id, series_id))
        
        if not investment_result:
            raise HTTPException(
                status_code=404, 
                detail="No active investment found for this investor in this series"
            )
        
        investment_data = investment_result[0]
        investment_id = investment_data['id']
        investment_amount = float(investment_data['amount'])
        
        # 6. Set exit_date and update investment status to 'cancelled' (exited)
        # IMPORTANT: Setting exit_date triggers prorated interest calculation in payout system
        update_investment = """
        UPDATE investments 
        SET status = 'cancelled', 
            exit_date = %s,
            updated_at = NOW()
        WHERE id = %s
        """
        db.execute_query(update_investment, (today, investment_id))
        
        logger.info(f"✅ Set exit_date = {today} for investment {investment_id}")
        logger.info(f"💰 Final prorated interest will be calculated from last payout to {today}")
        
        # 7. DO NOT update investor total_investment - it's LIFETIME history, not current balance
        # The investor's total_investment should NEVER decrease because it represents
        # the total amount they have EVER invested, not their current active investment
        
        # 8. Update investor_series record to mark as exited
        # CRITICAL: Keep historical data (total_invested, investment_count) - NEVER set to 0!
        # Only change the status to 'exited' to track that investor is no longer active
        # SAFETY: If record doesn't exist, create it (handles legacy data)
        
        # First check if record exists
        check_investor_series = """
        SELECT id, total_invested, investment_count FROM investor_series 
        WHERE investor_id = %s AND series_id = %s
        """
        existing_record = db.execute_query(check_investor_series, (investor_id, series_id))
        
        if existing_record:
            # Record exists - update status to 'exited' but KEEP historical data
            update_investor_series = """
            UPDATE investor_series 
            SET status = 'exited',
                updated_at = NOW()
            WHERE investor_id = %s AND series_id = %s
            """
            db.execute_query(update_investor_series, (investor_id, series_id))
            logger.info(f"✅ Updated investor_series status to 'exited' (historical data preserved)")
            logger.info(f"   Kept: total_invested = ₹{existing_record[0]['total_invested']:,.2f}, investment_count = {existing_record[0]['investment_count']}")
        else:
            # Record doesn't exist - create it with historical data
            logger.warning(f"⚠️ investor_series record missing - creating new record for historical data")
            
            # Get first and last investment dates and calculate totals
            date_query = """
            SELECT 
                MIN(date_received) as first_date,
                MAX(date_received) as last_date,
                SUM(amount) as total_amount,
                COUNT(*) as count
            FROM investments
            WHERE investor_id = %s AND series_id = %s AND status IN ('confirmed', 'cancelled')
            """
            date_result = db.execute_query(date_query, (investor_id, series_id))
            
            first_date = date_result[0]['first_date'] if date_result else today
            last_date = date_result[0]['last_date'] if date_result else today
            total_amount = float(date_result[0]['total_amount']) if date_result and date_result[0]['total_amount'] else investment_amount
            count = date_result[0]['count'] if date_result else 1
            
            # Create record with ACTUAL historical data and status = 'exited'
            insert_investor_series = """
            INSERT INTO investor_series (
                investor_id, series_id, total_invested, investment_count,
                first_investment_date, last_investment_date, status,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            """
            db.execute_query(insert_investor_series, (investor_id, series_id, total_amount, count, first_date, last_date, 'exited'))
            logger.info(f"✅ Created investor_series record with historical data (status = 'exited')")
            logger.info(f"   Saved: total_invested = ₹{total_amount:,.2f}, investment_count = {count}")
        
        # 9. Historical data is preserved in investor_series table
        # The status field tracks if investor is still active ('active') or has exited ('exited')
        logger.info(f"✅ Historical data preserved in investor_series (status = 'exited')")
        
        # 10. CREATE AUDIT LOG FOR EXIT
        create_audit_log(
            db=db,
            action="Series Exit",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']}) exited from series \"{series_data['name']}\" with investment amount ₹{investment_amount:,.2f}",
            entity_type="Investment",
            entity_id=f"{investor_data['investor_id']}-{series_data['name']}",
            changes={
                "investor_id": investor_data['investor_id'],
                "investor_name": investor_data['full_name'],
                "series_id": series_id,
                "series_name": series_data['name'],
                "amount_exited": investment_amount,
                "exit_date": today.strftime('%Y-%m-%d'),
                "lock_in_date": str(lock_in_date) if lock_in_date else None,
                "maturity_date": str(maturity_date) if maturity_date else None,
                "status_changed": "confirmed -> cancelled",
                "action": "series_exit"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"✅ Investor {investor_data['investor_id']} successfully exited from series {series_data['name']}")
        
        return {
            "success": True,
            "message": f"Successfully exited from {series_data['name']}",
            "investor_id": investor_data['investor_id'],
            "series_name": series_data['name'],
            "amount_exited": investment_amount,
            "exit_date": today.strftime('%d/%m/%Y')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in series exit: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{investor_id}/series/{series_id}/documents", response_model=InvestorDocumentResponse)
async def upload_series_investor_document(
    investor_id: int,
    series_id: int,
    request: Request,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """
    Upload series-specific investor document (15G, 15H, Bond Paper) to S3
    These documents are specific to an investor's investment in a particular series
    """
    try:
        # Verify investor exists
        investor_check = "SELECT id, investor_id, full_name FROM investors WHERE id = %s"
        investor_result = db.execute_query(investor_check, (investor_id,))
        
        if not investor_result:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        investor_data = investor_result[0]
        
        # Verify series exists
        series_check = "SELECT id, name, series_code FROM ncd_series WHERE id = %s"
        series_result = db.execute_query(series_check, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = series_result[0]
        
        # Validate document type for series-specific documents
        valid_types = ['form_15g', 'form_15h', 'bond_paper']
        if document_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid document type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is 10MB, got {file_size / (1024*1024):.2f}MB"
            )
        
        # Import S3 service
        from s3_service import s3_service
        
        if not s3_service:
            # Make S3 upload OPTIONAL - still save to database even if S3 fails
            logger.warning("⚠️ S3 Service not initialized - document will be saved to database only")
            s3_key = None
            doc_info = {
                'file_name': file.filename,
                's3_key': None,
                'file_size': file_size
            }
        else:
            # Upload to S3
            success, doc_info, error_msg = s3_service.upload_investor_document(
                investor_id=investor_id,
                series_id=series_id,
                document_type=document_type,
                file_content=file_content,
                file_name=file.filename
            )
            
            if not success:
                logger.warning(f"⚠️ S3 upload failed: {error_msg} - saving to database only")
                doc_info = {
                    'file_name': file.filename,
                    's3_key': None,
                    'file_size': file_size
                }
        
        # Save document record to database
        insert_query = """
        INSERT INTO investor_documents (
            investor_id, document_type, file_name, file_path, file_size
        ) VALUES (%s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            investor_id,
            document_type,
            doc_info['file_name'],
            doc_info.get('s3_key'),
            doc_info['file_size']
        ))
        
        # Get the created document record
        select_query = """
        SELECT * FROM investor_documents 
        WHERE investor_id = %s AND document_type = %s 
        ORDER BY uploaded_at DESC LIMIT 1
        """
        result = db.execute_query(select_query, (investor_id, document_type))
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to retrieve uploaded document")
        
        doc_data = result[0]
        doc_data['uploaded_at'] = doc_data['uploaded_at'].isoformat() if doc_data['uploaded_at'] else None
        
        # CREATE AUDIT LOG FOR DOCUMENT UPLOAD
        create_audit_log(
            db=db,
            action="Series Document Uploaded",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Uploaded {document_type.replace('_', ' ').title()} document for investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']}) in series \"{series_data['name']}\" - File: {file.filename} ({file_size / 1024:.2f} KB)",
            entity_type="Document",
            entity_id=investor_data['investor_id'],
            changes={
                "investor_id": investor_data['investor_id'],
                "investor_name": investor_data['full_name'],
                "series_id": series_id,
                "series_name": series_data['name'],
                "document_type": document_type,
                "file_name": file.filename,
                "file_size": file_size,
                "s3_key": doc_info.get('s3_key'),
                "action": "series_document_upload"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"✅ Uploaded {document_type} for investor {investor_id} in series {series_id}")
        return InvestorDocumentResponse(**doc_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading series document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{investor_id}/documents", response_model=InvestorDocumentResponse)
async def upload_investor_document(
    investor_id: int,
    request: Request,
    document_type: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Upload KYC document for investor"""
    try:
        # Verify investor exists and get investor details for audit log
        investor_check = "SELECT id, investor_id, full_name FROM investors WHERE id = %s"
        investor_result = db.execute_query(investor_check, (investor_id,))
        
        if not investor_result:
            raise HTTPException(status_code=404, detail="Investor not found")
        
        investor_data = investor_result[0]
        
        # Validate document type
        valid_types = ['pan_document', 'aadhaar_document', 'cancelled_cheque', 'form_15g_15h', 'digital_signature']
        if document_type not in valid_types:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid document type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if file_size > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size is 10MB, got {file_size / (1024*1024):.2f}MB"
            )
        
        # Import S3 service
        from s3_service import s3_service
        
        if not s3_service:
            raise HTTPException(
                status_code=500,
                detail="Document upload service not available"
            )
        
        # Upload to S3
        # For investor KYC documents, we use investor_id as series_id (or 0)
        success, doc_info, error_msg = s3_service.upload_investor_document(
            investor_id=investor_id,
            series_id=0,  # KYC documents are not series-specific
            document_type=document_type,
            file_content=file_content,
            file_name=file.filename
        )
        
        if not success:
            raise HTTPException(status_code=500, detail=error_msg or "Failed to upload document")
        
        # Save document record to database
        insert_query = """
        INSERT INTO investor_documents (
            investor_id, document_type, file_name, file_path, file_size
        ) VALUES (%s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            investor_id,
            document_type,
            doc_info['file_name'],
            doc_info['s3_key'],
            doc_info['file_size']
        ))
        
        # Get the created document record
        select_query = """
        SELECT * FROM investor_documents 
        WHERE investor_id = %s AND document_type = %s 
        ORDER BY uploaded_at DESC LIMIT 1
        """
        result = db.execute_query(select_query, (investor_id, document_type))
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to retrieve uploaded document")
        
        doc_data = result[0]
        doc_data['uploaded_at'] = doc_data['uploaded_at'].isoformat() if doc_data['uploaded_at'] else None
        
        # CREATE AUDIT LOG FOR DOCUMENT UPLOAD
        create_audit_log(
            db=db,
            action="Document Uploaded",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Uploaded {document_type.replace('_', ' ').title()} document for investor \"{investor_data['full_name']}\" (ID: {investor_data['investor_id']}) - File: {file.filename} ({file_size / 1024:.2f} KB)",
            entity_type="Document",
            entity_id=investor_data['investor_id'],
            changes={
                "investor_id": investor_data['investor_id'],
                "investor_name": investor_data['full_name'],
                "document_type": document_type,
                "file_name": file.filename,
                "file_size": file_size,
                "s3_key": doc_info['s3_key'],
                "action": "document_upload"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"Uploaded document for investor {investor_id}: {document_type}")
        return InvestorDocumentResponse(**doc_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{investor_id}/documents", response_model=List[InvestorDocumentResponse])
async def get_investor_documents(
    investor_id: int,
    current_user: dict = Depends(get_current_user),
    db = Depends(get_db)
):
    """Get all documents for an investor with signed URLs"""
    try:
        # Import S3 service
        from s3_service import s3_service
        
        query = "SELECT * FROM investor_documents WHERE investor_id = %s ORDER BY uploaded_at DESC"
        results = db.execute_query(query, (investor_id,))
        
        documents = []
        for doc in results:
            doc['uploaded_at'] = doc['uploaded_at'].isoformat() if doc['uploaded_at'] else None
            
            # Generate signed URL for download if S3 service is available
            if s3_service and doc.get('file_path'):
                try:
                    signed_url = s3_service.generate_signed_url(doc['file_path'])
                    doc['download_url'] = signed_url
                    logger.info(f"✅ Generated signed URL for document {doc['id']}")
                except Exception as e:
                    logger.error(f"❌ Failed to generate signed URL for document {doc['id']}: {e}")
                    doc['download_url'] = None
            else:
                doc['download_url'] = None
            
            documents.append(InvestorDocumentResponse(**doc))
        
        return documents
        
    except Exception as e:
        logger.error(f"Error fetching documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# STATISTICS AND ANALYTICS ENDPOINTS
# ============================================

@router.get("/stats/summary")
async def get_investor_statistics(
    current_user: dict = Depends(get_current_user)
):
    """
    Get investor statistics summary
    Returns: total investors, KYC status counts, etc.
    """
    try:
        db = get_db()
        # Total active investors
        total_query = "SELECT COUNT(*) as count FROM investors WHERE is_active = 1 AND status != 'deleted'"
        total_result = db.execute_query(total_query)
        total_investors = total_result[0]['count'] if total_result else 0
        
        # KYC status counts
        kyc_completed_query = """
        SELECT COUNT(*) as count FROM investors 
        WHERE is_active = 1 AND status != 'deleted' AND kyc_status = 'Completed'
        """
        kyc_completed_result = db.execute_query(kyc_completed_query)
        kyc_completed = kyc_completed_result[0]['count'] if kyc_completed_result else 0
        
        kyc_pending_query = """
        SELECT COUNT(*) as count FROM investors 
        WHERE is_active = 1 AND status != 'deleted' AND kyc_status = 'Pending'
        """
        kyc_pending_result = db.execute_query(kyc_pending_query)
        kyc_pending = kyc_pending_result[0]['count'] if kyc_pending_result else 0
        
        kyc_rejected_query = """
        SELECT COUNT(*) as count FROM investors 
        WHERE is_active = 1 AND status != 'deleted' AND kyc_status = 'Rejected'
        """
        kyc_rejected_result = db.execute_query(kyc_rejected_query)
        kyc_rejected = kyc_rejected_result[0]['count'] if kyc_rejected_result else 0
        
        # Total investment amount
        total_investment_query = """
        SELECT COALESCE(SUM(total_investment), 0) as total 
        FROM investors 
        WHERE is_active = 1 AND status != 'deleted'
        """
        total_investment_result = db.execute_query(total_investment_query)
        total_investment = float(total_investment_result[0]['total']) if total_investment_result else 0.0
        
        logger.info(f"Retrieved investor statistics")
        return {
            "total_investors": total_investors,
            "kyc_completed": kyc_completed,
            "kyc_pending": kyc_pending,
            "kyc_rejected": kyc_rejected,
            "total_investment": total_investment
        }
        
    except Exception as e:
        logger.error(f"Error fetching investor statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/filters/series")
async def get_unique_series(
    current_user: dict = Depends(get_current_user)
):
    """
    Get unique series names from investor_series table for filtering
    Returns: List of unique series names
    """
    try:
        db = get_db()
        query = """
        SELECT DISTINCT s.name 
        FROM investor_series isr
        JOIN ncd_series s ON isr.series_id = s.id
        WHERE s.is_active = 1
        ORDER BY s.name
        """
        
        result = db.execute_query(query)
        series_names = [row['name'] for row in result] if result else []
        
        logger.info(f"Retrieved {len(series_names)} unique series for filtering")
        return {
            "series": series_names,
            "count": len(series_names)
        }
        
    except Exception as e:
        logger.error(f"Error fetching unique series: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# EXPORT FUNCTIONALITY
# ============================================

@router.get("/export/csv")
async def export_investors_csv(
    q: Optional[str] = None,
    kyc_status: Optional[str] = None,
    series_name: Optional[str] = None,
    status: Optional[str] = "active",
    current_user: dict = Depends(get_current_user)
):
    """
    Export investors to CSV format
    Uses same filters as search endpoint
    Returns CSV content as string
    """
    try:
        db = get_db()
        # Use same query logic as search endpoint
        base_query = """
        SELECT DISTINCT
            i.full_name, i.investor_id, i.email, i.phone,
            i.kyc_status, i.date_joined, i.total_investment,
            GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR ', ') as series_names
        FROM investors i
        LEFT JOIN investor_series isr ON i.id = isr.investor_id
        LEFT JOIN ncd_series s ON isr.series_id = s.id
        WHERE 1=1
        """
        
        params = []
        
        # Apply same filters as search
        if status and status != "all":
            if status == "active":
                base_query += " AND i.is_active = 1 AND i.status != 'deleted'"
            elif status == "inactive":
                base_query += " AND i.is_active = 0"
            elif status == "deleted":
                base_query += " AND i.status = 'deleted'"
        
        if q:
            base_query += """ AND (
                i.full_name LIKE %s OR 
                i.email LIKE %s OR 
                i.investor_id LIKE %s
            )"""
            search_term = f"%{q}%"
            params.extend([search_term, search_term, search_term])
        
        if kyc_status and kyc_status != "all":
            base_query += " AND i.kyc_status = %s"
            params.append(kyc_status)
        
        if series_name and series_name != "all":
            base_query += " AND s.name = %s"
            params.append(series_name)
        
        base_query += """
        GROUP BY i.id, i.full_name, i.investor_id, i.email, i.phone,
                 i.kyc_status, i.date_joined, i.total_investment
        ORDER BY i.date_joined DESC
        """
        
        result = db.execute_query(base_query, tuple(params))
        
        # Build CSV
        csv_lines = []
        
        # Header
        csv_lines.append("Name,Investor ID,Email,Phone,Series,Investment,KYC Status,Date Joined")
        
        # Data rows
        for row in result:
            name = row['full_name'] or ''
            investor_id = row['investor_id'] or ''
            email = row['email'] or ''
            phone = row['phone'] or ''
            series_names = row['series_names'] or 'No Series'
            investment = f"₹{float(row['total_investment'] or 0):,.2f}"
            kyc_status = row['kyc_status'] or ''
            date_joined = row['date_joined'].strftime('%d/%m/%Y') if row['date_joined'] else ''
            
            # Escape commas in fields
            name = f'"{name}"' if ',' in name else name
            series_names = f'"{series_names}"' if ',' in series_names else series_names
            
            csv_lines.append(f"{name},{investor_id},{email},{phone},{series_names},{investment},{kyc_status},{date_joined}")
        
        csv_content = '\n'.join(csv_lines)
        
        logger.info(f"Exported {len(result)} investors to CSV")
        return {
            "csv_content": csv_content,
            "record_count": len(result),
            "filename": f"investors_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        }
        
    except Exception as e:
        logger.error(f"Error exporting investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# INVESTMENT VALIDATION
# ============================================

@router.post("/validate-investment")
async def validate_investment(
    validation_data: InvestmentValidationRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate if an investment can be made
    Checks:
    - Investor exists and is active
    - Series exists and is accepting investments
    - Amount meets minimum investment
    - Subscription window is open
    
    Returns validation result with detailed messages
    """
    try:
        db = get_db()
        
        investor_id = validation_data.investor_id
        series_id = validation_data.series_id
        amount = validation_data.amount
        
        # Check investor
        investor_query = "SELECT id, investor_id, full_name, status, is_active FROM investors WHERE investor_id = %s"
        investor_result = db.execute_query(investor_query, (investor_id,))
        
        if not investor_result:
            return {
                "valid": False,
                "error": "INVESTOR_NOT_FOUND",
                "message": "Investor not found. Please check the Investor ID."
            }
        
        investor = investor_result[0]
        
        # Check if investor is deleted
        if investor['status'] == 'deleted':
            return {
                "valid": False,
                "error": "INVESTOR_DELETED",
                "message": "🚫 INVESTMENT BLOCKED: This investor account has been DELETED. Cannot add investments to deleted accounts."
            }
        
        # Check if investor is deactivated
        if investor['status'] == 'deactivated' or not investor['is_active']:
            return {
                "valid": False,
                "error": "INVESTOR_DEACTIVATED",
                "message": "🚫 INVESTMENT BLOCKED: This investor account has been DEACTIVATED. Cannot add investments to deactivated accounts. Please reactivate the account first."
            }
        
        # Check series
        series_query = """
        SELECT id, name, status, subscription_start_date, subscription_end_date,
               series_start_date, maturity_date, min_investment, target_amount
        FROM ncd_series 
        WHERE id = %s AND is_active = 1
        """
        series_result = db.execute_query(series_query, (series_id,))
        
        if not series_result:
            return {
                "valid": False,
                "error": "SERIES_NOT_FOUND",
                "message": "Series not found or inactive."
            }
        
        series = series_result[0]
        
        # Calculate series status
        from datetime import date
        today = date.today()
        
        subscription_start = series['subscription_start_date']
        subscription_end = series['subscription_end_date']
        series_start = series['series_start_date']
        maturity_date = series['maturity_date']
        
        # Check if series is in DRAFT
        if series['status'] in ['DRAFT', 'PENDING_APPROVAL']:
            return {
                "valid": False,
                "error": "SERIES_DRAFT",
                "message": f"🚫 INVESTMENT BLOCKED: Series \"{series['name']}\" is still in draft status and not approved for investments."
            }
        
        # Check if matured
        if maturity_date and today > maturity_date:
            return {
                "valid": False,
                "error": "SERIES_MATURED",
                "message": f"🚫 INVESTMENT BLOCKED: Series \"{series['name']}\" has matured and no longer accepts investments."
            }
        
        # Check subscription window
        if subscription_start and subscription_end:
            if today < subscription_start:
                return {
                    "valid": False,
                    "error": "SUBSCRIPTION_NOT_STARTED",
                    "message": f"🚫 INVESTMENT BLOCKED: Series \"{series['name']}\" subscription has not started yet. Subscription starts on {subscription_start.strftime('%d/%m/%Y')}."
                }
            elif today > subscription_end:
                return {
                    "valid": False,
                    "error": "SUBSCRIPTION_ENDED",
                    "message": f"🚫 INVESTMENT BLOCKED: Series \"{series['name']}\" subscription window has ended on {subscription_end.strftime('%d/%m/%Y')}. No new investments are accepted."
                }
        
        # Check minimum investment
        if series['min_investment'] and amount < series['min_investment']:
            return {
                "valid": False,
                "error": "AMOUNT_BELOW_MINIMUM",
                "message": f"Investment amount must be at least ₹{series['min_investment']:,.2f}"
            }
        
        # All validations passed
        return {
            "valid": True,
            "investor": {
                "id": investor['id'],
                "investor_id": investor['investor_id'],
                "name": investor['full_name']
            },
            "series": {
                "id": series['id'],
                "name": series['name']
            },
            "message": "✅ Investment validation passed. Ready to proceed."
        }
        
    except Exception as e:
        logger.error(f"Error validating investment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series/available-for-investment")
async def get_available_series_for_investment(
    current_user: dict = Depends(get_current_user)
):
    """
    Get ONLY series that are accepting investments
    Returns only series where canInvest = true
    """
    try:
        db = get_db()
        from datetime import date
        today = date.today()
        
        logger.info(f"📅 Today's date: {today}")
        
        # Get all active series with calculated funds_raised
        query = """
        SELECT s.id, s.name, s.status, s.subscription_start_date, s.subscription_end_date,
               s.series_start_date, s.maturity_date, s.min_investment, s.target_amount,
               COALESCE(SUM(i.amount), 0) as funds_raised, 
               s.interest_rate, s.interest_frequency, s.lock_in_date
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status = 'confirmed'
        WHERE s.is_active = 1
        GROUP BY s.id, s.name, s.status, s.subscription_start_date, s.subscription_end_date,
                 s.series_start_date, s.maturity_date, s.min_investment, s.target_amount,
                 s.interest_rate, s.interest_frequency, s.lock_in_date
        ORDER BY s.subscription_start_date DESC
        """
        
        series_list = db.execute_query(query)
        logger.info(f"📊 Found {len(series_list)} active series in database")
        
        result = []
        for series in series_list:
            subscription_start = series['subscription_start_date']
            subscription_end = series['subscription_end_date']
            maturity_date = series['maturity_date']
            
            logger.info(f"🔍 Series: {series['name']}")
            logger.info(f"   Status: {series['status']}")
            logger.info(f"   Subscription: {subscription_start} to {subscription_end}")
            logger.info(f"   Maturity: {maturity_date}")
            
            # ONLY include series that are accepting investments
            can_invest = False
            
            # Skip DRAFT/PENDING_APPROVAL
            if series['status'] in ['DRAFT', 'PENDING_APPROVAL', 'REJECTED']:
                logger.info(f"   ❌ SKIPPED - Draft/Pending/Rejected status")
                continue
            
            # Skip matured
            if maturity_date and today > maturity_date:
                logger.info(f"   ❌ SKIPPED - Matured")
                continue
            
            # Check subscription window
            if subscription_start and subscription_end:
                if today >= subscription_start and today <= subscription_end:
                    can_invest = True
                    logger.info(f"   ✅ ACCEPTING INVESTMENTS")
                else:
                    logger.info(f"   ❌ SKIPPED - Outside subscription window")
                    continue
            else:
                # No subscription dates - consider as accepting
                can_invest = True
                logger.info(f"   ✅ ACCEPTING (no subscription dates)")
            
            # Only add if can_invest is True
            if can_invest:
                result.append({
                    "id": series['id'],
                    "name": series['name'],
                    "status": series['status'],
                    "subscriptionStartDate": subscription_start.strftime('%d/%m/%Y') if subscription_start else None,
                    "subscriptionEndDate": subscription_end.strftime('%d/%m/%Y') if subscription_end else None,
                    "seriesStartDate": series['series_start_date'].strftime('%d/%m/%Y') if series['series_start_date'] else None,
                    "maturityDate": maturity_date.strftime('%d/%m/%Y') if maturity_date else None,
                    "minInvestment": float(series['min_investment']) if series['min_investment'] else 0,
                    "targetAmount": float(series['target_amount']) if series['target_amount'] else 0,
                    "fundsRaised": float(series['funds_raised']) if series['funds_raised'] else 0,
                    "interestRate": float(series['interest_rate']) if series['interest_rate'] else 0,
                    "interestFrequency": series['interest_frequency'],
                    "lockInDate": series['lock_in_date'].strftime('%d/%m/%Y') if series['lock_in_date'] else None
                })
        
        logger.info(f"📊 Returning {len(result)} series that are accepting investments")
        
        return {
            "series": result,
            "count": len(result)
        }
        
    except Exception as e:
        logger.error(f"❌ Error fetching available series: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))
