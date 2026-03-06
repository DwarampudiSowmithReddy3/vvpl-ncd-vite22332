"""
SIMPLIFIED COMMUNICATION ROUTES
ALL LOGIC IN BACKEND - Frontend is just UI
Attack-proof, secure, and simple
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from pydantic import BaseModel, validator
from models import UserInDB
from auth import get_current_user
from database import get_db
from permissions_checker import has_permission, log_unauthorized_access
from datetime import datetime
import logging
import json
import os

router = APIRouter(prefix="/communication", tags=["communication"])
logger = logging.getLogger(__name__)


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class SendMessageRequest(BaseModel):
    """Simple request model for sending messages"""
    type: str  # 'SMS' or 'Email'
    template_id: Optional[int] = None  # Use template or custom message
    custom_message: Optional[str] = None  # Custom message if no template
    series_ids: List[int]  # Which series to send to
    
    @validator('type')
    def validate_type(cls, v):
        if v not in ['SMS', 'Email']:
            raise ValueError('Type must be SMS or Email')
        return v
    
    @validator('custom_message', 'template_id')
    def validate_message_source(cls, v, values):
        # Must have either template_id or custom_message
        if 'template_id' in values and not values.get('template_id') and not v:
            raise ValueError('Must provide either template_id or custom_message')
        return v


class TemplateResponse(BaseModel):
    id: int
    name: str
    type: str
    subject: Optional[str]
    content: str
    is_active: bool


class VariableResponse(BaseModel):
    variable_name: str
    display_name: str
    description: Optional[str]
    example_value: Optional[str]


class SeriesWithInvestorsResponse(BaseModel):
    id: int
    name: str
    series_code: str
    status: str
    investor_count: int


# ============================================
# HELPER FUNCTIONS
# ============================================

def get_client_ip(request: Request) -> str:
    """Extract client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    if request.client:
        return request.client.host
    return "unknown"


def create_audit_log(db, action: str, admin_name: str, admin_role: str, 
                     details: str, entity_type: str, entity_id: str, 
                     changes: dict = None, ip_address: str = None):
    """Create audit log entry"""
    try:
        changes_json = json.dumps(changes) if changes else None
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, 
                               entity_type, entity_id, changes, timestamp, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            action, admin_name, admin_role, details,
            entity_type, entity_id, changes_json,
            datetime.now(), ip_address
        ))
        
    except Exception as e:
        logger.error(f"❌ Failed to create audit log: {e}")


def personalize_message(message: str, investor_data: dict) -> str:
    """Replace variables in message with actual data"""
    replacements = {
        '{InvestorName}': investor_data.get('name', ''),
        '{InvestorID}': investor_data.get('investor_id', ''),
        '{SeriesName}': investor_data.get('series_name', ''),
        '{Amount}': f"₹{investor_data.get('amount', 0):,.2f}" if investor_data.get('amount') else '₹0',
        '{BankAccountNumber}': investor_data.get('account_number', 'N/A'),
        '{InterestMonth}': investor_data.get('interest_month', ''),
        '{Status}': investor_data.get('status', 'has been')
    }
    
    for variable, value in replacements.items():
        message = message.replace(variable, str(value))
    
    return message


def send_sms_via_kaleyra(phone: str, message: str) -> tuple:
    """
    Send SMS via Kaleyra API
    Returns: (success: bool, message_id: str, error: str)
    """
    try:
        # Get Kaleyra credentials from environment
        api_key = os.getenv('KALEYRA_API_KEY')
        sid = os.getenv('KALEYRA_SID')
        sender_id = os.getenv('KALEYRA_SENDER_ID')
        api_url = os.getenv('KALEYRA_API_URL', 'https://api.kaleyra.io/v1/')
        
        if not all([api_key, sid, sender_id]):
            logger.error("❌ Kaleyra credentials not configured")
            return (False, None, "SMS service not configured")
        
        # TODO: Implement actual Kaleyra API call here
        # For now, simulate success
        logger.warning("⚠️ SMS sending simulated - Kaleyra API not implemented yet")
        message_id = f"SMS_{datetime.now().timestamp()}"
        
        # REPLACE THIS WITH ACTUAL KALEYRA API CALL:
        # import requests
        # response = requests.post(
        #     f"{api_url}messages",
        #     headers={'api-key': api_key},
        #     json={
        #         'to': phone,
        #         'sender': sender_id,
        #         'body': message,
        #         'type': 'TXN'
        #     }
        # )
        # if response.status_code == 200:
        #     data = response.json()
        #     return (True, data.get('id'), None)
        # else:
        #     return (False, None, response.text)
        
        return (True, message_id, None)
        
    except Exception as e:
        logger.error(f"❌ SMS sending error: {e}")
        return (False, None, str(e))


