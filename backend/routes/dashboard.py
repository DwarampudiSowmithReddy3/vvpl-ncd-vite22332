"""
Dashboard API Routes
Provides all dashboard metrics calculated on backend
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
from decimal import Decimal
import logging

from database import get_db
from auth import get_current_user
from models import UserInDB
from permissions_checker import has_permission, log_unauthorized_access

router = APIRouter(prefix="/dashboard", tags=["dashboard"])
logger = logging.getLogger(__name__)


@router.get("/metrics")
async def get_dashboard_metrics(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all dashboard metrics in one call
    PERMISSION REQUIRED: view_dashboard
    Returns:
    - active_series_count
    - average_interest_rate
    - total_funds_raised
    - total_investors
    - maturity_distribution
    - lockin_distribution
    - series_performance
    - compliance_status
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_dashboard_metrics", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        # 1. Active Series Count (accepting + active + upcoming)
        active_series_query = """
        SELECT COUNT(*) as count
        FROM ncd_series
        WHERE is_active = 1 AND status IN ('active', 'accepting', 'upcoming')
        """
        active_result = db.execute_query(active_series_query)
        active_series_count = active_result[0]['count'] if active_result else 0
        
        # 2. Average Interest Rate (from active series)
        avg_interest_query = """
        SELECT AVG(interest_rate) as avg_rate
        FROM ncd_series
        WHERE is_active = 1 AND status IN ('active', 'accepting', 'upcoming')
        """
        avg_result = db.execute_query(avg_interest_query)
        average_interest_rate = float(avg_result[0]['avg_rate']) if avg_result and avg_result[0]['avg_rate'] else 0.0
        
        # 3. Total Funds Raised (sum of ALL investments ever made - LIFETIME total)
        # This includes both active (confirmed) AND exited (cancelled) investments
        # because it represents the total amount that has EVER been invested
        funds_query = """
        SELECT COALESCE(SUM(amount), 0) as total_funds
        FROM investments
        WHERE status IN ('confirmed', 'cancelled')
        """
        funds_result = db.execute_query(funds_query)
        total_funds_raised = float(funds_result[0]['total_funds']) if funds_result else 0.0
        
        # 4. Total Investors (unique investor_ids with LIFETIME investments - confirmed or exited)
        investors_query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investments
        WHERE status IN ('confirmed', 'cancelled')
        """
        investors_result = db.execute_query(investors_query)
        total_investors = investors_result[0]['count'] if investors_result else 0
        
        # 5. Maturity Distribution (buckets)
        maturity_distribution = calculate_maturity_distribution(db)
        
        # 6. Lock-in Distribution (buckets)
        lockin_distribution = calculate_lockin_distribution(db)
        
        # 7. Series Performance (top performing series)
        series_performance = calculate_series_performance(db)
        
        # 8. Compliance Status
        compliance_status = calculate_compliance_status(db)
        
        return {
            "active_series_count": active_series_count,
            "average_interest_rate": round(average_interest_rate, 2),
            "total_funds_raised": total_funds_raised,
            "total_investors": total_investors,
            "maturity_distribution": maturity_distribution,
            "lockin_distribution": lockin_distribution,
            "series_performance": series_performance,
            "compliance_status": compliance_status,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting dashboard metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard metrics: {str(e)}"
        )


