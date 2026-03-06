"""
Series Utility Functions - ALL BUSINESS LOGIC FOR NCD SERIES
NO LOGIC IN FRONTEND - EVERYTHING HERE
"""

from decimal import Decimal
from datetime import date
from typing import Optional
from models import StatusInfo, FormattedCurrency, FormattedDate
import logging

logger = logging.getLogger(__name__)

def format_currency(amount: Decimal) -> FormattedCurrency:
    """Format currency - replaces formatCurrency() from NCDSeries.jsx"""
    try:
        amount_float = float(amount)
        
        if amount_float >= 10000000:  # >= 1 Crore
            crores = amount_float / 10000000
            formatted = f"₹{crores:.1f} Cr"
            in_crores = crores
            in_lakhs = amount_float / 100000
        else:
            lakhs = amount_float / 100000
            formatted = f"₹{lakhs:.2f} L"
            in_crores = amount_float / 10000000
            in_lakhs = lakhs
        
        formatted_full = f"₹{amount_float:,.0f}"
        
        return FormattedCurrency(
            raw_value=amount,
            formatted=formatted,
            formatted_full=formatted_full,
            in_crores=in_crores,
            in_lakhs=in_lakhs
        )
    except Exception as e:
        logger.error(f"Error formatting currency: {e}")
        return FormattedCurrency(
            raw_value=amount,
            formatted=f"₹{amount}",
            formatted_full=f"₹{amount}",
            in_crores=None,
            in_lakhs=None
        )

def format_date(date_value: Optional[date]) -> Optional[FormattedDate]:
    """Format date - replaces date formatting from frontend"""
    if date_value is None:
        return None
    
    try:
        formatted_dd_mm_yyyy = date_value.strftime("%d/%m/%Y")
        formatted_display = date_value.strftime("%d %b %Y")
        iso_format = date_value.isoformat()
        
        return FormattedDate(
            raw_value=date_value,
            formatted_dd_mm_yyyy=formatted_dd_mm_yyyy,
            formatted_display=formatted_display,
            iso_format=iso_format
        )
    except Exception as e:
        logger.error(f"Error formatting date: {e}")
        return FormattedDate(
            raw_value=date_value,
            formatted_dd_mm_yyyy=str(date_value),
            formatted_display=str(date_value),
            iso_format=str(date_value)
        )

def calculate_series_status(
    db_status: str,
    subscription_start_date: date,
    subscription_end_date: date,
    release_date: date,
    maturity_date: date,
    series_start_date: Optional[date] = None
) -> str:
    """
    Calculate status - CORRECT LOGIC WITH series_start_date
    
    Status Flow:
    DRAFT → upcoming → accepting → active → matured
       ↓
    REJECTED
    
    - DRAFT: Not approved yet
    - REJECTED: Rejected by board
    - upcoming: Before subscription window opens
    - accepting: Within subscription window (accepting investments)
    - active: After series_start_date (no more investments, paying interest)
    - matured: After maturity date
    
    IMPORTANT: 
    - series_start_date is ALWAYS after subscription_end_date
    - series_start_date is when the series goes to "active" state
    - If series_start_date is not set, series goes to "active" after subscription_end_date
    """
    try:
        today = date.today()
        
        # DRAFT - Not approved yet
        if db_status == 'DRAFT':
            return 'DRAFT'
        
        # REJECTED - Rejected by board
        if db_status == 'REJECTED':
            return 'REJECTED'
        
        # matured - After maturity date
        if today >= maturity_date:
            return 'matured'
        
        # active - After series_start_date (if provided), otherwise after subscription_end_date
        if series_start_date:
            if today >= series_start_date:
                return 'active'
        else:
            # If no series_start_date, go to active after subscription ends
            if today > subscription_end_date:
                return 'active'
        
        # upcoming - Before subscription window opens
        if today < subscription_start_date:
            return 'upcoming'
        
        # accepting - Within subscription window (accepting investments)
        if subscription_start_date <= today <= subscription_end_date:
            return 'accepting'
        
        # Between subscription_end_date and series_start_date (waiting for series to start)
        # This is a transition period - series is not accepting investments but not yet active
        # We'll call this "accepting" status but it won't actually accept investments
        # OR we could return a new status like "pending_start"
        if today > subscription_end_date and series_start_date and today < series_start_date:
            return 'accepting'  # Or could be 'pending_start' if you want a new status
        
        return db_status.lower()
    except Exception as e:
        logger.error(f"Error calculating series status: {e}")
        return db_status.lower()

