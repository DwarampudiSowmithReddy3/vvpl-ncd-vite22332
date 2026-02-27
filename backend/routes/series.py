"""
NCD Series API Routes
====================
CRUD operations for NCD Series management

IMPORTANT: ALL business logic in backend, NO logic in frontend
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from typing import List, Optional, Dict
from models import (
    SeriesCreate,
    SeriesUpdate,
    SeriesResponse,
    SeriesEnhancedResponse,
    SeriesWithDocuments,
    SeriesComplete,
    SeriesDocumentCreate,
    SeriesDocumentResponse,
    MessageResponse,
    UserInDB,
    SecurityType,
    SeriesStatus,
    DocumentType
)
from auth import get_current_user
from database import get_db
from permissions_checker import has_permission, log_unauthorized_access
from series_status_updater import update_series_status_by_dates
from datetime import datetime, date
from decimal import Decimal
import json
import logging

# Import ALL utility functions (ALL LOGIC HERE, NONE IN FRONTEND)
from series_utils import (
    format_currency,
    format_date,
    calculate_series_status,
    get_status_info,
    get_series_category,
    calculate_progress_percentage,
    calculate_days_until,
    is_subscription_open,
    can_delete_series,
    calculate_investor_count,
    calculate_funds_raised
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/series", tags=["NCD Series Management"])


def get_client_ip(request: Request) -> str:
    """Extract client IP address from request, handling proxies"""
    # Check for X-Forwarded-For header (proxy/load balancer)
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can contain multiple IPs, take the first one
        return forwarded.split(",")[0].strip()
    
    # Check for X-Real-IP header (nginx proxy)
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to direct client IP
    if request.client:
        return request.client.host
    
    return "unknown"


def get_user_agent(request: Request) -> str:
    """Extract user agent from request"""
    return request.headers.get("User-Agent", "unknown")


@router.get("/test")
async def test_endpoint():
    """Simple test endpoint"""
    print("🚨 TEST ENDPOINT CALLED!")
    return {"message": "Series router is working!", "test": True}


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
        
        logger.info(f"Audit log created: {action} by {admin_name} from IP {ip_address}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")
        # Don't fail the main operation if audit logging fails


def calculate_funds_raised(db, series_id: int) -> Decimal:
    """
    Calculate total funds raised for a series
    BUSINESS LOGIC - BACKEND ONLY
    Sums confirmed investments only
    """
    try:
        # Calculate LIFETIME funds raised (includes both active and exited investments)
        # This represents the total amount that has EVER been invested in this series
        query = """
        SELECT COALESCE(SUM(amount), 0) as total
        FROM investments
        WHERE series_id = %s AND status IN ('confirmed', 'cancelled')
        """
        
        result = db.execute_query(query, (series_id,))
        
        if result and len(result) > 0:
            return Decimal(str(result[0]['total']))
        
        return Decimal('0')
        
    except Exception as e:
        logger.error(f"Error calculating funds raised: {e}")
        return Decimal('0')


def calculate_progress_percentage(funds_raised: Decimal, 
                                 target_amount: Decimal) -> float:
    """
    Calculate progress percentage
    BUSINESS LOGIC - BACKEND ONLY
    """
    try:
        if target_amount > 0:
            progress = (float(funds_raised) / float(target_amount)) * 100
            return round(progress, 2)
        return 0.0
    except Exception as e:
        logger.error(f"Error calculating progress: {e}")
        return 0.0


def calculate_series_status(series_data: dict) -> str:
    """
    Calculate series status based on dates
    BUSINESS LOGIC - BACKEND ONLY
    
    Status Flow:
    DRAFT → APPROVED → accepting → upcoming → active → matured
               ↓
            REJECTED
    
    - DRAFT: Not approved yet
    - REJECTED: Rejected by board
    - APPROVED: Approved, waiting for subscription_start_date
    - accepting: Within subscription window (accepting investments)
    - upcoming: After subscription ends but before series_start_date
    - active: After series_start_date, before maturity (PAYING INTEREST)
    - matured: After maturity date
    
    CRITICAL: Series becomes 'active' (starts paying interest) on series_start_date, NOT release_date!
    """
    try:
        current_status = series_data.get('status', 'DRAFT')
        today = date.today()
        
        # Manual statuses - don't auto-change
        if current_status in ['DRAFT', 'PENDING_APPROVAL', 'REJECTED']:
            return current_status
        
        # Get dates - handle None values
        subscription_start_date = series_data.get('subscription_start_date')
        subscription_end_date = series_data.get('subscription_end_date')
        series_start_date = series_data.get('series_start_date')
        maturity_date = series_data.get('maturity_date')
        
        # If no maturity date, return current status
        if not maturity_date:
            logger.warning(f"Series {series_data.get('id')} has no maturity_date")
            return current_status
        
        # Rule 1: matured - After maturity date
        if today >= maturity_date:
            return 'matured'
        
        # Rule 2: active - After series_start_date (this is when interest payments start!)
        if series_start_date and today >= series_start_date:
            return 'active'
        
        # Rule 3: upcoming - After subscription ends but before series starts
        if subscription_end_date and today > subscription_end_date and series_start_date and today < series_start_date:
            return 'upcoming'
        
        # Rule 4: accepting - Within subscription window (accepting investments)
        if subscription_start_date and subscription_end_date and subscription_start_date <= today <= subscription_end_date:
            return 'accepting'
        
        # Rule 5: APPROVED - Approved but before subscription starts
        if current_status == 'APPROVED' and subscription_start_date and today < subscription_start_date:
            return 'APPROVED'
        
        # Default fallback
        return current_status
        
    except Exception as e:
        logger.error(f"Error calculating series status for series {series_data.get('id', 'unknown')}: {e}")
        logger.error(f"Series data: {series_data}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return series_data.get('status', 'DRAFT')


@router.get("/")
async def get_all_series(
    status: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active series with calculated fields
    ALL LOGIC IN BACKEND - Frontend only displays
    
    AUTOMATIC STATUS UPDATES:
    Before fetching series, automatically updates statuses based on dates:
    - APPROVED → ACCEPTING (on subscription_start_date)
    - ACCEPTING → UPCOMING (on subscription_end_date)
    - UPCOMING → ACTIVE (on series_start_date)
    - ACTIVE → MATURED (on maturity_date)
    """
    print(f"🚨 SERIES ENDPOINT CALLED! User: {current_user.username}")
    logger.error(f"🚨 SERIES ENDPOINT CALLED! User: {current_user.username}")
    
    db = get_db()
    
    # AUTO-UPDATE: Update all series statuses based on current dates
    # This ensures status is always accurate
    try:
        logger.info("🔄 Auto-updating series statuses based on dates...")
        updated_count = update_series_status_by_dates()
        logger.info(f"✅ Status update complete. Updated {updated_count} series.")
    except Exception as e:
        logger.error(f"⚠️ Error auto-updating statuses: {e}")
        import traceback
        logger.error(traceback.format_exc())
        # Continue even if update fails
    
    # FIXED: Query with LEFT JOIN to calculate LIFETIME funds_raised and investor count
    # Includes both 'confirmed' (active) and 'cancelled' (exited) investments
    query = """
    SELECT 
        s.*,
        COALESCE(SUM(CASE WHEN i.status IN ('confirmed', 'cancelled') THEN i.amount ELSE 0 END), 0) as funds_raised,
        COUNT(DISTINCT CASE WHEN i.status IN ('confirmed', 'cancelled') THEN i.investor_id ELSE NULL END) as investor_count
    FROM ncd_series s
    LEFT JOIN investments i ON s.id = i.series_id
    WHERE s.is_active = 1
    GROUP BY s.id
    """
    result = db.execute_query(query)
    
    logger.error(f"📊 Query returned {len(result)} rows")
    
    # Calculate lock_in_period and progress_percentage for each series - ALL LOGIC IN BACKEND
    from datetime import date
    
    for series in result:
        # Calculate progress percentage
        funds_raised = float(series.get('funds_raised', 0))
        target_amount = float(series.get('target_amount', 0))
        
        if target_amount > 0:
            progress_percentage = round((funds_raised / target_amount) * 100, 2)
        else:
            progress_percentage = 0.0
        
        series['progress_percentage'] = progress_percentage
        
        logger.info(f"📊 Series {series['name']}: funds_raised=₹{funds_raised:,.2f}, target=₹{target_amount:,.2f}, progress={progress_percentage}%")
        
        # Calculate lock-in period from issue_date and lock_in_date
        lock_in_period = None
        if series.get('issue_date') and series.get('lock_in_date'):
            issue_date = series['issue_date']
            lock_in_date = series['lock_in_date']
            
            # Convert to date objects if they're strings
            if isinstance(issue_date, str):
                parts = issue_date.split('-')
                if len(parts) == 3:
                    issue_date = date(int(parts[0]), int(parts[1]), int(parts[2]))
            
            if isinstance(lock_in_date, str):
                parts = lock_in_date.split('-')
                if len(parts) == 3:
                    lock_in_date = date(int(parts[0]), int(parts[1]), int(parts[2]))
            
            # Calculate difference in years
            if isinstance(issue_date, date) and isinstance(lock_in_date, date):
                years = lock_in_date.year - issue_date.year
                months = lock_in_date.month - issue_date.month
                
                if months < 0:
                    years -= 1
                    months += 12
                
                if years > 0:
                    lock_in_period = f"{years} year{'s' if years > 1 else ''}"
                elif months > 0:
                    lock_in_period = f"{months} month{'s' if months > 1 else ''}"
                else:
                    lock_in_period = "Less than 1 month"
        
        # Add calculated field to series
        series['lock_in_period'] = lock_in_period
    
    # Return data with calculated fields
    return result


