"""
Report Logger
Logs all report generation activities to the database
"""

from datetime import datetime
from typing import Optional, Dict, Any
import logging
import json

logger = logging.getLogger(__name__)


def log_report_generation(
    db,
    report_name: str,
    report_type: str,
    user_id: int,
    user_name: str,
    user_role: str,
    report_filters: Optional[Dict[str, Any]] = None,
    record_count: int = 0,
    file_size_kb: Optional[float] = None,
    generation_time_ms: Optional[int] = None,
    status: str = "success",
    error_message: Optional[str] = None
):
    """
    Log report generation to database
    
    Args:
        db: Database connection
        report_name: Name of the report (e.g., "Series Maturity Report")
        report_type: Type of report ("PDF", "Excel", "CSV")
        user_id: ID of the user who generated the report
        user_name: Name of the user
        user_role: Role of the user
        report_filters: Dictionary of filters applied (optional)
        record_count: Number of records in the report
        file_size_kb: Size of generated file in KB (optional)
        generation_time_ms: Time taken to generate in milliseconds (optional)
        status: Status of generation ("success", "failed", "in_progress")
        error_message: Error message if failed (optional)
    """
    try:
        # Convert filters to JSON string
        filters_json = json.dumps(report_filters) if report_filters else None
        
        insert_query = """
        INSERT INTO report_logs (
            report_name,
            report_type,
            user_id,
            user_name,
            user_role,
            report_filters,
            record_count,
            file_size_kb,
            generation_time_ms,
            status,
            error_message
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        db.execute_query(insert_query, (
            report_name,
            report_type,
            user_id,
            user_name,
            user_role,
            filters_json,
            record_count,
            file_size_kb,
            generation_time_ms,
            status,
            error_message
        ))
        
        logger.info(f"✅ Report log created: {report_name} ({report_type}) by {user_name}")
        
    except Exception as e:
        logger.error(f"❌ Error logging report generation: {e}")
        # Don't raise exception - logging failure shouldn't break report generation


def get_report_logs(
    db,
    user_id: Optional[int] = None,
    report_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100
):
    """
    Get report generation logs with optional filters
    
    Args:
        db: Database connection
        user_id: Filter by user ID (optional)
        report_name: Filter by report name (optional)
        start_date: Filter by start date (optional)
        end_date: Filter by end date (optional)
        limit: Maximum number of records to return
        
    Returns:
        List of report log records
    """
    try:
        query = "SELECT * FROM report_logs WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = %s"
            params.append(user_id)
        
        if report_name:
            query += " AND report_name = %s"
            params.append(report_name)
        
        if start_date:
            query += " AND DATE(generated_at) >= %s"
            params.append(start_date)
        
        if end_date:
            query += " AND DATE(generated_at) <= %s"
            params.append(end_date)
        
        query += " ORDER BY generated_at DESC LIMIT %s"
        params.append(limit)
        
        results = db.execute_query(query, tuple(params))
        
        # Parse JSON filters
        for row in results:
            if row.get('report_filters'):
                try:
                    row['report_filters'] = json.loads(row['report_filters'])
                except:
                    row['report_filters'] = None
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Error getting report logs: {e}")
        return []


def get_report_statistics(db):
    """
    Get report generation statistics
    
    Args:
        db: Database connection
        
    Returns:
        Dictionary with statistics
    """
    try:
        stats_query = """
        SELECT 
            report_name,
            report_type,
            COUNT(*) as total_generated,
            AVG(generation_time_ms) as avg_generation_time,
            MAX(generated_at) as last_generated,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
            SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
        FROM report_logs
        GROUP BY report_name, report_type
        ORDER BY total_generated DESC
        """
        
        results = db.execute_query(stats_query)
        return results
        
    except Exception as e:
        logger.error(f"❌ Error getting report statistics: {e}")
        return []