def get_status_info(calculated_status: str) -> StatusInfo:
    """Get status info - replaces getStatusInfo() from NCDSeries.jsx"""
    status_map = {
        'DRAFT': {'label': 'Yet to be approved', 'color': 'gray', 'badge_text': 'DRAFT'},
        'REJECTED': {'label': 'Rejected', 'color': 'red', 'badge_text': 'REJECTED'},
        'upcoming': {'label': 'Releasing soon', 'color': 'orange', 'badge_text': 'UPCOMING'},
        'accepting': {'label': 'Accepting investments', 'color': 'blue', 'badge_text': 'ACCEPTING'},
        'active': {'label': 'Active', 'color': 'green', 'badge_text': 'ACTIVE'},
        'matured': {'label': 'Matured', 'color': 'gray', 'badge_text': 'MATURED'}
    }
    
    info = status_map.get(calculated_status, {
        'label': 'Unknown', 'color': 'gray', 'badge_text': 'UNKNOWN'
    })
    
    return StatusInfo(
        status=calculated_status,
        label=info['label'],
        color=info['color'],
        badge_text=info['badge_text']
    )

def get_series_category(calculated_status: str) -> str:
    """Get category - replaces frontend filtering logic"""
    category_map = {
        'DRAFT': 'draft',
        'REJECTED': 'rejected',
        'upcoming': 'upcoming',
        'accepting': 'accepting',
        'active': 'active',
        'matured': 'matured'
    }
    return category_map.get(calculated_status, 'unknown')

def calculate_progress_percentage(funds_raised: Decimal, target_amount: Decimal) -> float:
    """Calculate progress percentage"""
    try:
        if target_amount > 0:
            progress = (float(funds_raised) / float(target_amount)) * 100
            return round(min(progress, 100), 2)
        return 0.0
    except Exception as e:
        logger.error(f"Error calculating progress: {e}")
        return 0.0

def calculate_days_until(target_date: date) -> int:
    """Calculate days until target date (negative if passed)"""
    try:
        today = date.today()
        delta = (target_date - today).days
        return delta
    except Exception as e:
        logger.error(f"Error calculating days until: {e}")
        return 0

def is_subscription_open(subscription_start_date: date, subscription_end_date: date) -> bool:
    """Check if subscription window is open"""
    try:
        today = date.today()
        return subscription_start_date <= today <= subscription_end_date
    except Exception as e:
        logger.error(f"Error checking subscription status: {e}")
        return False

def can_delete_series(calculated_status: str) -> bool:
    """Check if series can be deleted (only DRAFT and upcoming)"""
    return calculated_status in ['DRAFT', 'upcoming']

def calculate_investor_count(db, series_id: int) -> int:
    """Calculate number of unique investors"""
    try:
        query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investments
        WHERE series_id = %s AND status = 'confirmed'
        """
        result = db.execute_query(query, (series_id,))
        if result and len(result) > 0:
            return result[0]['count']
        return 0
    except Exception as e:
        logger.error(f"Error calculating investor count: {e}")
        return 0

def calculate_funds_raised(db, series_id: int) -> Decimal:
    """Calculate total funds raised"""
    try:
        # FIXED: Changed investment_amount to amount (correct column name)
        query = """
        SELECT COALESCE(SUM(amount), 0) as total
        FROM investments
        WHERE series_id = %s AND status = 'confirmed'
        """
        result = db.execute_query(query, (series_id,))
        if result and len(result) > 0:
            return Decimal(str(result[0]['total']))
        return Decimal('0')
    except Exception as e:
        logger.error(f"Error calculating funds raised: {e}")
        return Decimal('0')
