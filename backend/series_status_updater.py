"""
Automatic Series Status Updater
================================
Updates NCD series status based on dates and current time

Status Flow:
1. DRAFT → Created, waiting for approval
2. PENDING_APPROVAL → Submitted for approval
3. APPROVED → Approved, waiting for subscription start
4. ACCEPTING → Accepting investments (subscription_start_date to subscription_end_date)
5. UPCOMING → Releasing soon (subscription_end_date to series_start_date)
6. ACTIVE → Interest calculation active (series_start_date to maturity_date)
7. MATURED → Series ended (after maturity_date)
8. REJECTED → Rejected by admin

CRITICAL BUSINESS RULES:
- Status changes are AUTOMATIC based on dates
- Only DRAFT, PENDING_APPROVAL, APPROVED, REJECTED are manual
- ACCEPTING, UPCOMING, ACTIVE, MATURED are automatic
"""

from datetime import datetime, date
from database import get_db
import logging

logger = logging.getLogger(__name__)


def update_series_status_by_dates():
    """
    Update all series statuses based on current date and their timeline dates
    
    This function should be called:
    1. Daily via a scheduler/cron job
    2. Before fetching series data
    3. After any date changes
    """
    try:
        db = get_db()
        today = date.today()
        
        logger.info(f"🔄 Updating series statuses for date: {today}")
        
        # Get all series that might need status updates
        # Exclude DRAFT, PENDING_APPROVAL, REJECTED (manual statuses)
        query = """
        SELECT 
            id, 
            name, 
            status,
            subscription_start_date,
            subscription_end_date,
            series_start_date,
            maturity_date
        FROM ncd_series
        WHERE status NOT IN ('DRAFT', 'PENDING_APPROVAL', 'REJECTED')
        AND is_active = 1
        """
        
        series_list = db.execute_query(query)
        
        if not series_list:
            logger.info("No series to update")
            return
        
        updated_count = 0
        
        for series in series_list:
            series_id = series['id']
            series_name = series['name']
            current_status = series['status']
            
            subscription_start = series['subscription_start_date']
            subscription_end = series['subscription_end_date']
            series_start = series['series_start_date']
            maturity_date = series['maturity_date']
            
            # DEBUG: Log each series being checked
            logger.info(f"  Checking {series_name}: status={current_status}, series_start={series_start}, today={today}")
            
            # Determine new status based on dates
            new_status = None
            
            # Rule 1: After maturity date → MATURED
            if maturity_date and today >= maturity_date:
                new_status = 'matured'
                logger.info(f"    → Rule 1: After maturity → matured")
            
            # Rule 2: After series start date → ACTIVE
            elif series_start and today >= series_start:
                new_status = 'active'
                logger.info(f"    → Rule 2: After series start ({series_start}) → active")
            
            # Rule 3: After subscription end, before series start → UPCOMING
            elif subscription_end and today > subscription_end and series_start and today < series_start:
                new_status = 'upcoming'
                logger.info(f"    → Rule 3: Between subscription end and series start → upcoming")
            
            # Rule 4: During subscription period → ACCEPTING
            elif subscription_start and subscription_end and subscription_start <= today <= subscription_end:
                new_status = 'accepting'
                logger.info(f"    → Rule 4: During subscription period → accepting")
            
            # Rule 5: Approved but before subscription start → Keep as APPROVED
            elif current_status == 'APPROVED' and subscription_start and today < subscription_start:
                new_status = 'APPROVED'
                logger.info(f"    → Rule 5: Approved, before subscription → APPROVED")
            
            # Update if status changed
            if new_status and new_status != current_status:
                update_query = """
                UPDATE ncd_series
                SET status = %s, last_modified_at = NOW()
                WHERE id = %s
                """
                
                db.execute_query(update_query, (new_status, series_id))
                
                logger.info(f"✅ Updated {series_name}: {current_status} → {new_status}")
                updated_count += 1
        
        if updated_count > 0:
            logger.info(f"🎉 Updated {updated_count} series statuses")
        else:
            logger.info("✓ All series statuses are up to date")
        
        return updated_count
        
    except Exception as e:
        logger.error(f"❌ Error updating series statuses: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return 0


def get_expected_status(series_data: dict, current_date: date = None) -> str:
    """
    Calculate what the status SHOULD be based on dates
    
    Args:
        series_data: Dictionary with series dates and current status
        current_date: Date to check against (defaults to today)
    
    Returns:
        Expected status string
    """
    if current_date is None:
        current_date = date.today()
    
    status = series_data.get('status')
    subscription_start = series_data.get('subscription_start_date')
    subscription_end = series_data.get('subscription_end_date')
    series_start = series_data.get('series_start_date')
    maturity_date = series_data.get('maturity_date')
    
    # Manual statuses - don't auto-change
    if status in ['DRAFT', 'PENDING_APPROVAL', 'REJECTED']:
        return status
    
    # Automatic status based on dates
    if maturity_date and current_date >= maturity_date:
        return 'matured'
    
    if series_start and current_date >= series_start:
        return 'active'
    
    if subscription_end and current_date > subscription_end and series_start and current_date < series_start:
        return 'upcoming'
    
    if subscription_start and subscription_end and subscription_start <= current_date <= subscription_end:
        return 'accepting'
    
    if status == 'APPROVED' and subscription_start and current_date < subscription_start:
        return 'APPROVED'
    
    # Default: keep current status
    return status


def update_single_series_status(series_id: int):
    """
    Update status for a single series
    Useful after editing series dates
    """
    try:
        db = get_db()
        
        query = """
        SELECT 
            id, 
            name, 
            status,
            subscription_start_date,
            subscription_end_date,
            series_start_date,
            maturity_date
        FROM ncd_series
        WHERE id = %s
        """
        
        result = db.execute_query(query, (series_id,))
        
        if not result or len(result) == 0:
            logger.warning(f"Series {series_id} not found")
            return False
        
        series = result[0]
        current_status = series['status']
        new_status = get_expected_status(series)
        
        if new_status != current_status:
            update_query = """
            UPDATE ncd_series
            SET status = %s, last_modified_at = NOW()
            WHERE id = %s
            """
            
            db.execute_query(update_query, (new_status, series_id))
            logger.info(f"✅ Updated {series['name']}: {current_status} → {new_status}")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"❌ Error updating series {series_id} status: {e}")
        return False
