"""
Compliance Management API Routes - REDESIGNED
==============================================
Handles 42 compliance documents for each NCD series:
- Pre-Compliance (26 items) - One-time before launch
- Post-Compliance (11 items) - One-time after launch  
- Recurring Compliance (5 items) - Monthly/Quarterly/Annually

ALL business logic in backend, frontend just displays
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Dict, Optional
from datetime import datetime, date
from decimal import Decimal
import logging
import json

from auth import get_current_user
from database import get_db
from models import UserInDB
from permissions_checker import has_permission, log_unauthorized_access

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compliance", tags=["Compliance Management"])


def create_audit_log(db, action: str, admin_name: str, admin_role: str, 
                     details: str, entity_type: str, entity_id: str, 
                     changes: dict = None):
    """Helper function to create audit log entries"""
    try:
        changes_json = json.dumps(changes) if changes else None
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, 
                               entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            action,
            admin_name,
            admin_role,
            details,
            entity_type,
            entity_id,
            changes_json,
            datetime.now()
        ))
        
        logger.info(f"Audit log created: {action} by {admin_name}")
        
    except Exception as e:
        logger.error(f"Failed to create audit log: {e}")


# ============================================================================
# 1. MASTER COMPLIANCE ITEMS (42 items)
# ============================================================================

@router.get("/items")
async def get_compliance_items(
    section: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all 42 compliance items from master list
    Optional filter by section: pre, post, recurring
    """
    try:
        logger.info(f"🔄 Getting compliance items (section={section})...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_compliance", db):
            log_unauthorized_access(db, current_user, "get_compliance_items", "view_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view compliance"
            )
        
        if section:
            query = """
            SELECT id, section, title, description, legal_reference, 
                   frequency, display_order
            FROM compliance_master_items
            WHERE section = %s AND is_active = 1
            ORDER BY display_order
            """
            result = db.execute_query(query, (section,))
        else:
            query = """
            SELECT id, section, title, description, legal_reference, 
                   frequency, display_order
            FROM compliance_master_items
            WHERE is_active = 1
            ORDER BY display_order
            """
            result = db.execute_query(query)
        
        logger.info(f"✅ Found {len(result)} compliance items")
        
        return {
            "items": result,
            "total": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting compliance items: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving compliance items: {str(e)}"
        )


# ============================================================================
# 2. SERIES COMPLIANCE STATUS
# ============================================================================