def send_email_via_smtp(email: str, subject: str, message: str) -> tuple:
    """
    Send Email via SMTP
    Returns: (success: bool, message_id: str, error: str)
    """
    try:
        # Get SMTP credentials from environment
        smtp_host = os.getenv('VITE_SMTP_HOST')
        smtp_port = os.getenv('VITE_SMTP_PORT')
        smtp_user = os.getenv('VITE_SMTP_USER')
        smtp_password = os.getenv('VITE_SMTP_PASSWORD')
        
        if not all([smtp_host, smtp_user, smtp_password]):
            logger.error("❌ SMTP credentials not configured")
            return (False, None, "Email service not configured")
        
        # TODO: Implement actual SMTP email sending here
        # For now, simulate success
        logger.warning("⚠️ Email sending simulated - SMTP not implemented yet")
        message_id = f"EMAIL_{datetime.now().timestamp()}"
        
        # REPLACE THIS WITH ACTUAL SMTP CALL:
        # import smtplib
        # from email.mime.text import MIMEText
        # from email.mime.multipart import MIMEMultipart
        # 
        # msg = MIMEMultipart()
        # msg['From'] = smtp_user
        # msg['To'] = email
        # msg['Subject'] = subject
        # msg.attach(MIMEText(message, 'plain'))
        # 
        # with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
        #     server.starttls()
        #     server.login(smtp_user, smtp_password)
        #     server.send_message(msg)
        # 
        # return (True, message_id, None)
        
        return (True, message_id, None)
        
    except Exception as e:
        logger.error(f"❌ Email sending error: {e}")
        return (False, None, str(e))


# ============================================
# API ENDPOINTS
# ============================================