@router.post("/", response_model=SeriesResponse)
async def create_series(
    series_data: SeriesCreate,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create a new NCD series
    IMPORTANT: Documents uploaded separately via /series/{id}/documents
    """
    try:
        logger.info(f"🔄 Creating series: {series_data.name}")
        logger.info(f"🔄 Series data: {series_data}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "create_ncdSeries", db):
            log_unauthorized_access(db, current_user, "create_series", "create_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to create NCD series"
            )
        
        # Check if series_code already exists (only check active series)
        check_query = """
        SELECT COUNT(*) as count FROM ncd_series
        WHERE series_code = %s AND is_active = 1
        """
        result = db.execute_query(check_query, (series_data.series_code,))
        
        if result[0]['count'] > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Series code '{series_data.series_code}' already exists"
            )
        
        # Check if name already exists (only check active series)
        check_name_query = """
        SELECT COUNT(*) as count FROM ncd_series
        WHERE name = %s AND is_active = 1
        """
        result = db.execute_query(check_name_query, (series_data.name,))
        
        if result[0]['count'] > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Series name '{series_data.name}' already exists"
            )
        
        # Insert new series
        insert_query = """
        INSERT INTO ncd_series (
            name, series_code, security_type, status, debenture_trustee_name,
            investors_size, issue_date, tenure, maturity_date, lock_in_date,
            subscription_start_date, subscription_end_date, release_date, series_start_date,
            min_subscription_percentage, face_value, min_investment,
            target_amount, total_issue_size, interest_rate, credit_rating,
            interest_frequency, interest_payment_day, description, created_at, created_by, is_active
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
        )
        """
        
        now = datetime.now()
        
        # Log all values before insert for debugging
        insert_values = (
            series_data.name,
            series_data.series_code,
            series_data.security_type.value,
            series_data.status.value,
            series_data.debenture_trustee_name,
            series_data.investors_size,
            series_data.issue_date,
            series_data.tenure,
            series_data.maturity_date,
            series_data.lock_in_date,
            series_data.subscription_start_date,
            series_data.subscription_end_date,
            series_data.release_date,
            series_data.series_start_date,  # NEW FIELD
            series_data.min_subscription_percentage,
            series_data.face_value,
            series_data.min_investment,
            series_data.target_amount,
            series_data.total_issue_size,
            series_data.interest_rate,
            series_data.credit_rating,
            series_data.interest_frequency,
            series_data.interest_payment_day,  # NEW FIELD
            series_data.description,
            now,
            series_data.created_by,
            True
        )
        
        logger.info(f"🔍 INSERT VALUES:")
        logger.info(f"   face_value: {series_data.face_value} (type: {type(series_data.face_value)})")
        logger.info(f"   min_investment: {series_data.min_investment} (type: {type(series_data.min_investment)})")
        logger.info(f"   target_amount: {series_data.target_amount} (type: {type(series_data.target_amount)})")
        logger.info(f"   interest_rate: {series_data.interest_rate} (type: {type(series_data.interest_rate)})")
        logger.info(f"   min_subscription_percentage: {series_data.min_subscription_percentage} (type: {type(series_data.min_subscription_percentage)})")
        
        db.execute_query(insert_query, insert_values)
        
        # Get the created series
        get_series_query = """
        SELECT * FROM ncd_series
        WHERE series_code = %s
        """
        
        result = db.execute_query(get_series_query, (series_data.series_code,))
        
        if result:
            series_record = result[0]
            
            # Create audit log with IP tracking
            create_audit_log(
                db=db,
                action="Created Series",
                admin_name=current_user.full_name,
                admin_role=current_user.role,
                details=f"Created new series \"{series_data.name}\" ({series_data.series_code})",
                entity_type="Series",
                entity_id=series_data.series_code,
                changes={
                    "seriesCode": series_data.series_code,
                    "name": series_data.name,
                    "targetAmount": str(series_data.target_amount),
                    "interestRate": str(series_data.interest_rate),
                    "action": "series_created"
                },
                ip_address=get_client_ip(request),
                user_agent=get_user_agent(request)
            )
            
            # Helper function to convert date to string
            def date_to_str(date_val):
                if date_val is None:
                    return None
                if isinstance(date_val, str):
                    return date_val
                # Convert date/datetime to string
                return str(date_val)
            
            return SeriesResponse(
                id=series_record['id'],
                name=series_record['name'],
                series_code=series_record['series_code'],
                security_type=series_record['security_type'],
                status=series_record['status'],
                debenture_trustee_name=series_record['debenture_trustee_name'],
                investors_size=series_record['investors_size'],
                issue_date=date_to_str(series_record['issue_date']),
                tenure=series_record['tenure'],
                maturity_date=date_to_str(series_record['maturity_date']),
                lock_in_date=date_to_str(series_record['lock_in_date']),
                subscription_start_date=date_to_str(series_record['subscription_start_date']),
                subscription_end_date=date_to_str(series_record['subscription_end_date']),
                release_date=date_to_str(series_record['release_date']),
                series_start_date=date_to_str(series_record.get('series_start_date')),
                min_subscription_percentage=series_record['min_subscription_percentage'],
                face_value=series_record['face_value'],
                min_investment=series_record['min_investment'],
                target_amount=series_record['target_amount'],
                total_issue_size=series_record['total_issue_size'],
                interest_rate=series_record['interest_rate'],
                credit_rating=series_record['credit_rating'],
                interest_frequency=series_record['interest_frequency'],
                interest_payment_day=series_record.get('interest_payment_day', 15),  # NEW FIELD
                description=series_record['description'],
                created_at=series_record['created_at'],
                updated_at=series_record['updated_at'],
                created_by=series_record['created_by'],
                is_active=bool(series_record['is_active']),
                funds_raised=Decimal('0'),
                progress_percentage=0.0,
                next_action="/approval"  # Backend tells frontend to navigate to approval page
            )
        
        raise HTTPException(
            status_code=500,
            detail="Series created but could not retrieve"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ ERROR creating series: {e}")
        logger.error(f"❌ ERROR type: {type(e)}")
        logger.error(f"❌ ERROR details: {str(e)}")
        import traceback
        logger.error(f"❌ TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating series: {str(e)}"
        )


@router.get("/{series_id}", response_model=SeriesComplete)
async def get_series(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get a specific series with documents and investments
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view NCD series"
            )
        
        # Get series
        series_query = """
        SELECT * FROM ncd_series
        WHERE id = %s AND is_active = 1
        """
        
        result = db.execute_query(series_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = result[0]
        
        # Calculate funds raised and progress
        funds_raised = calculate_funds_raised(db, series_id)
        progress = calculate_progress_percentage(
            funds_raised,
            series_data['target_amount']
        )
        
        # Calculate actual status
        actual_status = calculate_series_status(series_data)
        
        # Get documents
        docs_query = """
        SELECT * FROM series_documents
        WHERE series_id = %s AND is_active = 1
        """
        docs_result = db.execute_query(docs_query, (series_id,))
        
        # Import S3 service for generating signed URLs
        from s3_service import s3_service
        
        documents = []
        for doc in docs_result:
            # Generate signed URL for download if S3 service is available
            download_url = None
            if s3_service and doc.get('s3_key'):
                try:
                    download_url = s3_service.generate_signed_url(doc['s3_key'])
                except Exception as e:
                    logger.error(f"❌ Failed to generate signed URL for series document {doc['id']}: {e}")
            
            documents.append(SeriesDocumentResponse(
                id=doc['id'],
                series_id=doc['series_id'],
                document_type=doc['document_type'],
                file_name=doc['file_name'],
                file_path=doc.get('s3_key', ''),
                uploaded_at=doc['uploaded_at'],
                uploaded_by=doc['uploaded_by'],
                download_url=download_url
            ))
        
        # Get investments (simplified - full investment model in investments.py)
        investments_query = """
        SELECT * FROM investments
        WHERE series_id = %s
        ORDER BY created_at DESC
        """
        investments_result = db.execute_query(investments_query, (series_id,))
        
        return SeriesComplete(
            id=series_data['id'],
            name=series_data['name'],
            series_code=series_data['series_code'],
            security_type=series_data['security_type'],
            status=actual_status,
            debenture_trustee_name=series_data['debenture_trustee_name'],
            investors_size=series_data['investors_size'],
            issue_date=series_data['issue_date'],
            tenure=series_data['tenure'],
            maturity_date=series_data['maturity_date'],
            lock_in_date=series_data['lock_in_date'],
            subscription_start_date=series_data['subscription_start_date'],
            subscription_end_date=series_data['subscription_end_date'],
            release_date=series_data['release_date'],
            series_start_date=series_data.get('series_start_date'),
            min_subscription_percentage=series_data['min_subscription_percentage'],
            face_value=series_data['face_value'],
            min_investment=series_data['min_investment'],
            target_amount=series_data['target_amount'],
            total_issue_size=series_data['total_issue_size'],
            interest_rate=series_data['interest_rate'],
            credit_rating=series_data['credit_rating'],
            interest_frequency=series_data['interest_frequency'],
            interest_payment_day=series_data.get('interest_payment_day', 15),
            description=series_data['description'],
            created_at=series_data['created_at'],
            updated_at=series_data['updated_at'],
            created_by=series_data['created_by'],
            is_active=bool(series_data['is_active']),
            funds_raised=funds_raised,
            progress_percentage=progress,
            documents=documents,
            investments=[],  # Simplified for now
            total_investments=len(investments_result)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting series: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving series"
        )


@router.get("/{series_id}/display-data")
async def get_series_display_data(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get series display data with formatted dates for UI
    ALL LOGIC IN BACKEND - Frontend only displays
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_display_data", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view NCD series"
            )
        
        # Get series
        series_query = """
        SELECT * FROM ncd_series
        WHERE id = %s AND is_active = 1
        """
        
        result = db.execute_query(series_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = result[0]
        
        # Helper function to format date from database (date object) to DD/MM/YYYY string
        def format_date_for_display(date_value):
            """Format date for display - ALL LOGIC IN BACKEND"""
            if date_value is None:
                return None
            
            # If it's already a string, return as is
            if isinstance(date_value, str):
                return date_value
            
            # If it's a date object, format it
            try:
                return date_value.strftime('%d/%m/%Y')
            except:
                return str(date_value)
        
        # Format Lock-in Date - BACKEND LOGIC
        lock_in_date_display = None
        if series_data.get('lock_in_date'):
            lock_in_date_display = format_date_for_display(series_data['lock_in_date'])
        
        # Format Subscription Period - BACKEND LOGIC
        subscription_period_display = None
        if series_data.get('subscription_start_date') and series_data.get('subscription_end_date'):
            start_date = format_date_for_display(series_data['subscription_start_date'])
            end_date = format_date_for_display(series_data['subscription_end_date'])
            subscription_period_display = f"{start_date} to {end_date}"
        
        # Return formatted display data - ALL LOGIC DONE IN BACKEND
        return {
            "series_id": series_id,
            "lock_in_date": {
                "raw_value": series_data.get('lock_in_date'),
                "display_value": lock_in_date_display if lock_in_date_display else "Not Set",
                "has_value": lock_in_date_display is not None
            },
            "subscription_period": {
                "start_date": series_data.get('subscription_start_date'),
                "end_date": series_data.get('subscription_end_date'),
                "display_value": subscription_period_display if subscription_period_display else "Not Set",
                "has_value": subscription_period_display is not None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting series display data: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series display data: {str(e)}"
        )


@router.get("/{series_id}/insights")
async def get_series_insights(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get series insights with ALL calculations done in backend
    - Lock-in period details
    - Maturity period details
    - Remaining funds to raise
    - Active investor counts
    ALL LOGIC IN BACKEND - Frontend only displays
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_insights", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view NCD series"
            )
        
        # Get series
        series_query = """
        SELECT * FROM ncd_series
        WHERE id = %s AND is_active = 1
        """
        
        result = db.execute_query(series_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_data = result[0]
        
        from datetime import date, timedelta
        
        today = date.today()
        
        # Helper function to format date
        def format_date(date_value):
            if date_value is None:
                return None
            if isinstance(date_value, str):
                return date_value
            try:
                return date_value.strftime('%d/%m/%Y')
            except:
                return str(date_value)
        
        # Calculate Lock-in Details - ALL LOGIC IN BACKEND
        lock_in_details = None
        if series_data.get('lock_in_date'):
            lock_in_date = series_data['lock_in_date']
            
            # Convert lock_in_date to date object if needed
            if isinstance(lock_in_date, str):
                # Parse YYYY-MM-DD format from database
                parts = lock_in_date.split('-')
                if len(parts) == 3:
                    lock_in_date = date(int(parts[0]), int(parts[1]), int(parts[2]))
            
            if isinstance(lock_in_date, date):
                days_left = (lock_in_date - today).days
                is_active = days_left > 0
                
                # Get maturity date for comparison
                maturity_date = series_data.get('maturity_date')
                if isinstance(maturity_date, str):
                    parts = maturity_date.split('/')
                    if len(parts) == 3:
                        maturity_date = date(int(parts[2]), int(parts[1]), int(parts[0]))
                
                # Calculate amount withdrawn AFTER lock-in date but BEFORE maturity date
                # This means investors who cancelled their investment after lock-in period ended
                amount_withdrawn_after_lock_in = 0
                investors_who_left_after_lock_in = 0
                
                if isinstance(maturity_date, date):
                    # Query for investments that were cancelled AFTER lock-in date
                    # We check if the investment was cancelled and the cancellation happened after lock-in
                    withdrawn_query = """
                    SELECT COUNT(DISTINCT i.investor_id) as count, 
                           COALESCE(SUM(i.amount), 0) as total_amount
                    FROM investments i
                    WHERE i.series_id = %s 
                    AND i.status = 'cancelled'
                    AND i.updated_at >= %s
                    AND i.updated_at < %s
                    """
                    withdrawn_result = db.execute_query(withdrawn_query, (series_id, lock_in_date, maturity_date))
                    investors_who_left_after_lock_in = withdrawn_result[0]['count'] if withdrawn_result else 0
                    amount_withdrawn_after_lock_in = float(withdrawn_result[0]['total_amount']) if withdrawn_result else 0
                
                # Count remaining active investors in this series (who did NOT leave)
                active_query = """
                SELECT COUNT(DISTINCT i.investor_id) as count,
                       COALESCE(SUM(inv.amount), 0) as total_amount
                FROM investments inv
                INNER JOIN investors i ON inv.investor_id = i.id
                WHERE inv.series_id = %s AND inv.status = 'confirmed' AND i.is_active = 1
                """
                active_result = db.execute_query(active_query, (series_id,))
                remaining_investors = active_result[0]['count'] if active_result else 0
                total_principal_remaining = float(active_result[0]['total_amount']) if active_result else 0
                
                lock_in_details = {
                    "lock_in_end_date": format_date(lock_in_date),
                    "days_left": days_left,
                    "is_active": is_active,
                    "investors_left_after_lock_in": investors_who_left_after_lock_in,  # Investors who left AFTER lock-in
                    "amount_withdrawn_after_lock_in": amount_withdrawn_after_lock_in,  # Amount withdrawn AFTER lock-in
                    "remaining_investors": remaining_investors,
                    "total_principal_remaining": total_principal_remaining  # Principal amount for investors still in series
                }
        
        # Calculate Maturity Details - ALL LOGIC IN BACKEND
        maturity_details = None
        if series_data.get('maturity_date'):
            maturity_date = series_data['maturity_date']
            
            if isinstance(maturity_date, str):
                # Parse DD/MM/YYYY format
                parts = maturity_date.split('/')
                if len(parts) == 3:
                    maturity_date = date(int(parts[2]), int(parts[1]), int(parts[0]))
            
            if isinstance(maturity_date, date):
                days_left = (maturity_date - today).days
                is_matured = days_left <= 0
                
                # Count active investors (who are still in the series)
                active_query = """
                SELECT COUNT(DISTINCT i.id) as count
                FROM investors i
                INNER JOIN investments inv ON i.id = inv.investor_id
                WHERE inv.series_id = %s AND inv.status = 'confirmed' AND i.is_active = 1
                """
                active_result = db.execute_query(active_query, (series_id,))
                active_investors_count = active_result[0]['count'] if active_result else 0
                
                # Calculate total principal amount to be paid back to investors (who are still in series)
                # This is the sum of all confirmed investments that are still active
                principal_query = """
                SELECT COALESCE(SUM(inv.amount), 0) as total_principal
                FROM investments inv
                INNER JOIN investors i ON inv.investor_id = i.id
                WHERE inv.series_id = %s AND inv.status = 'confirmed' AND i.is_active = 1
                """
                principal_result = db.execute_query(principal_query, (series_id,))
                total_principal_to_be_paid = float(principal_result[0]['total_principal']) if principal_result else 0
                
                # Calculate actual status
                actual_status = calculate_series_status(series_data)
                
                maturity_details = {
                    "maturity_date": format_date(maturity_date),
                    "days_left": days_left,
                    "is_matured": is_matured,
                    "active_investors_count": active_investors_count,
                    "total_principal_to_be_paid": total_principal_to_be_paid,  # Total principal to pay back
                    "real_series_status": actual_status
                }
        
        return {
            "series_id": series_id,
            "lock_in": lock_in_details,
            "maturity": maturity_details
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting series insights: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series insights: {str(e)}"
        )


@router.get("/{series_id}/investors")
async def get_series_investors(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all investors who have invested in a specific series
    Returns investor details with their investment amounts in this series
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_investors", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view series investors"
            )
        
        # Verify series exists
        series_check = "SELECT id, name FROM ncd_series WHERE id = %s"
        series_result = db.execute_query(series_check, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_name = series_result[0]['name']
        
        # Get all investors with investments in this series (including exited investors)
        # This shows LIFETIME investment history, not just current active investments
        query = """
        SELECT 
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.kyc_status,
            i.bank_name,
            i.account_number,
            i.ifsc_code,
            COALESCE(SUM(inv.amount), 0) as total_invested,
            COUNT(inv.id) as investment_count,
            MIN(inv.date_received) as first_investment_date,
            MAX(inv.date_received) as last_investment_date,
            MAX(CASE WHEN inv.status = 'cancelled' THEN 1 ELSE 0 END) as has_exited
        FROM investors i
        INNER JOIN investments inv ON i.id = inv.investor_id
        WHERE inv.series_id = %s AND inv.status IN ('confirmed', 'cancelled')
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone, i.kyc_status,
                 i.bank_name, i.account_number, i.ifsc_code
        ORDER BY total_invested DESC
        """
        
        investors = db.execute_query(query, (series_id,))
        
        logger.info(f"📊 Found {len(investors)} investors for series {series_name} (ID: {series_id})")
        
        # Format response
        result = []
        for inv in investors:
            result.append({
                "id": inv['id'],
                "investorId": inv['investor_id'],
                "name": inv['name'],
                "email": inv['email'],
                "phone": inv['phone'],
                "kycStatus": inv['kyc_status'],
                "bankName": inv['bank_name'],
                "accountNumber": inv['account_number'],
                "ifscCode": inv['ifsc_code'],
                "totalInvested": float(inv['total_invested']),
                "investmentCount": inv['investment_count'],
                "firstInvestmentDate": inv['first_investment_date'].strftime('%d/%m/%Y') if inv['first_investment_date'] else None,
                "lastInvestmentDate": inv['last_investment_date'].strftime('%d/%m/%Y') if inv['last_investment_date'] else None,
                "hasExited": bool(inv['has_exited'])  # Flag to indicate if investor has exited
            })
        
        return {
            "series_id": series_id,
            "series_name": series_name,
            "investors": result,
            "total_investors": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting series investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{series_id}", response_model=SeriesResponse)
async def update_series(
    series_id: int,
    series_data: SeriesUpdate,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update a series
    All fields optional - only updates provided fields
    TRACKS CHANGES: Records old→new values in series_approvals table
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_ncdSeries", db):
            log_unauthorized_access(db, current_user, "update_series", "edit_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to edit NCD series"
            )
        
        # Check if series exists - GET ALL FIELDS for change tracking
        check_query = "SELECT * FROM ncd_series WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_record = result[0]
        
        # Build update query dynamically
        update_fields = []
        update_values = []
        changed_fields = []
        changes_made = {}  # Track old→new values for series_approvals table
        
        # Track if payment day changed (for updating payout dates)
        payment_day_changed = False
        new_payment_day = None
        
        # Helper function to track changes (old→new)
        def track_change(field_name, old_value, new_value):
            if old_value != new_value:
                changes_made[field_name] = {
                    "old": str(old_value) if old_value is not None else None,
                    "new": str(new_value) if new_value is not None else None
                }
        
        # Check each field and add to update if provided
        if series_data.name is not None and series_data.name != series_record['name']:
            track_change("name", series_record['name'], series_data.name)
            update_fields.append("name = %s")
            update_values.append(series_data.name)
            changed_fields.append("name")
        
        # series_code is NOT editable - it's a unique identifier, so we skip it
        
        if series_data.security_type is not None and series_data.security_type.value != series_record['security_type']:
            track_change("security_type", series_record['security_type'], series_data.security_type.value)
            update_fields.append("security_type = %s")
            update_values.append(series_data.security_type.value)
            changed_fields.append("security_type")
        
        if series_data.status is not None and series_data.status.value != series_record['status']:
            track_change("status", series_record['status'], series_data.status.value)
            update_fields.append("status = %s")
            update_values.append(series_data.status.value)
            changed_fields.append("status")
        
        if series_data.debenture_trustee_name is not None and series_data.debenture_trustee_name != series_record['debenture_trustee_name']:
            track_change("debenture_trustee_name", series_record['debenture_trustee_name'], series_data.debenture_trustee_name)
            update_fields.append("debenture_trustee_name = %s")
            update_values.append(series_data.debenture_trustee_name)
            changed_fields.append("debenture_trustee_name")
        
        if series_data.investors_size is not None and series_data.investors_size != series_record['investors_size']:
            track_change("investors_size", series_record['investors_size'], series_data.investors_size)
            update_fields.append("investors_size = %s")
            update_values.append(series_data.investors_size)
            changed_fields.append("investors_size")
        
        if series_data.issue_date is not None and series_data.issue_date != series_record['issue_date']:
            track_change("issue_date", series_record['issue_date'], series_data.issue_date)
            update_fields.append("issue_date = %s")
            update_values.append(series_data.issue_date)
            changed_fields.append("issue_date")
        
        if series_data.tenure is not None and series_data.tenure != series_record['tenure']:
            track_change("tenure", series_record['tenure'], series_data.tenure)
            update_fields.append("tenure = %s")
            update_values.append(series_data.tenure)
            changed_fields.append("tenure")
        
        if series_data.maturity_date is not None and series_data.maturity_date != series_record['maturity_date']:
            track_change("maturity_date", series_record['maturity_date'], series_data.maturity_date)
            update_fields.append("maturity_date = %s")
            update_values.append(series_data.maturity_date)
            changed_fields.append("maturity_date")
        
        if series_data.lock_in_date is not None and series_data.lock_in_date != series_record.get('lock_in_date'):
            track_change("lock_in_date", series_record.get('lock_in_date'), series_data.lock_in_date)
            update_fields.append("lock_in_date = %s")
            update_values.append(series_data.lock_in_date)
            changed_fields.append("lock_in_date")
        
        if series_data.subscription_start_date is not None and series_data.subscription_start_date != series_record['subscription_start_date']:
            track_change("subscription_start_date", series_record['subscription_start_date'], series_data.subscription_start_date)
            update_fields.append("subscription_start_date = %s")
            update_values.append(series_data.subscription_start_date)
            changed_fields.append("subscription_start_date")
        
        if series_data.subscription_end_date is not None and series_data.subscription_end_date != series_record['subscription_end_date']:
            track_change("subscription_end_date", series_record['subscription_end_date'], series_data.subscription_end_date)
            update_fields.append("subscription_end_date = %s")
            update_values.append(series_data.subscription_end_date)
            changed_fields.append("subscription_end_date")
        
        if series_data.release_date is not None and series_data.release_date != series_record.get('release_date'):
            track_change("release_date", series_record.get('release_date'), series_data.release_date)
            update_fields.append("release_date = %s")
            update_values.append(series_data.release_date)
            changed_fields.append("release_date")
        
        if series_data.series_start_date is not None and series_data.series_start_date != series_record.get('series_start_date'):
            track_change("series_start_date", series_record.get('series_start_date'), series_data.series_start_date)
            update_fields.append("series_start_date = %s")
            update_values.append(series_data.series_start_date)
            changed_fields.append("series_start_date")
        
        if series_data.min_subscription_percentage is not None and series_data.min_subscription_percentage != series_record['min_subscription_percentage']:
            track_change("min_subscription_percentage", series_record['min_subscription_percentage'], series_data.min_subscription_percentage)
            update_fields.append("min_subscription_percentage = %s")
            update_values.append(series_data.min_subscription_percentage)
            changed_fields.append("min_subscription_percentage")
        
        if series_data.face_value is not None and series_data.face_value != series_record['face_value']:
            track_change("face_value", series_record['face_value'], series_data.face_value)
            update_fields.append("face_value = %s")
            update_values.append(series_data.face_value)
            changed_fields.append("face_value")
        
        if series_data.min_investment is not None and series_data.min_investment != series_record['min_investment']:
            track_change("min_investment", series_record['min_investment'], series_data.min_investment)
            update_fields.append("min_investment = %s")
            update_values.append(series_data.min_investment)
            changed_fields.append("min_investment")
        
        if series_data.target_amount is not None and series_data.target_amount != series_record['target_amount']:
            track_change("target_amount", series_record['target_amount'], series_data.target_amount)
            update_fields.append("target_amount = %s")
            update_values.append(series_data.target_amount)
            changed_fields.append("target_amount")
        
        if series_data.total_issue_size is not None and series_data.total_issue_size != series_record['total_issue_size']:
            track_change("total_issue_size", series_record['total_issue_size'], series_data.total_issue_size)
            update_fields.append("total_issue_size = %s")
            update_values.append(series_data.total_issue_size)
            changed_fields.append("total_issue_size")
        
        if series_data.interest_rate is not None and series_data.interest_rate != series_record['interest_rate']:
            track_change("interest_rate", series_record['interest_rate'], series_data.interest_rate)
            update_fields.append("interest_rate = %s")
            update_values.append(series_data.interest_rate)
            changed_fields.append("interest_rate")
        
        if series_data.credit_rating is not None and series_data.credit_rating != series_record['credit_rating']:
            track_change("credit_rating", series_record['credit_rating'], series_data.credit_rating)
            update_fields.append("credit_rating = %s")
            update_values.append(series_data.credit_rating)
            changed_fields.append("credit_rating")
        
        if series_data.interest_frequency is not None and series_data.interest_frequency != series_record['interest_frequency']:
            track_change("interest_frequency", series_record['interest_frequency'], series_data.interest_frequency)
            update_fields.append("interest_frequency = %s")
            update_values.append(series_data.interest_frequency)
            changed_fields.append("interest_frequency")
        
        if series_data.interest_payment_day is not None and series_data.interest_payment_day != series_record.get('interest_payment_day', 15):
            track_change("interest_payment_day", series_record.get('interest_payment_day', 15), series_data.interest_payment_day)
            update_fields.append("interest_payment_day = %s")
            update_values.append(series_data.interest_payment_day)
            changed_fields.append("interest_payment_day")
            
            # Flag to update payout dates after series update
            payment_day_changed = True
            new_payment_day = series_data.interest_payment_day
        
        if series_data.description is not None and series_data.description != series_record.get('description'):
            track_change("description", series_record.get('description'), series_data.description)
            update_fields.append("description = %s")
            update_values.append(series_data.description)
            changed_fields.append("description")
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add updated_at timestamp
        update_fields.append("updated_at = %s")
        update_values.append(datetime.now())
        
        # Update last_modified_by and last_modified_at if series is DRAFT
        if series_record['status'] == 'DRAFT':
            update_fields.append("last_modified_by = %s")
            update_values.append(current_user.id)
            update_fields.append("last_modified_at = %s")
            update_values.append(datetime.now())
        
        # Add series_id for WHERE clause
        update_values.append(series_id)
        
        update_query = f"UPDATE ncd_series SET {', '.join(update_fields)} WHERE id = %s"
        db.execute_query(update_query, update_values)
        
        # CRITICAL: Insert EDITED record into series_approvals table (if changes were made)
        if changes_made and series_record['status'] == 'DRAFT':
            insert_edit_query = """
            INSERT INTO series_approvals (
                series_id, action_type, user_id, user_name, user_role,
                action_timestamp, changes_made, previous_status, new_status
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            db.execute_query(insert_edit_query, (
                series_id,
                'EDITED',
                current_user.id,
                current_user.full_name,
                current_user.role,
                datetime.now(),
                json.dumps(changes_made),
                series_record['status'],
                series_record['status']  # Status stays same for EDITED
            ))
            
            logger.info(f"✅ Edit history recorded in series_approvals table: {len(changes_made)} fields changed")
        
        # Create audit log with IP tracking
        series_info = series_record
        create_audit_log(
            db=db,
            action="Updated Series",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Updated {', '.join(changed_fields)} for series \"{series_info['name']}\"",
            entity_type="Series",
            entity_id=series_info['series_code'],
            changes={
                "fields": changed_fields,
                "seriesId": series_id,
                "seriesCode": series_info['series_code'],
                "action": "series_updated",
                "changes_detail": changes_made
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        # Get updated series data
        get_updated_query = "SELECT * FROM ncd_series WHERE id = %s AND is_active = 1"
        updated_result = db.execute_query(get_updated_query, (series_id,))
        
        if not updated_result:
            raise HTTPException(status_code=404, detail="Series not found after update")
        
        updated_series = updated_result[0]
        
        # Update payout dates if interest_payment_day was changed
        if payment_day_changed and new_payment_day:
            logger.info(f"🔄 Updating payout dates for series {series_id} to use payment day {new_payment_day}")
            try:
                import calendar
                
                # Get all payout records for this series
                payout_query = """
                SELECT id, payout_month, payout_date
                FROM interest_payouts
                WHERE series_id = %s AND is_active = 1
                """
                
                payouts = db.execute_query(payout_query, (series_id,))
                
                updated_payout_count = 0
                for payout in payouts:
                    payout_id = payout['id']
                    payout_month = payout['payout_month']
                    old_date = payout['payout_date']
                    
                    # Parse the payout month (format: "February 2026")
                    try:
                        from datetime import datetime as dt
                        month_date = dt.strptime(payout_month, '%B %Y')
                        year = month_date.year
                        month = month_date.month
                        
                        # Generate new date with updated payment day
                        max_day = calendar.monthrange(year, month)[1]
                        actual_day = min(new_payment_day, max_day)
                        new_date_obj = date(year, month, actual_day)
                        new_date = new_date_obj.strftime('%d-%b-%Y')
                        
                        if old_date != new_date:
                            update_payout_query = """
                            UPDATE interest_payouts
                            SET payout_date = %s,
                                updated_at = NOW()
                            WHERE id = %s
                            """
                            
                            db.execute_query(update_payout_query, (new_date, payout_id))
                            logger.info(f"  ✅ Updated payout {payout_id}: {old_date} → {new_date}")
                            updated_payout_count += 1
                    except Exception as payout_error:
                        logger.warning(f"  ⚠️  Could not update payout {payout_id}: {payout_error}")
                
                logger.info(f"✅ Updated {updated_payout_count} payout records with new payment day")
            except Exception as e:
                logger.error(f"❌ Error updating payout dates: {e}")
                # Don't fail the series update if payout update fails
        
        # Calculate funds raised and progress
        funds_raised = calculate_funds_raised(db, series_id)
        progress = calculate_progress_percentage(
            funds_raised,
            updated_series['target_amount']
        )
        
        # Helper function to convert date to string
        def date_to_str(date_val):
            if date_val is None:
                return None
            if isinstance(date_val, str):
                return date_val
            # Convert date/datetime to string
            return str(date_val)
        
        # Return updated series with dates converted to strings
        try:
            logger.info(f"📦 Building SeriesResponse with updated data...")
            logger.info(f"   funds_raised: {funds_raised} (type: {type(funds_raised)})")
            logger.info(f"   progress: {progress} (type: {type(progress)})")
            
            response = SeriesResponse(
                id=updated_series['id'],
                name=updated_series['name'],
                series_code=updated_series['series_code'],
                security_type=updated_series['security_type'],
                status=updated_series['status'],
                debenture_trustee_name=updated_series['debenture_trustee_name'],
                investors_size=updated_series['investors_size'],
                issue_date=date_to_str(updated_series['issue_date']),
                tenure=updated_series['tenure'],
                maturity_date=date_to_str(updated_series['maturity_date']),
                lock_in_date=date_to_str(updated_series['lock_in_date']),
                subscription_start_date=date_to_str(updated_series['subscription_start_date']),
                subscription_end_date=date_to_str(updated_series['subscription_end_date']),
                release_date=date_to_str(updated_series['release_date']),
                series_start_date=date_to_str(updated_series.get('series_start_date')),  # NEW FIELD
                min_subscription_percentage=updated_series['min_subscription_percentage'],
                face_value=updated_series['face_value'],
                min_investment=updated_series['min_investment'],
                target_amount=updated_series['target_amount'],
                total_issue_size=updated_series['total_issue_size'],
                interest_rate=updated_series['interest_rate'],
                credit_rating=updated_series['credit_rating'],
                interest_frequency=updated_series['interest_frequency'],
                interest_payment_day=updated_series.get('interest_payment_day', 15),  # NEW FIELD
                description=updated_series['description'],
                created_at=updated_series['created_at'],
                updated_at=updated_series['updated_at'],
                created_by=updated_series['created_by'],
                is_active=bool(updated_series['is_active']),
                funds_raised=float(funds_raised),  # Convert Decimal to float
                progress_percentage=progress
            )
            
            logger.info(f"✅ SeriesResponse built successfully")
            return response
            
        except Exception as response_error:
            logger.error(f"❌ Error building SeriesResponse: {response_error}")
            logger.error(f"   Updated series data: {updated_series}")
            import traceback
            logger.error(traceback.format_exc())
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error building response: {str(response_error)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating series: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating series: {str(e)}"
        )


@router.get("/{series_id}/upcoming-payouts")
async def get_series_upcoming_payouts(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get upcoming month's payouts for a specific series
    ALL LOGIC IN BACKEND - Frontend only displays
    Reuses payout calculation logic from payouts.py
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_upcoming_payouts", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view series payouts"
            )
        
        # Verify series exists and is active
        series_query = """
        SELECT * FROM ncd_series
        WHERE id = %s AND is_active = 1 AND status = 'active'
        """
        series_result = db.execute_query(series_query, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found or not active")
        
        series_data = series_result[0]
        
        # Import payout calculation functions from payouts.py
        from datetime import date
        import sys
        import os
        
        # Add backend directory to path to import from payouts
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        parent_dir = os.path.dirname(backend_dir)
        if parent_dir not in sys.path:
            sys.path.insert(0, parent_dir)
        
        from routes.payouts import (
            calculate_monthly_interest,
            calculate_first_month_interest,
            calculate_exit_interest,
            calculate_maturity_interest,
            is_first_payout,
            is_final_payout_after_exit,
            is_last_payout_before_maturity,
            should_skip_payout,
            get_last_payout_date,
            generate_payout_date,
            generate_payout_month
        )
        
        # Calculate next month
        from datetime import datetime
        current_date = datetime.now()
        
        if current_date.month == 12:
            target_year = current_date.year + 1
            target_month = 1
        else:
            target_year = current_date.year
            target_month = current_date.month + 1
        
        target_month_str = generate_payout_month(target_year, target_month)
        
        logger.info(f"📅 Calculating upcoming payouts for series {series_id}, month: {target_month_str}")
        
        # Query to get all confirmed investments for this series
        query = """
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            inv.bank_name,
            inv.account_number,
            inv.ifsc_code,
            i.id as investment_id,
            i.amount as investment_amount,
            i.exit_date,
            i.status as investment_status,
            i.series_id,
            s.name as series_name,
            s.interest_rate,
            s.interest_payment_day,
            s.series_start_date,
            s.maturity_date,
            s.lock_in_date
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL)
        )
        AND s.id = %s
        AND s.is_active = 1
        AND s.status = 'active'
        ORDER BY inv.investor_id
        """
        
        result = db.execute_query(query, (series_id,))
        
        # Generate payout records
        payouts = []
        payout_id = 1
        
        for row in result:
            # Get series start date
            series_start_date = row['series_start_date']
            if isinstance(series_start_date, str):
                try:
                    series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                except:
                    series_start_date = None
            
            # Get maturity date
            maturity_date = row['maturity_date']
            if isinstance(maturity_date, str):
                try:
                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                except:
                    maturity_date = None
            
            # Get exit date
            exit_date = row['exit_date']
            if isinstance(exit_date, str):
                try:
                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                except:
                    exit_date = None
            
            # Generate payout date for target month
            payout_date_obj = date(
                target_year,
                target_month,
                min(row['interest_payment_day'] or 15, 28)
            )
            
            # Get last payout date for period calculation
            last_payout_date = get_last_payout_date(
                series_start_date if series_start_date else payout_date_obj,
                row['interest_payment_day'] or 15,
                payout_date_obj
            )
            
            # Check if we should skip this payout
            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                continue
            
            # Calculate interest amount based on CORRECT LOGIC
            # RULE 1: First month → If starts on 1st (full monthly), if mid-month (days-wise)
            # RULE 2: Regular full months → FIXED monthly amount
            # RULE 3: Exit → If last day (full monthly), if mid-month (days-wise)
            # RULE 4: Maturity → If last day (full monthly), if mid-month (days-wise)
            
            if series_start_date and is_first_payout(series_start_date, target_month, target_year):
                # SCENARIO 1: First payout - Check if starts on 1st or mid-month
                monthly_interest = calculate_first_month_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    series_start_date,
                    target_month,
                    target_year
                )
            elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                # SCENARIO 2: Investor has exited - Check if last day or mid-month
                monthly_interest = calculate_exit_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    exit_date,
                    target_month - 1 if target_month > 1 else 12,
                    target_year if target_month > 1 else target_year - 1
                )
            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                # SCENARIO 3: Series has matured - Check if last day or mid-month
                monthly_interest = calculate_maturity_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    maturity_date,
                    target_month - 1 if target_month > 1 else 12,
                    target_year if target_month > 1 else target_year - 1
                )
            else:
                # SCENARIO 4: Regular monthly interest (FULL MONTH)
                monthly_interest = calculate_monthly_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate'])
                )
            
            # Check if payout record exists in database
            payout_query = """
            SELECT id, status, payout_date
            FROM interest_payouts
            WHERE investor_id = %s 
            AND series_id = %s 
            AND payout_month = %s
            AND is_active = 1
            """
            
            payout_result = db.execute_query(payout_query, (
                row['investor_id'],
                row['series_id'],
                target_month_str
            ))
            
            if payout_result and len(payout_result) > 0:
                payout_status = payout_result[0]['status']
                payout_date = payout_result[0]['payout_date']
            else:
                payout_status = 'Scheduled'
                payout_date = generate_payout_date(
                    target_year,
                    target_month,
                    row['interest_payment_day'] or 15
                )
            
            payouts.append({
                'id': payout_id,
                'investor_id': row['investor_code'],
                'investor_name': row['investor_name'],
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'interest_month': target_month_str,
                'interest_date': payout_date,
                'amount': monthly_interest,
                'status': payout_status,
                'bank_name': row['bank_name'] or 'N/A',
                'bank_account_number': row['account_number'] or 'N/A',
                'ifsc_code': row['ifsc_code'] or 'N/A'
            })
            
            payout_id += 1
        
        # Calculate summary
        total_amount = sum(p['amount'] for p in payouts)
        
        logger.info(f"✅ Generated {len(payouts)} upcoming payout records for series {series_id}")
        
        return {
            'series_id': series_id,
            'series_name': series_data['name'],
            'interest_payment_day': series_data.get('interest_payment_day', 15),
            'upcoming_month': target_month_str,
            'payouts': payouts,
            'summary': {
                'total_amount': round(total_amount, 2),
                'investor_count': len(payouts),
                'payout_date': generate_payout_date(target_year, target_month, series_data.get('interest_payment_day', 15))
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching series upcoming payouts: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching series upcoming payouts: {str(e)}"
        )


@router.get("/{series_id}/recent-payouts")
async def get_series_recent_payouts(
    series_id: int,
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get recent payout history for a specific series
    Uses the SAME calculation logic as Interest Payout page
    Returns calculated payouts with status from interest_payouts table
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_recent_payouts", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view series payouts"
            )
        
        # Verify series exists
        series_query = """
        SELECT id, name FROM ncd_series
        WHERE id = %s AND is_active = 1
        """
        series_result = db.execute_query(series_query, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_name = series_result[0]['name']
        
        logger.info(f"📅 Fetching recent payouts for series {series_id} using calculated amounts with actual paid timestamps")
        
        # Get calculated payouts from export logic, then enrich with actual paid timestamps
        from routes.payouts import get_export_payouts
        
        try:
            export_data = await get_export_payouts(
                series_id=series_id,
                month_type='current',
                current_user=current_user
            )
            
            # Filter only Paid status
            all_payouts = export_data.get('payouts', [])
            paid_payouts = [p for p in all_payouts if p.get('status') == 'Paid']
            
            # Get actual paid timestamps from interest_payouts table
            payouts = []
            for payout in paid_payouts:
                # Query interest_payouts table for the actual paid timestamp
                timestamp_query = """
                SELECT updated_at, paid_date, created_at
                FROM interest_payouts
                WHERE investor_id = (SELECT id FROM investors WHERE investor_id = %s)
                AND series_id = %s
                AND payout_month = %s
                AND status = 'Paid'
                AND is_active = 1
                LIMIT 1
                """
                
                timestamp_result = db.execute_query(timestamp_query, (
                    payout.get('investor_id'),
                    series_id,
                    payout.get('interest_month')
                ))
                
                # Use updated_at as the paid timestamp (when status was changed to Paid)
                if timestamp_result and len(timestamp_result) > 0:
                    paid_timestamp = timestamp_result[0]['updated_at']
                    if paid_timestamp:
                        paid_date_str = paid_timestamp.strftime('%d-%b-%Y')
                        paid_time_str = paid_timestamp.strftime('%d/%m/%Y %H:%M:%S')
                    else:
                        # Fallback to created_at if updated_at is null
                        created_at = timestamp_result[0]['created_at']
                        paid_date_str = created_at.strftime('%d-%b-%Y') if created_at else payout.get('interest_date', 'N/A')
                        paid_time_str = created_at.strftime('%d/%m/%Y %H:%M:%S') if created_at else None
                else:
                    # No record in interest_payouts table - use payout date
                    paid_date_str = payout.get('interest_date', 'N/A')
                    paid_time_str = None
                
                payouts.append({
                    'id': len(payouts) + 1,
                    'investor_id': payout.get('investor_id', 'N/A'),
                    'investor_name': payout.get('investor_name', 'N/A'),
                    'series_id': series_id,
                    'series_name': series_name,
                    'payout_month': payout.get('interest_month', 'N/A'),
                    'payout_date': paid_date_str,  # Show when it was actually paid
                    'amount': float(payout.get('amount', 0)),
                    'status': payout.get('status', 'N/A'),
                    'paid_date': paid_time_str,  # Full timestamp with time
                    'created_at': None
                })
            
            # Sort by paid date descending and limit
            payouts.sort(key=lambda x: x.get('payout_date', ''), reverse=True)
            payouts = payouts[:limit]
            
            logger.info(f"✅ Found {len(payouts)} recent paid payouts for series {series_id}")
            
            return {
                'series_id': series_id,
                'series_name': series_name,
                'payouts': payouts,
                'count': len(payouts)
            }
            
        except Exception as e:
            logger.error(f"❌ Error calling export endpoint: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to empty list if export fails
            return {
                'series_id': series_id,
                'series_name': series_name,
                'payouts': [],
                'count': 0
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching series recent payouts: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching series recent payouts: {str(e)}"
        )


@router.delete("/{series_id}", response_model=MessageResponse)
async def delete_series(
    series_id: int,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Soft delete a series (mark as inactive)
    
    BUSINESS RULE: Series with investors cannot be deleted
    - Frontend must check if series has investors before calling this endpoint
    - Series can only be deleted if no investors have invested
    - Once investors invest, series must run until maturity
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "delete_ncdSeries", db):
            log_unauthorized_access(db, current_user, "delete_series", "delete_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to delete NCD series"
            )
        
        # Check if series exists
        check_query = "SELECT id, name, series_code, status FROM ncd_series WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_info = result[0]
        
        # TODO: When investments table exists, check for investors:
        # investor_check_query = "SELECT COUNT(*) as count FROM investments WHERE series_id = %s"
        # investor_result = db.execute_query(investor_check_query, (series_id,))
        # if investor_result[0]['count'] > 0:
        #     raise HTTPException(
        #         status_code=400,
        #         detail="Cannot delete series with investors. Series must run until maturity."
        #     )
        
        # Soft delete (mark as inactive)
        delete_query = "UPDATE ncd_series SET is_active = 0, updated_at = %s WHERE id = %s"
        db.execute_query(delete_query, (datetime.now(), series_id))
        
        # Create audit log with IP tracking
        create_audit_log(
            db=db,
            action="Deleted Series",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Deleted series \"{series_info['name']}\" ({series_info['series_code']})",
            entity_type="Series",
            entity_id=series_info['series_code'],
            changes={
                "seriesId": series_id,
                "seriesCode": series_info['series_code'],
                "seriesName": series_info['name'],
                "status": series_info['status'],
                "action": "series_deleted"
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return MessageResponse(
            message=f"Series {series_info['name']} deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting series: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting series"
        )


# ============================================
# ENHANCED ENDPOINT - ALL LOGIC IN BACKEND
# ============================================

@router.get("/enhanced", response_model=List[SeriesEnhancedResponse])
async def get_all_series_enhanced(
    status: Optional[str] = None,
    category: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active series with FULL COMPUTED FIELDS
    ZERO LOGIC NEEDED IN FRONTEND - ALL FORMATTING DONE HERE
    
    This endpoint returns series with:
    - Formatted currency (₹5 Cr, ₹2 L)
    - Formatted dates (DD/MM/YYYY, display format)
    - Status information (label, color, badge)
    - Category for filtering
    - Progress calculations
    - Days until/since dates
    - Subscription status
    - Delete permission
    - Investor count
    
    Optional filters:
    - status: Filter by database status (DRAFT, APPROVED, etc.)
    - category: Filter by calculated category (draft, upcoming, accepting, active, matured)
    """
    try:
        db = get_db()
        logger.info("🔄 Getting enhanced series with ALL computed fields...")
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_all_series_enhanced", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view NCD series"
            )
        
        # Build query with optional status filter
        if status:
            query = """
            SELECT * FROM ncd_series
            WHERE is_active = 1 AND status = %s
            ORDER BY created_at DESC
            """
            result = db.execute_query(query, (status,))
        else:
            query = """
            SELECT * FROM ncd_series
            WHERE is_active = 1
            ORDER BY created_at DESC
            """
            result = db.execute_query(query)
        
        series_list = []
        for series_data in result:
            # ============================================
            # CALCULATE ALL FIELDS - ALL LOGIC IN BACKEND
            # ============================================
            
            # Calculate funds raised and investor count
            funds_raised = calculate_funds_raised(db, series_data['id'])
            investor_count = calculate_investor_count(db, series_data['id'])
            progress = calculate_progress_percentage(funds_raised, series_data['target_amount'])
            
            # Calculate actual status based on dates
            calculated_status = calculate_series_status(series_data)
            
            # Get status info (label, color, badge)
            status_info = get_status_info(calculated_status)
            
            # Get category for filtering
            series_category = get_series_category(calculated_status)
            
            # Filter by category if requested
            if category and series_category != category:
                continue
            
            # Format all currency fields
            formatted_target_amount = format_currency(series_data['target_amount'])
            formatted_funds_raised = format_currency(funds_raised)
            formatted_face_value = format_currency(series_data['face_value'])
            formatted_min_investment = format_currency(series_data['min_investment'])
            
            # Format all date fields
            formatted_issue_date = format_date(series_data['issue_date'])
            formatted_maturity_date = format_date(series_data['maturity_date'])
            formatted_subscription_start = format_date(series_data['subscription_start_date'])
            formatted_subscription_end = format_date(series_data['subscription_end_date'])
            formatted_release_date = format_date(series_data['release_date'])
            formatted_lock_in_date = format_date(series_data['lock_in_date'])
            
            # Calculate days until/since dates
            days_until_maturity = calculate_days_until(series_data['maturity_date'])
            days_until_subscription_start = calculate_days_until(series_data['subscription_start_date'])
            days_until_subscription_end = calculate_days_until(series_data['subscription_end_date'])
            
            # Check subscription status
            subscription_open = is_subscription_open(
                series_data['subscription_start_date'],
                series_data['subscription_end_date']
            )
            
            # Check delete permission
            can_delete = can_delete_series(calculated_status)
            
            # ============================================
            # BUILD ENHANCED RESPONSE - ALL FIELDS COMPUTED
            # ============================================
            
            series_list.append(SeriesEnhancedResponse(
                # Basic fields from database
                id=series_data['id'],
                name=series_data['name'],
                series_code=series_data['series_code'],
                security_type=series_data['security_type'],
                status=calculated_status,  # Calculated status, not DB status
                debenture_trustee_name=series_data['debenture_trustee_name'],
                investors_size=series_data['investors_size'],
                issue_date=series_data['issue_date'],
                tenure=series_data['tenure'],
                maturity_date=series_data['maturity_date'],
                lock_in_date=series_data['lock_in_date'],
                subscription_start_date=series_data['subscription_start_date'],
                subscription_end_date=series_data['subscription_end_date'],
                release_date=series_data['release_date'],
                series_start_date=series_data.get('series_start_date'),
                min_subscription_percentage=series_data['min_subscription_percentage'],
                face_value=series_data['face_value'],
                min_investment=series_data['min_investment'],
                target_amount=series_data['target_amount'],
                total_issue_size=series_data['total_issue_size'],
                interest_rate=series_data['interest_rate'],
                credit_rating=series_data['credit_rating'],
                interest_frequency=series_data['interest_frequency'],
                interest_payment_day=series_data.get('interest_payment_day', 15),
                description=series_data['description'],
                created_at=series_data['created_at'],
                updated_at=series_data['updated_at'],
                created_by=series_data['created_by'],
                is_active=bool(series_data['is_active']),
                
                # ============================================
                # COMPUTED FIELDS - ALL LOGIC IN BACKEND
                # ============================================
                status_info=status_info,
                category=series_category,
                formatted_target_amount=formatted_target_amount,
                formatted_funds_raised=formatted_funds_raised,
                formatted_face_value=formatted_face_value,
                formatted_min_investment=formatted_min_investment,
                formatted_issue_date=formatted_issue_date,
                formatted_maturity_date=formatted_maturity_date,
                formatted_subscription_start=formatted_subscription_start,
                formatted_subscription_end=formatted_subscription_end,
                formatted_release_date=formatted_release_date,
                formatted_lock_in_date=formatted_lock_in_date,
                funds_raised=funds_raised,
                progress_percentage=progress,
                investor_count=investor_count,
                days_until_maturity=days_until_maturity,
                days_until_subscription_start=days_until_subscription_start,
                days_until_subscription_end=days_until_subscription_end,
                is_subscription_open=subscription_open,
                can_delete=can_delete
            ))
        
        logger.info(f"✅ Returning {len(series_list)} enhanced series with ALL computed fields")
        return series_list
        
    except Exception as e:
        logger.error(f"❌ Error getting enhanced series: {e}")
        import traceback
        logger.error(f"❌ TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving enhanced series: {str(e)}"
        )


@router.get("/by-category", response_model=Dict[str, List[SeriesEnhancedResponse]])
async def get_series_by_category(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get series grouped by category
    Returns: {
        "draft": [...],
        "rejected": [...],
        "upcoming": [...],
        "accepting": [...],
        "active": [...],
        "matured": [...]
    }
    
    ZERO LOGIC IN FRONTEND - ALL GROUPING DONE HERE
    """
    try:
        logger.info("🔄 Getting series grouped by category...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_by_category", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view NCD series"
            )
        
        # Get all enhanced series
        all_series = await get_all_series_enhanced(current_user=current_user)
        
        # Group by category
        grouped = {
            "draft": [],
            "rejected": [],
            "upcoming": [],
            "accepting": [],
            "active": [],
            "matured": []
        }
        
        for series in all_series:
            category = series.category
            if category in grouped:
                grouped[category].append(series)
        
        logger.info(f"✅ Grouped series: draft={len(grouped['draft'])}, rejected={len(grouped['rejected'])}, upcoming={len(grouped['upcoming'])}, accepting={len(grouped['accepting'])}, active={len(grouped['active'])}, matured={len(grouped['matured'])}")
        
        return grouped
        
    except Exception as e:
        logger.error(f"❌ Error grouping series by category: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error grouping series: {str(e)}"
        )


@router.post("/{series_id}/approve", response_model=SeriesResponse)
async def approve_series(
    series_id: int,
    series_data: SeriesUpdate,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Approve a series - ALL LOGIC IN BACKEND
    - Validates series exists and is in DRAFT status
    - Handles date format conversions (DD/MM/YYYY → YYYY-MM-DD)
    - Tracks ALL changes (old → new values)
    - Calculates correct status based on dates
    - Creates comprehensive audit log
    - Returns updated series with calculated status
    """
    try:
        logger.info(f"🔄 Approving series ID: {series_id}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_approval", db):
            log_unauthorized_access(db, current_user, "approve_series", "edit_approval")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to approve NCD series"
            )
        
        # Import date utilities
        from date_utils import parse_date_flexible, format_date_for_db
        
        # Check if series exists and is DRAFT
        check_query = """
        SELECT * FROM ncd_series 
        WHERE id = %s AND is_active = 1
        """
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_record = result[0]
        
        if series_record['status'] != 'DRAFT':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot approve series with status '{series_record['status']}'. Only DRAFT series can be approved."
            )
        
        # Track all changes for audit log
        changes_made = {}
        
        # Track all changes for audit log
        changes_made = {}
        
        # Build update query with provided data
        update_fields = []
        update_values = []
        
        # Helper function to track changes
        def track_change(field_name, old_value, new_value):
            if old_value != new_value:
                changes_made[field_name] = {
                    "old": str(old_value) if old_value is not None else None,
                    "new": str(new_value) if new_value is not None else None
                }
        
        # Update all provided fields and track changes
        if series_data.name is not None and series_data.name != series_record['name']:
            update_fields.append("name = %s")
            update_values.append(series_data.name)
            track_change("name", series_record['name'], series_data.name)
        
        # series_code is NOT editable - it's a unique identifier, so we skip it
        
        if series_data.security_type is not None and series_data.security_type.value != series_record['security_type']:
            update_fields.append("security_type = %s")
            update_values.append(series_data.security_type.value)
            track_change("security_type", series_record['security_type'], series_data.security_type.value)

        
        if series_data.debenture_trustee_name is not None and series_data.debenture_trustee_name != series_record['debenture_trustee_name']:
            update_fields.append("debenture_trustee_name = %s")
            update_values.append(series_data.debenture_trustee_name)
            track_change("debenture_trustee_name", series_record['debenture_trustee_name'], series_data.debenture_trustee_name)
        
        if series_data.investors_size is not None and series_data.investors_size != series_record['investors_size']:
            update_fields.append("investors_size = %s")
            update_values.append(series_data.investors_size)
            track_change("investors_size", series_record['investors_size'], series_data.investors_size)
        
        # Handle dates - convert from DD/MM/YYYY to YYYY-MM-DD for database
        if series_data.issue_date is not None:
            db_date = format_date_for_db(series_data.issue_date)
            if db_date and db_date != str(series_record['issue_date']):
                update_fields.append("issue_date = %s")
                update_values.append(db_date)
                track_change("issue_date", series_record['issue_date'], db_date)
        
        if series_data.tenure is not None and series_data.tenure != series_record['tenure']:
            update_fields.append("tenure = %s")
            update_values.append(series_data.tenure)
            track_change("tenure", series_record['tenure'], series_data.tenure)
        
        if series_data.maturity_date is not None:
            db_date = format_date_for_db(series_data.maturity_date)
            if db_date and db_date != str(series_record['maturity_date']):
                update_fields.append("maturity_date = %s")
                update_values.append(db_date)
                track_change("maturity_date", series_record['maturity_date'], db_date)
        
        if series_data.lock_in_date is not None:
            db_date = format_date_for_db(series_data.lock_in_date)
            if db_date and db_date != str(series_record.get('lock_in_date')):
                update_fields.append("lock_in_date = %s")
                update_values.append(db_date)
                track_change("lock_in_date", series_record.get('lock_in_date'), db_date)
        
        if series_data.subscription_start_date is not None:
            db_date = format_date_for_db(series_data.subscription_start_date)
            if db_date and db_date != str(series_record['subscription_start_date']):
                update_fields.append("subscription_start_date = %s")
                update_values.append(db_date)
                track_change("subscription_start_date", series_record['subscription_start_date'], db_date)
        
        if series_data.subscription_end_date is not None:
            db_date = format_date_for_db(series_data.subscription_end_date)
            if db_date and db_date != str(series_record['subscription_end_date']):
                update_fields.append("subscription_end_date = %s")
                update_values.append(db_date)
                track_change("subscription_end_date", series_record['subscription_end_date'], db_date)
        
        if series_data.release_date is not None:
            db_date = format_date_for_db(series_data.release_date)
            if db_date and db_date != str(series_record.get('release_date')):
                update_fields.append("release_date = %s")
                update_values.append(db_date)
                track_change("release_date", series_record.get('release_date'), db_date)
        
        if series_data.series_start_date is not None:
            db_date = format_date_for_db(series_data.series_start_date)
            if db_date and db_date != str(series_record.get('series_start_date')):
                update_fields.append("series_start_date = %s")
                update_values.append(db_date)
                track_change("series_start_date", series_record.get('series_start_date'), db_date)
        
        if series_data.min_subscription_percentage is not None and series_data.min_subscription_percentage != series_record['min_subscription_percentage']:
            update_fields.append("min_subscription_percentage = %s")
            update_values.append(series_data.min_subscription_percentage)
            track_change("min_subscription_percentage", series_record['min_subscription_percentage'], series_data.min_subscription_percentage)
        
        if series_data.face_value is not None and series_data.face_value != series_record['face_value']:
            update_fields.append("face_value = %s")
            update_values.append(series_data.face_value)
            track_change("face_value", series_record['face_value'], series_data.face_value)
        
        if series_data.min_investment is not None and series_data.min_investment != series_record['min_investment']:
            update_fields.append("min_investment = %s")
            update_values.append(series_data.min_investment)
            track_change("min_investment", series_record['min_investment'], series_data.min_investment)
        
        if series_data.target_amount is not None and series_data.target_amount != series_record['target_amount']:
            update_fields.append("target_amount = %s")
            update_values.append(series_data.target_amount)
            track_change("target_amount", series_record['target_amount'], series_data.target_amount)
        
        if series_data.total_issue_size is not None and series_data.total_issue_size != series_record['total_issue_size']:
            update_fields.append("total_issue_size = %s")
            update_values.append(series_data.total_issue_size)
            track_change("total_issue_size", series_record['total_issue_size'], series_data.total_issue_size)
        
        if series_data.interest_rate is not None and series_data.interest_rate != series_record['interest_rate']:
            update_fields.append("interest_rate = %s")
            update_values.append(series_data.interest_rate)
            track_change("interest_rate", series_record['interest_rate'], series_data.interest_rate)
        
        if series_data.credit_rating is not None and series_data.credit_rating != series_record['credit_rating']:
            update_fields.append("credit_rating = %s")
            update_values.append(series_data.credit_rating)
            track_change("credit_rating", series_record['credit_rating'], series_data.credit_rating)
        
        if series_data.interest_frequency is not None and series_data.interest_frequency != series_record['interest_frequency']:
            update_fields.append("interest_frequency = %s")
            update_values.append(series_data.interest_frequency)
            track_change("interest_frequency", series_record['interest_frequency'], series_data.interest_frequency)
        
        if series_data.description is not None and series_data.description != series_record.get('description'):
            update_fields.append("description = %s")
            update_values.append(series_data.description)
            track_change("description", series_record.get('description'), series_data.description)
        
        # Calculate status based on dates (BACKEND LOGIC)
        # Get the updated dates (use new values if provided, otherwise use existing)
        subscription_start = format_date_for_db(series_data.subscription_start_date) if series_data.subscription_start_date is not None else series_record['subscription_start_date']
        subscription_end = format_date_for_db(series_data.subscription_end_date) if series_data.subscription_end_date is not None else series_record['subscription_end_date']
        maturity_date_val = format_date_for_db(series_data.maturity_date) if series_data.maturity_date is not None else series_record['maturity_date']
        series_start = format_date_for_db(series_data.series_start_date) if series_data.series_start_date is not None else series_record.get('series_start_date')
        
        # Calculate actual status based on dates
        # Build series_data dict for status calculation
        series_data_for_status = {
            'id': series_id,
            'status': 'upcoming',  # Default after approval
            'subscription_start_date': parse_date_flexible(subscription_start),
            'subscription_end_date': parse_date_flexible(subscription_end),
            'release_date': parse_date_flexible(format_date_for_db(series_data.release_date) if series_data.release_date is not None else series_record.get('release_date')),
            'maturity_date': parse_date_flexible(maturity_date_val),
            'series_start_date': parse_date_flexible(series_start) if series_start else None
        }
        
        calculated_status = calculate_series_status(series_data_for_status)
        
        # Set status to calculated value
        update_fields.append("status = %s")
        update_values.append(calculated_status)
        track_change("status", "DRAFT", calculated_status)
        
        # Add updated_at timestamp
        update_fields.append("updated_at = %s")
        update_values.append(datetime.now())
        
        # Add series_id for WHERE clause
        update_values.append(series_id)
        
        # Execute update
        update_query = f"""
        UPDATE ncd_series 
        SET {', '.join(update_fields)} 
        WHERE id = %s
        """
        
        db.execute_query(update_query, update_values)
        
        # Add approval metadata to changes
        changes_made["approved_at"] = datetime.now().isoformat()
        changes_made["approved_by"] = current_user.full_name
        changes_made["calculated_status"] = calculated_status
        
        # CRITICAL: Insert into series_approvals table for approval history with IP tracking
        approval_notes = series_data.description if series_data.description else "Series approved"
        insert_approval_query = """
        INSERT INTO series_approvals (
            series_id, action_type, user_id, user_name, user_role,
            action_timestamp, approval_notes, changes_made,
            previous_status, new_status, ip_address, user_agent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_approval_query, (
            series_id,
            'APPROVED',
            current_user.id,
            current_user.full_name,
            current_user.role,
            datetime.now(),
            approval_notes,
            json.dumps(changes_made),
            'DRAFT',
            calculated_status,
            get_client_ip(request),
            get_user_agent(request)
        ))
        
        logger.info(f"✅ Approval history recorded in series_approvals table with IP: {get_client_ip(request)}")
        
        # CRITICAL: Update ncd_series approval tracking columns
        update_approval_columns_query = """
        UPDATE ncd_series 
        SET approved_at = %s, approved_by = %s, approval_notes = %s
        WHERE id = %s
        """
        
        db.execute_query(update_approval_columns_query, (
            datetime.now(),
            current_user.id,
            approval_notes,
            series_id
        ))
        
        logger.info(f"✅ Approval metadata updated in ncd_series table")
        
        # Create comprehensive audit log with IP tracking
        changed_fields = [k for k in changes_made.keys() if k not in ["approved_at", "approved_by", "calculated_status"]]
        details = f"Approved series '{series_record['name']}' - Status changed from DRAFT to '{calculated_status}'"
        if changed_fields:
            details += f" - Modified fields: {', '.join(changed_fields)}"
        
        create_audit_log(
            db=db,
            action="Approved Series",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=details,
            entity_type="Series",
            entity_id=series_record['series_code'],
            changes=changes_made,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        # Get updated series
        result = db.execute_query(check_query, (series_id,))
        updated_series = result[0]
        
        logger.info(f"✅ Series approved: {updated_series['name']} - Status: {updated_series['status']}")
        logger.info(f"✅ Changes tracked: {len(changes_made)} fields modified")
        
        # Helper function to convert date to string
        def date_to_str(date_val):
            if date_val is None:
                return None
            if isinstance(date_val, str):
                return date_val
            # Convert date/datetime to string
            return str(date_val)
        
        return SeriesResponse(
            id=updated_series['id'],
            name=updated_series['name'],
            series_code=updated_series['series_code'],
            security_type=updated_series['security_type'],
            status=updated_series['status'],
            debenture_trustee_name=updated_series['debenture_trustee_name'],
            investors_size=updated_series['investors_size'],
            issue_date=date_to_str(updated_series['issue_date']),
            tenure=updated_series['tenure'],
            maturity_date=date_to_str(updated_series['maturity_date']),
            lock_in_date=date_to_str(updated_series['lock_in_date']),
            subscription_start_date=date_to_str(updated_series['subscription_start_date']),
            subscription_end_date=date_to_str(updated_series['subscription_end_date']),
            release_date=date_to_str(updated_series['release_date']),
            series_start_date=date_to_str(updated_series.get('series_start_date')),  # NEW FIELD
            min_subscription_percentage=updated_series['min_subscription_percentage'],
            face_value=updated_series['face_value'],
            min_investment=updated_series['min_investment'],
            target_amount=updated_series['target_amount'],
            total_issue_size=updated_series['total_issue_size'],
            interest_rate=updated_series['interest_rate'],
            credit_rating=updated_series['credit_rating'],
            interest_frequency=updated_series['interest_frequency'],
            interest_payment_day=updated_series.get('interest_payment_day', 15),  # NEW FIELD
            description=updated_series['description'],
            created_at=updated_series['created_at'],
            updated_at=updated_series['updated_at'],
            created_by=updated_series['created_by'],
            is_active=bool(updated_series['is_active']),
            funds_raised=Decimal('0'),
            progress_percentage=0.0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error approving series: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error approving series: {str(e)}"
        )


@router.post("/{series_id}/reject")
async def reject_series(
    series_id: int,
    rejection_data: dict,
    request: Request,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Reject a series - ALL LOGIC IN BACKEND
    - Validates series exists and is in DRAFT status
    - Sets status to REJECTED
    - Stores rejection reason and timestamp
    """
    try:
        logger.info(f"🔄 Rejecting series ID: {series_id}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_approval", db):
            log_unauthorized_access(db, current_user, "reject_series", "edit_approval")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to reject NCD series"
            )
        
        # Check if series exists and is DRAFT
        check_query = """
        SELECT * FROM ncd_series 
        WHERE id = %s AND is_active = 1
        """
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_record = result[0]
        
        if series_record['status'] != 'DRAFT':
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot reject series with status '{series_record['status']}'. Only DRAFT series can be rejected."
            )
        
        rejection_reason = rejection_data.get('reason', 'No reason provided')
        
        # Update series status to REJECTED
        update_query = """
        UPDATE ncd_series 
        SET status = %s, updated_at = %s
        WHERE id = %s
        """
        
        db.execute_query(update_query, ('REJECTED', datetime.now(), series_id))
        
        # CRITICAL: Insert into series_approvals table for rejection history with IP tracking
        insert_rejection_query = """
        INSERT INTO series_approvals (
            series_id, action_type, user_id, user_name, user_role,
            action_timestamp, rejection_reason, changes_made,
            previous_status, new_status, ip_address, user_agent
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        changes_for_rejection = {
            "status": {"old": "DRAFT", "new": "REJECTED"},
            "rejection_reason": rejection_reason
        }
        
        db.execute_query(insert_rejection_query, (
            series_id,
            'REJECTED',
            current_user.id,
            current_user.full_name,
            current_user.role,
            datetime.now(),
            rejection_reason,
            json.dumps(changes_for_rejection),
            'DRAFT',
            'REJECTED',
            get_client_ip(request),
            get_user_agent(request)
        ))
        
        logger.info(f"✅ Rejection history recorded in series_approvals table with IP: {get_client_ip(request)}")
        
        # CRITICAL: Update ncd_series rejection tracking columns
        update_rejection_columns_query = """
        UPDATE ncd_series 
        SET rejected_at = %s, rejected_by = %s, rejection_reason = %s
        WHERE id = %s
        """
        
        db.execute_query(update_rejection_columns_query, (
            datetime.now(),
            current_user.id,
            rejection_reason,
            series_id
        ))
        
        logger.info(f"✅ Rejection metadata updated in ncd_series table")
        
        # Create audit log with IP tracking
        create_audit_log(
            db=db,
            action="Rejected Series",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Rejected series '{series_record['name']}' - Reason: {rejection_reason}",
            entity_type="Series",
            entity_id=series_record['series_code'],
            changes={
                "status": {"old": "DRAFT", "new": "REJECTED"},
                "rejection_reason": rejection_reason,
                "rejected_at": datetime.now().isoformat(),
                "rejected_by": current_user.full_name
            },
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        logger.info(f"✅ Series rejected: {series_record['name']}")
        
        return {
            "success": True,
            "message": f"Series '{series_record['name']}' has been rejected",
            "series_id": series_id,
            "status": "REJECTED"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error rejecting series: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error rejecting series: {str(e)}"
        )



# ============================================
# APPROVAL HISTORY ENDPOINTS
# ============================================

@router.get("/{series_id}/approval-history")
async def get_approval_history(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get complete approval history for a series
    Shows all APPROVED, REJECTED, and EDITED actions
    """
    try:
        logger.info(f"🔄 Getting approval history for series ID: {series_id}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_approval_history", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view approval history"
            )
        
        # Check if series exists
        check_query = "SELECT id, name, series_code, status FROM ncd_series WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_info = result[0]
        
        # Get approval history
        history_query = """
        SELECT 
            id,
            action_type,
            user_name,
            user_role,
            action_timestamp,
            approval_notes,
            rejection_reason,
            changes_made,
            previous_status,
            new_status
        FROM series_approvals
        WHERE series_id = %s
        ORDER BY action_timestamp DESC
        """
        
        history_result = db.execute_query(history_query, (series_id,))
        
        # Parse JSON changes_made field
        for record in history_result:
            if record['changes_made']:
                try:
                    record['changes_made'] = json.loads(record['changes_made'])
                except:
                    record['changes_made'] = {}
        
        logger.info(f"✅ Found {len(history_result)} approval history records")
        
        return {
            "series_id": series_id,
            "series_name": series_info['name'],
            "series_code": series_info['series_code'],
            "current_status": series_info['status'],
            "history_count": len(history_result),
            "history": history_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting approval history: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving approval history"
        )


@router.get("/pending-approvals")
async def get_pending_approvals(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all series pending approval (DRAFT status)
    Includes edit count and last edited timestamp
    """
    try:
        logger.info(f"🔄 Getting pending approvals")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_pending_approvals", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view pending approvals"
            )
        
        # Get all DRAFT series with edit count
        query = """
        SELECT 
            ns.id,
            ns.name,
            ns.series_code,
            ns.status,
            ns.created_at,
            ns.created_by,
            ns.target_amount,
            ns.interest_rate,
            ns.issue_date,
            ns.maturity_date,
            ns.subscription_start_date,
            ns.subscription_end_date,
            COUNT(sa.id) as edit_count,
            MAX(sa.action_timestamp) as last_edited_at,
            (SELECT user_name FROM series_approvals 
             WHERE series_id = ns.id AND action_type = 'EDITED' 
             ORDER BY action_timestamp DESC LIMIT 1) as last_edited_by
        FROM ncd_series ns
        LEFT JOIN series_approvals sa ON ns.id = sa.series_id AND sa.action_type = 'EDITED'
        WHERE ns.status = 'DRAFT' AND ns.is_active = 1
        GROUP BY ns.id
        ORDER BY ns.created_at DESC
        """
        
        result = db.execute_query(query)
        
        # Calculate days pending for each series
        from datetime import date
        today = date.today()
        
        for series in result:
            if series['created_at']:
                created_date = series['created_at'].date() if hasattr(series['created_at'], 'date') else series['created_at']
                days_pending = (today - created_date).days
                series['days_pending'] = days_pending
            else:
                series['days_pending'] = 0
        
        logger.info(f"✅ Found {len(result)} pending approvals")
        
        return {
            "count": len(result),
            "series": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting pending approvals: {e}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving pending approvals"
        )


# ============================================
# DOCUMENT UPLOAD ENDPOINTS
# ============================================

@router.post("/{series_id}/documents/upload")
async def upload_series_documents(
    series_id: int,
    term_sheet: UploadFile = File(...),
    offer_document: UploadFile = File(...),
    board_resolution: UploadFile = File(...),
    request: Request = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload all 3 required documents for a series
    Documents are uploaded to S3 and metadata saved to database
    """
    try:
        logger.info(f"🔄 Uploading documents for series {series_id}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "create_ncdSeries", db):
            log_unauthorized_access(db, current_user, "upload_series_documents", "create_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to upload documents"
            )
        
        # Check if series exists
        check_query = "SELECT id, name FROM ncd_series WHERE id = %s AND is_active = 1"
        result = db.execute_query(check_query, (series_id,))
        
        if not result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_name = result[0]['name']
        
        # Import S3 service
        from s3_service import S3Service
        s3_service = S3Service()
        
        uploaded_docs = []
        
        # Upload each document
        documents = [
            ('term_sheet', term_sheet),
            ('offer_document', offer_document),
            ('board_resolution', board_resolution)
        ]
        
        for doc_type, file in documents:
            if file:
                # Read file content
                file_content = await file.read()
                
                # Upload to S3
                success, doc_info, error_msg = s3_service.upload_series_document(
                    series_id=series_id,
                    document_type=doc_type,
                    file_content=file_content,
                    file_name=file.filename
                )
                
                if not success:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Failed to upload {doc_type}: {error_msg}"
                    )
                
                # Save to database
                insert_query = """
                INSERT INTO series_documents (
                    series_id, document_type, file_name, s3_url, s3_bucket, s3_key,
                    file_size, content_type, uploaded_by, uploaded_at, is_active
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(insert_query, (
                    series_id,
                    doc_type,
                    file.filename,
                    doc_info['s3_url'],
                    doc_info['s3_bucket'],
                    doc_info['s3_key'],
                    doc_info['file_size'],
                    doc_info['content_type'],
                    current_user.full_name,
                    datetime.now(),
                    True
                ))
                
                uploaded_docs.append({
                    'document_type': doc_type,
                    'file_name': file.filename,
                    'file_size': doc_info['file_size']
                })
                
                logger.info(f"✅ Uploaded {doc_type}: {file.filename}")
        
        # Create audit log with IP tracking
        create_audit_log(
            db=db,
            action="Uploaded Documents",
            admin_name=current_user.full_name,
            admin_role=current_user.role,
            details=f"Uploaded 3 documents for series \"{series_name}\"",
            entity_type="Series",
            entity_id=str(series_id),
            changes={
                "series_id": series_id,
                "documents_uploaded": len(uploaded_docs),
                "action": "documents_uploaded"
            },
            ip_address=get_client_ip(request) if request else None,
            user_agent=get_user_agent(request) if request else None
        )
        
        return {
            "message": "Documents uploaded successfully",
            "series_id": series_id,
            "documents": uploaded_docs
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading documents: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading documents: {str(e)}"
        )


@router.get("/{series_id}/documents")
async def get_series_documents(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all documents for a series with signed URLs for viewing
    """
    try:
        logger.info(f"🔄 Getting documents for series {series_id}")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_ncdSeries", db):
            log_unauthorized_access(db, current_user, "get_series_documents", "view_ncdSeries")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view documents"
            )
        
        # Get documents from database
        query = """
        SELECT id, series_id, document_type, file_name, s3_key, s3_bucket,
               file_size, content_type, uploaded_at, uploaded_by
        FROM series_documents
        WHERE series_id = %s AND is_active = 1
        ORDER BY document_type
        """
        
        result = db.execute_query(query, (series_id,))
        
        if not result:
            return {
                "series_id": series_id,
                "documents": [],
                "message": "No documents found"
            }
        
        # Import S3 service to generate signed URLs
        from s3_service import S3Service
        s3_service = S3Service()
        
        documents = []
        for doc in result:
            # Generate fresh signed URL (valid for 1 hour)
            signed_url = s3_service.generate_signed_url(doc['s3_key'])
            
            documents.append({
                'id': doc['id'],
                'document_type': doc['document_type'],
                'file_name': doc['file_name'],
                'file_size': doc['file_size'],
                'content_type': doc['content_type'],
                'uploaded_at': str(doc['uploaded_at']),
                'uploaded_by': doc['uploaded_by'],
                'view_url': signed_url  # Signed URL for viewing
            })
        
        return {
            "series_id": series_id,
            "documents": documents,
            "total_count": len(documents)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting documents: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving documents: {str(e)}"
        )


# ============================================
# SERIES FILTERING FOR INVESTMENTS
# ============================================

@router.get("/available-for-investment")
async def get_series_available_for_investment(
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get series that are available for new investments
    Includes status calculation and subscription window validation
    
    Parameters:
    - search: Optional search term for series name or ID
    
    Returns: List of series with calculated status and availability
    """
    try:
        db = get_db()
        
        # Get all active series
        query = """
        SELECT id, name, series_code, status, subscription_start_date, subscription_end_date,
               series_start_date, maturity_date, interest_rate, min_investment, target_amount,
               funds_raised, investors_size
        FROM ncd_series
        WHERE is_active = 1
        """
        
        params = []
        
        # Add search filter if provided
        if search:
            query += " AND (name LIKE %s OR series_code LIKE %s OR id LIKE %s)"
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        query += " ORDER BY name"
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        # Calculate status for each series
        from datetime import date
        today = date.today()
        
        series_list = []
        for row in result:
            subscription_start = row['subscription_start_date']
            subscription_end = row['subscription_end_date']
            series_start = row['series_start_date']
            maturity_date = row['maturity_date']
            
            # Calculate actual status
            calculated_status = row['status']
            is_accepting = False
            blocking_message = None
            
            # Check if DRAFT
            if row['status'] in ['DRAFT', 'PENDING_APPROVAL']:
                calculated_status = 'DRAFT'
                blocking_message = f"Series is in draft status and not approved for investments"
            # Check if matured
            elif maturity_date and today > maturity_date:
                calculated_status = 'matured'
                blocking_message = "Series has matured and no longer accepts investments"
            # Check subscription window
            elif subscription_start and subscription_end:
                if today < subscription_start:
                    calculated_status = 'upcoming'
                    blocking_message = f"Subscription has not started yet. Starts on {subscription_start.strftime('%d/%m/%Y')}"
                elif today >= subscription_start and today <= subscription_end:
                    calculated_status = 'accepting'
                    is_accepting = True
                elif today > subscription_end:
                    calculated_status = 'active'
                    blocking_message = f"Subscription window ended on {subscription_end.strftime('%d/%m/%Y')}"
            
            # Calculate progress
            progress = 0
            if row['target_amount'] and row['target_amount'] > 0:
                progress = (row['funds_raised'] / row['target_amount']) * 100
            
            series_list.append({
                "id": row['id'],
                "name": row['name'],
                "series_code": row['series_code'],
                "status": calculated_status,
                "is_accepting": is_accepting,
                "blocking_message": blocking_message,
                "subscription_start_date": subscription_start.strftime('%d/%m/%Y') if subscription_start else None,
                "subscription_end_date": subscription_end.strftime('%d/%m/%Y') if subscription_end else None,
                "series_start_date": series_start.strftime('%d/%m/%Y') if series_start else None,
                "maturity_date": maturity_date.strftime('%d/%m/%Y') if maturity_date else None,
                "interest_rate": float(row['interest_rate']) if row['interest_rate'] else 0,
                "min_investment": float(row['min_investment']) if row['min_investment'] else 0,
                "target_amount": float(row['target_amount']) if row['target_amount'] else 0,
                "funds_raised": float(row['funds_raised']) if row['funds_raised'] else 0,
                "progress": round(progress, 2),
                "investors_size": row['investors_size']
            })
        
        logger.info(f"Retrieved {len(series_list)} series for investment (search: {search})")
        return {
            "series": series_list,
            "total": len(series_list),
            "accepting_count": sum(1 for s in series_list if s['is_accepting'])
        }
        
    except Exception as e:
        logger.error(f"Error fetching series for investment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series: {str(e)}"
        )
