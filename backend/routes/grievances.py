"""
Grievance Management Routes - ALL LOGIC IN BACKEND
Handles investor and trustee/regulator grievances
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Optional
from models import (
    GrievanceCreate,
    GrievanceUpdate,
    GrievanceStatusUpdate,
    GrievanceResponse,
    GrievanceStatsResponse,
    UserInDB
)
from auth import get_current_user
from database import get_db
from permissions_checker import has_permission, log_unauthorized_access
from datetime import datetime
import logging
import json

router = APIRouter(prefix="/grievances", tags=["grievances"])
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
                               entity_type, entity_id, changes, timestamp,
                               ip_address)
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


def generate_grievance_id(db) -> str:
    """Generate unique grievance ID"""
    query = "SELECT COUNT(*) as count FROM grievances"
    result = db.execute_query(query)
    count = result[0]['count'] if result else 0
    return f"GRV{str(count + 1).zfill(6)}"


@router.get("/", response_model=List[GrievanceResponse])
async def get_grievances(
    request: Request,
    grievance_type: Optional[str] = None,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    series_id: Optional[int] = None,
    investor_id: Optional[str] = None,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all grievances with optional filters
    ALL LOGIC IN BACKEND - NO FRONTEND FILTERING
    """
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "view_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "get_grievances", "view_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view grievances"
            )

        logger.info(f"📊 Fetching grievances with filters: type={grievance_type}, status={status_filter}")

        # Build query with filters
        query = """
        SELECT
            g.*,
            i.full_name as investor_name,
            s.name as series_name
        FROM grievances g
        LEFT JOIN investors i ON g.investor_id = i.investor_id
        LEFT JOIN ncd_series s ON g.series_id = s.id
        WHERE g.is_active = 1
        """
        params = []

        # Apply filters
        if grievance_type:
            query += " AND g.grievance_type = %s"
            params.append(grievance_type)

        if status_filter:
            query += " AND g.status = %s"
            params.append(status_filter)

        if category:
            query += " AND g.category = %s"
            params.append(category)

        if priority:
            query += " AND g.priority = %s"
            params.append(priority)

        if series_id:
            query += " AND g.series_id = %s"
            params.append(series_id)

        if investor_id:
            query += " AND g.investor_id = %s"
            params.append(investor_id)

        if from_date:
            query += " AND DATE(g.created_at) >= %s"
            params.append(from_date)

        if to_date:
            query += " AND DATE(g.created_at) <= %s"
            params.append(to_date)

        if search:
            query += """ AND (
                g.subject LIKE %s OR
                g.description LIKE %s OR
                g.investor_id LIKE %s OR
                g.trustee_name LIKE %s OR
                g.grievance_id LIKE %s
            )"""
            search_param = f"%{search}%"
            params.extend([search_param] * 5)

        query += " ORDER BY g.created_at DESC"

        grievances = db.execute_query(query, tuple(params))

        result = []
        for g in grievances:
            result.append(GrievanceResponse(
                id=g['id'],
                grievance_id=g['grievance_id'],
                grievance_type=g['grievance_type'],
                investor_id=g['investor_id'],
                trustee_name=g['trustee_name'],
                investor_name=g['investor_name'],
                series_id=g['series_id'],
                series_name=g['series_name'],
                subject=g['subject'],
                description=g['description'],
                category=g['category'],
                priority=g['priority'],
                status=g['status'],
                resolution_comment=g['resolution_comment'],
                resolved_at=g['resolved_at'],
                resolved_by=g['resolved_by'],
                created_by=g['created_by'],
                created_by_role=g['created_by_role'],
                created_at=g['created_at'],
                updated_at=g['updated_at'],
                is_active=bool(g['is_active'])
            ))

        logger.info(f"✅ Retrieved {len(result)} grievances")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching grievances: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=GrievanceStatsResponse)
