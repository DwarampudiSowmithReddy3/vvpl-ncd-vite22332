"""
Communication Routes - SMS and Email sending
ALL LOGIC IN BACKEND, NO FRONTEND LOGIC
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from app.models.pydantic.models import (
    SendMessageRequest,
    CommunicationHistoryResponse,
    BulkMessageResponse,
    UserInDB,
    CommunicationType,
    CommunicationStatus
)
from app.core.auth import get_current_user
from app.core.database import get_db
from app.core.permissions import has_permission, log_unauthorized_access
from datetime import datetime
import logging
import json
import os
import requests
from app.services.communication.kaleyra_service import send_single_sms, send_bulk_sms
from app.services.communication.mailchimp_service import MailchimpService

router = APIRouter(prefix="/communication", tags=["communication"])
logger = logging.getLogger(__name__)

# Initialize Mailchimp service
mailchimp_service = MailchimpService()


def send_sms_via_kaleyra(phone: str, message: str, template_id: str, message_type_code: str = 'TXN') -> tuple:
    """
    Send SMS via Kaleyra Service (API v1)
    Parameters:
    - phone: Phone number with country code (e.g., 919876543210)
    - message: Message content
    - template_id: Kaleyra DLT template ID
    - message_type_code: DLT message type (TXN, PRM, OTP, ALR, SRV)
    Returns: (success: bool, message_id: str, error: str)
    """
    return send_single_sms(phone, message, template_id, message_type_code)


def send_email_via_mailchimp(email: str, subject: str, message: str) -> tuple:
    """
    Send Email via Mailchimp
    Returns: (success: bool, message_id: str, error: str)
    """
    # try:
    # Convert plain text to HTML (simple conversion)
    html_content = f"<p>{message.replace(chr(10), '<br>')}</p>"
    
    logger.info(f"📤 Sending email to {email} via Mailchimp")
    logger.info(f"📤 Subject: {subject}")
    
    # Send via Mailchimp
    success, message_id, error = mailchimp_service.send_email(
        to_email=email,
        subject=subject,
        html_content=html_content,
        text_content=message
    )
    
    if success:
        logger.info(f"✅ Email sent successfully! Message ID: {message_id}")
        return (True, message_id, None)
    else:
        logger.error(f"❌ Email failed: {error}")
        return (False, None, error)
    
    # except Exception as e:
    #     logger.error(f"❌ Error sending email: {e}")
    #     import traceback
    #     logger.error(traceback.format_exc())
    #     return (False, None, str(e))


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


def create_audit_log(db, action: str, admin_name: str, admin_role: str, 
                     details: str, entity_type: str, entity_id: str, 
                     changes: dict = None, ip_address: str = None):
    """Helper function to create audit log entries"""
    try:
        changes_json = json.dumps(changes) if changes else None
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, 
                               entity_type, entity_id, changes, timestamp, ip_address)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
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
            ip_address
        ))
        
        logger.info(f"✅ Audit log created: {action} by {admin_name}")
        
    except Exception as e:
        logger.error(f"❌ Failed to create audit log: {e}")


@router.get("/series-with-investors")
async def get_series_with_investors(
    search: str = None,
    status_filter: str = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active series with their investors
    Supports search and status filtering (ALL LOGIC IN BACKEND)
    
    Parameters:
    - search: Search term for series name
    - status_filter: Filter by status (all, active, upcoming, accepting)
    
    Returns series list with investor counts for communication page
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_series_with_investors", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication"
            )
        
        logger.info(f"📊 Fetching series with investors (search: {search}, status: {status_filter})")
        
        # Build query with filters
        query = """
        SELECT 
            s.id,
            s.name,
            s.series_code,
            s.status,
            COUNT(DISTINCT inv.investor_id) as investor_count
        FROM ncd_series s
        LEFT JOIN investments inv ON s.id = inv.series_id AND inv.status = 'confirmed'
        LEFT JOIN investors i ON inv.investor_id = i.investor_id
        WHERE s.is_active = 1
        """
        
        params = []
        
        # Apply status filter
        if status_filter and status_filter != 'all':
            query += " AND s.status = %s"
            params.append(status_filter)
        
        # Apply search filter (search in series name)
        if search and search.strip():
            query += " AND s.name LIKE %s"
            params.append(f"%{search}%")
        
        query += """
        GROUP BY s.id, s.name, s.series_code, s.status
        ORDER BY s.name ASC
        """
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        series_list = []
        for row in result:
            series_list.append({
                'id': row['id'],
                'name': row['name'],
                'series_code': row['series_code'],
                'status': row['status'],
                'investorCount': row['investor_count']
            })
        
        logger.info(f"✅ Found {len(series_list)} series")
        
        return {
            'series': series_list,
            'count': len(series_list)
        }
        
    except Exception as e:
        logger.error(f"Error fetching series with investors: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series: {str(e)}"
        )


@router.get("/series/{series_id}/investors-for-communication")
async def get_investors_for_communication(
    series_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all investors for a specific series with contact information
    Returns investor details needed for sending messages
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_investors_for_communication", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication"
            )
        
        # Verify series exists
        series_check = "SELECT id, name FROM ncd_series WHERE id = %s"
        series_result = db.execute_query(series_check, (series_id,))
        
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_name = series_result[0]['name']
        
        # Get all investors with investments in this series (including deleted investors for reference)
        query = """
        SELECT 
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.bank_name,
            i.account_number,
            i.status,
            COALESCE(SUM(inv.amount), 0) as total_invested
        FROM investors i
        INNER JOIN investments inv ON i.id = inv.investor_id
        WHERE inv.series_id = %s 
          AND inv.status = 'confirmed'
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone, 
                 i.bank_name, i.account_number, i.status
        ORDER BY i.full_name
        """
        
        investors = db.execute_query(query, (series_id,))
        
        logger.info(f"📊 Found {len(investors)} investors for series {series_name}")
        
        result = []
        for inv in investors:
            result.append({
                "id": inv['id'],
                "investorId": inv['investor_id'],
                "name": inv['name'],
                "email": inv['email'],
                "phone": inv['phone'],
                "bankName": inv['bank_name'],
                "accountNumber": inv['account_number'],
                "totalInvested": float(inv['total_invested']),
                "status": inv['status']
            })
        
        return {
            "series_id": series_id,
            "series_name": series_name,
            "investors": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search-investors")
async def search_investors(
    search: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Search investors across all series by name, email, phone, or investor ID
    ALL LOGIC IN BACKEND
    
    Parameters:
    - search: Search term for investor name, email, phone, or ID
    
    Returns matching investors with their series information
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "search_investors", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication"
            )
        
        if not search or not search.strip():
            return {
                'investors': [],
                'count': 0
            }
        
        logger.info(f"🔍 Searching investors with term: {search}")
        
        # Search investors by name, email, phone, or investor ID (including deleted for reference)
        query = """
        SELECT DISTINCT
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.status,
            GROUP_CONCAT(DISTINCT s.id) as series_ids,
            GROUP_CONCAT(DISTINCT s.name) as series_names
        FROM investors i
        INNER JOIN investments inv ON i.investor_id = inv.investor_id
        INNER JOIN ncd_series s ON inv.series_id = s.id
        WHERE inv.status = 'confirmed'
        AND s.is_active = 1
        AND (
            i.full_name LIKE %s
            OR i.email LIKE %s
            OR i.phone LIKE %s
            OR i.investor_id LIKE %s
        )
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone, i.status
        ORDER BY i.full_name ASC
        LIMIT 50
        """
        
        search_param = f"%{search}%"
        result = db.execute_query(query, (search_param, search_param, search_param, search_param))
        
        investors_list = []
        for row in result:
            # Parse series IDs and names
            series_ids = row['series_ids'].split(',') if row['series_ids'] else []
            series_names = row['series_names'].split(',') if row['series_names'] else []
            
            investors_list.append({
                'id': row['id'],
                'investorId': row['investor_id'],
                'name': row['name'],
                'email': row['email'],
                'phone': row['phone'],
                'status': row['status'],
                'seriesIds': [int(sid) for sid in series_ids],
                'series': series_names
            })
        
        logger.info(f"✅ Found {len(investors_list)} matching investors")
        
        return {
            'investors': investors_list,
            'count': len(investors_list)
        }
        
    except Exception as e:
        logger.error(f"Error searching investors: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching investors: {str(e)}"
        )


@router.post("/send-messages", response_model=BulkMessageResponse)
async def send_bulk_messages(
    request: Request,
    message_request: SendMessageRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Send bulk SMS or Email messages to selected investors
    ALL LOGIC HERE - Frontend only sends request
    """
    try:
        db = get_db()
        
        # DEBUG: Log received data
        logger.info(f"📥 Received message request:")
        logger.info(f"   Type: {message_request.type}")
        logger.info(f"   Investor IDs: {message_request.investor_ids}")
        logger.info(f"   Series IDs: {message_request.series_ids}")
        logger.info(f"   Message length: {len(message_request.message)}")
        
        # CHECK PERMISSION
        if not has_permission(current_user, "create_communication", db):
            log_unauthorized_access(db, current_user, "send_bulk_messages", "create_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to send messages"
            )
        
        logger.info(f"📤 Sending {message_request.type} to {len(message_request.investor_ids)} investors")
        
        # Get investor details
        if not message_request.investor_ids:
            raise HTTPException(status_code=400, detail="No investors selected")
        
        placeholders = ','.join(['%s'] * len(message_request.investor_ids))
        investor_query = f"""
        SELECT DISTINCT
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.bank_name,
            i.account_number,
            inv.series_id,
            s.name as series_name,
            inv.amount as investment_amount
        FROM investors i
        INNER JOIN investments inv ON i.id = inv.investor_id
        INNER JOIN ncd_series s ON inv.series_id = s.id
        WHERE i.investor_id IN ({placeholders})
          AND inv.status IN ('confirmed', 'pending')
          AND i.status != 'deleted'
        """
        
        investors = db.execute_query(investor_query, tuple(message_request.investor_ids))
        
        logger.info(f"🔍 Query returned {len(investors) if investors else 0} investors")
        
        if not investors:
            # Log debug info
            debug_query = f"""
            SELECT 
                i.id,
                i.full_name,
                inv.status as investment_status,
                i.status as investor_status
            FROM investors i
            LEFT JOIN investments inv ON i.id = inv.investor_id
            WHERE i.investor_id IN ({placeholders})
            """
            debug_result = db.execute_query(debug_query, tuple(message_request.investor_ids))
            logger.warning(f"⚠️ Debug info: {debug_result}")
            
            raise HTTPException(status_code=400, detail="No valid investors found")
        
        # Send messages and track results
        results = []
        successful = 0
        failed = 0
        
        # For EMAIL: Fetch template from DB, personalize per investor, send in batch
        # For SMS: Fetch template from DB, personalize per investor, send individually (Kaleyra doesn't support batching)
        
        if message_request.type == CommunicationType.EMAIL:
            # EMAIL: Template-based sending (fetch from DB, personalize, send in batch)
            
            # Fetch email template from database
            if not message_request.template_id:
                raise HTTPException(status_code=400, detail="Email template_id is required")
            
            template_query = """
            SELECT id, name, subject, content
            FROM communication_templates 
            WHERE id = %s AND type = 'Email' AND is_active = TRUE
            """
            template_result = db.execute_query(template_query, (message_request.template_id,))
            
            if not template_result:
                raise HTTPException(status_code=400, detail="Email template not found")
            
            template = template_result[0]
            template_subject = template['subject']
            template_content = template['content']
            
            logger.info(f"📋 Using email template: {template['name']}")
            
            # Build email batch with personalized content per investor
            email_batch = []
            email_investor_map = {}  # Map email to investor data for tracking
            
            for investor in investors:
                # Personalize subject
                personalized_subject = template_subject
                personalized_subject = personalized_subject.replace('{InvestorName}', investor['name'])
                personalized_subject = personalized_subject.replace('{InvestorID}', investor['investor_id'])
                personalized_subject = personalized_subject.replace('{SeriesName}', investor['series_name'])
                personalized_subject = personalized_subject.replace('{Amount}', f"₹{investor['investment_amount']:,.2f}")
                personalized_subject = personalized_subject.replace('{BankAccountNumber}', str(investor.get('account_number') or 'N/A'))
                
                # Personalize content
                personalized_message = template_content
                personalized_message = personalized_message.replace('{InvestorName}', investor['name'])
                personalized_message = personalized_message.replace('{InvestorID}', investor['investor_id'])
                personalized_message = personalized_message.replace('{SeriesName}', investor['series_name'])
                personalized_message = personalized_message.replace('{Amount}', f"₹{investor['investment_amount']:,.2f}")
                personalized_message = personalized_message.replace('{BankAccountNumber}', str(investor.get('account_number') or 'N/A'))
                
                contact_info = investor['email']
                
                if not contact_info:
                    # No email - mark as failed
                    error_msg = "No email available"
                    
                    insert_query = """
                    INSERT INTO communication_history 
                    (type, recipient_name, recipient_contact, investor_id, series_name, 
                     subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    db.execute_query(insert_query, (
                        message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                        investor['name'],
                        'N/A',
                        investor['investor_id'],
                        investor['series_name'],
                        personalized_subject,
                        personalized_message,
                        CommunicationStatus.FAILED.value,
                        error_msg,
                        current_user.full_name,
                        current_user.role,
                        datetime.now()
                    ))
                    
                    results.append({
                        "investor": investor['name'],
                        "status": "Failed",
                        "error": error_msg
                    })
                    failed += 1
                    continue
                
                # Add to batch (simple, no merge_vars - backend already personalized)
                email_batch.append({
                    'email': contact_info,
                    'name': investor['name']
                })
                email_investor_map[contact_info] = {
                    'investor': investor,
                    'personalized_subject': personalized_subject,
                    'personalized_message': personalized_message
                }
            
            # Send all emails in batch (optimized for 1000+ emails)
            if email_batch:
                logger.info(f"📤 Sending {len(email_batch)} emails in batch mode")
                
                # Send first email to get subject/content format, then send batch
                # Note: We send each personalized email separately to Mailchimp batch
                batch_results = {
                    "successful": 0,
                    "failed": 0,
                    "details": []
                }
                
                # Process each email in the batch
                for email_recipient in email_batch:
                    email = email_recipient['email']
                    investor_data = email_investor_map.get(email, {})
                    investor = investor_data.get('investor', {})
                    personalized_subject = investor_data.get('personalized_subject', '')
                    personalized_message = investor_data.get('personalized_message', '')
                    
                    # Send email via Mailchimp
                    send_success, message_id, error_msg = send_email_via_mailchimp(
                        email,
                        personalized_subject,
                        personalized_message
                    )
                    
                    if send_success:
                        batch_results["successful"] += 1
                        batch_results["details"].append({
                            "email": email,
                            "name": investor.get('name', 'Unknown'),
                            "status": "success",
                            "message_id": message_id
                        })
                    else:
                        batch_results["failed"] += 1
                        batch_results["details"].append({
                            "email": email,
                            "name": investor.get('name', 'Unknown'),
                            "status": "failed",
                            "error": error_msg
                        })
                
                # Process batch results and save to database
                for detail in batch_results['details']:
                    email = detail['email']
                    investor_data = email_investor_map.get(email, {})
                    investor = investor_data.get('investor', {})
                    personalized_subject = investor_data.get('personalized_subject', '')
                    personalized_message = investor_data.get('personalized_message', '')
                    
                    if detail['status'] == 'success':
                        # Save success to database
                        insert_query = """
                        INSERT INTO communication_history 
                        (type, recipient_name, recipient_contact, investor_id, series_name, 
                         subject, message, status, message_id, sent_by, sent_by_role, sent_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        db.execute_query(insert_query, (
                            message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                            investor.get('name', detail['name']),
                            email,
                            investor.get('investor_id', 'N/A'),
                            investor.get('series_name', 'N/A'),
                            personalized_subject,
                            personalized_message,
                            CommunicationStatus.SUCCESS.value,
                            detail.get('message_id', 'MAILCHIMP'),
                            current_user.full_name,
                            current_user.role,
                            datetime.now()
                        ))
                        
                        results.append({
                            "investor": investor.get('name', detail['name']),
                            "status": "Success",
                            "messageId": detail.get('message_id')
                        })
                        successful += 1
                    else:
                        # Save failure to database
                        error_msg = detail.get('error', 'Failed to send email')
                        
                        insert_query = """
                        INSERT INTO communication_history 
                        (type, recipient_name, recipient_contact, investor_id, series_name, 
                         subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """
                        
                        db.execute_query(insert_query, (
                            message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                            investor.get('name', detail['name']),
                            email,
                            investor.get('investor_id', 'N/A'),
                            investor.get('series_name', 'N/A'),
                            personalized_subject,
                            personalized_message,
                            CommunicationStatus.FAILED.value,
                            error_msg,
                            current_user.full_name,
                            current_user.role,
                            datetime.now()
                        ))
                        
                        results.append({
                            "investor": investor.get('name', detail['name']),
                            "status": "Failed",
                            "error": error_msg
                        })
                        failed += 1
        
        else:
            # SMS: Template-based sending (fetch from DB, personalize, send individually)
            
            # Fetch SMS template from database
            if not message_request.template_id:
                raise HTTPException(status_code=400, detail="SMS template_id is required")
            
            template_query = """
            SELECT id, name, content, template_id, message_type_code
            FROM communication_templates 
            WHERE id = %s AND type = 'SMS' AND is_active = TRUE
            """
            template_result = db.execute_query(template_query, (message_request.template_id,))
            
            if not template_result:
                raise HTTPException(status_code=400, detail="SMS template not found")
            
            template = template_result[0]
            template_content = template['content']
            template_id = template['template_id']
            message_type_code = template['message_type_code']
            
            logger.info(f"📋 Using SMS template: {template['name']}")
            logger.info(f"📋 Template ID: {template_id}")
            logger.info(f"📋 Message Type Code: {message_type_code}")
            
            # Send SMS individually (Kaleyra doesn't support batching)
            for investor in investors:
                # Personalize message from template
                personalized_message = template_content
                personalized_message = personalized_message.replace('{InvestorName}', investor['name'])
                personalized_message = personalized_message.replace('{InvestorID}', investor['investor_id'])
                personalized_message = personalized_message.replace('{SeriesName}', investor['series_name'])
                personalized_message = personalized_message.replace('{Amount}', f"₹{investor['investment_amount']:,.2f}")
                personalized_message = personalized_message.replace('{BankAccountNumber}', str(investor.get('account_number') or 'N/A'))
                
                contact_info = investor['phone']
                
                if not contact_info:
                    # No phone - mark as failed
                    error_msg = "No phone available"
                    
                    insert_query = """
                    INSERT INTO communication_history 
                    (type, recipient_name, recipient_contact, investor_id, series_name, 
                     subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    db.execute_query(insert_query, (
                        message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                        investor['name'],
                        'N/A',
                        investor['investor_id'],
                        investor['series_name'],
                        message_request.subject,
                        personalized_message,
                        CommunicationStatus.FAILED.value,
                        error_msg,
                        current_user.full_name,
                        current_user.role,
                        datetime.now()
                    ))
                    
                    results.append({
                        "investor": investor['name'],
                        "status": "Failed",
                        "error": error_msg
                    })
                    failed += 1
                    continue
                
                # Send SMS via Kaleyra with template_id and message_type_code
                send_success, message_id, error_msg = send_sms_via_kaleyra(contact_info, personalized_message, template_id, message_type_code)
                
                if send_success:
                    # Save success to database
                    insert_query = """
                    INSERT INTO communication_history 
                    (type, recipient_name, recipient_contact, investor_id, series_name, 
                     subject, message, status, message_id, sent_by, sent_by_role, sent_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    db.execute_query(insert_query, (
                        message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                        investor['name'],
                        contact_info,
                        investor['investor_id'],
                        investor['series_name'],
                        message_request.subject,
                        personalized_message,
                        CommunicationStatus.SUCCESS.value,
                        message_id,
                        current_user.full_name,
                        current_user.role,
                        datetime.now()
                    ))
                    
                    results.append({
                        "investor": investor['name'],
                        "status": "Success",
                        "messageId": message_id
                    })
                    successful += 1
                else:
                    # Save failure to database - preserve real error message from Kaleyra
                    error_msg = error_msg or "Failed to send message"
                    
                    insert_query = """
                    INSERT INTO communication_history 
                    (type, recipient_name, recipient_contact, investor_id, series_name, 
                     subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    db.execute_query(insert_query, (
                        message_request.type if isinstance(message_request.type, str) else message_request.type.value,
                        investor['name'],
                        contact_info,
                        investor['investor_id'],
                        investor['series_name'],
                        message_request.subject,
                        personalized_message,
                        CommunicationStatus.FAILED.value,
                        error_msg,
                        current_user.full_name,
                        current_user.role,
                        datetime.now()
                    ))
                    
                    results.append({
                        "investor": investor['name'],
                        "status": "Failed",
                        "error": error_msg
                    })
                    failed += 1
        
        # Create audit log
        create_audit_log(
            db=db,
            action=f"Sent {message_request.type.value if hasattr(message_request.type, 'value') else message_request.type}",
            admin_name=current_user.full_name,
            admin_role=current_user.role,  # Already a string, no .value needed
            details=f"Sent {successful} {message_request.type.value if hasattr(message_request.type, 'value') else message_request.type} messages to investors ({failed} failed)",
            entity_type="Communication",
            entity_id=f"Bulk_{message_request.type.value if hasattr(message_request.type, 'value') else message_request.type}",
            changes={
                "type": message_request.type.value if hasattr(message_request.type, 'value') else message_request.type,
                "total": len(investors),
                "successful": successful,
                "failed": failed,
                "series_count": len(message_request.series_ids)
            },
            ip_address=get_client_ip(request)
        )
        
        logger.info(f"✅ Sent {successful} messages, {failed} failed")
        
        return BulkMessageResponse(
            total_sent=len(investors),
            successful=successful,
            failed=failed,
            details=results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error sending messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history", response_model=List[CommunicationHistoryResponse])
async def get_communication_history(
    type: str = None,
    status: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get communication history from database
    Supports filtering by type and status (ALL LOGIC IN BACKEND)
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_communication_history", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication history"
            )
        
        # Build query with filters
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
        
        result = []
        for record in history:
            result.append(CommunicationHistoryResponse(
                id=record['id'],
                type=record['type'],
                recipient_name=record['recipient_name'],
                recipient_contact=record['recipient_contact'],
                investor_id=record['investor_id'],
                series_name=record['series_name'],
                subject=record['subject'],
                message=record['message'],
                status=record['status'],
                error_message=record['error_message'],
                message_id=record['message_id'],
                sent_by=record['sent_by'],
                sent_by_role=record['sent_by_role'],
                sent_at=record['sent_at']
            ))
        
        logger.info(f"📊 Retrieved {len(result)} communication history records")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching communication history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/stats")
async def get_communication_history_stats(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get communication history statistics (counts by type)
    ALL LOGIC IN BACKEND
    
    Returns:
    - total_count: Total number of communications
    - sms_count: Number of SMS messages
    - email_count: Number of Email messages
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_communication_history_stats", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication history"
            )
        
        logger.info("📊 Fetching communication history statistics")
        
        # Get counts by type
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
        
    except Exception as e:
        logger.error(f"Error fetching communication history stats: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving communication history stats: {str(e)}"
        )


@router.get("/templates")
async def get_communication_templates(
    type: str = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all active communication templates from database
    ALL LOGIC IN BACKEND
    
    Parameters:
    - type: Filter by communication type ('SMS' or 'Email') OR message type code ('TXN', 'PRM', 'OTP', 'ALR', 'SRV')
    
    Returns list of templates with id, name, type, subject, content, template_id, message_type_code
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_communication", db):
            log_unauthorized_access(db, current_user, "get_communication_templates", "view_communication")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view communication templates"
            )
        
        logger.info(f"📊 Fetching communication templates (filter: {type})")
        
        # Build query with optional type filter
        query = """
        SELECT 
            id,
            name,
            type,
            subject,
            content,
            template_id,
            message_type_code,
            created_at,
            updated_at
        FROM communication_templates
        WHERE is_active = TRUE
        """
        
        params = []
        if type:
            # Check if filtering by communication type (SMS, Email) or message type code (TXN, PRM, OTP, ALR, SRV)
            communication_types = ['SMS', 'Email']
            message_type_codes = ['TXN', 'PRM', 'OTP', 'ALR', 'SRV']
            
            if type.upper() in communication_types:
                # Filter by communication type
                query += " AND type = %s"
                params.append(type.upper())
                logger.info(f"📋 Filtering by communication type: {type.upper()}")
            elif type.upper() in message_type_codes:
                # Filter by message type code (DLT type)
                query += " AND message_type_code = %s"
                params.append(type.upper())
                logger.info(f"📋 Filtering by message type code: {type.upper()}")
            else:
                # Try both - could be either
                query += " AND (type = %s OR message_type_code = %s)"
                params.extend([type.upper(), type.upper()])
                logger.info(f"📋 Filtering by type or message_type_code: {type.upper()}")
        
        query += " ORDER BY type, name"
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        templates = []
        for row in result:
            templates.append({
                'id': row['id'],
                'name': row['name'],
                'type': row['type'],
                'subject': row['subject'],
                'content': row['content'],
                'template_id': row.get('template_id'),
                'message_type_code': row.get('message_type_code', 'TXN'),
                'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None
            })
        
        logger.info(f"✅ Found {len(templates)} templates")
        
        return {
            'templates': templates,
            'count': len(templates)
        }
        
    except Exception as e:
        logger.error(f"Error fetching communication templates: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving communication templates: {str(e)}"
        )