def calculate_maturity_distribution(db) -> List[Dict[str, Any]]:
    """
    Calculate maturity buckets based on series maturity dates
    FIXED: Shows CURRENT ACTIVE FUNDS only (excludes exited investors who took principal back)
    """
    try:
        today = date.today()
        
        # FIXED: Only count ACTIVE investments (status = 'confirmed')
        # Exited investors (status = 'cancelled') have taken their principal back
        query = """
        SELECT 
            s.id,
            s.name,
            s.maturity_date,
            COALESCE(SUM(i.amount), 0) as funds_raised
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status = 'confirmed'
        WHERE s.is_active = 1 AND s.maturity_date IS NOT NULL
        GROUP BY s.id, s.name, s.maturity_date
        """
        
        series_data = db.execute_query(query)
        
        # Initialize buckets
        buckets = {
            '< 3 months': {'amount': 0, 'seriesCount': 0},
            '3 to 6 months': {'amount': 0, 'seriesCount': 0},
            '6 to 12 months': {'amount': 0, 'seriesCount': 0},
            '> 12 months': {'amount': 0, 'seriesCount': 0}
        }
        
        for series in series_data:
            maturity_date = series['maturity_date']
            funds = float(series['funds_raised'])
            
            # Calculate months to maturity
            delta = maturity_date - today
            months_to_maturity = delta.days / 30
            
            # Categorize into buckets
            if months_to_maturity < 3:
                buckets['< 3 months']['amount'] += funds
                buckets['< 3 months']['seriesCount'] += 1
            elif months_to_maturity < 6:
                buckets['3 to 6 months']['amount'] += funds
                buckets['3 to 6 months']['seriesCount'] += 1
            elif months_to_maturity < 12:
                buckets['6 to 12 months']['amount'] += funds
                buckets['6 to 12 months']['seriesCount'] += 1
            else:
                buckets['> 12 months']['amount'] += funds
                buckets['> 12 months']['seriesCount'] += 1
        
        # Convert to list format
        result = []
        for bucket_name, data in buckets.items():
            result.append({
                'bucket': bucket_name,
                'amount': data['amount'],
                'seriesCount': data['seriesCount']
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating maturity distribution: {e}")
        return []


def calculate_lockin_distribution(db) -> List[Dict[str, Any]]:
    """
    Calculate lock-in buckets based on series lock-in dates
    FIXED: Shows CURRENT ACTIVE FUNDS only (excludes exited investors who took principal back)
    """
    try:
        today = date.today()
        
        # FIXED: Only count ACTIVE investments (status = 'confirmed')
        # Exited investors (status = 'cancelled') have taken their principal back
        query = """
        SELECT 
            s.id,
            s.name,
            s.lock_in_date,
            COALESCE(SUM(i.amount), 0) as funds_raised
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status = 'confirmed'
        WHERE s.is_active = 1 AND s.lock_in_date IS NOT NULL
        GROUP BY s.id, s.name, s.lock_in_date
        """
        
        series_data = db.execute_query(query)
        
        # Initialize buckets
        buckets = {
            '< 3 months': {'amount': 0, 'seriesCount': 0},
            '3 to 6 months': {'amount': 0, 'seriesCount': 0},
            '6 to 12 months': {'amount': 0, 'seriesCount': 0},
            '> 12 months': {'amount': 0, 'seriesCount': 0}
        }
        
        for series in series_data:
            lockin_date = series['lock_in_date']
            funds = float(series['funds_raised'])
            
            # Calculate months to lock-in completion
            delta = lockin_date - today
            months_to_lockin = delta.days / 30
            
            # Categorize into buckets
            if months_to_lockin < 3:
                buckets['< 3 months']['amount'] += funds
                buckets['< 3 months']['seriesCount'] += 1
            elif months_to_lockin < 6:
                buckets['3 to 6 months']['amount'] += funds
                buckets['3 to 6 months']['seriesCount'] += 1
            elif months_to_lockin < 12:
                buckets['6 to 12 months']['amount'] += funds
                buckets['6 to 12 months']['seriesCount'] += 1
            else:
                buckets['> 12 months']['amount'] += funds
                buckets['> 12 months']['seriesCount'] += 1
        
        # Convert to list format
        result = []
        for bucket_name, data in buckets.items():
            result.append({
                'bucket': bucket_name,
                'amount': data['amount'],
                'seriesCount': data['seriesCount']
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating lock-in distribution: {e}")
        return []


def calculate_series_performance(db) -> List[Dict[str, Any]]:
    """Calculate performance metrics for each series - shows LIFETIME totals"""
    try:
        query = """
        SELECT 
            s.id,
            s.name,
            s.series_code,
            s.target_amount,
            s.interest_rate,
            s.status,
            COALESCE(SUM(i.amount), 0) as funds_raised,
            COUNT(DISTINCT i.investor_id) as investor_count
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status IN ('confirmed', 'cancelled')
        WHERE s.is_active = 1
        GROUP BY s.id, s.name, s.series_code, s.target_amount, s.interest_rate, s.status
        ORDER BY funds_raised DESC
        LIMIT 10
        """
        
        series_data = db.execute_query(query)
        
        result = []
        for series in series_data:
            funds_raised = float(series['funds_raised'])
            target_amount = float(series['target_amount'])
            progress = (funds_raised / target_amount * 100) if target_amount > 0 else 0
            
            result.append({
                'id': series['id'],
                'name': series['name'],
                'series_code': series['series_code'],
                'target_amount': target_amount,
                'funds_raised': funds_raised,
                'progress_percentage': round(progress, 2),
                'interest_rate': float(series['interest_rate']),
                'investor_count': series['investor_count'],
                'status': series['status']
            })
        
        return result
        
    except Exception as e:
        logger.error(f"Error calculating series performance: {e}")
        return []


def calculate_compliance_status(db) -> Dict[str, Any]:
    """Calculate compliance metrics"""
    try:
        # Count series by status
        status_query = """
        SELECT 
            status,
            COUNT(*) as count
        FROM ncd_series
        WHERE is_active = 1
        GROUP BY status
        """
        
        status_data = db.execute_query(status_query)
        
        status_counts = {
            'DRAFT': 0,
            'REJECTED': 0,
            'upcoming': 0,
            'accepting': 0,
            'active': 0,
            'matured': 0
        }
        
        for row in status_data:
            status = row['status']
            if status in status_counts:
                status_counts[status] = row['count']
        
        # Calculate compliance percentage (all non-draft, non-rejected / total)
        total = sum(status_counts.values())
        compliant = status_counts['upcoming'] + status_counts['accepting'] + status_counts['active'] + status_counts['matured']
        compliance_percentage = (compliant / total * 100) if total > 0 else 100
        
        return {
            'compliance_percentage': round(compliance_percentage, 2),
            'total_series': total,
            'draft_count': status_counts['DRAFT'],
            'rejected_count': status_counts['REJECTED'],
            'upcoming_count': status_counts['upcoming'],
            'accepting_count': status_counts['accepting'],
            'active_count': status_counts['active'],
            'matured_count': status_counts['matured']
        }
        
    except Exception as e:
        logger.error(f"Error calculating compliance status: {e}")
        return {
            'compliance_percentage': 0,
            'total_series': 0,
            'draft_count': 0,
            'rejected_count': 0,
            'upcoming_count': 0,
            'accepting_count': 0,
            'active_count': 0,
            'matured_count': 0
        }


@router.get("/maturity-lockin-distribution")
async def get_maturity_lockin_distribution(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get maturity and lock-in distribution buckets for ACTIVE series ONLY (not accepting)
    PERMISSION REQUIRED: view_dashboard
    
    Lock-in date = when lock-in ENDS (investors can withdraw)
    
    Returns:
    - maturity_buckets: 4 buckets based on months to maturity
    - lockin_buckets: 4 buckets based on months until lock-in ends (investors can withdraw)
    
    Each bucket contains:
    - label: Bucket name
    - amount: Total funds in bucket
    - series_count: Number of series in bucket
    - percentage: Percentage of total funds
    - color: UI color code
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_maturity_lockin_distribution", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        logger.info("📊 Fetching maturity & lock-in distribution for ACTIVE series ONLY")
        
        # FIXED: Get ONLY ACTIVE series with CURRENT ACTIVE FUNDS (excludes exited investors)
        # Exited investors have taken their principal back, so don't count them
        series_query = """
        SELECT 
            s.id,
            s.name,
            s.status,
            s.maturity_date,
            s.lock_in_date,
            COALESCE(SUM(i.amount), 0) as funds_raised
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status = 'confirmed'
        WHERE s.is_active = 1 AND s.status = 'active'
        GROUP BY s.id, s.name, s.status, s.maturity_date, s.lock_in_date
        """
        
        series_data = db.execute_query(series_query)
        
        logger.info(f"📊 Found {len(series_data)} ACTIVE series for distribution calculation")
        
        # Initialize maturity buckets
        maturity_buckets = {
            '< 3 months': {'amount': 0, 'series_count': 0, 'color': 'blue'},
            '3 to 6 months': {'amount': 0, 'series_count': 0, 'color': 'teal'},
            '6 to 12 months': {'amount': 0, 'series_count': 0, 'color': 'orange'},
            '12 months above': {'amount': 0, 'series_count': 0, 'color': 'purple'}
        }
        
        # Initialize lock-in buckets
        lockin_buckets = {
            'Lock-in completed': {'amount': 0, 'series_count': 0, 'color': 'green'},
            'Lock-in ending in <3 months': {'amount': 0, 'series_count': 0, 'color': 'blue'},
            'Lock-in ending in 3 to 6 months': {'amount': 0, 'series_count': 0, 'color': 'teal'},
            'Lock-in ending in 6 to 12 months': {'amount': 0, 'series_count': 0, 'color': 'orange'}
        }
        
        today = date.today()
        
        # Process each ACTIVE series
        for series in series_data:
            funds = float(series['funds_raised'])
            
            logger.info(f"  Processing series: {series['name']} (Status: {series['status']}, Funds: ₹{funds:,.2f})")
            
            # Calculate maturity bucket
            if series['maturity_date']:
                maturity_date = series['maturity_date']
                days_to_maturity = (maturity_date - today).days
                months_to_maturity = days_to_maturity / 30.0
                
                logger.info(f"    Maturity: {maturity_date} ({months_to_maturity:.1f} months away)")
                
                if months_to_maturity < 3:
                    maturity_buckets['< 3 months']['amount'] += funds
                    maturity_buckets['< 3 months']['series_count'] += 1
                elif months_to_maturity < 6:
                    maturity_buckets['3 to 6 months']['amount'] += funds
                    maturity_buckets['3 to 6 months']['series_count'] += 1
                elif months_to_maturity < 12:
                    maturity_buckets['6 to 12 months']['amount'] += funds
                    maturity_buckets['6 to 12 months']['series_count'] += 1
                else:
                    maturity_buckets['12 months above']['amount'] += funds
                    maturity_buckets['12 months above']['series_count'] += 1
            
            # Calculate lock-in bucket (lock_in_date = when investors can withdraw)
            if series['lock_in_date']:
                lockin_date = series['lock_in_date']
                days_to_lockin_end = (lockin_date - today).days
                months_to_lockin_end = days_to_lockin_end / 30.0
                
                logger.info(f"    Lock-in ends: {lockin_date} ({months_to_lockin_end:.1f} months away)")
                
                if days_to_lockin_end <= 0:
                    # Lock-in has already ended - investors can withdraw now
                    lockin_buckets['Lock-in completed']['amount'] += funds
                    lockin_buckets['Lock-in completed']['series_count'] += 1
                    logger.info(f"      ✅ Lock-in completed (investors can withdraw)")
                elif months_to_lockin_end < 3:
                    # Lock-in will end in less than 3 months
                    lockin_buckets['Lock-in ending in <3 months']['amount'] += funds
                    lockin_buckets['Lock-in ending in <3 months']['series_count'] += 1
                    logger.info(f"      ⏰ Lock-in ending soon")
                elif months_to_lockin_end < 6:
                    lockin_buckets['Lock-in ending in 3 to 6 months']['amount'] += funds
                    lockin_buckets['Lock-in ending in 3 to 6 months']['series_count'] += 1
                elif months_to_lockin_end < 12:
                    lockin_buckets['Lock-in ending in 6 to 12 months']['amount'] += funds
                    lockin_buckets['Lock-in ending in 6 to 12 months']['series_count'] += 1
        
        # Calculate total amounts for percentage calculation
        total_maturity_amount = sum(bucket['amount'] for bucket in maturity_buckets.values())
        total_lockin_amount = sum(bucket['amount'] for bucket in lockin_buckets.values())
        
        logger.info(f"📊 Total maturity amount: ₹{total_maturity_amount:,.2f}")
        logger.info(f"📊 Total lock-in amount: ₹{total_lockin_amount:,.2f}")
        
        # Format maturity buckets for response
        maturity_result = []
        for label, data in maturity_buckets.items():
            percentage = round((data['amount'] / total_maturity_amount * 100)) if total_maturity_amount > 0 else 0
            maturity_result.append({
                'label': label,
                'amount': data['amount'],
                'series_count': data['series_count'],
                'percentage': percentage,
                'color': data['color']
            })
        
        # Format lock-in buckets for response
        lockin_result = []
        for label, data in lockin_buckets.items():
            percentage = round((data['amount'] / total_lockin_amount * 100)) if total_lockin_amount > 0 else 0
            lockin_result.append({
                'label': label,
                'amount': data['amount'],
                'series_count': data['series_count'],
                'percentage': percentage,
                'color': data['color']
            })
        
        logger.info(f"✅ Maturity & Lock-in distribution calculated successfully for ACTIVE series")
        
        return {
            'maturity_buckets': maturity_result,
            'lockin_buckets': lockin_result,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error calculating maturity-lockin distribution: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving maturity-lockin distribution: {str(e)}"
        )


@router.get("/upcoming-maturity-calendar")
async def get_upcoming_maturity_calendar(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get upcoming maturity calendar data for dashboard header
    PERMISSION REQUIRED: view_dashboard
    
    Returns calendar display data and series list for UpcomingPayoutCalendar component
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_upcoming_maturity_calendar", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        # Get active and upcoming series with maturity dates
        series_query = """
        SELECT 
            id,
            name,
            series_code,
            maturity_date,
            status
        FROM ncd_series
        WHERE is_active = 1 
        AND (status = 'active' OR status = 'upcoming')
        AND maturity_date IS NOT NULL
        ORDER BY maturity_date ASC
        """
        
        series_data = db.execute_query(series_query)
        
        # Find the nearest upcoming maturity date
        calendar_display = None
        if series_data and len(series_data) > 0:
            nearest_date = series_data[0]['maturity_date']
            calendar_display = {
                'day': nearest_date.strftime('%d'),
                'month': nearest_date.strftime('%b').upper()
            }
        
        # Format series list with days left calculation
        today = date.today()
        series_list = []
        for s in series_data:
            maturity_date = s['maturity_date']
            days_left = (maturity_date - today).days
            
            series_list.append({
                'name': s['name'],
                'maturityDate': maturity_date.strftime('%d/%m/%Y'),
                'status': s['status'],
                'daysLeft': days_left
            })
        
        logger.info(f"✅ Calendar data retrieved: {len(series_list)} series")
        
        return {
            'calendar_display': calendar_display,
            'series_list': series_list,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting calendar data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving calendar data: {str(e)}"
        )


@router.get("/upcoming-maturity-calendar")
async def get_upcoming_maturity_calendar(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get upcoming maturity calendar data for dashboard
    PERMISSION REQUIRED: view_dashboard
    
    Returns:
    - nearest_maturity_date: The nearest upcoming maturity date
    - calendar_display: { day, month, year } for calendar UI
    - series_list: List of active/upcoming series with maturity info
    - selected_series_details: Detailed breakdown for modal
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_upcoming_maturity_calendar", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        # Get all active and upcoming series with maturity dates (LIFETIME funds)
        series_query = """
        SELECT 
            s.id,
            s.name,
            s.maturity_date,
            s.lock_in_date,
            s.status,
            s.interest_rate,
            COALESCE(SUM(i.amount), 0) as funds_raised,
            COUNT(DISTINCT i.investor_id) as investor_count
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status IN ('confirmed', 'cancelled')
        WHERE s.is_active = 1 
        AND (s.status = 'active' OR s.status = 'upcoming')
        AND s.maturity_date IS NOT NULL
        GROUP BY s.id, s.name, s.maturity_date, s.lock_in_date, s.status, s.interest_rate
        ORDER BY s.maturity_date ASC
        """
        
        series_data = db.execute_query(series_query)
        
        if not series_data or len(series_data) == 0:
            return {
                'nearest_maturity_date': None,
                'calendar_display': None,
                'series_list': [],
                'message': 'No active or upcoming series with maturity dates found'
            }
        
        today = date.today()
        
        # Find nearest maturity date (future dates only)
        future_series = [s for s in series_data if s['maturity_date'] >= today]
        
        if not future_series:
            # All series have matured, show the most recent one
            nearest_series = series_data[0]
        else:
            nearest_series = future_series[0]
        
        nearest_date = nearest_series['maturity_date']
        
        # Format calendar display
        calendar_display = {
            'day': nearest_date.day,
            'month': nearest_date.strftime('%b').upper(),
            'year': nearest_date.year,
            'full_date': nearest_date.strftime('%Y-%m-%d')
        }
        
        # Build series list with days left
        series_list = []
        for s in series_data:
            maturity_date = s['maturity_date']
            days_left = (maturity_date - today).days
            
            # Calculate lock-in status
            lock_in_status = None
            if s['lock_in_date']:
                lock_in_date = s['lock_in_date']
                days_to_lockin = (lock_in_date - today).days
                
                if days_to_lockin > 0:
                    lock_in_status = f"{days_to_lockin} days left for lock-in"
                else:
                    lock_in_status = f"Lock-in period ended {abs(days_to_lockin)} days ago"
            
            series_list.append({
                'series_id': s['id'],
                'series_name': s['name'],
                'maturity_date': maturity_date.strftime('%d/%m/%Y'),
                'maturity_date_iso': maturity_date.strftime('%Y-%m-%d'),
                'days_left': days_left if days_left > 0 else 0,
                'status': s['status'],
                'funds_raised': float(s['funds_raised']),
                'investor_count': s['investor_count'],
                'interest_rate': float(s['interest_rate']),
                'lock_in_status': lock_in_status
            })
        
        logger.info(f"✅ Upcoming maturity calendar data calculated successfully")
        
        return {
            'nearest_maturity_date': nearest_date.strftime('%d/%m/%Y'),
            'calendar_display': calendar_display,
            'series_list': series_list,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error calculating upcoming maturity calendar: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving upcoming maturity calendar: {str(e)}"
        )


@router.get("/top-investors")
async def get_top_investors(
    limit: int = 10,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get top investors by total investment amount with maturity and lock-in calculations
    Returns: List of top investors with their details
    - rank
    - investor_name
    - investor_id
    - series (list of series names)
    - total_invested
    - at_maturity (principal + interest at maturity)
    - after_lock_in (amount available after lock-in period)
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_top_investors", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        logger.info(f"📊 Fetching top {limit} investors by investment amount")
        
        # Query to get top investors with their LIFETIME investments (including exited series)
        # This shows ALL-TIME top investors, not just currently active investments
        query = """
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            i.id as investment_id,
            i.amount as investment_amount,
            i.series_id,
            s.name as series_name,
            s.interest_rate,
            s.maturity_date,
            s.lock_in_date,
            s.series_start_date,
            s.issue_date,
            s.tenure
        FROM investors inv
        LEFT JOIN investments i ON inv.id = i.investor_id AND i.status IN ('confirmed', 'cancelled')
        LEFT JOIN ncd_series s ON i.series_id = s.id
        WHERE inv.status = 'active' AND inv.is_active = 1 AND i.amount IS NOT NULL
        ORDER BY inv.id
        """
        
        result = db.execute_query(query)
        
        # Group by investor and calculate totals
        investor_data = {}
        for row in result:
            investor_id = row['investor_id']
            
            if investor_id not in investor_data:
                investor_data[investor_id] = {
                    'investor_code': row['investor_code'],
                    'investor_name': row['investor_name'],
                    'total_invested': 0,
                    'at_maturity': 0,
                    'after_lock_in': 0,
                    'series': set()
                }
            
            # Add to totals
            investment_amount = float(row['investment_amount'])
            investor_data[investor_id]['total_invested'] += investment_amount
            investor_data[investor_id]['series'].add(row['series_name'])
            
            # Calculate at maturity (principal + total interest earned until maturity)
            # CORRECT FORMULA: (Principal × Interest Rate × Days) / 100 / Days_in_year
            if row['interest_rate'] and row['maturity_date'] and row['series_start_date']:
                from datetime import datetime
                import calendar
                
                interest_rate = float(row['interest_rate'])
                
                # Parse dates
                maturity_date = row['maturity_date']
                start_date = row['series_start_date']
                
                if isinstance(maturity_date, str):
                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                if isinstance(start_date, str):
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                
                # Calculate days from start to maturity
                days_to_maturity = (maturity_date - start_date).days + 1
                days_in_year = 366 if calendar.isleap(start_date.year) else 365
                
                # Calculate interest using actual days
                total_interest = (investment_amount * interest_rate * days_to_maturity) / 100 / days_in_year
                maturity_value = investment_amount + total_interest
                investor_data[investor_id]['at_maturity'] += maturity_value
                
                logger.debug(f"  AT MATURITY: Principal={investment_amount}, Rate={interest_rate}%, Days={days_to_maturity}, Interest={total_interest:.2f}, Total={maturity_value:.2f}")
            else:
                # If no interest rate or maturity date, just return principal
                investor_data[investor_id]['at_maturity'] += investment_amount
                logger.warning(f"  AT MATURITY: Missing data for investment {row['investment_id']}, using principal only")
            
            # Calculate after lock-in (principal + interest earned until lock-in date)
            # CORRECT FORMULA: (Principal × Interest Rate × Days) / 100 / Days_in_year
            if row['interest_rate'] and row['lock_in_date'] and row['series_start_date']:
                from datetime import datetime
                import calendar
                
                interest_rate = float(row['interest_rate'])
                
                # Parse dates
                lock_in_date = row['lock_in_date']
                start_date = row['series_start_date']
                
                if isinstance(lock_in_date, str):
                    lock_in_date = datetime.strptime(lock_in_date, '%Y-%m-%d').date()
                if isinstance(start_date, str):
                    start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                
                # Calculate days from start to lock-in
                days_to_lockin = (lock_in_date - start_date).days + 1
                days_in_year = 366 if calendar.isleap(start_date.year) else 365
                
                # Calculate interest using actual days
                lock_in_interest = (investment_amount * interest_rate * days_to_lockin) / 100 / days_in_year
                lock_in_value = investment_amount + lock_in_interest
                investor_data[investor_id]['after_lock_in'] += lock_in_value
                
                logger.debug(f"  AFTER LOCK-IN: Principal={investment_amount}, Rate={interest_rate}%, Days={days_to_lockin}, Interest={lock_in_interest:.2f}, Total={lock_in_value:.2f}")
            else:
                # If no lock-in date or interest rate, just return principal
                investor_data[investor_id]['after_lock_in'] += investment_amount
                logger.warning(f"  AFTER LOCK-IN: Missing data for investment {row['investment_id']}, using principal only")
        
        # Sort by total invested and take top N
        sorted_investors = sorted(
            investor_data.items(),
            key=lambda x: x[1]['total_invested'],
            reverse=True
        )[:limit]
        
        # Format response
        top_investors = []
        for idx, (investor_id, data) in enumerate(sorted_investors):
            top_investors.append({
                "rank": idx + 1,
                "investorName": data['investor_name'],
                "investorId": data['investor_code'],
                "series": sorted(list(data['series'])),
                "totalInvested": round(data['total_invested'], 2),
                "atMaturity": round(data['at_maturity'], 2),
                "afterLockIn": round(data['after_lock_in'], 2)
            })
        
        logger.info(f"✅ Retrieved {len(top_investors)} top investors with maturity calculations")
        
        return {
            "topInvestors": top_investors,
            "count": len(top_investors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching top investors: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payout-stats")
async def get_payout_stats(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Interest Payout Statistics for Dashboard
    ALL LOGIC IN BACKEND - NO FRONTEND CALCULATION
    
    Returns:
    - total_interest_paid: Sum of all paid payouts for current month
    - upcoming_month_payout: Sum of all scheduled payouts for next month (calculated from investments)
    - current_month: Current month name (e.g., "February 2026")
    - upcoming_month: Next month name (e.g., "March 2026")
    - total_payouts: Count of current month payouts
    - upcoming_payouts: Count of next month payouts (calculated from active investments)
    - upcoming_details: Array of upcoming payouts by series with investor counts
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_payout_stats", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        logger.info("📊 Calculating payout statistics for dashboard...")
        
        # Get current date
        current_date = datetime.now()
        current_month = current_date.month
        current_year = current_date.year
        
        # Calculate next month
        if current_month == 12:
            next_month = 1
            next_year = current_year + 1
        else:
            next_month = current_month + 1
            next_year = current_year
        
        # Format month strings
        current_month_str = date(current_year, current_month, 1).strftime('%B %Y')
        next_month_str = date(next_year, next_month, 1).strftime('%B %Y')
        
        logger.info(f"   Current month: {current_month_str}")
        logger.info(f"   Next month: {next_month_str}")
        
        # 1. Get CURRENT MONTH payouts - USE THE SAME LOGIC AS INTEREST PAYOUT PAGE
        # This ensures Dashboard shows EXACTLY the same value as Interest Payout Management
        logger.info(f"   Fetching current month payouts from export endpoint...")
        
        try:
            # Import the get_export_payouts function from payouts router
            from routes.payouts import get_export_payouts
            
            # Call the export endpoint with month_type='current'
            current_export_data = await get_export_payouts(
                series_id=None,  # All series
                month_type='current',
                current_user=current_user
            )
            
            # Extract the total_amount from summary
            total_interest_paid = current_export_data.get('summary', {}).get('total_amount', 0)
            total_payouts = len(current_export_data.get('payouts', []))
            
            logger.info(f"   Current month calculated: ₹{total_interest_paid:,.2f} ({total_payouts} payouts)")
            
        except Exception as e:
            logger.error(f"❌ Error fetching current month payouts from export endpoint: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Fallback to 0 if there's an error
            total_interest_paid = 0.0
            total_payouts = 0

        
        # 2. Get UPCOMING MONTH payouts - USE THE SAME LOGIC AS INTEREST PAYOUT PAGE
        # This ensures consistency with the Interest Payout Management page
        logger.info(f"   Fetching upcoming month payouts from export endpoint...")
        
        try:
            # Call the export endpoint with month_type='upcoming'
            upcoming_export_data = await get_export_payouts(
                series_id=None,  # All series
                month_type='upcoming',
                current_user=current_user
            )
            
            # Extract the total_amount from summary
            upcoming_month_payout = upcoming_export_data.get('summary', {}).get('total_amount', 0)
            upcoming_payouts_count = len(upcoming_export_data.get('payouts', []))
            
            # Build upcoming details from the export data
            upcoming_details = []
            
            # Group by series
            series_payouts = {}
            for payout in upcoming_export_data.get('payouts', []):
                series_name = payout.get('series_name', 'Unknown')
                if series_name not in series_payouts:
                    series_payouts[series_name] = {
                        'investors': set(),
                        'amount': 0,
                        'date': payout.get('interest_date', ''),
                        'payout_date_obj': None
                    }
                
                series_payouts[series_name]['investors'].add(payout.get('investor_id'))
                series_payouts[series_name]['amount'] += float(payout.get('amount', 0))
                
                # Parse date for days_left calculation
                if payout.get('interest_date'):
                    try:
                        payout_date_obj = datetime.strptime(payout.get('interest_date'), '%d-%b-%Y').date()
                        series_payouts[series_name]['payout_date_obj'] = payout_date_obj
                    except:
                        pass
            
            # Convert to list format
            for series_name, data in series_payouts.items():
                days_left = 0
                if data['payout_date_obj']:
                    days_left = (data['payout_date_obj'] - date.today()).days
                
                upcoming_details.append({
                    'series': series_name,
                    'investors': len(data['investors']),
                    'amount': round(data['amount'], 2),
                    'date': data['date'],
                    'days_left': max(0, days_left)
                })
            
            logger.info(f"   Next month calculated: ₹{upcoming_month_payout:,.2f} ({upcoming_payouts_count} payouts)")
            logger.info(f"   Upcoming details: {len(upcoming_details)} series")
            
        except Exception as e:
            logger.error(f"❌ Error fetching upcoming month payouts from export endpoint: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Fallback to 0 if there's an error
            upcoming_month_payout = 0.0
            upcoming_payouts_count = 0
            upcoming_details = []
        
        logger.info(f"✅ Payout statistics calculated successfully")
        
        return {
            "total_interest_paid": round(total_interest_paid, 2),
            "upcoming_month_payout": round(upcoming_month_payout, 2),
            "current_month": current_month_str,
            "upcoming_month": next_month_str,
            "total_payouts": total_payouts,
            "upcoming_payouts": upcoming_payouts_count,
            "upcoming_details": upcoming_details,
            "timestamp": datetime.now().isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error calculating payout statistics: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating payout statistics: {str(e)}"
        )


@router.get("/satisfaction-metrics")
async def get_satisfaction_metrics(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Investor Satisfaction Index metrics
    ALL LOGIC IN BACKEND - NO FRONTEND CALCULATION
    
    Returns:
    - retention_rate: Percentage of investors retained
    - churn_requests: Number of investors who deleted account
    - churn_amount: Total investment amount of churned investors
    - early_redemption_requests: Number of series exits before maturity
    - early_redemption_amount: Total amount of early redemptions
    
    RETENTION LOGIC:
    - Investor is RETAINED if:
      * Has active investments in any series, OR
      * Series matured but reinvested in another series
    - Investor is CHURNED if:
      * All series matured AND didn't reinvest, OR
      * Deleted/deactivated account
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_dashboard", db):
            log_unauthorized_access(db, current_user, "get_satisfaction_metrics", "view_dashboard")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view dashboard"
            )
        
        logger.info("📊 Calculating satisfaction metrics...")
        
        # 1. CHURN REQUESTS - Investors who deleted their account
        churn_query = """
        SELECT COUNT(*) as count, COALESCE(SUM(total_investment), 0) as total_amount
        FROM investors
        WHERE status = 'deleted'
        """
        churn_result = db.execute_query(churn_query)
        churn_requests = churn_result[0]['count'] if churn_result else 0
        churn_amount = float(churn_result[0]['total_amount']) if churn_result else 0.0
        
        # 2. EARLY REDEMPTION - Series exits (cancelled investments)
        early_redemption_query = """
        SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
        FROM investments
        WHERE status = 'cancelled'
        """
        early_redemption_result = db.execute_query(early_redemption_query)
        early_redemption_requests = early_redemption_result[0]['count'] if early_redemption_result else 0
        early_redemption_amount = float(early_redemption_result[0]['total_amount']) if early_redemption_result else 0.0
        
        # 3. RETENTION RATE CALCULATION
        # IMPORTANT: Only count investors who HAVE INVESTED at least once
        # Exclude investors who just registered but never invested
        
        # Get all investors who EVER had investments (at least one investment record)
        investors_who_ever_invested_query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investments
        """
        ever_invested_result = db.execute_query(investors_who_ever_invested_query)
        investors_who_ever_invested = ever_invested_result[0]['count'] if ever_invested_result else 0
        
        # Get investors with CONFIRMED investments (currently invested) - RETAINED
        investors_with_active_investments_query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investments
        WHERE status = 'confirmed'
        """
        active_investments_result = db.execute_query(investors_with_active_investments_query)
        investors_with_active_investments = active_investments_result[0]['count'] if active_investments_result else 0
        
        # Get investors whose ALL series matured but they REINVESTED in new series
        # Logic: Investor had investments in matured series, but also has investments in active series
        reinvested_investors_query = """
        SELECT COUNT(DISTINCT i.investor_id) as count
        FROM investments i
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE i.status = 'confirmed'
        AND s.status = 'active'
        AND i.investor_id IN (
            SELECT DISTINCT i2.investor_id
            FROM investments i2
            INNER JOIN ncd_series s2 ON i2.series_id = s2.id
            WHERE s2.status = 'matured'
        )
        """
        reinvested_result = db.execute_query(reinvested_investors_query)
        reinvested_investors = reinvested_result[0]['count'] if reinvested_result else 0
        
        # RETAINED INVESTORS = Investors with active investments (includes reinvested)
        retained_investors = investors_with_active_investments
        
        # CHURNED INVESTORS = Investors who invested but now have NO confirmed investments
        # This includes:
        # 1. Investors whose series matured and didn't reinvest
        # 2. Investors who exited all series
        # 3. Investors who deleted their account (if they had investments)
        churned_investors = investors_who_ever_invested - retained_investors
        
        # Calculate retention rate
        # Only consider investors who actually invested at least once
        if investors_who_ever_invested > 0:
            retention_rate = round((retained_investors / investors_who_ever_invested) * 100, 1)
            # Ensure retention rate is between 0 and 100
            retention_rate = max(0, min(100, retention_rate))
        else:
            retention_rate = 100.0
        
        logger.info(f"✅ Satisfaction metrics calculated:")
        logger.info(f"   - Investors who ever invested: {investors_who_ever_invested}")
        logger.info(f"   - Investors with active investments (RETAINED): {investors_with_active_investments}")
        logger.info(f"   - Reinvested investors: {reinvested_investors}")
        logger.info(f"   - Churned investors: {churned_investors}")
        logger.info(f"   - Churn requests (deleted accounts): {churn_requests}")
        logger.info(f"   - Retention rate: {retention_rate}%")
        
        return {
            "retention_rate": retention_rate,
            "churn_requests": churn_requests,
            "churn_amount": churn_amount,
            "early_redemption_requests": early_redemption_requests,
            "early_redemption_amount": early_redemption_amount,
            "retained_investors": retained_investors,
            "churned_investors": churned_investors,
            "total_investors_who_invested": investors_who_ever_invested
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error calculating satisfaction metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