@router.get("/series/{series_id}")
async def get_series_compliance(
    series_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get compliance status for a specific series
    
    For pre/post items: year and month are ignored
    For recurring items: 
      - If year/month provided: get status for that period
      - If not provided: get status for current month
    """
    try:
        logger.info(f"🔄 Getting compliance status for series {series_id}...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_compliance", db):
            log_unauthorized_access(db, current_user, "get_series_compliance", "view_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view compliance"
            )
        
        # Verify series exists
        series_query = "SELECT id, name FROM ncd_series WHERE id = %s AND is_active = 1"
        series_result = db.execute_query(series_query, (series_id,))
        if not series_result:
            raise HTTPException(status_code=404, detail="Series not found")
        
        series_name = series_result[0]['name']
        
        # Get all master items
        master_query = """
        SELECT id, section, title, description, legal_reference, frequency, display_order
        FROM compliance_master_items
        WHERE is_active = 1
        ORDER BY display_order
        """
        master_items = db.execute_query(master_query)
        
        # Get compliance status for this series
        # For pre/post: year and month are NULL
        # For recurring: year and month are specified
        status_query = """
        SELECT master_item_id, year, month, status, submitted_at, submitted_by, notes
        FROM series_compliance_status
        WHERE series_id = %s
        """
        status_result = db.execute_query(status_query, (series_id,))
        
        # Create lookup map: (item_id, year, month) -> status
        status_map = {}
        for row in status_result:
            key = (row['master_item_id'], row['year'], row['month'])
            status_map[key] = row
        
        # Build response
        compliance_data = []
        for item in master_items:
            item_id = item['id']
            section = item['section']
            
            # For pre/post items: year=None, month=None
            if section in ['pre', 'post']:
                key = (item_id, None, None)
                status_info = status_map.get(key, {})
                
                compliance_data.append({
                    'item_id': item_id,
                    'section': section,
                    'title': item['title'],
                    'description': item['description'],
                    'legal_reference': item['legal_reference'],
                    'frequency': item['frequency'],
                    'display_order': item['display_order'],
                    'year': None,
                    'month': None,
                    'status': status_info.get('status', 'pending'),
                    'submitted_at': status_info.get('submitted_at'),
                    'submitted_by': status_info.get('submitted_by'),
                    'notes': status_info.get('notes')
                })
            
            # For recurring items: use provided year/month or current
            else:  # section == 'recurring'
                target_year = year if year else datetime.now().year
                target_month = month if month else datetime.now().month
                
                key = (item_id, target_year, target_month)
                status_info = status_map.get(key, {})
                
                compliance_data.append({
                    'item_id': item_id,
                    'section': section,
                    'title': item['title'],
                    'description': item['description'],
                    'legal_reference': item['legal_reference'],
                    'frequency': item['frequency'],
                    'display_order': item['display_order'],
                    'year': target_year,
                    'month': target_month,
                    'status': status_info.get('status', 'pending'),
                    'submitted_at': status_info.get('submitted_at'),
                    'submitted_by': status_info.get('submitted_by'),
                    'notes': status_info.get('notes')
                })
        
        # Calculate summary stats
        total = len(compliance_data)
        pending = len([item for item in compliance_data if item['status'] == 'pending'])
        received = len([item for item in compliance_data if item['status'] == 'received'])
        submitted = len([item for item in compliance_data if item['status'] == 'submitted'])
        not_applicable = len([item for item in compliance_data if item['status'] == 'not-applicable'])
        
        logger.info(f"✅ Compliance status retrieved: {total} items")
        
        return {
            'series_id': series_id,
            'series_name': series_name,
            'year': year,
            'month': month,
            'items': compliance_data,
            'summary': {
                'total': total,
                'pending': pending,
                'received': received,
                'submitted': submitted,
                'not_applicable': not_applicable
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting series compliance: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series compliance: {str(e)}"
        )


@router.put("/series/{series_id}/item/{item_id}")
async def update_compliance_status(
    series_id: int,
    item_id: int,
    request_data: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update compliance status for a specific item
    
    Body:
    {
        "year": 2024,  // Required for recurring items, null for pre/post
        "month": 1,    // Required for recurring items, null for pre/post
        "status": "received",  // pending, received, submitted, not-applicable
        "notes": "Document received on..."
    }
    """
    try:
        logger.info(f"🔄 Updating compliance status: series={series_id}, item={item_id}...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_compliance", db):
            log_unauthorized_access(db, current_user, "update_compliance_status", "edit_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to edit compliance"
            )
        
        # Get request data
        year = request_data.get('year')
        month = request_data.get('month')
        new_status = request_data.get('status', 'pending')
        notes = request_data.get('notes')
        
        # Validate status
        valid_statuses = ['pending', 'received', 'submitted', 'not-applicable']
        if new_status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
        # Get master item details
        item_query = "SELECT section, title, frequency FROM compliance_master_items WHERE id = %s"
        item_result = db.execute_query(item_query, (item_id,))
        if not item_result:
            raise HTTPException(status_code=404, detail="Compliance item not found")
        
        item_section = item_result[0]['section']
        item_title = item_result[0]['title']
        item_frequency = item_result[0]['frequency']
        
        # For pre/post items: year and month must be NULL
        if item_section in ['pre', 'post']:
            year = None
            month = None
        # For recurring items: year and month are required
        elif item_section == 'recurring':
            if year is None or month is None:
                raise HTTPException(status_code=400, detail="Year and month are required for recurring items")
        
        # Check if status entry exists
        check_query = """
        SELECT id, status FROM series_compliance_status
        WHERE series_id = %s AND master_item_id = %s 
        AND (year IS NULL AND %s IS NULL OR year = %s)
        AND (month IS NULL AND %s IS NULL OR month = %s)
        """
        existing = db.execute_query(check_query, (series_id, item_id, year, year, month, month))
        
        if existing:
            # Update existing status
            old_status = existing[0]['status']
            
            update_query = """
            UPDATE series_compliance_status
            SET status = %s, 
                submitted_at = %s,
                submitted_by = %s,
                notes = %s,
                updated_at = NOW()
            WHERE series_id = %s AND master_item_id = %s
            AND (year IS NULL AND %s IS NULL OR year = %s)
            AND (month IS NULL AND %s IS NULL OR month = %s)
            """
            
            submitted_at = datetime.now() if new_status in ['received', 'submitted'] else None
            
            db.execute_query(update_query, (
                new_status, submitted_at, current_user.username, notes,
                series_id, item_id, year, year, month, month
            ))
            
            logger.info(f"✅ Updated compliance status: {old_status} → {new_status}")
            
        else:
            # Create new status entry
            insert_query = """
            INSERT INTO series_compliance_status (
                series_id, master_item_id, section, title, frequency,
                year, month, status, submitted_at, submitted_by, notes
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            submitted_at = datetime.now() if new_status in ['received', 'submitted'] else None
            
            db.execute_query(insert_query, (
                series_id, item_id, item_section, item_title, item_frequency,
                year, month, new_status, submitted_at, current_user.username, notes
            ))
            
            logger.info(f"✅ Created new compliance status: {new_status}")
        
        # Create audit log
        period_str = f" ({year}-{month:02d})" if year and month else ""
        create_audit_log(
            db,
            "Updated Compliance Status",
            current_user.full_name,
            current_user.role,
            f"Updated compliance status for '{item_title}'{period_str} to {new_status}",
            "compliance",
            str(series_id),
            {
                "series_id": series_id,
                "item_id": item_id,
                "item_title": item_title,
                "year": year,
                "month": month,
                "new_status": new_status,
                "notes": notes
            }
        )
        
        return {
            "success": True,
            "message": "Compliance status updated successfully",
            "series_id": series_id,
            "item_id": item_id,
            "status": new_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating compliance status: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating compliance status: {str(e)}"
        )


# ============================================================================
# 3. DOCUMENT UPLOAD & MANAGEMENT
# ============================================================================

@router.post("/series/{series_id}/item/{item_id}/upload")
async def upload_compliance_document(
    series_id: int,
    item_id: int,
    file: UploadFile = File(...),
    year: Optional[int] = None,
    month: Optional[int] = None,
    description: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Upload compliance document to S3
    
    For pre/post items: year and month are null
    For recurring items: year and month are required
    """
    try:
        logger.info(f"🔄 Uploading document: series={series_id}, item={item_id}...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_compliance", db):
            log_unauthorized_access(db, current_user, "upload_compliance_document", "edit_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to upload documents"
            )
        
        # TODO: Implement S3 upload
        # For now, return placeholder
        
        logger.info("⚠️ S3 upload not yet implemented - returning placeholder")
        
        return {
            "success": True,
            "message": "Document upload endpoint ready (S3 integration pending)",
            "file_name": file.filename,
            "series_id": series_id,
            "item_id": item_id,
            "year": year,
            "month": month
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error uploading document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )


@router.get("/series/{series_id}/item/{item_id}/documents")
async def get_compliance_documents(
    series_id: int,
    item_id: int,
    year: Optional[int] = None,
    month: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all documents uploaded for a specific compliance item
    """
    try:
        logger.info(f"🔄 Getting documents: series={series_id}, item={item_id}...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_compliance", db):
            log_unauthorized_access(db, current_user, "get_compliance_documents", "view_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view documents"
            )
        
        # Build query based on year/month
        if year and month:
            query = """
            SELECT id, document_title, description, file_name, s3_url, 
                   file_size, content_type, uploaded_at, uploaded_by
            FROM compliance_documents
            WHERE series_id = %s AND master_item_id = %s 
            AND year = %s AND month = %s
            AND is_active = 1
            ORDER BY uploaded_at DESC
            """
            result = db.execute_query(query, (series_id, item_id, year, month))
        else:
            query = """
            SELECT id, document_title, description, file_name, s3_url, 
                   file_size, content_type, uploaded_at, uploaded_by
            FROM compliance_documents
            WHERE series_id = %s AND master_item_id = %s 
            AND year IS NULL AND month IS NULL
            AND is_active = 1
            ORDER BY uploaded_at DESC
            """
            result = db.execute_query(query, (series_id, item_id))
        
        logger.info(f"✅ Found {len(result)} documents")
        
        return {
            "series_id": series_id,
            "item_id": item_id,
            "year": year,
            "month": month,
            "documents": result,
            "total": len(result)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving documents: {str(e)}"
        )


@router.delete("/documents/{document_id}")
async def delete_compliance_document(
    document_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Soft delete a compliance document
    """
    try:
        logger.info(f"🔄 Deleting document: {document_id}...")
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_compliance", db):
            log_unauthorized_access(db, current_user, "delete_compliance_document", "edit_compliance")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to delete documents"
            )
        
        # Soft delete
        update_query = """
        UPDATE compliance_documents
        SET is_active = 0, deleted_at = NOW(), deleted_by = %s
        WHERE id = %s
        """
        db.execute_query(update_query, (current_user.username, document_id))
        
        logger.info(f"✅ Document {document_id} deleted")
        
        # Create audit log
        create_audit_log(
            db,
            "Deleted Compliance Document",
            current_user.full_name,
            current_user.role,
            f"Deleted compliance document ID {document_id}",
            "compliance_document",
            str(document_id),
            {"document_id": document_id}
        )
        
        return {
            "success": True,
            "message": "Document deleted successfully",
            "document_id": document_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting document: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )
