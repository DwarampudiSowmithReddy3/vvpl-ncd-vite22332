"""
Security Incident Logging - RBI/SEBI Compliance
Logs all security incidents for audit trail
"""

from fastapi import APIRouter, Request, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
from app.core.database import get_db
from app.core.auth import get_current_user
from app.core.permissions import require_permission
from app.models.pydantic.models import UserInDB
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/security", tags=["security"])

@router.post("/incident")
async def log_security_incident(request: Request):
    """
    Log security incidents (DevTools detection, unauthorized access, etc.)
    RBI/SEBI Compliance: Maintain immutable audit trail
    """
    try:
        body = await request.json()
        
        incident_type = body.get('incidentType')
        details = body.get('details', {})
        user_agent = body.get('userAgent', '')
        url = body.get('url', '')
        timestamp = body.get('timestamp', datetime.now().isoformat())

        # Log to database for audit trail
        db = get_db()
        
        query = """
        INSERT INTO security_incidents 
        (incident_type, details, user_agent, url, timestamp, created_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(query, (
            incident_type,
            str(details),
            user_agent,
            url,
            timestamp,
            datetime.now()
        ))

        # Log to application logs
        logger.warning(f"🔒 Security Incident: {incident_type} - {details}")

        # Alert security team if critical
        if incident_type in ['DevTools Detected', 'Unauthorized Access', 'SQL Injection Attempt']:
            logger.critical(f"🚨 CRITICAL SECURITY INCIDENT: {incident_type}")
            # TODO: Send alert to security team

        return JSONResponse({
            "status": "logged",
            "message": "Security incident logged for audit trail"
        })

    except Exception as e:
        logger.error(f"Error logging security incident: {e}")
        # Don't expose error details
        return JSONResponse(
            status_code=500,
            content={"status": "error"}
        )

@router.get("/incidents")
@require_permission("view_security_logs")
async def get_security_incidents(
    request: Request,
    db = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get security incidents (Admin only)
    RBI/SEBI Compliance: Audit trail access
    """
    try:
        query = """
        SELECT * FROM security_incidents 
        ORDER BY created_at DESC 
        LIMIT 1000
        """
        
        results = db.execute_query(query)
        
        return {
            "status": "success",
            "incidents": results,
            "count": len(results)
        }

    except Exception as e:
        logger.error(f"Error fetching security incidents: {e}")
        raise HTTPException(status_code=500, detail="Error fetching incidents")

@router.get("/audit-trail")
@require_permission("view_security_logs")
async def get_audit_trail(
    request: Request,
    db = Depends(get_db),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get complete audit trail
    RBI/SEBI Compliance: Immutable audit log
    """
    try:
        query = """
        SELECT * FROM audit_logs 
        ORDER BY created_at DESC 
        LIMIT 10000
        """
        
        results = db.execute_query(query)
        
        return {
            "status": "success",
            "audit_trail": results,
            "count": len(results)
        }

    except Exception as e:
        logger.error(f"Error fetching audit trail: {e}")
        raise HTTPException(status_code=500, detail="Error fetching audit trail")
