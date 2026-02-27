"""
Communication Routes - SMS and Email sending
ALL LOGIC IN BACKEND, NO FRONTEND LOGIC
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from models import (
    SendMessageRequest,
    CommunicationHistoryResponse,
    BulkMessageResponse,
    UserInDB,
    CommunicationType,
    CommunicationStatus
)
from auth import get_current_user
from database import get_db
from permissions_checker import has_permission, log_unauthorized_access
from datetime import datetime
import logging
import json

router = APIRouter(prefix="/communication", tags=["communication"])
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
        
        # Get all investors with investments in this series
        query = """
        SELECT 
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            i.bank_name,
            i.account_number,
            COALESCE(SUM(inv.amount), 0) as total_invested
        FROM investors i
        INNER JOIN investments inv ON i.id = inv.investor_id
        WHERE inv.series_id = %s 
          AND inv.status = 'confirmed'
          AND i.status != 'deleted'
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone, 
                 i.bank_name, i.account_number
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
                "totalInvested": float(inv['total_invested'])
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
        
        # Search investors by name, email, phone, or investor ID
        query = """
        SELECT DISTINCT
            i.id,
            i.investor_id,
            i.full_name as name,
            i.email,
            i.phone,
            GROUP_CONCAT(DISTINCT s.id) as series_ids,
            GROUP_CONCAT(DISTINCT s.name) as series_names
        FROM investors i
        INNER JOIN investments inv ON i.investor_id = inv.investor_id
        INNER JOIN ncd_series s ON inv.series_id = s.id
        WHERE i.status = 'active'
        AND inv.status = 'confirmed'
        AND s.is_active = 1
        AND (
            i.full_name LIKE %s
            OR i.email LIKE %s
            OR i.phone LIKE %s
            OR i.investor_id LIKE %s
        )
        GROUP BY i.id, i.investor_id, i.full_name, i.email, i.phone
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
        SELECT 
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
          AND inv.status = 'confirmed'
          AND i.status != 'deleted'
        """
        
        investors = db.execute_query(investor_query, tuple(message_request.investor_ids))
        
        if not investors:
            raise HTTPException(status_code=404, detail="No valid investors found")
        
        # Send messages and track results
        results = []
        successful = 0
        failed = 0
        
        for investor in investors:
            # Personalize message
            personalized_message = message_request.message
            personalized_message = personalized_message.replace('{InvestorName}', investor['name'])
            personalized_message = personalized_message.replace('{InvestorID}', investor['investor_id'])
            personalized_message = personalized_message.replace('{SeriesName}', investor['series_name'])
            personalized_message = personalized_message.replace('{Amount}', f"₹{investor['investment_amount']:,.2f}")
            personalized_message = personalized_message.replace('{BankAccountNumber}', investor['account_number'] or 'N/A')
            
            contact_info = investor['email'] if message_request.type == CommunicationType.EMAIL else investor['phone']
            
            if not contact_info:
                # No contact info - mark as failed
                error_msg = f"No {'email' if message_request.type == CommunicationType.EMAIL else 'phone'} available"
                
                # Save to database
                insert_query = """
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(insert_query, (
                    message_request.type.value,
                    investor['name'],
                    contact_info or 'N/A',
                    investor['investor_id'],
                    investor['series_name'],
                    message_request.subject,
                    personalized_message,
                    CommunicationStatus.FAILED.value,
                    error_msg,
                    current_user.full_name,
                    current_user.role.value,
                    datetime.now()
                ))
                
                results.append({
                    "investor": investor['name'],
                    "status": "Failed",
                    "error": error_msg
                })
                failed += 1
                continue
            
            # TODO: Integrate with actual SMS/Email service
            # For now, simulate success (you need to add actual SMS/Email API integration)
            send_success = True  # Replace with actual API call
            message_id = f"MSG_{datetime.now().timestamp()}"
            
            if send_success:
                # Save success to database
                insert_query = """
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, message_id, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(insert_query, (
                    message_request.type.value,
                    investor['name'],
                    contact_info,
                    investor['investor_id'],
                    investor['series_name'],
                    message_request.subject,
                    personalized_message,
                    CommunicationStatus.SUCCESS.value,
                    message_id,
                    current_user.full_name,
                    current_user.role.value,
                    datetime.now()
                ))
                
                results.append({
                    "investor": investor['name'],
                    "status": "Success",
                    "messageId": message_id
                })
                successful += 1
            else:
                # Save failure to database
                error_msg = "Failed to send message"
                
                insert_query = """
                INSERT INTO communication_history 
                (type, recipient_name, recipient_contact, investor_id, series_name, 
                 subject, message, status, error_message, sent_by, sent_by_role, sent_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """
                
                db.execute_query(insert_query, (
                    message_request.type.value,
                    investor['name'],
                    contact_info,
                    investor['investor_id'],
                    investor['series_name'],
                    message_request.subject,
                    personalized_message,
                    CommunicationStatus.FAILED.value,
                    error_msg,
                    current_user.full_name,
                    current_user.role.value,
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
            action=f"Sent {message_request.type.value}",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Sent {successful} {message_request.type.value} messages to investors ({failed} failed)",
            entity_type="Communication",
            entity_id=f"Bulk_{message_request.type.value}",
            changes={
                "type": message_request.type.value,
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
    - type: Filter by type ('SMS' or 'Email'), optional
    
    Returns list of templates with id, name, type, subject, content
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
        
        logger.info(f"📊 Fetching communication templates (type: {type})")
        
        # Build query with optional type filter
        query = """
        SELECT 
            id,
            name,
            type,
            subject,
            content,
            created_at,
            updated_at
        FROM communication_templates
        WHERE is_active = TRUE
        """
        
        params = []
        if type and type in ['SMS', 'Email']:
            query += " AND type = %s"
            params.append(type)
        
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


