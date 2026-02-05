from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from models import AuditLogCreate, AuditLogResponse, UserInDB
from auth import get_current_user
from database import get_db
from datetime import datetime, date
import json
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    from_date: Optional[date] = Query(None, description="Filter logs from this date"),
    to_date: Optional[date] = Query(None, description="Filter logs to this date"),
    limit: Optional[int] = Query(10, description="Number of logs to return"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get audit logs with optional date filtering"""
    try:
        db = get_db()
        
        # Build query with optional date filters
        query = """
        SELECT id, action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp
        FROM audit_logs
        """
        
        conditions = []
        params = []
        
        if from_date:
            conditions.append("DATE(timestamp) >= %s")
            params.append(from_date)
        
        if to_date:
            conditions.append("DATE(timestamp) <= %s")
            params.append(to_date)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        query += " ORDER BY timestamp DESC"
        
        if limit:
            query += " LIMIT %s"
            params.append(limit)
        
        result = db.execute_query(query, params)
        
        logs = []
        for log_data in result:
            # Parse changes JSON if it exists
            changes = None
            if log_data['changes']:
                try:
                    changes = json.loads(log_data['changes']) if isinstance(log_data['changes'], str) else log_data['changes']
                except json.JSONDecodeError:
                    changes = None
            
            logs.append(AuditLogResponse(
                id=log_data['id'],
                action=log_data['action'],
                admin_name=log_data['admin_name'],
                admin_role=log_data['admin_role'],
                details=log_data['details'],
                entity_type=log_data['entity_type'],
                entity_id=log_data['entity_id'],
                changes=changes,
                timestamp=log_data['timestamp']
            ))
        
        return logs
        
    except Exception as e:
        logger.error(f"Error getting audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving audit logs"
        )

@router.post("/", response_model=AuditLogResponse)
async def create_audit_log(
    audit_data: AuditLogCreate,
    current_user: UserInDB = Depends(get_current_user)
):
    """Create a new audit log entry"""
    try:
        db = get_db()
        
        # Convert changes dict to JSON string if provided
        changes_json = None
        if audit_data.changes:
            changes_json = json.dumps(audit_data.changes)
        
        insert_query = """
        INSERT INTO audit_logs (action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        now = datetime.now()
        db.execute_query(insert_query, (
            audit_data.action,
            audit_data.admin_name,
            audit_data.admin_role,
            audit_data.details,
            audit_data.entity_type,
            audit_data.entity_id,
            changes_json,
            now
        ))
        
        # Get the created audit log
        get_log_query = """
        SELECT id, action, admin_name, admin_role, details, entity_type, entity_id, changes, timestamp
        FROM audit_logs
        WHERE timestamp = %s AND admin_name = %s
        ORDER BY id DESC
        LIMIT 1
        """
        
        result = db.execute_query(get_log_query, (now, audit_data.admin_name))
        
        if result:
            log_data = result[0]
            
            # Parse changes JSON
            changes = None
            if log_data['changes']:
                try:
                    changes = json.loads(log_data['changes']) if isinstance(log_data['changes'], str) else log_data['changes']
                except json.JSONDecodeError:
                    changes = None
            
            return AuditLogResponse(
                id=log_data['id'],
                action=log_data['action'],
                admin_name=log_data['admin_name'],
                admin_role=log_data['admin_role'],
                details=log_data['details'],
                entity_type=log_data['entity_type'],
                entity_id=log_data['entity_id'],
                changes=changes,
                timestamp=log_data['timestamp']
            )
        
        raise HTTPException(status_code=500, detail="Audit log created but could not retrieve")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating audit log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating audit log"
        )

@router.get("/count")
async def get_audit_logs_count(
    from_date: Optional[date] = Query(None, description="Filter logs from this date"),
    to_date: Optional[date] = Query(None, description="Filter logs to this date"),
    current_user: UserInDB = Depends(get_current_user)
):
    """Get total count of audit logs with optional date filtering"""
    try:
        db = get_db()
        
        query = "SELECT COUNT(*) as count FROM audit_logs"
        
        conditions = []
        params = []
        
        if from_date:
            conditions.append("DATE(timestamp) >= %s")
            params.append(from_date)
        
        if to_date:
            conditions.append("DATE(timestamp) <= %s")
            params.append(to_date)
        
        if conditions:
            query += " WHERE " + " AND ".join(conditions)
        
        result = db.execute_query(query, params)
        
        return {"count": result[0]['count']}
        
    except Exception as e:
        logger.error(f"Error getting audit logs count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting audit logs count"
        )