@router.get("/templates", response_model=List[TemplateResponse])
async def get_templates(
    type: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active message templates from database
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_templates", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to view communication"
            )
        
        # Build query
        query = "SELECT * FROM communication_templates WHERE is_active = TRUE"
        params = []
        
        if type and type in ['SMS', 'Email']:
            query += " AND type = %s"
            params.append(type)
        
        query += " ORDER BY name ASC"
        
        templates = db.execute_query(query, tuple(params) if params else None)
        
        logger.info(f"✅ Retrieved {len(templates)} templates")
        return templates
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching templates: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/variables", response_model=List[VariableResponse])
async def get_variables(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active variables from database
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_variables", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to view communication"
            )
        
        query = """
        SELECT variable_name, display_name, description, example_value
        FROM communication_variables 
        WHERE is_active = TRUE
        ORDER BY variable_name ASC
        """
        
        variables = db.execute_query(query)
        
        logger.info(f"✅ Retrieved {len(variables)} variables")
        return variables
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching variables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/series", response_model=List[SeriesWithInvestorsResponse])
async def get_series_for_communication(
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all series with investor counts
    ALL LOGIC IN BACKEND - Simple and secure
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_series_for_communication", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to view communication"
            )
        
        # Build query - ALL LOGIC HERE
        query = """
        SELECT 
            s.id,
            s.name,
            s.series_code,
            s.status,
            COUNT(DISTINCT inv.investor_id) as investor_count
        FROM ncd_series s
        LEFT JOIN investments inv ON s.id = inv.series_id AND inv.status = 'confirmed'
        WHERE s.is_active = 1
        """
        
        params = []
        
        # Apply filters
        if status_filter and status_filter != 'all':
            query += " AND s.status = %s"
            params.append(status_filter)
        
        if search and search.strip():
            query += " AND s.name LIKE %s"
            params.append(f"%{search}%")
        
        query += """
        GROUP BY s.id, s.name, s.series_code, s.status
        HAVING investor_count > 0
        ORDER BY s.name ASC
        """
        
        series = db.execute_query(query, tuple(params) if params else None)
        
        logger.info(f"✅ Retrieved {len(series)} series with investors")
        return series
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching series: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/send")
async def send_messages(
    request: Request,
    message_request: SendMessageRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Send messages to investors in selected series
    ALL LOGIC IN BACKEND - Simple, secure, attack-proof
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "create_communication", db):
            log_unauthorized_access(db, current_user, "send_messages", "create_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to send messages"
            )
        
        logger.info(f"📤 Sending {message_request.type} to series: {message_request.series_ids}")
        
        # Get message content
        message_content = ""
        subject = None
        
        if message_request.template_id:
            # Use template from database
            template_query = """
            SELECT content, subject FROM communication_templates 
            WHERE id = %s AND type = %s AND is_active = TRUE
            """
            template = db.execute_query(template_query, (message_request.template_id, message_request.type))
            
            if not template:
                raise HTTPException(status_code=404, detail="Template not found")
            
            message_content = template[0]['content']
            subject = template[0].get('subject')
        else:
            # Use custom message
            message_content = message_request.custom_message
            subject = f"Important Update - NCD Investment"
        
        # Get all investors from selected series - ALL LOGIC IN BACKEND
        placeholders = ','.join(['%s'] * len(message_request.series_ids))
        investor_query = f"""
        SELECT 
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.account_number,
            s.id as series_id,
            s.name as series_name,
            inv.amount
        FROM investors i
        INNER JOIN investments inv ON i.id = inv.investor_id
        INNER JOIN ncd_series s ON inv.series_id = s.id
        WHERE s.id IN ({placeholders})
          AND inv.status = 'confirmed'
          AND i.status = 'active'
        ORDER BY i.full_name ASC
        """
        
        investors = db.execute_query(investor_query, tuple(message_request.series_ids))
        
        if not investors:
            raise HTTPException(status_code=404, detail="No active investors found in selected series")
        
        logger.info(f"📊 Found {len(investors)} investors to send messages to")
        
        # Send messages and track results
        successful = 0
        failed = 0
        results = []
        
        for investor in investors:
            # Personalize message
            personalized_message = personalize_message(message_content, investor)
            personalized_subject = personalize_message(subject, investor) if subject else None
            
            # Get contact info
            contact_info = investor['email'] if message_request.type == 'Email' else investor['phone']
            
            if not contact_info:
                # No contact info - mark as failed
                error_msg = f"No {'email' if message_request.type == 'Email' else 'phone'} available"
                
                # Save to database
                db.execute_query("""
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    message_request.type, investor['name'], contact_info or 'N/A',
                    investor['investor_id'], investor['series_name'],
                    personalized_subject, personalized_message,
                    'Failed', error_msg,
                    current_user.full_name, current_user.role.value, datetime.now()
                ))
                
                failed += 1
                results.append({
                    "investor": investor['name'],
                    "status": "Failed",
                    "error": error_msg
                })
                continue
            
            # Send message via appropriate service
            if message_request.type == 'SMS':
                send_success, message_id, error = send_sms_via_kaleyra(contact_info, personalized_message)
            else:
                send_success, message_id, error = send_email_via_smtp(contact_info, personalized_subject, personalized_message)
            
            # Save to database
            if send_success:
                db.execute_query("""
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, message_id, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    message_request.type, investor['name'], contact_info,
                    investor['investor_id'], investor['series_name'],
                    personalized_subject, personalized_message,
                    'Success', message_id,
                    current_user.full_name, current_user.role.value, datetime.now()
                ))
                
                successful += 1
                results.append({
                    "investor": investor['name'],
                    "status": "Success",
                    "messageId": message_id
                })
            else:
                db.execute_query("""
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    message_request.type, investor['name'], contact_info,
                    investor['investor_id'], investor['series_name'],
                    personalized_subject, personalized_message,
                    'Failed', error,
                    current_user.full_name, current_user.role.value, datetime.now()
                ))
                
                failed += 1
                results.append({
                    "investor": investor['name'],
                    "status": "Failed",
                    "error": error
                })
        
        # Create audit log
        create_audit_log(
            db=db,
            action=f"Sent {message_request.type}",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Sent {successful} {message_request.type} messages ({failed} failed)",
            entity_type="Communication",
            entity_id=f"Bulk_{message_request.type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            changes={
                "type": message_request.type,
                "total": len(investors),
                "successful": successful,
                "failed": failed,
                "series_count": len(message_request.series_ids)
            },
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"✅ Sent {successful} messages, {failed} failed")
        
        return {
            "total_sent": len(investors),
            "successful": successful,
            "failed": failed,
            "details": results
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending messages: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history")
async def get_communication_history(
    type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get communication history from database
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_communication_history", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to view communication history"
            )
        
        # Build query
        query = "SELECT * FROM communication_history WHERE 1=1"
        params = []
        
        if type:
            query += " AND type = %s"
            params.append(type)
        
        if status:
            query += " AND status = %s"
            params.append(status)
        
        query += " ORDER BY sent_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        history = db.execute_query(query, tuple(params))
        
        logger.info(f"📊 Retrieved {len(history)} communication history records")
        return history
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching communication history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/stats")
async def get_communication_stats(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get communication statistics
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        # Check permission
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_communication_stats", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: No permission to view communication history"
            )
        
        query = """
        SELECT 
            COUNT(*) as total_count,
            SUM(CASE WHEN type = 'SMS' THEN 1 ELSE 0 END) as sms_count,
            SUM(CASE WHEN type = 'Email' THEN 1 ELSE 0 END) as email_count
        FROM communication_history
        """
        
        result = db.execute_query(query)
        stats = result[0] if result else {}
        
        return {
            'total_count': stats.get('total_count', 0),
            'sms_count': stats.get('sms_count', 0),
            'email_count': stats.get('email_count', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching communication stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