async def get_grievance_stats(
    grievance_type: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get grievance statistics
    Returns counts by status, category, and priority
    """
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "view_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "get_grievance_stats", "view_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view grievance statistics"
            )

        logger.info(f"📊 Fetching grievance statistics for type: {grievance_type}")

        # Base query
        where_clause = "WHERE is_active = 1"
        params = []

        if grievance_type:
            where_clause += " AND grievance_type = %s"
            params.append(grievance_type)

        # Get total counts by status - COALESCE to handle NULL
        status_query = f"""
        SELECT
            COUNT(*) as total,
            COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending,
            COALESCE(SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END), 0) as in_progress,
            COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0) as resolved,
            COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0) as closed
        FROM grievances
        {where_clause}
        """

        status_result = db.execute_query(status_query, tuple(params))
        stats = status_result[0] if status_result else {}

        # Get counts by category
        category_query = f"""
        SELECT category, COUNT(*) as count
        FROM grievances
        {where_clause}
        GROUP BY category
        """

        category_result = db.execute_query(category_query, tuple(params))
        by_category = {row['category']: row['count'] for row in category_result}

        # Get counts by priority
        priority_query = f"""
        SELECT priority, COUNT(*) as count
        FROM grievances
        {where_clause}
        GROUP BY priority
        """

        priority_result = db.execute_query(priority_query, tuple(params))
        by_priority = {row['priority']: row['count'] for row in priority_result}

        # Calculate resolution rate (resolved / total * 100)
        total_count = int(stats.get('total') or 0)
        resolved_count = int(stats.get('resolved') or 0)
        resolution_rate = round((resolved_count / total_count * 100), 1) if total_count > 0 else 0.0

        # Ensure all values are integers, not None
        return GrievanceStatsResponse(
            total=total_count,
            pending=int(stats.get('pending') or 0),
            in_progress=int(stats.get('in_progress') or 0),
            resolved=resolved_count,
            closed=int(stats.get('closed') or 0),
            resolution_rate=resolution_rate,
            by_category=by_category,
            by_priority=by_priority
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching grievance stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{grievance_id}", response_model=GrievanceResponse)
async def get_grievance(
    grievance_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """Get specific grievance by ID"""
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "view_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "get_grievance", "view_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view grievances"
            )

        query = """
        SELECT
            g.*,
            i.full_name as investor_name,
            s.name as series_name
        FROM grievances g
        LEFT JOIN investors i ON g.investor_id = i.investor_id
        LEFT JOIN ncd_series s ON g.series_id = s.id
        WHERE g.id = %s AND g.is_active = 1
        """

        result = db.execute_query(query, (grievance_id,))

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Grievance with ID {grievance_id} not found"
            )

        g = result[0]
        return GrievanceResponse(
            id=g['id'],
            grievance_id=g['grievance_id'],
            grievance_type=g['grievance_type'],
            investor_id=g['investor_id'],
            trustee_name=g['trustee_name'],
            investor_name=g['investor_name'],
            series_id=g['series_id'],
            series_name=g['series_name'],
            subject=g['subject'],
            description=g['description'],
            category=g['category'],
            priority=g['priority'],
            status=g['status'],
            resolution_comment=g['resolution_comment'],
            resolved_at=g['resolved_at'],
            resolved_by=g['resolved_by'],
            created_by=g['created_by'],
            created_by_role=g['created_by_role'],
            created_at=g['created_at'],
            updated_at=g['updated_at'],
            is_active=bool(g['is_active'])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=GrievanceResponse)
async def create_grievance(
    request: Request,
    grievance: GrievanceCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Create new grievance
    ALL VALIDATION IN BACKEND
    """
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "create_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "create_grievance", "create_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to create grievances"
            )

        logger.info(f"📝 Creating new {grievance.grievance_type} grievance")

        # Validate based on grievance type
        if grievance.grievance_type == "investor":
            if not grievance.investor_id:
                raise HTTPException(
                    status_code=400,
                    detail="investor_id is required for investor grievances"
                )

            # Verify investor exists and is active
            investor_check = "SELECT id, full_name, status FROM investors WHERE investor_id = %s"
            investor_result = db.execute_query(
                investor_check, (grievance.investor_id,)
            )

            if not investor_result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Investor with ID {grievance.investor_id} not found"
                )
            
            # Check if investor is deleted
            if investor_result[0]['status'] == 'deleted':
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot create grievance: Investor {grievance.investor_id} ({investor_result[0]['full_name']}) has been deleted"
                )

            investor_name = investor_result[0]['full_name']

        elif grievance.grievance_type == "trustee":
            if not grievance.trustee_name:
                raise HTTPException(
                    status_code=400,
                    detail="trustee_name is required for trustee grievances"
                )
            investor_name = None
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid grievance_type. Must be 'investor' or 'trustee'"
            )

        # Verify series if provided
        series_name = None
        if grievance.series_id:
            series_check = "SELECT name FROM ncd_series WHERE id = %s"
            series_result = db.execute_query(series_check, (grievance.series_id,))

            if not series_result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Series with ID {grievance.series_id} not found"
                )

            series_name = series_result[0]['name']

        # Generate grievance ID
        grievance_id = generate_grievance_id(db)

        # Insert grievance
        insert_query = """
        INSERT INTO grievances (
            grievance_id, grievance_type, investor_id, trustee_name,
            investor_name, series_id, series_name, subject, description,
            category, priority, status, created_by, created_by_role,
            created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        db.execute_query(insert_query, (
            grievance_id,
            grievance.grievance_type.value,
            grievance.investor_id,
            grievance.trustee_name,
            investor_name,
            grievance.series_id,
            series_name,
            grievance.subject,
            grievance.description,
            grievance.category.value,
            grievance.priority.value,
            'pending',
            current_user.full_name,
            current_user.role.value,
            datetime.now()
        ))

        # Get the created grievance
        get_query = "SELECT * FROM grievances WHERE grievance_id = %s"
        result = db.execute_query(get_query, (grievance_id,))
        created = result[0]

        # Create audit log
        entity_desc = (
            f"investor {grievance.investor_id}"
            if grievance.grievance_type == "investor"
            else f"trustee {grievance.trustee_name}"
        )

        create_audit_log(
            db=db,
            action="Created Grievance",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Created new {grievance.grievance_type} grievance for {entity_desc}: {grievance.subject}",
            entity_type="Grievance",
            entity_id=grievance_id,
            changes={
                "grievance_id": grievance_id,
                "type": grievance.grievance_type.value,
                "subject": grievance.subject,
                "category": grievance.category.value,
                "priority": grievance.priority.value
            },
            ip_address=get_client_ip(request)
        )

        logger.info(f"✅ Grievance created: {grievance_id}")

        return GrievanceResponse(
            id=created['id'],
            grievance_id=created['grievance_id'],
            grievance_type=created['grievance_type'],
            investor_id=created['investor_id'],
            trustee_name=created['trustee_name'],
            investor_name=created['investor_name'],
            series_id=created['series_id'],
            series_name=created['series_name'],
            subject=created['subject'],
            description=created['description'],
            category=created['category'],
            priority=created['priority'],
            status=created['status'],
            resolution_comment=created['resolution_comment'],
            resolved_at=created['resolved_at'],
            resolved_by=created['resolved_by'],
            created_by=created['created_by'],
            created_by_role=created['created_by_role'],
            created_at=created['created_at'],
            updated_at=created['updated_at'],
            is_active=bool(created['is_active'])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error creating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{grievance_id}/status", response_model=GrievanceResponse)
async def update_grievance_status(
    request: Request,
    grievance_id: int,
    status_update: GrievanceStatusUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update grievance status
    Handles pending -> in-progress -> resolved transitions
    """
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "edit_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "update_grievance_status", "edit_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to update grievances"
            )

        logger.info(f"📝 Updating grievance {grievance_id} status to {status_update.status}")

        # Get current grievance
        get_query = "SELECT * FROM grievances WHERE id = %s AND is_active = 1"
        result = db.execute_query(get_query, (grievance_id,))

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Grievance with ID {grievance_id} not found"
            )

        current_grievance = result[0]
        old_status = current_grievance['status']

        # Validate status transition
        if status_update.status.value == 'resolved' and not status_update.resolution_comment:
            raise HTTPException(
                status_code=400,
                detail="resolution_comment is required when marking as resolved"
            )

        # Update query
        update_query = """
        UPDATE grievances
        SET status = %s,
            resolution_comment = %s,
            resolved_at = %s,
            resolved_by = %s,
            updated_at = %s
        WHERE id = %s
        """

        resolved_at = datetime.now() if status_update.status.value == 'resolved' else None
        resolved_by = current_user.full_name if status_update.status.value == 'resolved' else None

        db.execute_query(update_query, (
            status_update.status.value,
            status_update.resolution_comment,
            resolved_at,
            resolved_by,
            datetime.now(),
            grievance_id
        ))

        # Create audit log
        create_audit_log(
            db=db,
            action=f"Updated Grievance Status",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Changed grievance {current_grievance['grievance_id']} status from {old_status} to {status_update.status.value}",
            entity_type="Grievance",
            entity_id=current_grievance['grievance_id'],
            changes={
                "old_status": old_status,
                "new_status": status_update.status.value,
                "resolution_comment": status_update.resolution_comment
            },
            ip_address=get_client_ip(request)
        )

        # Get updated grievance
        updated_result = db.execute_query(get_query, (grievance_id,))
        updated = updated_result[0]

        logger.info(f"✅ Grievance status updated: {grievance_id}")

        return GrievanceResponse(
            id=updated['id'],
            grievance_id=updated['grievance_id'],
            grievance_type=updated['grievance_type'],
            investor_id=updated['investor_id'],
            trustee_name=updated['trustee_name'],
            investor_name=updated['investor_name'],
            series_id=updated['series_id'],
            series_name=updated['series_name'],
            subject=updated['subject'],
            description=updated['description'],
            category=updated['category'],
            priority=updated['priority'],
            status=updated['status'],
            resolution_comment=updated['resolution_comment'],
            resolved_at=updated['resolved_at'],
            resolved_by=updated['resolved_by'],
            created_by=updated['created_by'],
            created_by_role=updated['created_by_role'],
            created_at=updated['created_at'],
            updated_at=updated['updated_at'],
            is_active=bool(updated['is_active'])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating grievance status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{grievance_id}", response_model=GrievanceResponse)
async def update_grievance(
    request: Request,
    grievance_id: int,
    grievance_update: GrievanceUpdate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Update grievance details (subject, description, category, priority)"""
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "edit_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "update_grievance", "edit_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to update grievances"
            )

        logger.info(f"📝 Updating grievance {grievance_id}")

        # Get current grievance
        get_query = "SELECT * FROM grievances WHERE id = %s AND is_active = 1"
        result = db.execute_query(get_query, (grievance_id,))

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Grievance with ID {grievance_id} not found"
            )

        current = result[0]

        # Build update query dynamically
        update_fields = []
        update_values = []

        if grievance_update.subject is not None:
            update_fields.append("subject = %s")
            update_values.append(grievance_update.subject)

        if grievance_update.description is not None:
            update_fields.append("description = %s")
            update_values.append(grievance_update.description)

        if grievance_update.category is not None:
            update_fields.append("category = %s")
            update_values.append(grievance_update.category.value)

        if grievance_update.priority is not None:
            update_fields.append("priority = %s")
            update_values.append(grievance_update.priority.value)

        if not update_fields:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )

        update_fields.append("updated_at = %s")
        update_values.append(datetime.now())
        update_values.append(grievance_id)

        update_query = f"""
        UPDATE grievances
        SET {', '.join(update_fields)}
        WHERE id = %s
        """

        db.execute_query(update_query, tuple(update_values))

        # Create audit log
        create_audit_log(
            db=db,
            action="Updated Grievance",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Updated grievance {current['grievance_id']}",
            entity_type="Grievance",
            entity_id=current['grievance_id'],
            changes={
                "old_subject": current['subject'],
                "new_subject": grievance_update.subject,
                "old_category": current['category'],
                "new_category": grievance_update.category.value if grievance_update.category else None,
                "old_priority": current['priority'],
                "new_priority": grievance_update.priority.value if grievance_update.priority else None
            },
            ip_address=get_client_ip(request)
        )

        # Get updated grievance
        updated_result = db.execute_query(get_query, (grievance_id,))
        updated = updated_result[0]

        logger.info(f"✅ Grievance updated: {grievance_id}")

        return GrievanceResponse(
            id=updated['id'],
            grievance_id=updated['grievance_id'],
            grievance_type=updated['grievance_type'],
            investor_id=updated['investor_id'],
            trustee_name=updated['trustee_name'],
            investor_name=updated['investor_name'],
            series_id=updated['series_id'],
            series_name=updated['series_name'],
            subject=updated['subject'],
            description=updated['description'],
            category=updated['category'],
            priority=updated['priority'],
            status=updated['status'],
            resolution_comment=updated['resolution_comment'],
            resolved_at=updated['resolved_at'],
            resolved_by=updated['resolved_by'],
            created_by=updated['created_by'],
            created_by_role=updated['created_by_role'],
            created_at=updated['created_at'],
            updated_at=updated['updated_at'],
            is_active=bool(updated['is_active'])
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{grievance_id}")
async def delete_grievance(
    request: Request,
    grievance_id: int,
    current_user: UserInDB = Depends(get_current_user)
):
    """Soft delete grievance (set is_active = FALSE)"""
    try:
        db = get_db()

        # CHECK PERMISSION
        if not has_permission(current_user, "delete_grievanceManagement", db):
            log_unauthorized_access(
                db, current_user, "delete_grievance", "delete_grievanceManagement"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to delete grievances"
            )

        logger.info(f"🗑️ Soft deleting grievance {grievance_id}")

        # Get current grievance
        get_query = "SELECT * FROM grievances WHERE id = %s AND is_active = 1"
        result = db.execute_query(get_query, (grievance_id,))

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Grievance with ID {grievance_id} not found"
            )

        grievance = result[0]

        # Soft delete
        delete_query = """
        UPDATE grievances
        SET is_active = FALSE, updated_at = %s
        WHERE id = %s
        """

        db.execute_query(delete_query, (datetime.now(), grievance_id))

        # Create audit log
        create_audit_log(
            db=db,
            action="Deleted Grievance",
            admin_name=current_user.full_name,
            admin_role=current_user.role.value,
            details=f"Deleted grievance {grievance['grievance_id']}: {grievance['subject']}",
            entity_type="Grievance",
            entity_id=grievance['grievance_id'],
            changes={"deleted": True},
            ip_address=get_client_ip(request)
        )

        logger.info(f"✅ Grievance deleted: {grievance_id}")

        return {"message": "Grievance deleted successfully", "success": True}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting grievance: {e}")
        raise HTTPException(status_code=500, detail=str(e))
