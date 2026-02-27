"""
Reports API Routes
Provides all report data calculated on backend
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

router = APIRouter(prefix="/reports", tags=["reports"])
logger = logging.getLogger(__name__)


@router.get("/statistics")
async def get_report_statistics(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get report statistics for summary cards
    PERMISSION REQUIRED: view_reports
    Returns:
    - reports_generated_this_month
    - reports_generated_lifetime
    - last_generated_date
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_report_statistics", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Check if report_logs table exists
        check_table_query = """
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'report_logs'
        """
        table_exists = db.execute_query(check_table_query)
        use_report_logs = table_exists and table_exists[0]['count'] > 0
        
        if use_report_logs:
            # Use report_logs table (preferred)
            logger.info("📊 Using report_logs table for statistics")
            
            # Get reports generated this month
            first_day_of_month = date.today().replace(day=1)
            
            reports_month_query = """
            SELECT COUNT(*) as count
            FROM report_logs
            WHERE DATE(generated_at) >= %s
            AND status = 'success'
            """
            reports_result = db.execute_query(reports_month_query, (first_day_of_month,))
            reports_generated = reports_result[0]['count'] if reports_result else 0
            
            # Get total reports generated lifetime
            lifetime_query = """
            SELECT COUNT(*) as count
            FROM report_logs
            WHERE status = 'success'
            """
            lifetime_result = db.execute_query(lifetime_query)
            reports_lifetime = lifetime_result[0]['count'] if lifetime_result else 0
            
            # Get last generated date
            last_generated_query = """
            SELECT MAX(generated_at) as last_date
            FROM report_logs
            WHERE status = 'success'
            """
            last_result = db.execute_query(last_generated_query)
            last_generated = last_result[0]['last_date'] if last_result and last_result[0]['last_date'] else None
            
        else:
            # Fallback to audit_logs table
            logger.info("📊 Using audit_logs table for statistics (report_logs table not found)")
            
            # Get reports generated this month from audit logs
            first_day_of_month = date.today().replace(day=1)
            
            reports_query = """
            SELECT COUNT(*) as count
            FROM audit_logs
            WHERE action IN ('Generated Report', 'Downloaded Report')
            AND DATE(timestamp) >= %s
            """
            reports_result = db.execute_query(reports_query, (first_day_of_month,))
            reports_generated = reports_result[0]['count'] if reports_result else 0
            
            # Get total reports generated lifetime from audit logs
            lifetime_query = """
            SELECT COUNT(*) as count
            FROM audit_logs
            WHERE action IN ('Generated Report', 'Downloaded Report')
            """
            lifetime_result = db.execute_query(lifetime_query)
            reports_lifetime = lifetime_result[0]['count'] if lifetime_result else 0
            
            # Get last generated date
            last_generated_query = """
            SELECT MAX(timestamp) as last_date
            FROM audit_logs
            WHERE action IN ('Generated Report', 'Downloaded Report')
            """
            last_result = db.execute_query(last_generated_query)
            last_generated = last_result[0]['last_date'] if last_result and last_result[0]['last_date'] else None
        
        return {
            "reports_generated_this_month": reports_generated,
            "reports_generated_lifetime": reports_lifetime,
            "last_generated_date": last_generated.strftime('%d/%m/%Y %H:%M') if last_generated else "Never",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting report statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving report statistics: {str(e)}"
        )



@router.get("/monthly-collection")
async def get_monthly_collection_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    series_id: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Monthly Collection Report data with investment details
    PERMISSION REQUIRED: view_reports
    Parameters:
    - from_date: Start date (YYYY-MM-DD format)
    - to_date: End date (YYYY-MM-DD format)
    - series_id: Optional series filter
    Returns:
    - Summary: total_funds_raised, total_investment_this_month, fulfillment_percentage
    - Investment details: investor_id, investor_name, series_id, series_name, amount, date_received
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_monthly_collection_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Default to current month if no dates provided
        if not from_date:
            from_date = date.today().replace(day=1).strftime('%Y-%m-%d')
        if not to_date:
            to_date = date.today().strftime('%Y-%m-%d')
        
        logger.info(f"📅 Report date range: {from_date} to {to_date}")
        
        # Build series filter condition
        series_filter = ""
        series_params = [from_date, to_date]
        if series_id:
            series_filter = "AND s.id = %s"
            series_params.append(series_id)
        
        # Get total funds raised (ACTUAL funds raised from investments - LIFETIME total)
        # This represents the total amount that has EVER been invested across all series
        # Includes both 'confirmed' (active) and 'cancelled' (exited) investments
        funds_raised_query = f"""
        SELECT 
            COALESCE(SUM(i.amount), 0) as total_funds_raised
        FROM investments i
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE i.status IN ('confirmed', 'cancelled')
        AND s.is_active = 1
        {series_filter.replace('s.id', 'i.series_id') if series_filter else ''}
        """
        
        # Adjust params if series filter exists
        if series_id:
            funds_raised_params = [series_id]
        else:
            funds_raised_params = []
        
        funds_raised_result = db.execute_query(funds_raised_query, funds_raised_params)
        total_funds_raised = float(funds_raised_result[0]['total_funds_raised']) if funds_raised_result else 0.0
        
        # Get total investment in the date range (includes both active and exited investments)
        # This shows the ACTUAL investment that happened in this period
        investment_params = [from_date, to_date]
        investment_filter = ""
        if series_id:
            investment_filter = "AND i.series_id = %s"
            investment_params.append(series_id)
        
        investment_query = f"""
        SELECT 
            COALESCE(SUM(i.amount), 0) as total_investment
        FROM investments i
        WHERE i.status IN ('confirmed', 'cancelled')
        AND i.date_received BETWEEN %s AND %s
        {investment_filter}
        """
        investment_result = db.execute_query(investment_query, investment_params)
        total_investment = float(investment_result[0]['total_investment']) if investment_result else 0.0
        
        logger.info(f"💰 Total investment in period: {total_investment}")
        
        # Calculate fulfillment percentage (investment this month / total funds raised)
        fulfillment_percentage = 0.0
        if total_funds_raised > 0:
            fulfillment_percentage = (total_investment / total_funds_raised) * 100
        
        # Get investment details for the period
        details_params = [from_date, to_date]
        details_filter = ""
        if series_id:
            details_filter = "AND i.series_id = %s"
            details_params.append(series_id)
        
        investment_details_query = f"""
        SELECT 
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            s.id as series_id,
            s.name as series_name,
            s.series_code,
            i.amount,
            i.date_received,
            i.date_transferred,
            i.created_at,
            i.status
        FROM investments i
        INNER JOIN investors inv ON i.investor_id = inv.id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE i.status IN ('confirmed', 'cancelled')
        AND i.date_received BETWEEN %s AND %s
        {details_filter}
        ORDER BY i.date_received DESC, inv.full_name ASC
        """
        logger.info(f"🔍 Investment details query: {investment_details_query}")
        logger.info(f"🔍 Query params: {details_params}")
        details_result = db.execute_query(investment_details_query, details_params)
        logger.info(f"🔍 Investment details result count: {len(details_result) if details_result else 0}")
        
        investment_details = []
        for row in details_result:
            investment_details.append({
                'investor_id': row['investor_code'],
                'investor_name': row['investor_name'],
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'series_code': row['series_code'],
                'amount': float(row['amount']),
                'date_received': row['date_received'].strftime('%d/%m/%Y') if row['date_received'] else None,
                'date_transferred': row['date_transferred'].strftime('%d/%m/%Y') if row['date_transferred'] else None,
                'created_at': row['created_at'].strftime('%d/%m/%Y %H:%M') if row['created_at'] else None
            })
        
        logger.info(f"✅ Processed {len(investment_details)} investment records")
        logger.info(f"✅ Sample data: {investment_details[:2] if investment_details else 'No data'}")
        
        # Calculate series-wise breakdown
        series_breakdown_params = [from_date, to_date]
        series_breakdown_filter = ""
        if series_id:
            series_breakdown_filter = "AND i.series_id = %s"
            series_breakdown_params.append(series_id)
        
        series_breakdown_query = f"""
        SELECT 
            s.id as series_id,
            s.name as series_name,
            s.series_code,
            s.target_amount,
            COALESCE(SUM(i.amount), 0) as collected_amount,
            COUNT(DISTINCT i.investor_id) as investor_count,
            COUNT(i.id) as transaction_count
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id 
            AND i.status IN ('confirmed', 'cancelled')
            AND i.date_received BETWEEN %s AND %s
        WHERE s.is_active = 1
        {series_breakdown_filter}
        GROUP BY s.id, s.name, s.series_code, s.target_amount
        ORDER BY collected_amount DESC
        """
        series_breakdown_result = db.execute_query(series_breakdown_query, series_breakdown_params)
        
        series_breakdown = []
        for row in series_breakdown_result:
            collected = float(row['collected_amount'])
            target = float(row['target_amount'])
            achievement_percentage = (collected / target * 100) if target > 0 else 0
            
            series_breakdown.append({
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'series_code': row['series_code'],
                'target_amount': target,
                'collected_amount': collected,
                'achievement_percentage': round(achievement_percentage, 2),
                'investor_count': row['investor_count'],
                'transaction_count': row['transaction_count'],
                'average_investment': round(collected / row['investor_count'], 2) if row['investor_count'] > 0 else 0
            })
        
        logger.info(f"📊 Series breakdown: {len(series_breakdown)} series")
        
        # Calculate investor statistics
        # New investors: Investors whose first investment is in this period
        new_investors_query = f"""
        SELECT COUNT(DISTINCT i.investor_id) as new_investor_count
        FROM investments i
        WHERE i.status IN ('confirmed', 'cancelled')
        AND i.date_received BETWEEN %s AND %s
        AND i.investor_id IN (
            SELECT inv.id
            FROM investors inv
            INNER JOIN investments first_inv ON inv.id = first_inv.investor_id
            WHERE first_inv.status IN ('confirmed', 'cancelled')
            GROUP BY inv.id
            HAVING MIN(first_inv.date_received) BETWEEN %s AND %s
        )
        {details_filter}
        """
        new_investors_params = [from_date, to_date, from_date, to_date]
        if series_id:
            new_investors_params.append(series_id)
        
        new_investors_result = db.execute_query(new_investors_query, new_investors_params)
        new_investor_count = new_investors_result[0]['new_investor_count'] if new_investors_result else 0
        
        # Returning investors: Investors who have made investments before this period and also in this period
        returning_investors_query = f"""
        SELECT COUNT(DISTINCT i.investor_id) as returning_investor_count
        FROM investments i
        WHERE i.status IN ('confirmed', 'cancelled')
        AND i.date_received BETWEEN %s AND %s
        AND i.investor_id IN (
            SELECT inv.id
            FROM investors inv
            INNER JOIN investments prev_inv ON inv.id = prev_inv.investor_id
            WHERE prev_inv.status IN ('confirmed', 'cancelled')
            AND prev_inv.date_received < %s
            GROUP BY inv.id
        )
        {details_filter}
        """
        returning_investors_params = [from_date, to_date, from_date]
        if series_id:
            returning_investors_params.append(series_id)
        
        returning_investors_result = db.execute_query(returning_investors_query, returning_investors_params)
        returning_investor_count = returning_investors_result[0]['returning_investor_count'] if returning_investors_result else 0
        
        # Calculate retention rate
        total_investors_in_period = new_investor_count + returning_investor_count
        retention_rate = 0.0
        if total_investors_in_period > 0:
            retention_rate = (returning_investor_count / total_investors_in_period) * 100
        
        logger.info(f"📊 New investors: {new_investor_count}, Returning: {returning_investor_count}, Retention: {retention_rate:.2f}%")
        
        return {
            "from_date": from_date,
            "to_date": to_date,
            "series_id": series_id,
            "summary": {
                "total_funds_raised": total_funds_raised,
                "total_investment_this_month": total_investment,
                "fulfillment_percentage": round(fulfillment_percentage, 2)
            },
            "series_breakdown": series_breakdown,
            "investor_statistics": {
                "new_investors": new_investor_count,
                "returning_investors": returning_investor_count,
                "retention_rate": round(retention_rate, 2)
            },
            "investment_details": investment_details,
            "total_records": len(investment_details),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting monthly collection report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving monthly collection report: {str(e)}"
        )



@router.get("/payout-statement")
async def get_payout_statement_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    month: Optional[str] = None,
    series_id: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Payout Statement Report data
    PERMISSION REQUIRED: view_reports
    
    Parameters:
    - from_date: Start date (YYYY-MM-DD) for date range
    - to_date: End date (YYYY-MM-DD) for date range
    - month: Month in YYYY-MM format (alternative to date range)
    - series_id: Optional series filter
    
    CRITICAL: This report CALCULATES payouts dynamically from investments table
    using the SAME logic as Interest Payout page, NOT from interest_payouts table
    
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_payout_statement_report", "view_reports")
            raise HTTPException(
                status_code=403,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Import calculation functions from payouts module
        from routes.payouts import (
            calculate_monthly_interest,
            calculate_first_month_interest,
            calculate_exit_interest,
            calculate_maturity_interest,
            is_first_payout,
            is_final_payout_after_exit,
            is_last_payout_before_maturity,
            should_skip_payout,
            get_last_payout_date,
            generate_payout_month
        )
        
        # Determine date range
        if month:
            # Month format: YYYY-MM
            year, month_num = month.split('-')
            from_date = f"{year}-{month_num}-01"
            # Get last day of month
            import calendar
            last_day = calendar.monthrange(int(year), int(month_num))[1]
            to_date = f"{year}-{month_num}-{last_day}"
        elif not from_date or not to_date:
            # Default to current month
            today = date.today()
            from_date = f"{today.year}-{today.month:02d}-01"
            import calendar
            last_day = calendar.monthrange(today.year, today.month)[1]
            to_date = f"{today.year}-{today.month:02d}-{last_day}"
        
        logger.info(f"📊 Payout Statement: from_date={from_date}, to_date={to_date}, series_id={series_id}")
        
        # Parse date range
        from_date_obj = datetime.strptime(from_date, '%Y-%m-%d').date()
        to_date_obj = datetime.strptime(to_date, '%Y-%m-%d').date()
        
        # CALCULATE payouts for the date range using SAME logic as Interest Payout page
        # Query investments that should have payouts in this period
        query = """
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            inv.email,
            inv.phone,
            inv.pan,
            inv.bank_name,
            inv.account_number,
            inv.ifsc_code,
            i.id as investment_id,
            i.amount as investment_amount,
            i.exit_date,
            i.status as investment_status,
            i.series_id,
            s.series_code,
            s.name as series_name,
            s.interest_rate,
            s.interest_payment_day,
            s.series_start_date,
            s.maturity_date,
            s.lock_in_date
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        """
        
        params = []
        
        if series_id:
            query += " AND s.id = %s"
            params.append(series_id)
        
        query += " ORDER BY inv.investor_id, s.name"
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        logger.info(f"✅ Found {len(result)} investment records for payout calculation")
        
        # Get existing payout records from interest_payouts table to check payment status
        # This tells us which calculated payouts have actually been paid
        existing_payouts_query = """
        SELECT 
            investor_id,
            series_id,
            payout_month,
            status,
            paid_date,
            amount
        FROM interest_payouts
        WHERE is_active = 1
        """
        
        existing_payouts_result = db.execute_query(existing_payouts_query)
        
        # Create a lookup dictionary for existing payouts
        # Key: (investor_id, series_id, payout_month)
        existing_payouts_lookup = {}
        for payout in existing_payouts_result:
            key = (payout['investor_id'], payout['series_id'], payout['payout_month'])
            existing_payouts_lookup[key] = {
                'status': payout['status'],
                'paid_date': payout['paid_date'],
                'amount': float(payout['amount'])
            }
        
        logger.info(f"✅ Found {len(existing_payouts_lookup)} existing payout records in database")
        
        # Calculate payouts for each month in the date range
        payout_details = []
        total_payout = 0.0
        paid_amount = 0.0
        to_be_paid_amount = 0.0
        paid_count = 0
        pending_count = 0
        
        # Iterate through each month in the date range
        current_month_date = from_date_obj.replace(day=1)
        while current_month_date <= to_date_obj:
            interest_year = current_month_date.year
            interest_month = current_month_date.month
            
            logger.info(f"📅 Calculating payouts for {interest_year}-{interest_month:02d}")
            
            # Calculate payouts for this month
            for row in result:
                # Get series start date
                series_start_date = row['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        series_start_date = None
                
                # Skip if series hasn't started yet by the end of this month
                # We need to check against the last day of the current month
                import calendar
                last_day_of_month = calendar.monthrange(current_month_date.year, current_month_date.month)[1]
                end_of_month = date(current_month_date.year, current_month_date.month, last_day_of_month)
                
                if series_start_date and series_start_date > end_of_month:
                    logger.info(f"  Skipping {row['investor_code']} - Series hasn't started yet (starts {series_start_date}, month ends {end_of_month})")
                    continue
                
                # Get maturity date
                maturity_date = row['maturity_date']
                if isinstance(maturity_date, str):
                    try:
                        maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                    except:
                        maturity_date = None
                
                # Get exit date
                exit_date = row['exit_date']
                if isinstance(exit_date, str):
                    try:
                        exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                    except:
                        exit_date = None
                
                # Generate payout date
                import calendar
                payment_day = row['interest_payment_day'] or 15
                max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                actual_payment_day = min(payment_day, max_day_in_month)
                
                payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                
                # Get last payout date
                last_payout_date = get_last_payout_date(
                    series_start_date if series_start_date else payout_date_obj,
                    row['interest_payment_day'] or 15,
                    payout_date_obj
                )
                
                # Check if we should skip this payout
                if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                    continue
                
                # Calculate interest amount using SAME logic as Interest Payout page
                if series_start_date and is_first_payout(series_start_date, interest_month, interest_year):
                    monthly_interest = calculate_first_month_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        series_start_date,
                        interest_month,
                        interest_year
                    )
                elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                    monthly_interest = calculate_exit_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        exit_date,
                        interest_month,
                        interest_year
                    )
                elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                    monthly_interest = calculate_maturity_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        maturity_date,
                        interest_month,
                        interest_year
                    )
                else:
                    monthly_interest = calculate_monthly_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate'])
                    )
                
                # Generate payout month string BEFORE using it
                payout_month = generate_payout_month(interest_year, interest_month)
                
                # Determine status by checking if this payout exists in interest_payouts table
                # Key: (investor_id, series_id, payout_month)
                payout_key = (row['investor_id'], row['series_id'], payout_month)
                
                if payout_key in existing_payouts_lookup:
                    # Payout exists in database - use its status
                    existing_payout = existing_payouts_lookup[payout_key]
                    payout_status = existing_payout['status']
                    paid_date_value = existing_payout['paid_date']
                else:
                    # Payout doesn't exist in database - it's scheduled
                    payout_status = 'Scheduled'
                    paid_date_value = None
                
                # Format payout date for display
                payout_date_str = payout_date_obj.strftime('%d-%b-%Y')
                
                # Format paid date if exists
                paid_date_str = None
                if paid_date_value:
                    if isinstance(paid_date_value, str):
                        paid_date_str = paid_date_value
                    else:
                        paid_date_str = paid_date_value.strftime('%d-%b-%Y')
                
                # Add to details
                payout_details.append({
                    'id': len(payout_details) + 1,
                    'investor_id': row['investor_code'],
                    'investor_name': row['investor_name'],
                    'investor_email': row.get('email'),
                    'investor_phone': row.get('phone'),
                    'investor_pan': row.get('pan'),
                    'series_code': row['series_code'],
                    'series_name': row['series_name'],
                    'amount': monthly_interest,
                    'status': payout_status,
                    'payout_date': payout_date_str,
                    'paid_date': paid_date_str,
                    'bank_name': row.get('bank_name'),
                    'account_number': row.get('account_number'),
                    'ifsc_code': row.get('ifsc_code'),
                    'payout_month': payout_month
                })
                
                # Update totals based on status
                total_payout += monthly_interest
                if payout_status == 'Paid':
                    paid_amount += monthly_interest
                    paid_count += 1
                else:
                    to_be_paid_amount += monthly_interest
                    pending_count += 1
            
            # Move to next month
            if current_month_date.month == 12:
                current_month_date = current_month_date.replace(year=current_month_date.year + 1, month=1)
            else:
                current_month_date = current_month_date.replace(month=current_month_date.month + 1)
        
        logger.info(f"✅ Calculated {len(payout_details)} payouts, Total: ₹{total_payout:,.2f}")
        
        # Summary data
        summary_data = {
            'total_payout': total_payout,
            'paid_amount': paid_amount,
            'to_be_paid_amount': to_be_paid_amount,
            'total_records': len(payout_details),
            'paid_count': paid_count,
            'pending_count': pending_count
        }
        
        # Query 3: Get series breakdown from calculated payouts
        series_breakdown_dict = {}
        for payout in payout_details:
            series_code = payout['series_code']
            series_name = payout['series_name']
            
            if series_code not in series_breakdown_dict:
                series_breakdown_dict[series_code] = {
                    'series_code': series_code,
                    'series_name': series_name,
                    'total_payout': 0.0,
                    'paid_amount': 0.0,
                    'pending_amount': 0.0,
                    'investor_count': set()
                }
            
            series_breakdown_dict[series_code]['total_payout'] += payout['amount']
            if payout['status'] == 'Paid':
                series_breakdown_dict[series_code]['paid_amount'] += payout['amount']
            else:
                series_breakdown_dict[series_code]['pending_amount'] += payout['amount']
            series_breakdown_dict[series_code]['investor_count'].add(payout['investor_id'])
        
        series_breakdown = []
        for series_code, data in series_breakdown_dict.items():
            series_breakdown.append({
                'series_code': data['series_code'],
                'series_name': data['series_name'],
                'total_payout': data['total_payout'],
                'paid_amount': data['paid_amount'],
                'pending_amount': data['pending_amount'],
                'investor_count': len(data['investor_count'])
            })
        
        # Sort by total payout descending
        series_breakdown.sort(key=lambda x: x['total_payout'], reverse=True)
        
        # Query 4: Get status breakdown from calculated payouts
        status_breakdown_dict = {}
        for payout in payout_details:
            payout_status_value = payout['status']
            if payout_status_value not in status_breakdown_dict:
                status_breakdown_dict[payout_status_value] = {
                    'count': 0,
                    'total_amount': 0.0
                }
            status_breakdown_dict[payout_status_value]['count'] += 1
            status_breakdown_dict[payout_status_value]['total_amount'] += payout['amount']
        
        status_breakdown = []
        for payout_status_value, data in status_breakdown_dict.items():
            status_breakdown.append({
                'status': payout_status_value,
                'count': data['count'],
                'total_amount': data['total_amount']
            })
        
        # Query 5: Get monthly trend from calculated payouts
        monthly_trend_dict = {}
        for payout in payout_details:
            month = payout['payout_month']
            if month not in monthly_trend_dict:
                monthly_trend_dict[month] = {
                    'total_amount': 0.0,
                    'paid_amount': 0.0,
                    'payout_count': 0
                }
            monthly_trend_dict[month]['total_amount'] += payout['amount']
            if payout['status'] == 'Paid':
                monthly_trend_dict[month]['paid_amount'] += payout['amount']
            monthly_trend_dict[month]['payout_count'] += 1
        
        monthly_trend = []
        for month, data in sorted(monthly_trend_dict.items()):
            monthly_trend.append({
                'month': month,
                'total_amount': data['total_amount'],
                'paid_amount': data['paid_amount'],
                'payout_count': data['payout_count']
            })
        
        logger.info(f"✅ Payout statement fetched: {len(payout_details)} records, {len(series_breakdown)} series, {len(status_breakdown)} statuses")
        
        # CRITICAL: Calculate total_payout as sum of paid_amount + to_be_paid_amount
        paid_amount = float(summary_data.get('paid_amount', 0))
        to_be_paid_amount = float(summary_data.get('to_be_paid_amount', 0))
        total_payout = paid_amount + to_be_paid_amount
        
        logger.info(f"📊 Summary Calculation:")
        logger.info(f"   - Paid Amount: ₹{paid_amount:,.2f}")
        logger.info(f"   - To Be Paid Amount: ₹{to_be_paid_amount:,.2f}")
        logger.info(f"   - Total Payout (Paid + To Be Paid): ₹{total_payout:,.2f}")
        
        return {
            "from_date": from_date,
            "to_date": to_date,
            "series_id": series_id,
            "summary": {
                "total_payout": total_payout,  # FIXED: Sum of paid + to_be_paid
                "paid_amount": paid_amount,  # FIXED: Only paid amounts in filtered period
                "to_be_paid_amount": to_be_paid_amount,  # Pending amounts in filtered period
                "total_records": summary_data.get('total_records', 0),
                "paid_count": summary_data.get('paid_count', 0),
                "pending_count": summary_data.get('pending_count', 0)
            },
            "series_breakdown": series_breakdown,
            "status_breakdown": status_breakdown,
            "monthly_trend": monthly_trend,
            "payout_details": payout_details,
            "total_records": len(payout_details),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting payout statement report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving payout statement report: {str(e)}"
        )




@router.get("/series-performance")
async def get_series_performance_report(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Series Performance Report data
    PERMISSION REQUIRED: view_reports
    
    Returns comprehensive series performance data:
    - Summary metrics (total series, active series, total investments, total investors)
    - Series comparison table (all series with key metrics)
    - Detailed per-series breakdown with graphs
    
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_series_performance_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Query 1: Get summary metrics (LIFETIME totals - includes both active and exited investments)
        summary_query = """
        SELECT 
            COUNT(DISTINCT s.id) as total_series,
            COUNT(DISTINCT CASE 
                WHEN s.status IN ('accepting', 'active') THEN s.id 
            END) as active_series,
            COALESCE(SUM(i.amount), 0) as total_investment_amount,
            COUNT(DISTINCT i.investor_id) as total_investors
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status IN ('confirmed', 'cancelled')
        WHERE s.is_active = 1
        """
        summary_result = db.execute_query(summary_query)
        summary_data = summary_result[0] if summary_result else {}
        
        # DEBUG: Check ALL series in database (before filtering)
        debug_query = "SELECT id, series_code, name, status, is_active, subscription_start_date, subscription_end_date, maturity_date FROM ncd_series"
        debug_result = db.execute_query(debug_query)
        logger.info(f"🔍 ALL SERIES IN DATABASE ({len(debug_result)} total):")
        for row in debug_result:
            logger.info(f"  - {row['series_code']}: status={row['status']}, is_active={row['is_active']}, sub_start={row['subscription_start_date']}, sub_end={row['subscription_end_date']}, maturity={row['maturity_date']}")
        
        # DEBUG: Log summary data
        logger.info(f"📊 Summary Data: {summary_data}")
        logger.info(f"📊 Total Series: {summary_data.get('total_series', 0)}")
        logger.info(f"📊 Active Series: {summary_data.get('active_series', 0)}")
        logger.info(f"📊 Total Investment Amount: ₹{summary_data.get('total_investment_amount', 0)}")
        logger.info(f"📊 Total Investors: {summary_data.get('total_investors', 0)}")
        
        # Query 2: Get all series with comprehensive metrics (LIFETIME totals)
        # CRITICAL: Use backend status directly - it's already calculated correctly
        series_query = """
        SELECT 
            s.id,
            s.name,
            s.series_code,
            s.target_amount,
            s.interest_rate,
            s.interest_frequency,
            s.issue_date,
            s.maturity_date,
            s.status,
            s.is_active,
            s.subscription_start_date,
            s.subscription_end_date,
            s.series_start_date,
            COALESCE(SUM(i.amount), 0) as funds_raised,
            COUNT(DISTINCT i.id) as total_investments,
            COUNT(DISTINCT i.investor_id) as total_investors,
            COUNT(DISTINCT CASE 
                WHEN i.investor_id IN (
                    SELECT investor_id 
                    FROM investments 
                    WHERE series_id != s.id AND status IN ('confirmed', 'cancelled')
                ) THEN i.investor_id 
            END) as repeated_investors
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id AND i.status IN ('confirmed', 'cancelled')
        WHERE s.is_active = 1
        GROUP BY s.id, s.name, s.series_code, s.target_amount, s.interest_rate, 
                 s.interest_frequency, s.issue_date, s.maturity_date, s.status,
                 s.subscription_start_date, s.subscription_end_date, s.series_start_date, s.is_active
        """
        series_result = db.execute_query(series_query)
        
        # DEBUG: Log series result
        logger.info(f"📊 Series Query returned {len(series_result)} series")
        for row in series_result:
            logger.info(f"📊 Series: {row['series_code']} - Status: {row['status']} - Investments: {row['total_investments']}")
        
        # Define status priority for sorting (same order as frontend)
        status_priority = {
            'accepting': 1,
            'active': 2,
            'upcoming': 3,
            'DRAFT': 4,
            'REJECTED': 5,
            'matured': 6
        }
        
        series_list = []
        for row in series_result:
            funds_raised = float(row['funds_raised'])
            target_amount = float(row['target_amount'])
            total_investors = row['total_investors']
            
            # Use the status from database - it's already calculated correctly by backend
            series_status = row['status']
            
            # Calculate subscription ratio
            subscription_ratio = (funds_raised / target_amount * 100) if target_amount > 0 else 0
            
            # Calculate average ticket size
            avg_ticket_size = (funds_raised / total_investors) if total_investors > 0 else 0
            
            # Calculate repeated investor percentage
            repeated_percentage = (row['repeated_investors'] / total_investors * 100) if total_investors > 0 else 0
            
            # Format status for display
            status_display = {
                'DRAFT': 'Draft',
                'REJECTED': 'Rejected',
                'upcoming': 'Releasing Soon',
                'accepting': 'Accepting Investments',
                'active': 'Active',
                'matured': 'Matured'
            }.get(series_status, series_status)
            
            series_list.append({
                'id': row['id'],
                'name': row['name'],
                'series_code': row['series_code'],
                'target_amount': target_amount,
                'funds_raised': funds_raised,
                'remaining_target': target_amount - funds_raised,
                'subscription_ratio': round(subscription_ratio, 2),
                'total_investments': row['total_investments'],
                'total_investors': total_investors,
                'repeated_investors': row['repeated_investors'],
                'repeated_investor_percentage': round(repeated_percentage, 2),
                'new_investors': total_investors - row['repeated_investors'],
                'avg_ticket_size': round(avg_ticket_size, 2),
                'interest_rate': float(row['interest_rate']),
                'interest_frequency': row['interest_frequency'],
                'issue_date': row['issue_date'].strftime('%d/%m/%Y') if row['issue_date'] else None,
                'maturity_date': row['maturity_date'].strftime('%d/%m/%Y') if row['maturity_date'] else None,
                'status': series_status,  # Use backend status
                'status_display': status_display
            })
        
        # Query 3: Get detailed per-series data with monthly trends
        detailed_series_data = []
        
        for series in series_list:
            series_id = series['id']
            
            # Get monthly investment trend for this series (LIFETIME - includes exited)
            monthly_trend_query = """
            SELECT 
                DATE_FORMAT(i.date_received, '%Y-%m') as month,
                COUNT(*) as investment_count,
                COALESCE(SUM(i.amount), 0) as total_amount,
                COUNT(DISTINCT i.investor_id) as investor_count
            FROM investments i
            WHERE i.series_id = %s AND i.status IN ('confirmed', 'cancelled')
            GROUP BY DATE_FORMAT(i.date_received, '%Y-%m')
            ORDER BY month
            """
            monthly_result = db.execute_query(monthly_trend_query, (series_id,))
            
            monthly_trend = []
            for row in monthly_result:
                monthly_trend.append({
                    'month': row['month'],
                    'investment_count': row['investment_count'],
                    'total_amount': float(row['total_amount']),
                    'investor_count': row['investor_count']
                })
            
            # Get payout statistics for this series
            # CRITICAL: Calculate ACTUAL payouts from series start till current date
            # Then check payment status from interest_payouts table
            # This ensures we show REAL calculated amounts, not just manually imported data
            
            # Import calculation functions
            from routes.payouts import (
                calculate_monthly_interest,
                calculate_first_month_interest,
                calculate_exit_interest,
                calculate_maturity_interest,
                is_first_payout,
                is_final_payout_after_exit,
                is_last_payout_before_maturity,
                should_skip_payout,
                get_last_payout_date,
                generate_payout_month
            )
            
            # Get all investments for this series (active and exited)
            investments_query = """
            SELECT 
                inv.id as investor_id,
                i.amount as investment_amount,
                i.exit_date,
                i.status as investment_status,
                s.series_start_date,
                s.maturity_date,
                s.interest_rate,
                s.interest_payment_day
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            INNER JOIN ncd_series s ON i.series_id = s.id
            WHERE i.series_id = %s 
            AND i.status IN ('confirmed', 'cancelled')
            AND s.series_start_date IS NOT NULL
            """
            investments_result = db.execute_query(investments_query, (series_id,))
            
            # Get existing payouts from interest_payouts table for status checking
            existing_payouts_query = """
            SELECT investor_id, series_id, payout_month, status, amount
            FROM interest_payouts
            WHERE series_id = %s AND is_active = 1
            """
            existing_payouts_result = db.execute_query(existing_payouts_query, (series_id,))
            existing_payouts_lookup = {}
            for payout in existing_payouts_result:
                key = (payout['investor_id'], payout['series_id'], payout['payout_month'])
                existing_payouts_lookup[key] = {
                    'status': payout['status'],
                    'amount': float(payout['amount'])
                }
            
            # Calculate payouts from series start till current month
            current_date = datetime.now()
            total_payout_amount = 0.0
            total_payouts = 0
            paid_amount = 0.0
            paid_count = 0
            pending_amount = 0.0
            pending_count = 0
            
            # Get series start date from first investment
            if investments_result and len(investments_result) > 0:
                series_start_date = investments_result[0]['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        series_start_date = None
                
                if series_start_date and series_start_date <= current_date.date():
                    # Calculate from series start month to current month
                    start_month_date = series_start_date.replace(day=1)
                    current_month_date = current_date.date().replace(day=1)
                    
                    # Iterate through each month from start to current
                    month_date = start_month_date
                    while month_date <= current_month_date:
                        interest_year = month_date.year
                        interest_month = month_date.month
                        
                        # Calculate payouts for this month
                        for inv_row in investments_result:
                            # Parse dates
                            inv_series_start = inv_row['series_start_date']
                            if isinstance(inv_series_start, str):
                                try:
                                    inv_series_start = datetime.strptime(inv_series_start, '%Y-%m-%d').date()
                                except:
                                    inv_series_start = None
                            
                            maturity_date = inv_row['maturity_date']
                            if isinstance(maturity_date, str):
                                try:
                                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                                except:
                                    maturity_date = None
                            
                            exit_date = inv_row['exit_date']
                            if isinstance(exit_date, str):
                                try:
                                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                                except:
                                    exit_date = None
                            
                            # Generate payout date
                            import calendar
                            payment_day = inv_row['interest_payment_day'] or 15
                            max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                            actual_payment_day = min(payment_day, max_day_in_month)
                            payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                            
                            # Get last payout date
                            last_payout_date = get_last_payout_date(
                                inv_series_start if inv_series_start else payout_date_obj,
                                inv_row['interest_payment_day'] or 15,
                                payout_date_obj
                            )
                            
                            # Check if we should skip this payout
                            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                                continue
                            
                            # Calculate interest amount
                            if inv_series_start and is_first_payout(inv_series_start, interest_month, interest_year):
                                monthly_interest = calculate_first_month_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    inv_series_start,
                                    interest_month,
                                    interest_year
                                )
                            elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                                monthly_interest = calculate_exit_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    exit_date,
                                    interest_month,
                                    interest_year
                                )
                            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                                monthly_interest = calculate_maturity_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    maturity_date,
                                    interest_month,
                                    interest_year
                                )
                            else:
                                monthly_interest = calculate_monthly_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate'])
                                )
                            
                            # Generate payout month
                            payout_month = generate_payout_month(interest_year, interest_month)
                            
                            # Check status from interest_payouts table
                            payout_key = (inv_row['investor_id'], series_id, payout_month)
                            if payout_key in existing_payouts_lookup:
                                payout_status = existing_payouts_lookup[payout_key]['status']
                            else:
                                # If not in table, consider it Scheduled (not yet paid)
                                payout_status = 'Scheduled'
                            
                            # Update totals - count ALL calculated payouts
                            total_payout_amount += monthly_interest
                            total_payouts += 1
                            
                            # But separate by status
                            if payout_status == 'Paid':
                                paid_amount += monthly_interest
                                paid_count += 1
                            else:
                                pending_amount += monthly_interest
                                pending_count += 1
                        
                        # Move to next month
                        if month_date.month == 12:
                            month_date = month_date.replace(year=month_date.year + 1, month=1)
                        else:
                            month_date = month_date.replace(month=month_date.month + 1)
            
            # Create payout stats dictionary
            # CRITICAL: total_payout_amount = ONLY Paid amounts (what user wants to see)
            payout_stats = {
                'total_payouts': paid_count,  # Count of PAID payouts
                'total_payout_amount': paid_amount,  # Sum of PAID amounts (how much payout happened till date)
                'paid_count': paid_count,
                'paid_amount': paid_amount,
                'pending_count': pending_count,
                'pending_amount': pending_amount
            }
            
            # Get investor details for this series (grouped by investor - one row per investor)
            # INCLUDES both active and exited investors for LIFETIME history
            investor_details_query = """
            SELECT 
                inv.investor_id,
                inv.full_name as investor_name,
                inv.email,
                inv.phone,
                inv.pan,
                SUM(i.amount) as investment_amount,
                MIN(i.date_received) as date_received,
                MIN(i.date_transferred) as date_transferred,
                MAX(CASE WHEN i.status = 'cancelled' THEN 'exited' ELSE 'confirmed' END) as investment_status
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            WHERE i.series_id = %s AND i.status IN ('confirmed', 'cancelled')
            GROUP BY inv.investor_id, inv.full_name, inv.email, inv.phone, inv.pan
            ORDER BY investment_amount DESC
            """
            investor_details_result = db.execute_query(investor_details_query, (series_id,))
            
            logger.info(f"📊 Series {series['series_code']}: Found {len(investor_details_result)} investors (including exited)")
            
            investor_details = []
            for row in investor_details_result:
                investor_details.append({
                    'investor_id': row['investor_id'],
                    'investor_name': row['investor_name'],
                    'email': row['email'],
                    'phone': row['phone'],
                    'pan': row['pan'],
                    'investment_amount': float(row['investment_amount']),
                    'date_received': row['date_received'].strftime('%d/%m/%Y') if row['date_received'] else None,
                    'date_transferred': row['date_transferred'].strftime('%d/%m/%Y') if row['date_transferred'] else None,
                    'investment_status': row['investment_status']
                })
            
            # Get investor distribution (ticket size distribution) - LIFETIME
            distribution_query = """
            SELECT 
                CASE 
                    WHEN i.amount < 100000 THEN 'Small (<1L)'
                    WHEN i.amount >= 100000 AND i.amount < 500000 THEN 'Medium (1L-5L)'
                    WHEN i.amount >= 500000 AND i.amount < 1000000 THEN 'Large (5L-10L)'
                    ELSE 'Very Large (>10L)'
                END as ticket_category,
                COUNT(*) as count,
                COALESCE(SUM(i.amount), 0) as total_amount
            FROM investments i
            WHERE i.series_id = %s AND i.status IN ('confirmed', 'cancelled')
            GROUP BY ticket_category
            ORDER BY MIN(i.amount)
            """
            distribution_result = db.execute_query(distribution_query, (series_id,))
            
            ticket_distribution = []
            for row in distribution_result:
                ticket_distribution.append({
                    'category': row['ticket_category'],
                    'count': row['count'],
                    'total_amount': float(row['total_amount'])
                })
            
            # Get compliance status for this series
            compliance_query = """
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'received' THEN 1 ELSE 0 END) as received,
                SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as submitted
            FROM series_compliance_status
            WHERE series_id = %s
            """
            compliance_result = db.execute_query(compliance_query, (series_id,))
            
            if compliance_result and compliance_result[0]['total'] > 0:
                comp_stats = compliance_result[0]
                total_requirements = 42  # Always 42 compliance items
                completed = comp_stats['received'] + comp_stats['submitted']
                pending_actions = comp_stats['pending']
            else:
                # No compliance entries yet - all pending
                total_requirements = 42
                completed = 0
                pending_actions = 42
            
            completion_percentage = round((completed / total_requirements * 100), 2) if total_requirements > 0 else 0
            
            detailed_series_data.append({
                'series_id': series_id,
                'series_code': series['series_code'],
                'series_name': series['name'],
                'monthly_trend': monthly_trend,
                'investor_details': investor_details,
                'payout_stats': {
                    'total_payouts': payout_stats.get('total_payouts', 0),
                    'total_payout_amount': float(payout_stats.get('total_payout_amount', 0)),
                    'paid_count': payout_stats.get('paid_count', 0),
                    'paid_amount': float(payout_stats.get('paid_amount', 0)),
                    'pending_count': payout_stats.get('pending_count', 0),
                    'pending_amount': float(payout_stats.get('pending_amount', 0)),
                    'payout_success_rate': round((payout_stats.get('paid_count', 0) / payout_stats.get('total_payouts', 1) * 100), 2) if payout_stats.get('total_payouts', 0) > 0 else 0
                },
                'compliance_stats': {
                    'total_requirements': total_requirements,
                    'completed': completed,
                    'pending_actions': pending_actions,
                    'completion_percentage': completion_percentage
                },
                'ticket_distribution': ticket_distribution
            })
        
        # Sort series_list by calculated status priority (accepting → active → upcoming → DRAFT → REJECTED → matured)
        series_list.sort(key=lambda x: status_priority.get(x['status'], 999))
        
        logger.info(f"✅ Series performance report generated: {len(series_list)} series")
        
        return {
            "summary": {
                "total_series": summary_data.get('total_series', 0),
                "active_series": summary_data.get('active_series', 0),
                "total_investments": float(summary_data.get('total_investment_amount', 0)),
                "total_investors": summary_data.get('total_investors', 0)
            },
            "series_comparison": series_list,
            "detailed_series_data": detailed_series_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting series performance report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series performance report: {str(e)}"
        )





@router.get("/kyc-status")
async def get_kyc_status_report(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get KYC Status Report data
    PERMISSION REQUIRED: view_reports
    
    Returns:
    - Summary: total_investors, pending_kyc, completed_kyc
    - Banking Details: investor_id, investor_name, bank_name, account_number, ifsc_code
    - KYC Details: investor_id, investor_name, pan, aadhaar, kyc_status, yet_to_submit_documents
    - Personal Details: investor_id, investor_name, email, phone, dob, source_of_funds
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_kyc_status_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        logger.info("📊 Fetching KYC Status Report...")
        
        # Query 1: Get summary metrics
        summary_query = """
        SELECT 
            COUNT(*) as total_investors,
            SUM(CASE WHEN kyc_status = 'Pending' THEN 1 ELSE 0 END) as pending_kyc,
            SUM(CASE WHEN kyc_status = 'Completed' THEN 1 ELSE 0 END) as completed_kyc
        FROM investors
        WHERE is_active = 1
        """
        summary_result = db.execute_query(summary_query)
        summary_data = summary_result[0] if summary_result else {}
        
        total_investors = summary_data.get('total_investors', 0)
        pending_kyc = summary_data.get('pending_kyc', 0)
        completed_kyc = summary_data.get('completed_kyc', 0)
        
        logger.info(f"📊 Summary: Total={total_investors}, Pending={pending_kyc}, Completed={completed_kyc}")
        
        # Query 2: Get banking details for all investors
        banking_query = """
        SELECT 
            investor_id,
            full_name as investor_name,
            bank_name,
            account_number,
            ifsc_code
        FROM investors
        WHERE is_active = 1
        ORDER BY full_name ASC
        """
        banking_result = db.execute_query(banking_query)
        
        banking_details = []
        for row in banking_result:
            banking_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'bank_name': row['bank_name'] or 'Not Provided',
                'account_number': row['account_number'] or 'Not Provided',
                'ifsc_code': row['ifsc_code'] or 'Not Provided'
            })
        
        logger.info(f"📊 Banking Details: {len(banking_details)} records")
        
        # Query 3: Get KYC details for all investors with document upload status
        kyc_query = """
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            i.pan,
            i.aadhaar,
            i.kyc_status,
            GROUP_CONCAT(DISTINCT d.document_type) as uploaded_documents
        FROM investors i
        LEFT JOIN investor_documents d ON i.id = d.investor_id
        WHERE i.is_active = 1
        GROUP BY i.id, i.investor_id, i.full_name, i.pan, i.aadhaar, i.kyc_status
        ORDER BY i.full_name ASC
        """
        kyc_result = db.execute_query(kyc_query)
        
        kyc_details = []
        for row in kyc_result:
            # Get list of uploaded documents
            uploaded_docs = row['uploaded_documents'].split(',') if row['uploaded_documents'] else []
            
            logger.info(f"📊 Investor {row['investor_id']}: uploaded_docs = {uploaded_docs}")
            
            # Determine which documents are yet to be submitted
            yet_to_submit = []
            
            # Check for PAN document
            if 'pan_document' not in uploaded_docs:
                yet_to_submit.append('PAN Document')
            
            # Check for Aadhaar document
            if 'aadhaar_document' not in uploaded_docs:
                yet_to_submit.append('Aadhaar Document')
            
            # Check for Cancelled Cheque
            if 'cancelled_cheque' not in uploaded_docs:
                yet_to_submit.append('Cancelled Cheque')
            
            kyc_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'pan': row['pan'] or 'Not Provided',
                'aadhaar': row['aadhaar'] or 'Not Provided',
                'kyc_status': row['kyc_status'] or 'Pending',
                'yet_to_submit_documents': ', '.join(yet_to_submit) if yet_to_submit else 'All Submitted'
            })
        
        logger.info(f"📊 KYC Details: {len(kyc_details)} records")
        
        # Query 4: Get personal details for all investors
        personal_query = """
        SELECT 
            investor_id,
            full_name as investor_name,
            email,
            phone,
            dob,
            source_of_funds
        FROM investors
        WHERE is_active = 1
        ORDER BY full_name ASC
        """
        personal_result = db.execute_query(personal_query)
        
        personal_details = []
        for row in personal_result:
            personal_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'email': row['email'] or 'Not Provided',
                'phone': row['phone'] or 'Not Provided',
                'dob': row['dob'].strftime('%d/%m/%Y') if row['dob'] else 'Not Provided',
                'source_of_funds': row['source_of_funds'] or 'Not Provided'
            })
        
        logger.info(f"📊 Personal Details: {len(personal_details)} records")
        
        return {
            "summary": {
                "total_investors": total_investors,
                "pending_kyc": pending_kyc,
                "completed_kyc": completed_kyc
            },
            "banking_details": banking_details,
            "kyc_details": kyc_details,
            "personal_details": personal_details,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting KYC status report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving KYC status report: {str(e)}"
        )



@router.get("/new-investors")
async def get_new_investors_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    investor_id: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get New Investor Report data
    PERMISSION REQUIRED: view_reports
    
    Parameters:
    - from_date: Start date (YYYY-MM-DD) - filters by investor created_at date
    - to_date: End date (YYYY-MM-DD) - filters by investor created_at date
    - investor_id: Optional investor ID filter (e.g., INV001)
    
    Returns:
    - Investment Details: investor_id, investor_name, series_invested, total_invested, total_payouts
    - Banking Details: investor_id, investor_name, bank_name, account_number, ifsc_code
    - KYC Details: investor_id, investor_name, pan, aadhaar, kyc_status, yet_to_submit_documents
    - Personal Details: investor_id, investor_name, email, phone, dob, source_of_funds
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_new_investors_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Default to last 30 days if no dates provided
        if not from_date:
            from_date = (date.today() - timedelta(days=30)).strftime('%Y-%m-%d')
        if not to_date:
            to_date = date.today().strftime('%Y-%m-%d')
        
        logger.info(f"📊 New Investor Report: from_date={from_date}, to_date={to_date}, investor_id={investor_id}")
        
        # Build WHERE clause for filtering
        where_conditions = ["i.is_active = 1"]
        query_params = []
        
        # Add date filter - filter by investor created_at date
        where_conditions.append("DATE(i.created_at) BETWEEN %s AND %s")
        query_params.extend([from_date, to_date])
        
        # Add investor ID filter if provided
        if investor_id:
            where_conditions.append("i.investor_id = %s")
            query_params.append(investor_id)
        
        where_clause = " AND ".join(where_conditions)
        
        logger.info(f"📊 WHERE clause: {where_clause}")
        logger.info(f"📊 Query params: {query_params}")
        
        # Query 1: Get investment details for new investors (LIFETIME totals)
        # CRITICAL: Calculate ACTUAL payouts dynamically, not from interest_payouts table
        
        logger.info(f"💸 Calculating payouts for new investors dynamically...")
        
        # First, get basic investment details
        investment_query = f"""
        SELECT 
            i.id as investor_db_id,
            i.investor_id,
            i.full_name as investor_name,
            GROUP_CONCAT(DISTINCT s.series_code ORDER BY s.series_code SEPARATOR ', ') as series_invested,
            COALESCE(SUM(inv.amount), 0) as total_invested
        FROM investors i
        LEFT JOIN investments inv ON i.id = inv.investor_id AND inv.status IN ('confirmed', 'cancelled')
        LEFT JOIN ncd_series s ON inv.series_id = s.id
        WHERE {where_clause}
        GROUP BY i.id, i.investor_id, i.full_name
        ORDER BY i.created_at DESC
        """
        investment_result = db.execute_query(investment_query, tuple(query_params))
        
        # Now calculate payouts for each investor
        try:
            # Import calculation functions
            from routes.payouts import (
                calculate_monthly_interest,
                calculate_first_month_interest,
                calculate_exit_interest,
                calculate_maturity_interest,
                is_first_payout,
                is_final_payout_after_exit,
                is_last_payout_before_maturity,
                should_skip_payout,
                get_last_payout_date,
                generate_payout_month
            )
            
            # Get all investments for these investors
            investor_ids = [row['investor_db_id'] for row in investment_result]
            
            if investor_ids:
                placeholders = ','.join(['%s'] * len(investor_ids))
                investments_query = f"""
                SELECT 
                    inv.id as investor_db_id,
                    i.amount as investment_amount,
                    i.exit_date,
                    i.status as investment_status,
                    i.series_id,
                    s.series_start_date,
                    s.maturity_date,
                    s.interest_rate,
                    s.interest_payment_day
                FROM investments i
                INNER JOIN investors inv ON i.investor_id = inv.id
                INNER JOIN ncd_series s ON i.series_id = s.id
                WHERE inv.id IN ({placeholders})
                AND i.status IN ('confirmed', 'cancelled')
                AND s.series_start_date IS NOT NULL
                """
                investments_data = db.execute_query(investments_query, tuple(investor_ids))
                
                # Get existing payouts for status checking
                existing_payouts_query = f"""
                SELECT investor_id, series_id, payout_month, status, amount
                FROM interest_payouts
                WHERE investor_id IN ({placeholders}) AND is_active = 1
                """
                existing_payouts_result = db.execute_query(existing_payouts_query, tuple(investor_ids))
                existing_payouts_lookup = {}
                for payout in existing_payouts_result:
                    key = (payout['investor_id'], payout['series_id'], payout['payout_month'])
                    existing_payouts_lookup[key] = {
                        'status': payout['status'],
                        'amount': float(payout['amount'])
                    }
                
                # Calculate payouts per investor
                current_date = datetime.now()
                investor_payouts = {}  # Key: investor_db_id, Value: total_payouts
                
                # Group investments by investor and series
                investor_series_investments = {}
                for inv_row in investments_data:
                    investor_id = inv_row['investor_db_id']
                    series_id = inv_row['series_id']
                    key = (investor_id, series_id)
                    
                    if key not in investor_series_investments:
                        investor_series_investments[key] = {
                            'series_start_date': inv_row['series_start_date'],
                            'investments': []
                        }
                    investor_series_investments[key]['investments'].append(inv_row)
                
                # Calculate for each investor-series combination
                for (investor_id, series_id), series_data in investor_series_investments.items():
                    series_start_date = series_data['series_start_date']
                    if isinstance(series_start_date, str):
                        try:
                            series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                        except:
                            continue
                    
                    if not series_start_date or series_start_date > current_date.date():
                        continue
                    
                    # Calculate from series start month to current month
                    start_month_date = series_start_date.replace(day=1)
                    current_month_date = current_date.date().replace(day=1)
                    
                    # Iterate through each month
                    month_date = start_month_date
                    while month_date <= current_month_date:
                        interest_year = month_date.year
                        interest_month = month_date.month
                        
                        for inv_row in series_data['investments']:
                            # Parse dates
                            inv_series_start = inv_row['series_start_date']
                            if isinstance(inv_series_start, str):
                                try:
                                    inv_series_start = datetime.strptime(inv_series_start, '%Y-%m-%d').date()
                                except:
                                    inv_series_start = None
                            
                            maturity_date = inv_row['maturity_date']
                            if isinstance(maturity_date, str):
                                try:
                                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                                except:
                                    maturity_date = None
                            
                            exit_date = inv_row['exit_date']
                            if isinstance(exit_date, str):
                                try:
                                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                                except:
                                    exit_date = None
                            
                            # Generate payout date
                            import calendar
                            payment_day = inv_row['interest_payment_day'] or 15
                            max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                            actual_payment_day = min(payment_day, max_day_in_month)
                            payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                            
                            # Get last payout date
                            last_payout_date = get_last_payout_date(
                                inv_series_start if inv_series_start else payout_date_obj,
                                inv_row['interest_payment_day'] or 15,
                                payout_date_obj
                            )
                            
                            # Check if we should skip
                            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                                continue
                            
                            # Calculate interest
                            if inv_series_start and is_first_payout(inv_series_start, interest_month, interest_year):
                                monthly_interest = calculate_first_month_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    inv_series_start,
                                    interest_month,
                                    interest_year
                                )
                            elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                                monthly_interest = calculate_exit_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    exit_date,
                                    interest_month,
                                    interest_year
                                )
                            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                                monthly_interest = calculate_maturity_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate']),
                                    maturity_date,
                                    interest_month,
                                    interest_year
                                )
                            else:
                                monthly_interest = calculate_monthly_interest(
                                    float(inv_row['investment_amount']),
                                    float(inv_row['interest_rate'])
                                )
                            
                            # Generate payout month
                            payout_month = generate_payout_month(interest_year, interest_month)
                            
                            # Check status
                            payout_key = (investor_id, series_id, payout_month)
                            if payout_key in existing_payouts_lookup:
                                payout_status = existing_payouts_lookup[payout_key]['status']
                            else:
                                payout_status = 'Scheduled'
                            
                            # Only count PAID payouts
                            if payout_status == 'Paid':
                                if investor_id not in investor_payouts:
                                    investor_payouts[investor_id] = 0.0
                                investor_payouts[investor_id] += monthly_interest
                        
                        # Move to next month
                        if month_date.month == 12:
                            month_date = month_date.replace(year=month_date.year + 1, month=1)
                        else:
                            month_date = month_date.replace(month=month_date.month + 1)
                
                logger.info(f"💸 Calculated payouts for {len(investor_payouts)} investors")
            else:
                investor_payouts = {}
        
        except Exception as e:
            logger.error(f"❌ Error calculating payouts for new investors: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to interest_payouts table
            investor_payouts = {}
            if investor_ids:
                placeholders = ','.join(['%s'] * len(investor_ids))
                fallback_query = f"""
                SELECT investor_id, COALESCE(SUM(amount), 0) as total_payouts
                FROM interest_payouts
                WHERE investor_id IN ({placeholders}) AND status = 'Paid'
                GROUP BY investor_id
                """
                fallback_result = db.execute_query(fallback_query, tuple(investor_ids))
                for row in fallback_result:
                    investor_payouts[row['investor_id']] = float(row['total_payouts'])
        
        # Build final investment details with calculated payouts
        investment_details = []
        for row in investment_result:
            investor_db_id = row['investor_db_id']
            total_payouts = investor_payouts.get(investor_db_id, 0.0)
            
            investment_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'series_invested': row['series_invested'] or 'None',
                'total_invested': float(row['total_invested']),
                'total_payouts': total_payouts
            })
        
        logger.info(f"📊 Investment Details: {len(investment_details)} records")
        
        # Query 2: Get banking details for new investors
        banking_query = f"""
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            i.bank_name,
            i.account_number,
            i.ifsc_code
        FROM investors i
        WHERE {where_clause}
        ORDER BY i.created_at DESC
        """
        banking_result = db.execute_query(banking_query, tuple(query_params))
        
        banking_details = []
        for row in banking_result:
            banking_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'bank_name': row['bank_name'] or 'Not Provided',
                'account_number': row['account_number'] or 'Not Provided',
                'ifsc_code': row['ifsc_code'] or 'Not Provided'
            })
        
        logger.info(f"📊 Banking Details: {len(banking_details)} records")
        
        # Query 3: Get KYC details for new investors with document upload status
        kyc_query = f"""
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            i.pan,
            i.aadhaar,
            i.kyc_status,
            GROUP_CONCAT(DISTINCT d.document_type) as uploaded_documents
        FROM investors i
        LEFT JOIN investor_documents d ON i.id = d.investor_id
        WHERE {where_clause}
        GROUP BY i.id, i.investor_id, i.full_name, i.pan, i.aadhaar, i.kyc_status
        ORDER BY i.created_at DESC
        """
        kyc_result = db.execute_query(kyc_query, tuple(query_params))
        
        kyc_details = []
        for row in kyc_result:
            # Get list of uploaded documents
            uploaded_docs = row['uploaded_documents'].split(',') if row['uploaded_documents'] else []
            
            # Determine which documents are yet to be submitted
            yet_to_submit = []
            if 'pan_document' not in uploaded_docs:
                yet_to_submit.append('PAN Document')
            if 'aadhaar_document' not in uploaded_docs:
                yet_to_submit.append('Aadhaar Document')
            if 'cancelled_cheque' not in uploaded_docs:
                yet_to_submit.append('Cancelled Cheque')
            
            kyc_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'pan': row['pan'] or 'Not Provided',
                'aadhaar': row['aadhaar'] or 'Not Provided',
                'kyc_status': row['kyc_status'] or 'Pending',
                'yet_to_submit_documents': ', '.join(yet_to_submit) if yet_to_submit else 'All Submitted'
            })
        
        logger.info(f"📊 KYC Details: {len(kyc_details)} records")
        
        # Query 4: Get personal details for new investors
        personal_query = f"""
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            i.email,
            i.phone,
            i.dob,
            i.source_of_funds,
            i.created_at
        FROM investors i
        WHERE {where_clause}
        ORDER BY i.created_at DESC
        """
        personal_result = db.execute_query(personal_query, tuple(query_params))
        
        personal_details = []
        for row in personal_result:
            personal_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'email': row['email'] or 'Not Provided',
                'phone': row['phone'] or 'Not Provided',
                'dob': row['dob'].strftime('%d/%m/%Y') if row['dob'] else 'Not Provided',
                'source_of_funds': row['source_of_funds'] or 'Not Provided',
                'date_joined': row['created_at'].strftime('%d/%m/%Y') if row['created_at'] else 'Not Provided'
            })
        
        logger.info(f"📊 Personal Details: {len(personal_details)} records")
        
        return {
            "from_date": from_date,
            "to_date": to_date,
            "investor_id": investor_id,
            "total_new_investors": len(investment_details),
            "investment_details": investment_details,
            "banking_details": banking_details,
            "kyc_details": kyc_details,
            "personal_details": personal_details,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting new investors report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving new investors report: {str(e)}"
        )



@router.get("/rbi-compliance")
async def get_rbi_compliance_report(
    series_id: Optional[int] = None,
    security_type: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """RBI Compliance Report - MINIMAL WORKING VERSION"""
    try:
        db = get_db()
        
        # Permission check
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_rbi_compliance_report", "view_reports")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access Denied")
        
        logger.info(f"RBI Report: user={current_user.username}, series={series_id}, type={security_type}")
        
        # Build WHERE clause for series filtering
        series_where = ["s.is_active = 1"]
        series_params = []
        
        if series_id:
            series_where.append("s.id = %s")
            series_params.append(series_id)
        
        if security_type and security_type.lower() != 'all':
            series_where.append("s.security_type = %s")
            series_params.append(security_type)
        
        series_where_clause = " AND ".join(series_where)
        
        # Query 1: Get Summary Metrics
        summary_query = f"""
        SELECT 
            COALESCE(SUM(inv.amount), 0) as total_aum,
            COUNT(DISTINCT i.id) as total_investors,
            SUM(CASE WHEN i.kyc_status = 'Pending' THEN 1 ELSE 0 END) as kyc_pending
        FROM ncd_series s
        LEFT JOIN investments inv ON s.id = inv.series_id AND inv.status = 'confirmed'
        LEFT JOIN investors i ON inv.investor_id = i.id
        WHERE {series_where_clause}
        """
        summary_result = db.execute_query(summary_query, tuple(series_params) if series_params else None)
        summary_data = summary_result[0] if summary_result else {}
        
        total_aum = float(summary_data.get('total_aum', 0))
        kyc_pending = summary_data.get('kyc_pending', 0)
        
        # Query 2: Get upcoming payouts (UPCOMING MONTH - same as Interest Payout page)
        # Calculate next month
        from datetime import datetime
        current_date = datetime.now()
        
        if current_date.month == 12:
            next_year = current_date.year + 1
            next_month = 1
        else:
            next_year = current_date.year
            next_month = current_date.month + 1
        
        # Generate payout_month string for next month (format: YYYY-MM)
        next_month_str = f"{next_year}-{next_month:02d}"
        
        logger.info(f"📅 Calculating upcoming payouts for month: {next_month_str}")
        
        # Query upcoming payouts from the SAME source as Interest Payout page
        # This matches the "Upcoming Month" tab in Interest Payout
        upcoming_query = f"""
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            i.id as investment_id,
            i.amount as investment_amount,
            i.exit_date,
            i.status as investment_status,
            i.series_id,
            s.name as series_name,
            s.interest_rate,
            s.interest_payment_day,
            s.series_start_date,
            s.maturity_date,
            s.lock_in_date
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        AND {series_where_clause}
        ORDER BY inv.investor_id, s.name
        """
        
        upcoming_result = db.execute_query(upcoming_query, tuple(series_params) if series_params else None)
        
        # Calculate upcoming payouts using the SAME logic as Interest Payout page
        # Import calculation functions from payouts module
        from routes.payouts import (
            calculate_monthly_interest,
            calculate_first_month_interest,
            calculate_exit_interest,
            calculate_maturity_interest,
            is_first_payout,
            is_final_payout_after_exit,
            is_last_payout_before_maturity,
            should_skip_payout,
            get_last_payout_date
        )
        from datetime import date
        import calendar
        
        upcoming_payouts = 0.0
        
        for row in upcoming_result:
            # Get series start date
            series_start_date = row['series_start_date']
            if isinstance(series_start_date, str):
                try:
                    series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                except:
                    series_start_date = None
            
            # Get maturity date
            maturity_date = row.get('maturity_date')
            if isinstance(maturity_date, str):
                try:
                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                except:
                    maturity_date = None
            
            # Get exit date
            exit_date = row.get('exit_date')
            if isinstance(exit_date, str):
                try:
                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                except:
                    exit_date = None
            
            # Generate payout date for next month
            payment_day = row['interest_payment_day'] or 15
            max_day_in_month = calendar.monthrange(next_year, next_month)[1]
            actual_payment_day = min(payment_day, max_day_in_month)
            
            payout_date_obj = date(next_year, next_month, actual_payment_day)
            
            # Get last payout date for period calculation
            last_payout_date = get_last_payout_date(
                series_start_date if series_start_date else payout_date_obj,
                row['interest_payment_day'] or 15,
                payout_date_obj
            )
            
            # Check if we should skip this payout
            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                continue
            
            # Calculate interest amount using SAME logic as Interest Payout page
            if series_start_date and is_first_payout(series_start_date, next_month, next_year):
                monthly_interest = calculate_first_month_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    series_start_date,
                    next_month,
                    next_year
                )
            elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                monthly_interest = calculate_exit_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    exit_date,
                    next_month - 1 if next_month > 1 else 12,
                    next_year if next_month > 1 else next_year - 1
                )
            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                monthly_interest = calculate_maturity_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    maturity_date,
                    next_month - 1 if next_month > 1 else 12,
                    next_year if next_month > 1 else next_year - 1
                )
            else:
                monthly_interest = calculate_monthly_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate'])
                )
            
            upcoming_payouts += monthly_interest
        
        logger.info(f"✅ Calculated upcoming payouts for {next_month_str}: ₹{upcoming_payouts:,.2f}")
        
        # Query 3: Get Series Compliance Details
        # Use subqueries to ensure accurate counting without row multiplication from JOINs
        series_query = f"""
        SELECT 
            s.id,
            s.series_code,
            s.name as series_name,
            s.security_type,
            s.credit_rating,
            s.debenture_trustee_name,
            s.issue_date,
            s.maturity_date,
            DATEDIFF(s.maturity_date, s.issue_date) as tenure_days,
            (SELECT COUNT(*) FROM series_documents sd WHERE sd.series_id = s.id AND sd.is_active = 1) as documents_count,
            (SELECT COUNT(DISTINCT inv.investor_id) 
             FROM investments inv 
             WHERE inv.series_id = s.id AND inv.status = 'confirmed') as total_investors_in_series,
            (SELECT COUNT(DISTINCT i.id)
             FROM investments inv
             INNER JOIN investors i ON inv.investor_id = i.id
             WHERE inv.series_id = s.id 
             AND inv.status = 'confirmed'
             AND i.kyc_status = 'Completed') as kyc_completed_count,
            (SELECT COUNT(DISTINCT p.id)
             FROM interest_payouts p
             WHERE p.series_id = s.id
             AND p.status = 'Paid' 
             AND DATEDIFF(p.paid_date, p.payout_date) > 1) as paid_late_count,
            (SELECT COUNT(DISTINCT p.id)
             FROM interest_payouts p
             WHERE p.series_id = s.id
             AND p.status IN ('Pending', 'Scheduled') 
             AND p.payout_date < CURDATE()) as overdue_count,
            (SELECT COUNT(DISTINCT p.id)
             FROM interest_payouts p
             WHERE p.series_id = s.id
             AND p.status IN ('Pending', 'Scheduled') 
             AND p.payout_date >= CURDATE()) as upcoming_count
        FROM ncd_series s
        WHERE {series_where_clause}
        ORDER BY s.series_code
        """
        series_result = db.execute_query(series_query, tuple(series_params) if series_params else None)
        
        # DEBUG: Log the query results to verify KYC calculation
        logger.info(f"📊 Series Compliance Query returned {len(series_result)} series")
        for row in series_result:
            logger.info(f"  Series {row['series_code']}: Total Investors={row['total_investors_in_series']}, KYC Completed={row['kyc_completed_count']}")
        
        series_compliance = []
        attention_items = []
        
        # Calculate compliance score based on ACTUAL 42 compliance items
        total_compliance_items = 0
        completed_compliance_items = 0
        
        for row in series_result:
            series_id = row['id']
            
            # Get actual compliance status for this series (42 items)
            compliance_count_query = """
            SELECT 
                COUNT(*) as total_items,
                SUM(CASE WHEN status IN ('received', 'submitted') THEN 1 ELSE 0 END) as completed_items
            FROM series_compliance_status
            WHERE series_id = %s
            """
            compliance_count = db.execute_query(compliance_count_query, (series_id,))
            
            if compliance_count and compliance_count[0]['total_items'] > 0:
                series_total_items = compliance_count[0]['total_items']
                series_completed_items = compliance_count[0]['completed_items'] or 0
            else:
                # If no status entries exist, assume all 42 items are pending
                series_total_items = 42
                series_completed_items = 0
            
            total_compliance_items += series_total_items
            completed_compliance_items += series_completed_items
            
            # Calculate percentage for this series
            series_completion_percent = (series_completed_items / series_total_items * 100) if series_total_items > 0 else 0
            
            # Calculate compliance checks (for display purposes)
            has_rating = bool(row['credit_rating'] and row['credit_rating'].strip())
            has_trustee = bool(row['debenture_trustee_name'] and row['debenture_trustee_name'].strip())
            has_all_docs = row['documents_count'] >= 3
            tenure_valid = row['tenure_days'] >= 90 if row['tenure_days'] else False
            
            total_inv = row['total_investors_in_series'] or 0
            kyc_completed = row['kyc_completed_count'] or 0
            kyc_complete = (kyc_completed == total_inv) if total_inv > 0 else True
            kyc_percent = (kyc_completed / total_inv * 100) if total_inv > 0 else 0
            
            # Determine compliance status based on actual 42 items completion
            if series_completion_percent >= 90:
                compliance_status = 'Compliant'
                compliance_color = 'green'
            elif series_completion_percent >= 50:
                compliance_status = 'Attention'
                compliance_color = 'yellow'
            else:
                compliance_status = 'Non-Compliant'
                compliance_color = 'red'
            
            # Determine payment status
            paid_late = row['paid_late_count'] or 0
            overdue = row['overdue_count'] or 0
            upcoming = row['upcoming_count'] or 0
            
            total_delays = paid_late + overdue
            
            if total_delays > 0:
                if overdue > 0:
                    payment_status = f"{overdue} Overdue, {paid_late} Paid Late"
                    payment_color = 'red'
                else:
                    payment_status = f"{paid_late} Paid Late"
                    payment_color = 'yellow'
            else:
                payment_status = 'On-Time'
                payment_color = 'green'
            
            series_compliance.append({
                'series_id': row['id'],
                'series_code': row['series_code'],
                'series_name': row['series_name'],
                'security_type': row['security_type'],
                'credit_rating': row['credit_rating'] or 'Missing',
                'has_rating': has_rating,
                'trustee_name': row['debenture_trustee_name'] or 'Missing',
                'has_trustee': has_trustee,
                'documents_count': row['documents_count'],
                'has_all_docs': has_all_docs,
                'tenure_days': row['tenure_days'] or 0,
                'tenure_valid': tenure_valid,
                'kyc_completion_percent': round(kyc_percent, 1),
                'kyc_completed_count': kyc_completed,
                'kyc_total_count': total_inv,
                'kyc_complete': kyc_complete,
                'payment_status': payment_status,
                'payment_color': payment_color,
                'paid_late_count': paid_late,
                'overdue_count': overdue,
                'upcoming_count': upcoming,
                'total_delays': total_delays,
                'compliance_status': compliance_status,
                'compliance_color': compliance_color
            })
            
            # Build attention items with compliance document status
            series_code = row['series_code']
            
            # Get compliance document counts by section for this series
            compliance_sections_query = """
            SELECT 
                section,
                COUNT(*) as total_items,
                SUM(CASE WHEN status IN ('received', 'submitted') THEN 1 ELSE 0 END) as completed_items
            FROM series_compliance_status
            WHERE series_id = %s
            GROUP BY section
            """
            sections_result = db.execute_query(compliance_sections_query, (series_id,))
            
            # Create lookup for section counts
            section_counts = {}
            for sec_row in sections_result:
                section_counts[sec_row['section']] = {
                    'total': sec_row['total_items'],
                    'completed': sec_row['completed_items'] or 0
                }
            
            # Get master item counts for each section
            master_counts_query = """
            SELECT 
                section,
                COUNT(*) as total_items
            FROM compliance_master_items
            WHERE is_active = 1
            GROUP BY section
            """
            master_counts = db.execute_query(master_counts_query)
            
            # Default totals (26 pre, 11 post, 5 recurring)
            pre_total = 26
            post_total = 11
            recurring_total = 5
            
            for mc_row in master_counts:
                if mc_row['section'] == 'pre':
                    pre_total = mc_row['total_items']
                elif mc_row['section'] == 'post':
                    post_total = mc_row['total_items']
                elif mc_row['section'] == 'recurring':
                    recurring_total = mc_row['total_items']
            
            # Calculate pending documents for each section
            pre_completed = section_counts.get('pre', {}).get('completed', 0)
            post_completed = section_counts.get('post', {}).get('completed', 0)
            recurring_completed = section_counts.get('recurring', {}).get('completed', 0)
            
            pre_pending = pre_total - pre_completed
            post_pending = post_total - post_completed
            recurring_pending = recurring_total - recurring_completed
            
            # Calculate KYC pending
            kyc_pending_count = total_inv - kyc_completed
            
            # Add to attention items if there are pending items
            if pre_pending > 0 or post_pending > 0 or recurring_pending > 0 or kyc_pending_count > 0:
                attention_items.append({
                    'series_code': series_code,
                    'pre_compliance_pending': pre_pending,
                    'post_compliance_pending': post_pending,
                    'recurring_compliance_pending': recurring_pending,
                    'kyc_pending': kyc_pending_count
                })
        
        # Calculate overall compliance score based on actual 42 items per series
        compliance_score = (completed_compliance_items / total_compliance_items * 100) if total_compliance_items > 0 else 0
        
        logger.info(f"✅ Compliance Score: {compliance_score:.1f}% ({completed_compliance_items}/{total_compliance_items} items)")
        
        # Query 4: Investor Summary
        investor_summary_query = """
        SELECT 
            COUNT(DISTINCT i.id) as total_investors,
            SUM(CASE WHEN i.kyc_status = 'Completed' THEN 1 ELSE 0 END) as kyc_completed,
            SUM(CASE WHEN i.kyc_status = 'Pending' THEN 1 ELSE 0 END) as kyc_pending,
            SUM(CASE WHEN i.kyc_status = 'Rejected' THEN 1 ELSE 0 END) as kyc_rejected
        FROM investors i
        WHERE i.is_active = 1
        """
        investor_summary_result = db.execute_query(investor_summary_query)
        investor_summary_data = investor_summary_result[0] if investor_summary_result else {}
        
        # Query 5: Top Investor Holdings (Concentration Risk)
        holdings_query = f"""
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            s.series_code,
            SUM(inv.amount) as amount_invested,
            (SUM(inv.amount) / s.target_amount * 100) as percent_of_series
        FROM investments inv
        INNER JOIN investors i ON inv.investor_id = i.id
        INNER JOIN ncd_series s ON inv.series_id = s.id
        WHERE inv.status = 'confirmed'
        AND {series_where_clause}
        GROUP BY i.investor_id, i.full_name, s.series_code, s.target_amount
        HAVING amount_invested > 0
        ORDER BY amount_invested DESC
        """
        holdings_result = db.execute_query(holdings_query, tuple(series_params) if series_params else None)
        
        top_holdings = []
        for row in holdings_result:
            top_holdings.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'series_code': row['series_code'],
                'amount_invested': float(row['amount_invested']),
                'percent_of_series': round(float(row['percent_of_series']), 2)
            })
        
        # Query 6: Payment Compliance per Series
        payment_query = f"""
        SELECT 
            s.series_code,
            COALESCE(SUM(CASE WHEN p.status = 'Paid' THEN p.amount ELSE 0 END), 0) as total_payouts,
            COALESCE(SUM(CASE WHEN p.status = 'Paid' AND DATEDIFF(p.paid_date, p.payout_date) <= 1 THEN p.amount ELSE 0 END), 0) as ontime_amount,
            COUNT(CASE WHEN p.status = 'Paid' AND DATEDIFF(p.paid_date, p.payout_date) <= 1 THEN 1 END) as ontime_count,
            COALESCE(SUM(CASE WHEN p.status = 'Paid' AND DATEDIFF(p.paid_date, p.payout_date) > 1 THEN p.amount ELSE 0 END), 0) as paid_late_amount,
            COUNT(CASE WHEN p.status = 'Paid' AND DATEDIFF(p.paid_date, p.payout_date) > 1 THEN 1 END) as paid_late_count,
            COALESCE(SUM(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date < CURDATE() THEN p.amount ELSE 0 END), 0) as overdue_amount,
            COUNT(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date < CURDATE() THEN 1 END) as overdue_count,
            COALESCE(SUM(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN p.amount ELSE 0 END), 0) as upcoming_amount,
            COUNT(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as upcoming_count,
            COALESCE(SUM(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN p.amount ELSE 0 END), 0) as future_amount,
            COUNT(CASE WHEN p.status IN ('Pending', 'Scheduled') AND p.payout_date > DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as future_count
        FROM ncd_series s
        LEFT JOIN interest_payouts p ON s.id = p.series_id
        WHERE {series_where_clause}
        GROUP BY s.series_code
        ORDER BY s.series_code
        """
        payment_result = db.execute_query(payment_query, tuple(series_params) if series_params else None)
        
        payment_compliance = []
        for row in payment_result:
            overdue_count = row['overdue_count']
            paid_late_count = row['paid_late_count']
            total_delays = overdue_count + paid_late_count
            
            if total_delays > 0:
                if overdue_count > 0:
                    status = f'{overdue_count} Overdue, {paid_late_count} Paid Late'
                else:
                    status = f'{paid_late_count} Paid Late'
            else:
                status = 'Compliant'
            
            payment_compliance.append({
                'series_code': row['series_code'],
                'total_payouts': float(row['total_payouts']),
                'ontime_amount': float(row['ontime_amount']),
                'ontime_count': row['ontime_count'],
                'paid_late_amount': float(row['paid_late_amount']),
                'paid_late_count': paid_late_count,
                'overdue_amount': float(row['overdue_amount']),
                'overdue_count': overdue_count,
                'upcoming_amount': float(row['upcoming_amount']),
                'upcoming_count': row['upcoming_count'],
                'future_amount': float(row['future_amount']),
                'future_count': row['future_count'],
                'total_delays': total_delays,
                'status': status
            })
        
        logger.info(f"✅ RBI Compliance Report: {len(series_compliance)} series, Score: {compliance_score:.1f}%")
        
        return {
            "series_id": series_id,
            "security_type": security_type,
            "summary": {
                "total_aum": total_aum,
                "compliance_score": round(compliance_score, 1),
                "kyc_pending": kyc_pending,
                "upcoming_payouts": upcoming_payouts
            },
            "series_compliance": series_compliance,
            "investor_summary": {
                "total_investors": investor_summary_data.get('total_investors', 0),
                "kyc_completed": investor_summary_data.get('kyc_completed', 0),
                "kyc_pending": investor_summary_data.get('kyc_pending', 0),
                "kyc_rejected": investor_summary_data.get('kyc_rejected', 0),
                "top_holdings": top_holdings
            },
            "payment_compliance": payment_compliance,
            "attention_items": attention_items,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting RBI compliance report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving RBI compliance report: {str(e)}"
        )



@router.get("/audit-trail")
async def get_audit_trail_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    series_id: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Audit Trail Report data with filters
    Shows investment transactions, payouts, and summary
    PERMISSION REQUIRED: view_reports
    """
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("📊 GENERATING AUDIT TRAIL REPORT")
        logger.info("=" * 80)
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_audit_trail_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Parse dates or use defaults (last 30 days)
        if from_date:
            start_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        else:
            start_date = date.today() - timedelta(days=30)
        
        if to_date:
            end_date = datetime.strptime(to_date, '%Y-%m-%d').date()
        else:
            end_date = date.today()
        
        logger.info(f"📅 Date Range: {start_date} to {end_date}")
        logger.info(f"📋 Series Filter: {series_id if series_id else 'All Series'}")
        
        # ============================================================
        # SUMMARY CARDS
        # ============================================================
        
        # Build series filter condition
        series_filter = ""
        series_params = []
        if series_id:
            series_filter = "AND i.series_id = %s"
            series_params = [series_id]
        
        # 1. Total Investments (received in date range) - LIFETIME totals
        total_investments_query = f"""
        SELECT COALESCE(SUM(i.amount), 0) as total
        FROM investments i
        WHERE i.status IN ('confirmed', 'cancelled')
        AND DATE(i.date_received) >= %s 
        AND DATE(i.date_received) <= %s
        {series_filter}
        """
        total_investments_result = db.execute_query(
            total_investments_query, 
            [start_date, end_date] + series_params
        )
        total_investments = total_investments_result[0]['total'] if total_investments_result else 0
        
        # 2. Total Payouts Till Date (all time, filtered by series if selected)
        # CRITICAL: Calculate ACTUAL payouts from series start till current date
        # Then check payment status from interest_payouts table
        # This ensures we show REAL calculated amounts, not just manually imported data
        
        logger.info(f"💸 Calculating Total Payouts Till Date dynamically...")
        
        # Initialize total_payouts outside try block
        total_payouts = 0.0
        
        try:
            # Import calculation functions
            from routes.payouts import (
                calculate_monthly_interest,
                calculate_first_month_interest,
                calculate_exit_interest,
                calculate_maturity_interest,
                is_first_payout,
                is_final_payout_after_exit,
                is_last_payout_before_maturity,
                should_skip_payout,
                get_last_payout_date,
                generate_payout_month
            )
            
            # Get all investments (filtered by series if provided)
            investments_query = f"""
            SELECT 
                inv.id as investor_id,
                i.amount as investment_amount,
                i.exit_date,
                i.status as investment_status,
                i.series_id,
                s.series_start_date,
                s.maturity_date,
                s.interest_rate,
                s.interest_payment_day
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            INNER JOIN ncd_series s ON i.series_id = s.id
            WHERE i.status IN ('confirmed', 'cancelled')
            AND s.series_start_date IS NOT NULL
            {series_filter}
            """
            investments_result = db.execute_query(investments_query, series_params if series_id else [])
            
            # Get existing payouts from interest_payouts table for status checking
            existing_payouts_query = f"""
            SELECT investor_id, series_id, payout_month, status, amount
            FROM interest_payouts
            WHERE is_active = 1
            {series_filter.replace('i.series_id', 'series_id') if series_id else ''}
            """
            existing_payouts_result = db.execute_query(existing_payouts_query, series_params if series_id else [])
            existing_payouts_lookup = {}
            for payout in existing_payouts_result:
                payout_month_from_db = payout['payout_month']
                
                # Store with original format
                key = (payout['investor_id'], payout['series_id'], payout_month_from_db)
                existing_payouts_lookup[key] = {
                    'status': payout['status'],
                    'amount': float(payout['amount'])
                }
                
                # Also store with converted format (if it's "February 2026", convert to "2026-02")
                try:
                    # Try to parse as "February 2026"
                    month_date = datetime.strptime(payout_month_from_db, '%B %Y')
                    payout_month_numeric = month_date.strftime('%Y-%m')
                    key_numeric = (payout['investor_id'], payout['series_id'], payout_month_numeric)
                    existing_payouts_lookup[key_numeric] = {
                        'status': payout['status'],
                        'amount': float(payout['amount'])
                    }
                except:
                    # Try to parse as "2026-02"
                    try:
                        year, month = payout_month_from_db.split('-')
                        month_date = datetime(int(year), int(month), 1).date()
                        payout_month_text = month_date.strftime('%B %Y')
                        key_text = (payout['investor_id'], payout['series_id'], payout_month_text)
                        existing_payouts_lookup[key_text] = {
                            'status': payout['status'],
                            'amount': float(payout['amount'])
                        }
                    except:
                        pass
            
            # Calculate payouts from series start till current month
            current_date = datetime.now()
            # total_payouts already initialized outside try block
            
            # Group investments by series to get series start date
            series_investments = {}
            for inv_row in investments_result:
                series_id_key = inv_row['series_id']
                if series_id_key not in series_investments:
                    series_investments[series_id_key] = {
                        'series_start_date': inv_row['series_start_date'],
                        'investments': []
                    }
                series_investments[series_id_key]['investments'].append(inv_row)
            
            # Calculate for each series
            for series_id_key, series_data in series_investments.items():
                series_start_date = series_data['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        continue
                
                if not series_start_date or series_start_date > current_date.date():
                    continue
                
                # Calculate from series start month to current month
                start_month_date = series_start_date.replace(day=1)
                current_month_date = current_date.date().replace(day=1)
                
                # Iterate through each month from start to current
                month_date = start_month_date
                while month_date <= current_month_date:
                    interest_year = month_date.year
                    interest_month = month_date.month
                    
                    # Calculate payouts for this month
                    for inv_row in series_data['investments']:
                        # Parse dates
                        inv_series_start = inv_row['series_start_date']
                        if isinstance(inv_series_start, str):
                            try:
                                inv_series_start = datetime.strptime(inv_series_start, '%Y-%m-%d').date()
                            except:
                                inv_series_start = None
                        
                        maturity_date = inv_row['maturity_date']
                        if isinstance(maturity_date, str):
                            try:
                                maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                            except:
                                maturity_date = None
                        
                        exit_date = inv_row['exit_date']
                        if isinstance(exit_date, str):
                            try:
                                exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                            except:
                                exit_date = None
                        
                        # Generate payout date
                        import calendar
                        payment_day = inv_row['interest_payment_day'] or 15
                        max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                        actual_payment_day = min(payment_day, max_day_in_month)
                        payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                        
                        # Get last payout date
                        last_payout_date = get_last_payout_date(
                            inv_series_start if inv_series_start else payout_date_obj,
                            inv_row['interest_payment_day'] or 15,
                            payout_date_obj
                        )
                        
                        # Check if we should skip this payout
                        if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                            continue
                        
                        # Calculate interest amount
                        if inv_series_start and is_first_payout(inv_series_start, interest_month, interest_year):
                            monthly_interest = calculate_first_month_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                inv_series_start,
                                interest_month,
                                interest_year
                            )
                        elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                            monthly_interest = calculate_exit_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                exit_date,
                                interest_month,
                                interest_year
                            )
                        elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                            monthly_interest = calculate_maturity_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                maturity_date,
                                interest_month,
                                interest_year
                            )
                        else:
                            monthly_interest = calculate_monthly_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate'])
                            )
                        
                        # Generate payout month in YYYY-MM format to match all_payouts_by_key
                        payout_month = f"{interest_year}-{interest_month:02d}"
                        
                        # Check status from interest_payouts table
                        payout_key = (inv_row['investor_id'], inv_row['series_id'], payout_month)
                        if payout_key in existing_payouts_lookup:
                            payout_status = existing_payouts_lookup[payout_key]['status']
                        else:
                            payout_status = 'Scheduled'
                        
                        # Only count PAID payouts for total
                        if payout_status == 'Paid':
                            total_payouts += monthly_interest
                    
                    # Move to next month
                    if month_date.month == 12:
                        month_date = month_date.replace(year=month_date.year + 1, month=1)
                    else:
                        month_date = month_date.replace(month=month_date.month + 1)
            
            logger.info(f"💸 Total Payouts (Calculated & Paid): ₹{total_payouts:,.2f}")
            
        except Exception as e:
            logger.error(f"❌ Error calculating total payouts: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to interest_payouts table
            total_payouts_query = f"""
            SELECT COALESCE(SUM(p.amount), 0) as total
            FROM interest_payouts p
            WHERE p.status = 'Paid'
            {series_filter.replace('i.series_id', 'p.series_id') if series_id else ''}
            """
            total_payouts_result = db.execute_query(
                total_payouts_query,
                series_params if series_id else []
            )
            total_payouts = total_payouts_result[0]['total'] if total_payouts_result else 0
        
        # 3. Upcoming Payouts (NEXT MONTH - same as "Upcoming Month" in Interest Payout)
        # FETCH DIRECTLY from the payouts export endpoint to ensure 100% accuracy
        # This guarantees we get the EXACT same value as shown in Interest Payout Export
        
        logger.info(f"📅 Fetching upcoming payouts from payouts export logic...")
        
        try:
            # Import the get_export_payouts function from the payouts router
            from routes.payouts import get_export_payouts
            
            # Call the export endpoint with month_type='upcoming'
            export_data = await get_export_payouts(
                series_id=series_id,
                month_type='upcoming',
                current_user=current_user
            )
            
            # Extract the total_amount from summary
            upcoming_payouts = export_data.get('summary', {}).get('total_amount', 0)
            
            logger.info(f"📅 Upcoming payouts fetched from export: ₹{upcoming_payouts:,.2f}")
            
        except Exception as e:
            logger.error(f"❌ Error fetching upcoming payouts from export endpoint: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to 0 if there's an error
            upcoming_payouts = 0
        
        # 4. Payout Rate (percentage of scheduled payouts that were completed)
        payout_rate_query = f"""
        SELECT 
            COUNT(*) as total_scheduled,
            SUM(CASE WHEN status = 'Paid' THEN 1 ELSE 0 END) as completed
        FROM interest_payouts
        WHERE payout_date <= CURDATE()
        {series_filter.replace('i.series_id', 'series_id') if series_id else ''}
        """
        payout_rate_result = db.execute_query(
            payout_rate_query,
            series_params if series_id else []
        )
        
        if payout_rate_result and payout_rate_result[0]['total_scheduled'] > 0:
            payout_rate = (payout_rate_result[0]['completed'] / payout_rate_result[0]['total_scheduled']) * 100
        else:
            payout_rate = 0
        
        summary = {
            'total_investments': float(total_investments) if total_investments else 0,
            'total_payouts': float(total_payouts) if total_payouts else 0,
            'upcoming_payouts': float(upcoming_payouts) if upcoming_payouts else 0,
            'payout_rate': round(payout_rate, 1)
        }
        
        logger.info(f"💰 Total Investments: ₹{total_investments:,.2f}")
        logger.info(f"💸 Total Payouts: ₹{total_payouts:,.2f}")
        logger.info(f"📅 Upcoming Payouts: ₹{upcoming_payouts:,.2f}")
        logger.info(f"📊 Payout Rate: {payout_rate:.1f}%")
        
        # ============================================================
        # INVESTMENT TRANSACTIONS TABLE (includes both active and exited)
        # ============================================================
        
        investments_query = f"""
        SELECT 
            i.id,
            i.investor_id,
            inv.full_name as investor_name,
            i.series_id,
            s.series_code,
            s.name as series_name,
            i.amount,
            i.date_received,
            i.date_transferred,
            i.status,
            i.created_at
        FROM investments i
        LEFT JOIN investors inv ON i.investor_id = inv.id
        LEFT JOIN ncd_series s ON i.series_id = s.id
        WHERE i.status IN ('confirmed', 'cancelled')
        AND DATE(i.date_received) >= %s 
        AND DATE(i.date_received) <= %s
        {series_filter}
        ORDER BY i.date_received DESC, i.created_at DESC
        """
        
        investments_result = db.execute_query(
            investments_query,
            [start_date, end_date] + series_params
        )
        
        investments = []
        for row in investments_result:
            # Format date_received
            date_received_str = ''
            if row['date_received']:
                if isinstance(row['date_received'], str):
                    date_received_str = row['date_received']
                else:
                    date_received_str = row['date_received'].strftime('%d/%m/%Y')
            
            # Format date_transferred
            date_transferred_str = ''
            if row.get('date_transferred'):
                if isinstance(row['date_transferred'], str):
                    date_transferred_str = row['date_transferred']
                else:
                    date_transferred_str = row['date_transferred'].strftime('%d/%m/%Y')
            
            # Format created_at
            created_at_str = ''
            if row['created_at']:
                if isinstance(row['created_at'], str):
                    created_at_str = row['created_at']
                else:
                    created_at_str = row['created_at'].strftime('%d/%m/%Y %H:%M')
            
            investments.append({
                'id': row['id'],
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'] or 'N/A',
                'series_id': row['series_id'],
                'series_code': row['series_code'] or 'N/A',
                'series_name': row['series_name'] or 'N/A',
                'amount': float(row['amount']) if row['amount'] else 0,
                'date_received': date_received_str,
                'date_transferred': date_transferred_str,
                'status': row['status'] or 'N/A',
                'created_at': created_at_str
            })
        
        logger.info(f"📝 Total Investment Records: {len(investments)}")
        
        # ============================================================
        # FETCH PAYOUTS DATA - Calculate dynamically like Interest Payout page
        # ============================================================
        
        # Import calculation functions from payouts module
        from routes.payouts import (
            calculate_monthly_interest,
            calculate_first_month_interest,
            calculate_exit_interest,
            calculate_maturity_interest,
            is_first_payout,
            is_final_payout_after_exit,
            is_last_payout_before_maturity,
            should_skip_payout,
            get_last_payout_date,
            generate_payout_month,
            generate_payout_date
        )
        from datetime import date
        import calendar
        
        current_date = datetime.now()
        
        # Get investments for calculation (same query as Interest Payout page)
        investments_for_payouts_query = f"""
        SELECT 
            inv.id as investor_db_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            i.id as investment_id,
            i.amount as investment_amount,
            i.exit_date,
            i.status as investment_status,
            i.series_id,
            s.series_code,
            s.name as series_name,
            s.interest_rate,
            s.interest_payment_day,
            s.series_start_date,
            s.maturity_date,
            s.lock_in_date
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        {series_filter if series_id else ''}
        ORDER BY inv.investor_id, s.name
        """
        
        investments_for_payouts_result = db.execute_query(
            investments_for_payouts_query,
            series_params if series_id else []
        )
        
        logger.info(f"📊 Found {len(investments_for_payouts_result)} investments for payout calculation")
        
        # Calculate ALL payouts from series start till current month
        all_payouts_by_key = {}
        
        for row in investments_for_payouts_result:
            series_start_date = row['series_start_date']
            if isinstance(series_start_date, str):
                try:
                    series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                except:
                    continue
            
            if not series_start_date:
                continue
            
            # Get maturity date
            maturity_date = row.get('maturity_date')
            if isinstance(maturity_date, str):
                try:
                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                except:
                    maturity_date = None
            
            # Get exit date
            exit_date = row.get('exit_date')
            if isinstance(exit_date, str):
                try:
                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                except:
                    exit_date = None
            
            # Calculate interest from series start month till current month
            interest_year = series_start_date.year
            interest_month = series_start_date.month
            
            while (interest_year < current_date.year) or (interest_year == current_date.year and interest_month <= current_date.month):
                # Payout happens in the NEXT month
                payout_month = interest_month + 1
                payout_year = interest_year
                if payout_month > 12:
                    payout_month = 1
                    payout_year += 1
                
                payout_month_str = f"{payout_year}-{payout_month:02d}"
                
                # Generate payout date using the same function as Interest Payout page
                payment_day = row['interest_payment_day'] or 15
                payout_date = generate_payout_date(payout_year, payout_month, payment_day)
                
                # Get last payout date
                last_payout_date = get_last_payout_date(
                    series_start_date,
                    payment_day,
                    datetime.strptime(payout_date, '%d-%b-%Y').date()
                )
                
                # Check if we should skip
                if not should_skip_payout(datetime.strptime(payout_date, '%d-%b-%Y').date(), maturity_date, exit_date, last_payout_date):
                    # Calculate interest using the SAME logic as Interest Payout page
                    if is_first_payout(series_start_date, interest_month, interest_year):
                        monthly_interest = calculate_first_month_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            series_start_date,
                            interest_month,
                            interest_year
                        )
                    elif exit_date and is_final_payout_after_exit(datetime.strptime(payout_date, '%d-%b-%Y').date(), exit_date):
                        monthly_interest = calculate_exit_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            exit_date,
                            interest_month,
                            interest_year
                        )
                    elif maturity_date and is_last_payout_before_maturity(datetime.strptime(payout_date, '%d-%b-%Y').date(), maturity_date):
                        monthly_interest = calculate_maturity_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            maturity_date,
                            interest_month,
                            interest_year
                        )
                    else:
                        monthly_interest = calculate_monthly_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate'])
                        )
                    
                    # Store by unique key (investor_db_id, series_id, payout_month)
                    key = (row['investor_db_id'], row['series_id'], payout_month_str)
                    all_payouts_by_key[key] = {
                        'investor_db_id': row['investor_db_id'],
                        'investor_code': row['investor_code'],
                        'investor_name': row['investor_name'],
                        'series_id': row['series_id'],
                        'series_code': row['series_code'],
                        'series_name': row['series_name'],
                        'invested_amount': float(row['investment_amount']),
                        'payout_date': payout_date,
                        'payout_month': payout_month_str,
                        'amount': round(monthly_interest, 2)
                    }
                
                # Move to next interest month
                interest_month += 1
                if interest_month > 12:
                    interest_month = 1
                    interest_year += 1
        
        logger.info(f"📊 Calculated {len(all_payouts_by_key)} total payouts")
        
        # ============================================================
        # TABLE 1: COMPLETED PAYOUTS (Paid)
        # Use the SAME calculation as Interest Payout Management page
        # ============================================================
        
        logger.info(f"📊 Fetching Completed Payouts using Interest Payout calculation...")
        
        # Get ALL calculated payouts from Interest Payout page logic
        # This uses get_export_payouts which calculates amounts correctly (including partial months)
        from routes.payouts import get_export_payouts
        
        # Get current month payouts (these are the ones that might be paid)
        try:
            export_data_current = await get_export_payouts(
                series_id=series_id,
                month_type='current',
                current_user=current_user
            )
        except:
            export_data_current = {'payouts': []}
        
        # Create a lookup dictionary: (investor_id, series_id, payout_month) -> calculated_amount
        calculated_payouts_lookup = {}
        if export_data_current and 'payouts' in export_data_current:
            for payout in export_data_current['payouts']:
                investor_code = payout.get('investor_id')  # This is investor_id code like "INV001"
                series_id_val = payout.get('series_id')
                payout_month = payout.get('interest_month')  # Format: "February 2026"
                amount = payout.get('amount', 0)
                
                key = (investor_code, series_id_val, payout_month)
                calculated_payouts_lookup[key] = amount
        
        logger.info(f"📊 Calculated {len(calculated_payouts_lookup)} payouts from Interest Payout page logic")
        
        # Now fetch Paid records from interest_payouts table
        completed_payouts_query = """
        SELECT 
            ip.id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            ip.series_id,
            s.series_code,
            s.name as series_name,
            i.amount as invested_amount,
            ip.payout_month,
            ip.payout_date,
            ip.status,
            ip.updated_at,
            ip.paid_date
        FROM interest_payouts ip
        INNER JOIN investors inv ON ip.investor_id = inv.id
        INNER JOIN ncd_series s ON ip.series_id = s.id
        LEFT JOIN investments i ON inv.id = i.investor_id AND s.id = i.series_id AND i.status = 'confirmed'
        WHERE ip.is_active = 1
        AND ip.status = 'Paid'
        """
        
        completed_params = []
        if series_id:
            completed_payouts_query += " AND ip.series_id = %s"
            completed_params.append(series_id)
        
        completed_payouts_query += " ORDER BY ip.payout_date DESC"
        
        completed_result = db.execute_query(completed_payouts_query, tuple(completed_params) if completed_params else None)
        
        completed_payouts = []
        for row in completed_result:
            # Format paid timestamp
            paid_timestamp_str = 'N/A'
            if row.get('paid_date'):
                paid_date = row['paid_date']
                if isinstance(paid_date, str):
                    paid_timestamp_str = paid_date
                else:
                    paid_timestamp_str = paid_date.strftime('%d/%m/%Y %H:%M:%S')
            elif row.get('updated_at'):
                updated_at = row['updated_at']
                if isinstance(updated_at, str):
                    paid_timestamp_str = updated_at
                else:
                    paid_timestamp_str = updated_at.strftime('%d/%m/%Y %H:%M:%S')
            
            # Format payout_date
            payout_date_str = 'N/A'
            if row.get('payout_date'):
                payout_date = row['payout_date']
                if isinstance(payout_date, str):
                    payout_date_str = payout_date
                else:
                    payout_date_str = payout_date.strftime('%d-%b-%Y')
            
            # Get calculated amount from Interest Payout page logic
            investor_code = row.get('investor_code')
            series_id_val = row.get('series_id')
            payout_month = row.get('payout_month')
            
            key = (investor_code, series_id_val, payout_month)
            calculated_amount = calculated_payouts_lookup.get(key, 0)
            
            logger.info(f"✅ {investor_code} - {payout_month}: Rs.{calculated_amount:.2f}")
            
            completed_payouts.append({
                'series_id': row['series_id'],
                'series_code': row['series_code'] or 'N/A',
                'series_name': row['series_name'] or 'N/A',
                'investor_id': investor_code or 'N/A',
                'investor_name': row['investor_name'] or 'N/A',
                'invested_amount': float(row['invested_amount']) if row['invested_amount'] else 0,
                'payout_month': payout_month or 'N/A',
                'payout_date': payout_date_str,
                'paid_timestamp': paid_timestamp_str,
                'payout_amount': round(calculated_amount, 2)
            })
        
        logger.info(f"✅ Completed Payouts: {len(completed_payouts)} records")
        
        # ============================================================
        # TABLE 2: PENDING PAYOUTS (Scheduled/Pending but not paid)
        # Use the SAME calculation as Interest Payout Management page
        # ============================================================
        
        logger.info(f"📊 Fetching Pending Payouts using Interest Payout calculation...")
        
        # Fetch Pending/Scheduled records from interest_payouts table
        pending_payouts_query = """
        SELECT 
            ip.id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            ip.series_id,
            s.series_code,
            s.name as series_name,
            i.amount as invested_amount,
            ip.payout_month,
            ip.payout_date,
            ip.status,
            ip.created_at
        FROM interest_payouts ip
        INNER JOIN investors inv ON ip.investor_id = inv.id
        INNER JOIN ncd_series s ON ip.series_id = s.id
        LEFT JOIN investments i ON inv.id = i.investor_id AND s.id = i.series_id AND i.status = 'confirmed'
        WHERE ip.is_active = 1
        AND ip.status IN ('Pending', 'Scheduled')
        """
        
        pending_params = []
        if series_id:
            pending_payouts_query += " AND ip.series_id = %s"
            pending_params.append(series_id)
        
        pending_payouts_query += " ORDER BY ip.payout_date ASC"
        
        pending_result = db.execute_query(pending_payouts_query, tuple(pending_params) if pending_params else None)
        
        pending_payouts = []
        for row in pending_result:
            # Format scheduled timestamp
            scheduled_timestamp_str = 'N/A'
            if row.get('created_at'):
                created_at = row['created_at']
                if isinstance(created_at, str):
                    scheduled_timestamp_str = created_at
                else:
                    scheduled_timestamp_str = created_at.strftime('%d/%m/%Y %H:%M:%S')
            
            # Format payout_date
            payout_date_str = 'N/A'
            if row.get('payout_date'):
                payout_date = row['payout_date']
                if isinstance(payout_date, str):
                    payout_date_str = payout_date
                else:
                    payout_date_str = payout_date.strftime('%d-%b-%Y')
            
            # Get calculated amount from Interest Payout page logic
            investor_code = row.get('investor_code')
            series_id_val = row.get('series_id')
            payout_month = row.get('payout_month')
            
            key = (investor_code, series_id_val, payout_month)
            calculated_amount = calculated_payouts_lookup.get(key, 0)
            
            logger.info(f"⏳ {investor_code} - {payout_month}: Rs.{calculated_amount:.2f}")
            
            pending_payouts.append({
                'series_id': row['series_id'],
                'series_code': row['series_code'] or 'N/A',
                'series_name': row['series_name'] or 'N/A',
                'investor_id': investor_code or 'N/A',
                'investor_name': row['investor_name'] or 'N/A',
                'invested_amount': float(row['invested_amount']) if row['invested_amount'] else 0,
                'payout_month': payout_month or 'N/A',
                'payout_date': payout_date_str,
                'scheduled_timestamp': scheduled_timestamp_str,
                'payout_amount': round(calculated_amount, 2)
            })
        
        logger.info(f"⏳ Pending Payouts: {len(pending_payouts)} records")
        
        # ============================================================
        # TABLE 3: UPCOMING PAYOUTS (Next Month)
        # Use the SAME calculation as Interest Payout Management page - Upcoming Month
        # ============================================================
        
        logger.info(f"📅 Fetching Upcoming Payouts using Interest Payout calculation...")
        
        # Get upcoming month payouts from Interest Payout page logic
        try:
            export_data_upcoming = await get_export_payouts(
                series_id=series_id,
                month_type='upcoming',
                current_user=current_user
            )
        except:
            export_data_upcoming = {'payouts': []}
        
        # Build upcoming payouts list directly from the export data
        upcoming_payouts_list = []
        if export_data_upcoming and 'payouts' in export_data_upcoming:
            for payout in export_data_upcoming['payouts']:
                # Get invested amount - need to query from investments table
                investor_code = payout.get('investor_id')
                series_id_val = payout.get('series_id')
                
                # Query to get invested amount
                invested_amount = 0
                if investor_code and series_id_val:
                    inv_query = """
                    SELECT i.amount
                    FROM investments i
                    INNER JOIN investors inv ON i.investor_id = inv.id
                    WHERE inv.investor_id = %s
                    AND i.series_id = %s
                    AND i.status = 'confirmed'
                    LIMIT 1
                    """
                    inv_result = db.execute_query(inv_query, (investor_code, series_id_val))
                    if inv_result and len(inv_result) > 0:
                        invested_amount = float(inv_result[0]['amount'])
                
                # Get series code
                series_code = 'N/A'
                if series_id_val:
                    series_query = "SELECT series_code FROM ncd_series WHERE id = %s"
                    series_result = db.execute_query(series_query, (series_id_val,))
                    if series_result and len(series_result) > 0:
                        series_code = series_result[0]['series_code']
                
                upcoming_payouts_list.append({
                    'series_id': series_id_val,
                    'series_code': series_code,
                    'series_name': payout.get('series_name', 'N/A'),
                    'investor_id': investor_code or 'N/A',
                    'investor_name': payout.get('investor_name', 'N/A'),
                    'invested_amount': invested_amount,
                    'payout_month': payout.get('interest_month', 'N/A'),
                    'payout_date': payout.get('interest_date', 'N/A'),
                    'scheduled_timestamp': datetime.now().strftime('%d/%m/%Y %H:%M:%S'),
                    'payout_amount': round(float(payout.get('amount', 0)), 2)
                })
                
                logger.info(f"📅 {investor_code} - {payout.get('interest_month')}: Rs.{payout.get('amount', 0):.2f}")
        
        logger.info(f"📅 Upcoming Payouts (Next Month): {len(upcoming_payouts_list)} records")
        
        logger.info("=" * 80)
        logger.info("✅ AUDIT TRAIL REPORT GENERATED SUCCESSFULLY")
        logger.info("=" * 80)
        
        return {
            "filters": {
                "from_date": start_date.strftime('%Y-%m-%d'),
                "to_date": end_date.strftime('%Y-%m-%d'),
                "series_id": series_id
            },
            "summary": summary,
            "investments": investments,
            "completed_payouts": completed_payouts,
            "pending_payouts": pending_payouts,
            "upcoming_payouts": upcoming_payouts_list,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting audit trail report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving audit trail report: {str(e)}"
        )

@router.get("/investor-portfolio")
async def get_investor_portfolio_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    investor_id: Optional[str] = None,
    series_id: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Investor Portfolio Summary Report data
    PERMISSION REQUIRED: view_reports
    Parameters:
    - from_date: Start date (YYYY-MM-DD format) - optional
    - to_date: End date (YYYY-MM-DD format) - optional
    - investor_id: Specific investor ID - optional (if not provided, shows all investors)
    - series_id: Optional series filter
    Returns:
    - Overall summary (if all investors)
    - Investor-wise breakdown
    - Per investor detailed view with investments, payouts, charts data
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_investor_portfolio_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # ============================================================
        # 1. OVERALL SUMMARY (when viewing all investors)
        # ============================================================
        # Get Total Investors
        investor_count_query = """
        SELECT COUNT(DISTINCT investor_id) as total_investors
        FROM investors
        WHERE status = 'active'
        """
        
        investor_params = []
        if investor_id:
            investor_count_query += " AND investor_id = %s"
            investor_params.append(investor_id)
        
        investor_count_result = db.execute_query(investor_count_query, tuple(investor_params) if investor_params else ())
        investor_count_data = investor_count_result[0] if investor_count_result else {}
        total_investors = investor_count_data.get('total_investors', 0) or 0
        
        # Get Total Funds Raised (Total Investments till date - LIFETIME total)
        # Includes both active (confirmed) and exited (cancelled) investments
        funds_query = """
        SELECT COALESCE(SUM(amount), 0) as total_funds_raised
        FROM investments
        WHERE status IN ('confirmed', 'cancelled')
        """
        
        funds_params = []
        if investor_id:
            funds_query += " AND investor_id = (SELECT id FROM investors WHERE investor_id = %s)"
            funds_params.append(investor_id)
        
        if series_id:
            funds_query += " AND series_id = %s"
            funds_params.append(series_id)
        
        funds_result = db.execute_query(funds_query, tuple(funds_params) if funds_params else ())
        funds_data = funds_result[0] if funds_result else {}
        total_funds_raised = float(funds_data.get('total_funds_raised', 0) or 0)
        
        # Get KYC Rejected count
        kyc_query = """
        SELECT COUNT(DISTINCT investor_id) as kyc_rejected_count
        FROM investors
        WHERE status = 'active' 
            AND kyc_status = 'rejected'
        """
        
        kyc_params = []
        if investor_id:
            kyc_query += " AND investor_id = %s"
            kyc_params.append(investor_id)
        
        kyc_result = db.execute_query(kyc_query, tuple(kyc_params) if kyc_params else ())
        kyc_data = kyc_result[0] if kyc_result else {}
        kyc_rejected_count = kyc_data.get('kyc_rejected_count', 0) or 0
        
        # Get Total Payouts - Calculate ACTUAL payouts from series start till current date
        # CRITICAL: Calculate dynamically, then check payment status from interest_payouts table
        # This ensures we show REAL calculated amounts, not just manually imported data
        
        logger.info(f"💸 Calculating Total Payouts for Investor Portfolio dynamically...")
        
        # Initialize total_payouts outside try block
        total_payouts = 0.0
        
        try:
            # Import calculation functions
            from routes.payouts import (
                calculate_monthly_interest,
                calculate_first_month_interest,
                calculate_exit_interest,
                calculate_maturity_interest,
                is_first_payout,
                is_final_payout_after_exit,
                is_last_payout_before_maturity,
                should_skip_payout,
                get_last_payout_date,
                generate_payout_month
            )
            
            # Get all investments (filtered by investor_id and series_id if provided)
            investments_query = """
            SELECT 
                inv.id as investor_db_id,
                i.amount as investment_amount,
                i.exit_date,
                i.status as investment_status,
                i.series_id,
                s.series_start_date,
                s.maturity_date,
                s.interest_rate,
                s.interest_payment_day
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            INNER JOIN ncd_series s ON i.series_id = s.id
            WHERE i.status IN ('confirmed', 'cancelled')
            AND s.series_start_date IS NOT NULL
            """
            
            payout_params = []
            if investor_id:
                investments_query += " AND inv.investor_id = %s"
                payout_params.append(investor_id)
            
            if series_id:
                investments_query += " AND i.series_id = %s"
                payout_params.append(series_id)
            
            investments_result = db.execute_query(investments_query, tuple(payout_params) if payout_params else ())
            
            # Get existing payouts from interest_payouts table for status checking
            existing_payouts_query = """
            SELECT investor_id, series_id, payout_month, status, amount
            FROM interest_payouts
            WHERE is_active = 1
            """
            
            existing_payouts_params = []
            if investor_id:
                existing_payouts_query += " AND investor_id = (SELECT id FROM investors WHERE investor_id = %s)"
                existing_payouts_params.append(investor_id)
            
            if series_id:
                existing_payouts_query += " AND series_id = %s"
                existing_payouts_params.append(series_id)
            
            existing_payouts_result = db.execute_query(existing_payouts_query, tuple(existing_payouts_params) if existing_payouts_params else ())
            existing_payouts_lookup = {}
            for payout in existing_payouts_result:
                key = (payout['investor_id'], payout['series_id'], payout['payout_month'])
                existing_payouts_lookup[key] = {
                    'status': payout['status'],
                    'amount': float(payout['amount'])
                }
            
            # Calculate payouts from series start till current month
            current_date = datetime.now()
            
            # Group investments by series
            series_investments = {}
            for inv_row in investments_result:
                series_id_key = inv_row['series_id']
                if series_id_key not in series_investments:
                    series_investments[series_id_key] = {
                        'series_start_date': inv_row['series_start_date'],
                        'investments': []
                    }
                series_investments[series_id_key]['investments'].append(inv_row)
            
            # Calculate for each series
            for series_id_key, series_data in series_investments.items():
                series_start_date = series_data['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        continue
                
                if not series_start_date or series_start_date > current_date.date():
                    continue
                
                # Calculate from series start month to current month
                start_month_date = series_start_date.replace(day=1)
                current_month_date = current_date.date().replace(day=1)
                
                # Iterate through each month from start to current
                month_date = start_month_date
                while month_date <= current_month_date:
                    interest_year = month_date.year
                    interest_month = month_date.month
                    
                    # Calculate payouts for this month
                    for inv_row in series_data['investments']:
                        # Parse dates
                        inv_series_start = inv_row['series_start_date']
                        if isinstance(inv_series_start, str):
                            try:
                                inv_series_start = datetime.strptime(inv_series_start, '%Y-%m-%d').date()
                            except:
                                inv_series_start = None
                        
                        maturity_date = inv_row['maturity_date']
                        if isinstance(maturity_date, str):
                            try:
                                maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                            except:
                                maturity_date = None
                        
                        exit_date = inv_row['exit_date']
                        if isinstance(exit_date, str):
                            try:
                                exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                            except:
                                exit_date = None
                        
                        # Generate payout date
                        import calendar
                        payment_day = inv_row['interest_payment_day'] or 15
                        max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                        actual_payment_day = min(payment_day, max_day_in_month)
                        payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                        
                        # Get last payout date
                        last_payout_date = get_last_payout_date(
                            inv_series_start if inv_series_start else payout_date_obj,
                            inv_row['interest_payment_day'] or 15,
                            payout_date_obj
                        )
                        
                        # Check if we should skip this payout
                        if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                            continue
                        
                        # Calculate interest amount
                        if inv_series_start and is_first_payout(inv_series_start, interest_month, interest_year):
                            monthly_interest = calculate_first_month_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                inv_series_start,
                                interest_month,
                                interest_year
                            )
                        elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                            monthly_interest = calculate_exit_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                exit_date,
                                interest_month,
                                interest_year
                            )
                        elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                            monthly_interest = calculate_maturity_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                maturity_date,
                                interest_month,
                                interest_year
                            )
                        else:
                            monthly_interest = calculate_monthly_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate'])
                            )
                        
                        # Generate payout month
                        payout_month = generate_payout_month(interest_year, interest_month)
                        
                        # Check status from interest_payouts table
                        payout_key = (inv_row['investor_db_id'], inv_row['series_id'], payout_month)
                        if payout_key in existing_payouts_lookup:
                            payout_status = existing_payouts_lookup[payout_key]['status']
                        else:
                            payout_status = 'Scheduled'
                        
                        # Only count PAID payouts for total
                        if payout_status == 'Paid':
                            total_payouts += monthly_interest
                    
                    # Move to next month
                    if month_date.month == 12:
                        month_date = month_date.replace(year=month_date.year + 1, month=1)
                    else:
                        month_date = month_date.replace(month=month_date.month + 1)
            
            logger.info(f"💸 Total Payouts (Calculated & Paid): ₹{total_payouts:,.2f}")
            
        except Exception as e:
            logger.error(f"❌ Error calculating total payouts: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to interest_payouts table
            payout_query = """
            SELECT COALESCE(SUM(amount), 0) as total_payouts
            FROM interest_payouts
            WHERE status = 'Paid'
            """
            
            payout_params = []
            if investor_id:
                payout_query += " AND investor_id = (SELECT id FROM investors WHERE investor_id = %s)"
                payout_params.append(investor_id)
            
            if series_id:
                payout_query += " AND series_id = %s"
                payout_params.append(series_id)
            
            payout_result = db.execute_query(payout_query, tuple(payout_params) if payout_params else ())
            payout_data = payout_result[0] if payout_result else {}
            total_payouts = float(payout_data.get('total_payouts', 0) or 0)
        
        summary = {
            "total_investors": total_investors,
            "kyc_rejected_count": kyc_rejected_count,
            "total_funds_raised": round(total_funds_raised, 2),
            "total_payouts": round(total_payouts, 2)
        }
        
        # ============================================================
        # 2. INVESTORS DETAILS TABLE (All Personal Information)
        # ============================================================
        investors_details_query = """
        SELECT 
            investor_id,
            full_name,
            email,
            phone,
            dob,
            residential_address,
            correspondence_address,
            pan,
            aadhaar,
            bank_name,
            account_number,
            ifsc_code,
            occupation,
            kyc_status,
            source_of_funds,
            date_joined,
            status
        FROM investors
        WHERE status = 'active'
        """
        
        investors_params = []
        if investor_id:
            investors_details_query += " AND investor_id = %s"
            investors_params.append(investor_id)
        
        investors_details_query += " ORDER BY date_joined DESC"
        
        investors_details_result = db.execute_query(investors_details_query, tuple(investors_params) if investors_params else ())
        
        investors_details = []
        for row in investors_details_result:
            investors_details.append({
                'investor_id': row['investor_id'],
                'full_name': row['full_name'],
                'email': row['email'],
                'phone': row['phone'],
                'dob': row['dob'].strftime('%d/%m/%Y') if row['dob'] else None,
                'residential_address': row['residential_address'],
                'correspondence_address': row['correspondence_address'],
                'pan': row['pan'],
                'aadhaar': row['aadhaar'],
                'bank_name': row['bank_name'],
                'account_number': row['account_number'],
                'ifsc_code': row['ifsc_code'],
                'occupation': row['occupation'],
                'kyc_status': row['kyc_status'],
                'source_of_funds': row['source_of_funds'],
                'date_joined': row['date_joined'].strftime('%d/%m/%Y') if row['date_joined'] else None,
                'status': row['status']
            })
        
        # ============================================================
        # 3. NOMINEE DETAILS TABLE (Separate table for nominee information)
        # ============================================================
        nominee_details_query = """
        SELECT 
            investor_id,
            full_name as investor_name,
            nominee_name,
            nominee_relationship,
            nominee_mobile,
            nominee_email,
            nominee_address
        FROM investors
        WHERE status = 'active'
            AND (nominee_name IS NOT NULL OR nominee_mobile IS NOT NULL OR nominee_email IS NOT NULL)
        """
        
        nominee_params = []
        if investor_id:
            nominee_details_query += " AND investor_id = %s"
            nominee_params.append(investor_id)
        
        nominee_details_query += " ORDER BY full_name ASC"
        
        nominee_details_result = db.execute_query(nominee_details_query, tuple(nominee_params) if nominee_params else ())
        
        nominee_details = []
        for row in nominee_details_result:
            nominee_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'nominee_name': row['nominee_name'],
                'nominee_relationship': row['nominee_relationship'],
                'nominee_mobile': row['nominee_mobile'],
                'nominee_email': row['nominee_email'],
                'nominee_address': row['nominee_address']
            })
        
        # ============================================================
        # 4. INVESTMENTS TABLE (All investment transactions)
        # ============================================================
        investments_table_query = """
        SELECT 
            inv.investor_id,
            inv.full_name as investor_name,
            s.series_code,
            s.name as series_name,
            i.amount,
            i.date_received,
            i.date_transferred,
            i.status,
            i.created_at
        FROM investments i
        JOIN investors inv ON i.investor_id = inv.id
        JOIN ncd_series s ON i.series_id = s.id
        WHERE inv.status = 'active'
        """
        
        investments_params = []
        if investor_id:
            investments_table_query += " AND inv.investor_id = %s"
            investments_params.append(investor_id)
        
        if series_id:
            investments_table_query += " AND i.series_id = %s"
            investments_params.append(series_id)
        
        investments_table_query += " ORDER BY i.date_received DESC, inv.investor_id ASC"
        
        investments_table_result = db.execute_query(investments_table_query, tuple(investments_params) if investments_params else ())
        
        # DEBUG: Log the investments query result
        logger.info(f"Investments table query returned {len(investments_table_result) if investments_table_result else 0} rows")
        if investments_table_result and len(investments_table_result) > 0:
            logger.info(f"First investment row sample: {investments_table_result[0]}")
        
        investments_table = []
        for row in investments_table_result:
            investments_table.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'series_code': row['series_code'],
                'series_name': row['series_name'],
                'amount': float(row['amount'] or 0),
                'date_received': row['date_received'].strftime('%d/%m/%Y') if row['date_received'] else None,
                'date_transferred': row['date_transferred'].strftime('%d/%m/%Y') if row['date_transferred'] else None,
                'status': row['status'],
                'created_at': row['created_at'].strftime('%d/%m/%Y %H:%M') if row['created_at'] else None
            })
        
        logger.info(f"Investments table array has {len(investments_table)} items")
        
        # ============================================================
        # 5. PAYOUTS TABLE (Aggregated payout summary per investor per series)
        # CRITICAL: Calculate ACTUAL payouts from series start till current date
        # Then aggregate by investor and series, showing only PAID amounts
        # ============================================================
        
        logger.info(f"💸 Calculating Payouts Table dynamically...")
        
        try:
            # Import calculation functions
            from routes.payouts import (
                calculate_monthly_interest,
                calculate_first_month_interest,
                calculate_exit_interest,
                calculate_maturity_interest,
                is_first_payout,
                is_final_payout_after_exit,
                is_last_payout_before_maturity,
                should_skip_payout,
                get_last_payout_date,
                generate_payout_month
            )
            
            # Get all investments (filtered by investor_id and series_id if provided)
            investments_query = """
            SELECT 
                inv.id as investor_db_id,
                inv.investor_id,
                inv.full_name as investor_name,
                i.amount as investment_amount,
                i.exit_date,
                i.status as investment_status,
                i.series_id,
                s.series_code,
                s.name as series_name,
                s.series_start_date,
                s.maturity_date,
                s.interest_rate,
                s.interest_payment_day
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            INNER JOIN ncd_series s ON i.series_id = s.id
            WHERE i.status IN ('confirmed', 'cancelled')
            AND inv.status = 'active'
            AND s.series_start_date IS NOT NULL
            """
            
            payouts_params = []
            if investor_id:
                investments_query += " AND inv.investor_id = %s"
                payouts_params.append(investor_id)
            
            if series_id:
                investments_query += " AND i.series_id = %s"
                payouts_params.append(series_id)
            
            investments_query += " ORDER BY inv.investor_id, s.series_code"
            
            investments_result = db.execute_query(investments_query, tuple(payouts_params) if payouts_params else ())
            
            # Get existing payouts from interest_payouts table for status checking
            existing_payouts_query = """
            SELECT investor_id, series_id, payout_month, status, amount, payout_date
            FROM interest_payouts
            WHERE is_active = 1
            """
            
            existing_payouts_params = []
            if investor_id:
                existing_payouts_query += " AND investor_id = (SELECT id FROM investors WHERE investor_id = %s)"
                existing_payouts_params.append(investor_id)
            
            if series_id:
                existing_payouts_query += " AND series_id = %s"
                existing_payouts_params.append(series_id)
            
            existing_payouts_result = db.execute_query(existing_payouts_query, tuple(existing_payouts_params) if existing_payouts_params else ())
            existing_payouts_lookup = {}
            for payout in existing_payouts_result:
                key = (payout['investor_id'], payout['series_id'], payout['payout_month'])
                existing_payouts_lookup[key] = {
                    'status': payout['status'],
                    'amount': float(payout['amount']),
                    'payout_date': payout['payout_date']
                }
            
            # Calculate payouts and aggregate by investor + series
            current_date = datetime.now()
            payouts_aggregated = {}  # Key: (investor_id, series_id)
            
            # Group investments by series to get series start date
            series_investments = {}
            for inv_row in investments_result:
                series_id_key = inv_row['series_id']
                if series_id_key not in series_investments:
                    series_investments[series_id_key] = {
                        'series_start_date': inv_row['series_start_date'],
                        'series_code': inv_row['series_code'],
                        'series_name': inv_row['series_name'],
                        'investments': []
                    }
                series_investments[series_id_key]['investments'].append(inv_row)
            
            # Calculate for each series
            for series_id_key, series_data in series_investments.items():
                series_start_date = series_data['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        continue
                
                if not series_start_date or series_start_date > current_date.date():
                    continue
                
                # Calculate from series start month to current month
                start_month_date = series_start_date.replace(day=1)
                current_month_date = current_date.date().replace(day=1)
                
                # Iterate through each month from start to current
                month_date = start_month_date
                while month_date <= current_month_date:
                    interest_year = month_date.year
                    interest_month = month_date.month
                    
                    # Calculate payouts for this month
                    for inv_row in series_data['investments']:
                        # Parse dates
                        inv_series_start = inv_row['series_start_date']
                        if isinstance(inv_series_start, str):
                            try:
                                inv_series_start = datetime.strptime(inv_series_start, '%Y-%m-%d').date()
                            except:
                                inv_series_start = None
                        
                        maturity_date = inv_row['maturity_date']
                        if isinstance(maturity_date, str):
                            try:
                                maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                            except:
                                maturity_date = None
                        
                        exit_date = inv_row['exit_date']
                        if isinstance(exit_date, str):
                            try:
                                exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                            except:
                                exit_date = None
                        
                        # Generate payout date
                        import calendar
                        payment_day = inv_row['interest_payment_day'] or 15
                        max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
                        actual_payment_day = min(payment_day, max_day_in_month)
                        payout_date_obj = datetime(interest_year, interest_month, actual_payment_day).date()
                        
                        # Get last payout date
                        last_payout_date = get_last_payout_date(
                            inv_series_start if inv_series_start else payout_date_obj,
                            inv_row['interest_payment_day'] or 15,
                            payout_date_obj
                        )
                        
                        # Check if we should skip this payout
                        if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                            continue
                        
                        # Calculate interest amount
                        if inv_series_start and is_first_payout(inv_series_start, interest_month, interest_year):
                            monthly_interest = calculate_first_month_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                inv_series_start,
                                interest_month,
                                interest_year
                            )
                        elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                            monthly_interest = calculate_exit_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                exit_date,
                                interest_month,
                                interest_year
                            )
                        elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                            monthly_interest = calculate_maturity_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate']),
                                maturity_date,
                                interest_month,
                                interest_year
                            )
                        else:
                            monthly_interest = calculate_monthly_interest(
                                float(inv_row['investment_amount']),
                                float(inv_row['interest_rate'])
                            )
                        
                        # Generate payout month
                        payout_month = generate_payout_month(interest_year, interest_month)
                        
                        # Check status from interest_payouts table
                        payout_key = (inv_row['investor_db_id'], inv_row['series_id'], payout_month)
                        if payout_key in existing_payouts_lookup:
                            payout_status = existing_payouts_lookup[payout_key]['status']
                            last_payout_date_value = existing_payouts_lookup[payout_key]['payout_date']
                        else:
                            payout_status = 'Scheduled'
                            last_payout_date_value = None
                        
                        # Only aggregate PAID payouts
                        if payout_status == 'Paid':
                            agg_key = (inv_row['investor_id'], inv_row['investor_name'], inv_row['series_id'], inv_row['series_code'], inv_row['series_name'])
                            if agg_key not in payouts_aggregated:
                                payouts_aggregated[agg_key] = {
                                    'total_amount': 0.0,
                                    'last_payout_date': last_payout_date_value
                                }
                            payouts_aggregated[agg_key]['total_amount'] += monthly_interest
                            # Keep the most recent payout date
                            if last_payout_date_value:
                                if payouts_aggregated[agg_key]['last_payout_date'] is None:
                                    payouts_aggregated[agg_key]['last_payout_date'] = last_payout_date_value
                                elif isinstance(last_payout_date_value, date) and isinstance(payouts_aggregated[agg_key]['last_payout_date'], date):
                                    if last_payout_date_value > payouts_aggregated[agg_key]['last_payout_date']:
                                        payouts_aggregated[agg_key]['last_payout_date'] = last_payout_date_value
                    
                    # Move to next month
                    if month_date.month == 12:
                        month_date = month_date.replace(year=month_date.year + 1, month=1)
                    else:
                        month_date = month_date.replace(month=month_date.month + 1)
            
            # Convert aggregated data to list
            payouts_table = []
            for agg_key, agg_data in payouts_aggregated.items():
                investor_id_val, investor_name, series_id_val, series_code, series_name = agg_key
                
                # Format last payout date
                last_payout_date_str = None
                if agg_data['last_payout_date']:
                    if hasattr(agg_data['last_payout_date'], 'strftime'):
                        last_payout_date_str = agg_data['last_payout_date'].strftime('%d/%m/%Y')
                    else:
                        last_payout_date_str = str(agg_data['last_payout_date'])
                
                payouts_table.append({
                    'investor_id': investor_id_val,
                    'investor_name': investor_name,
                    'series_code': series_code,
                    'series_name': series_name,
                    'total_amount': agg_data['total_amount'],
                    'last_payout_date': last_payout_date_str
                })
            
            # Sort by investor_id and series_code
            payouts_table.sort(key=lambda x: (x['investor_id'], x['series_code']))
            
            logger.info(f"💸 Payouts Table: {len(payouts_table)} records (calculated & paid)")
            
        except Exception as e:
            logger.error(f"❌ Error calculating payouts table: {e}")
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
            # Fallback to interest_payouts table
            payouts_table_query = """
            SELECT 
                inv.investor_id,
                inv.full_name as investor_name,
                s.series_code,
                s.name as series_name,
                SUM(ip.amount) as total_amount,
                MAX(ip.payout_date) as last_payout_date
            FROM interest_payouts ip
            JOIN investors inv ON ip.investor_id = inv.id
            JOIN ncd_series s ON ip.series_id = s.id
            WHERE inv.status = 'active'
                AND ip.status = 'Paid'
            """
            
            payouts_params = []
            if investor_id:
                payouts_table_query += " AND inv.investor_id = %s"
                payouts_params.append(investor_id)
            
            if series_id:
                payouts_table_query += " AND ip.series_id = %s"
                payouts_params.append(series_id)
            
            payouts_table_query += """
            GROUP BY inv.investor_id, inv.full_name, s.series_code, s.name
            ORDER BY inv.investor_id ASC, s.series_code ASC
            """
            
            payouts_table_result = db.execute_query(payouts_table_query, tuple(payouts_params) if payouts_params else ())
            
            payouts_table = []
            for row in payouts_table_result:
                last_payout_date_str = None
                if row['last_payout_date']:
                    if hasattr(row['last_payout_date'], 'strftime'):
                        last_payout_date_str = row['last_payout_date'].strftime('%d/%m/%Y')
                    else:
                        last_payout_date_str = row['last_payout_date']
                
                payouts_table.append({
                    'investor_id': row['investor_id'],
                    'investor_name': row['investor_name'],
                    'series_code': row['series_code'],
                    'series_name': row['series_name'],
                    'total_amount': float(row['total_amount'] or 0),
                    'last_payout_date': last_payout_date_str
                })
        
        # ============================================================
        # 6. GRIEVANCE MANAGEMENT SUMMARY
        # ============================================================
        grievance_summary_query = """
        SELECT 
            COUNT(*) as total_complaints,
            SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_complaints,
            SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_complaints,
            SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_complaints
        FROM grievances
        WHERE is_active = TRUE
        """
        
        grievance_params = []
        if investor_id:
            grievance_summary_query += " AND investor_id = %s"
            grievance_params.append(investor_id)
        
        grievance_summary_result = db.execute_query(grievance_summary_query, tuple(grievance_params) if grievance_params else ())
        grievance_summary_data = grievance_summary_result[0] if grievance_summary_result else {}
        
        total_complaints = grievance_summary_data.get('total_complaints', 0) or 0
        pending_complaints = grievance_summary_data.get('pending_complaints', 0) or 0
        in_progress_complaints = grievance_summary_data.get('in_progress_complaints', 0) or 0
        resolved_complaints = grievance_summary_data.get('resolved_complaints', 0) or 0
        
        # Calculate resolution rate
        resolution_rate = 0.0
        if total_complaints > 0:
            resolution_rate = round((resolved_complaints / total_complaints) * 100, 2)
        
        grievance_summary = {
            "total_complaints": total_complaints,
            "pending_complaints": pending_complaints,
            "in_progress_complaints": in_progress_complaints,
            "resolved_complaints": resolved_complaints,
            "resolution_rate": resolution_rate
        }
        
        # ============================================================
        # 7. INVESTOR GRIEVANCES TABLE (Detailed complaints per investor)
        # ============================================================
        investor_grievances_query = """
        SELECT 
            inv.investor_id,
            inv.full_name as investor_name,
            s.series_code,
            s.name as series_name,
            COUNT(g.id) as total_complaints,
            SUM(CASE WHEN g.status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved_complaints,
            SUM(CASE WHEN g.status IN ('pending', 'in-progress') THEN 1 ELSE 0 END) as unresolved_complaints
        FROM investors inv
        LEFT JOIN grievances g ON g.investor_id = inv.investor_id AND g.is_active = TRUE
        LEFT JOIN ncd_series s ON g.series_id = s.id
        WHERE inv.status = 'active'
        """
        
        grievances_table_params = []
        if investor_id:
            investor_grievances_query += " AND inv.investor_id = %s"
            grievances_table_params.append(investor_id)
        
        if series_id:
            investor_grievances_query += " AND g.series_id = %s"
            grievances_table_params.append(series_id)
        
        investor_grievances_query += """
        GROUP BY inv.investor_id, inv.full_name, s.series_code, s.name
        HAVING total_complaints > 0
        ORDER BY inv.investor_id ASC, s.series_code ASC
        """
        
        investor_grievances_result = db.execute_query(investor_grievances_query, tuple(grievances_table_params) if grievances_table_params else ())
        
        investor_grievances_table = []
        for row in investor_grievances_result:
            investor_grievances_table.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'series_code': row['series_code'] if row['series_code'] else 'General',
                'series_name': row['series_name'] if row['series_name'] else 'Not Series Specific',
                'total_complaints': row['total_complaints'] or 0,
                'resolved_complaints': row['resolved_complaints'] or 0,
                'unresolved_complaints': row['unresolved_complaints'] or 0
            })
        
        # ============================================================
        # 8. INVESTOR-WISE BREAKDOWN TABLE
        # ============================================================
        investor_breakdown_query = """
        SELECT 
            inv.investor_id,
            inv.full_name as investor_name,
            inv.email,
            inv.phone,
            inv.pan,
            COALESCE(SUM(CASE WHEN i.id IS NOT NULL THEN i.amount ELSE 0 END), 0) as total_investment,
            COUNT(DISTINCT CASE WHEN i.series_id IS NOT NULL THEN i.series_id END) as series_count,
            COUNT(CASE WHEN i.id IS NOT NULL THEN i.id END) as investment_count,
            MIN(CASE WHEN i.date_received IS NOT NULL THEN i.date_received END) as first_investment_date,
            MAX(CASE WHEN i.date_received IS NOT NULL THEN i.date_received END) as last_investment_date,
            CASE 
                WHEN COUNT(DISTINCT CASE WHEN s.status = 'active' AND i.series_id IS NOT NULL THEN i.series_id END) > 0 THEN 'Active'
                ELSE 'Inactive'
            END as status
        FROM investors inv
        LEFT JOIN investments i ON inv.id = i.investor_id
        LEFT JOIN ncd_series s ON i.series_id = s.id
        WHERE inv.status = 'active'
        """
        
        params = []
        
        # Add investor filter if provided
        if investor_id:
            investor_breakdown_query += " AND inv.investor_id = %s"
            params.append(investor_id)
        
        # Add series filter if provided
        if series_id:
            investor_breakdown_query += " AND i.series_id = %s"
            params.append(series_id)
        
        investor_breakdown_query += """
        GROUP BY inv.investor_id, inv.full_name, inv.email, inv.phone, inv.pan
        ORDER BY total_investment DESC
        """
        
        investor_breakdown_result = db.execute_query(investor_breakdown_query, tuple(params))
        
        # DEBUG: Log the query result
        logger.info(f"Investor breakdown query returned {len(investor_breakdown_result) if investor_breakdown_result else 0} rows")
        if investor_breakdown_result and len(investor_breakdown_result) > 0:
            logger.info(f"First row sample: {investor_breakdown_result[0]}")
        
        investor_breakdown = []
        for row in investor_breakdown_result:
            investor_breakdown.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'email': row['email'],
                'phone': row['phone'],
                'pan': row['pan'],
                'total_investment': float(row['total_investment'] or 0),
                'series_count': row['series_count'] or 0,
                'investment_count': row['investment_count'] or 0,
                'total_payouts_received': 0,
                'pending_payouts': 0,
                'first_investment_date': row['first_investment_date'].strftime('%d/%m/%Y') if row['first_investment_date'] else None,
                'last_investment_date': row['last_investment_date'].strftime('%d/%m/%Y') if row['last_investment_date'] else None,
                'status': row['status']
            })
        
        logger.info(f"Investor breakdown array has {len(investor_breakdown)} items")
        
        # ============================================================
        # 9. DETAILED INVESTOR DATA (per investor)
        # ============================================================
        detailed_investor_data = []
        
        # Get list of investors to process
        investors_to_process = []
        if investor_id:
            # Single investor
            investors_to_process = [inv for inv in investor_breakdown if inv['investor_id'] == investor_id]
        else:
            # All investors (limit to top 50 for performance)
            investors_to_process = investor_breakdown[:50]
        
        for investor in investors_to_process:
            inv_id = investor['investor_id']
            
            # A. Investment Summary (already have from breakdown)
            investment_summary = {
                'total_invested': investor['total_investment'],
                'number_of_series': investor['series_count'],
                'number_of_investments': investor['investment_count'],
                'average_investment_size': round(investor['total_investment'] / investor['investment_count'], 2) if investor['investment_count'] > 0 else 0,
                'first_investment_date': investor['first_investment_date'],
                'last_investment_date': investor['last_investment_date']
            }
            
            # B. Series-wise Investment Details
            series_investments_query = """
            SELECT 
                s.series_code,
                s.name as series_name,
                i.amount as investment_amount,
                i.date_received,
                i.date_transferred,
                s.interest_rate,
                s.interest_frequency,
                s.maturity_date,
                CASE 
                    WHEN CURDATE() < s.maturity_date THEN 'Active'
                    WHEN CURDATE() >= s.maturity_date THEN 'Matured'
                    ELSE s.status
                END as status
            FROM investments i
            JOIN ncd_series s ON i.series_id = s.id
            WHERE i.investor_id = %s 
                AND i.status = 'confirmed'
            """
            
            series_params = [inv_id]
            
            if series_id:
                series_investments_query += " AND i.series_id = %s"
                series_params.append(series_id)
            
            series_investments_query += " ORDER BY i.date_received DESC"
            
            series_investments_result = db.execute_query(series_investments_query, tuple(series_params))
            
            series_investments = []
            for row in series_investments_result:
                series_investments.append({
                    'series_code': row['series_code'],
                    'series_name': row['series_name'],
                    'investment_amount': float(row['investment_amount'] or 0),
                    'date_received': row['date_received'].strftime('%d/%m/%Y') if row['date_received'] else None,
                    'date_transferred': row['date_transferred'].strftime('%d/%m/%Y') if row['date_transferred'] else None,
                    'interest_rate': float(row['interest_rate'] or 0),
                    'interest_frequency': row['interest_frequency'],
                    'maturity_date': row['maturity_date'].strftime('%d/%m/%Y') if row['maturity_date'] else None,
                    'status': row['status']
                })
            
            # C. Payout History Summary - DISABLED (no payouts table)
            payout_history = {
                'total_payouts_received': 0,
                'paid_count': 0,
                'paid_amount': 0,
                'pending_count': 0,
                'pending_amount': 0,
                'last_payout_date': None,
                'next_expected_payout': None
            }
            
            # D. Payout Details Table - DISABLED (no payouts table)
            payout_details = []
            
            # E. KYC & Compliance Status
            kyc_query = """
            SELECT 
                kyc_status
            FROM investors
            WHERE investor_id = %s
            """
            
            kyc_result = db.execute_query(kyc_query, (inv_id,))
            kyc_data = kyc_result[0] if kyc_result else {}
            
            kyc_status = {
                'kyc_status': kyc_data.get('kyc_status', 'Pending'),
                'last_updated_date': None
            }
            
            # F. Bank Details
            bank_query = """
            SELECT 
                bank_name,
                account_number,
                ifsc_code
            FROM investors
            WHERE investor_id = %s
            """
            
            bank_result = db.execute_query(bank_query, (inv_id,))
            bank_data = bank_result[0] if bank_result else {}
            
            bank_details = {
                'bank_name': bank_data.get('bank_name'),
                'account_number': bank_data.get('account_number'),
                'ifsc_code': bank_data.get('ifsc_code')
            }
            
            # G. CHART DATA - Investment Distribution by Series (Pie Chart)
            investment_by_series_query = """
            SELECT 
                s.series_code,
                s.name as series_name,
                SUM(i.amount) as total_amount
            FROM investments i
            JOIN ncd_series s ON i.series_id = s.id
            WHERE i.investor_id = %s 
                AND i.status = 'confirmed'
            """
            
            chart_params = [inv_id]
            
            if series_id:
                investment_by_series_query += " AND i.series_id = %s"
                chart_params.append(series_id)
            
            investment_by_series_query += " GROUP BY s.series_code, s.name ORDER BY total_amount DESC"
            
            investment_by_series_result = db.execute_query(investment_by_series_query, tuple(chart_params))
            
            investment_distribution = []
            for row in investment_by_series_result:
                investment_distribution.append({
                    'series_code': row['series_code'],
                    'series_name': row['series_name'],
                    'amount': float(row['total_amount'] or 0)
                })
            
            # H. CHART DATA - Yearly Investment Trend (Line/Bar Chart)
            yearly_investment_query = """
            SELECT 
                YEAR(i.date_received) as year,
                SUM(i.amount) as total_amount,
                COUNT(i.id) as investment_count
            FROM investments i
            WHERE i.investor_id = %s 
                AND i.status = 'confirmed'
            """
            
            yearly_params = [inv_id]
            
            if series_id:
                yearly_investment_query += " AND i.series_id = %s"
                yearly_params.append(series_id)
            
            yearly_investment_query += " GROUP BY YEAR(i.date_received) ORDER BY year ASC"
            
            yearly_investment_result = db.execute_query(yearly_investment_query, tuple(yearly_params))
            
            yearly_investment_trend = []
            for row in yearly_investment_result:
                yearly_investment_trend.append({
                    'year': str(row['year']),
                    'total_amount': float(row['total_amount'] or 0),
                    'investment_count': row['investment_count'] or 0
                })
            
            # I. CHART DATA - Payout Trend Over Time - DISABLED (no payouts table)
            payout_trend = []
            
            # J. CHART DATA - Payout Status Distribution - DISABLED (no payouts table)
            payout_status_distribution = []
            
            # Compile all data for this investor
            detailed_investor_data.append({
                'investor_id': inv_id,
                'investor_name': investor['investor_name'],
                'email': investor['email'],
                'phone': investor['phone'],
                'pan': investor['pan'],
                'investment_summary': investment_summary,
                'series_investments': series_investments,
                'payout_history': payout_history,
                'payout_details': payout_details,
                'kyc_status': kyc_status,
                'bank_details': bank_details,
                'investment_distribution': investment_distribution,
                'yearly_investment_trend': yearly_investment_trend,
                'payout_trend': payout_trend,
                'payout_status_distribution': payout_status_distribution
            })
        
        # ============================================================
        # RETURN COMPLETE REPORT DATA
        # ============================================================
        return {
            "summary": summary,
            "investors_details": investors_details,
            "nominee_details": nominee_details,
            "investments_table": investments_table,
            "payouts_table": payouts_table,
            "grievance_summary": grievance_summary,
            "investor_grievances_table": investor_grievances_table,
            "investor_breakdown": investor_breakdown,
            "detailed_investor_data": detailed_investor_data,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error getting investor portfolio report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving investor portfolio report: {str(e)}"
        )


@router.get("/sebi-disclosure")
async def get_sebi_disclosure_report(
    series_id: Optional[int] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get SEBI Disclosure Report
    PERMISSION REQUIRED: view_reports
    
    Parameters:
    - series_id: Optional filter by specific series
    
    Returns:
    - Summary: total_series, active_series, avg_interest_rate, avg_investment_per_series
    - Series Details: Complete SEBI-required information for each series
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_sebi_disclosure_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        logger.info("=" * 80)
        logger.info("📊 GENERATING SEBI DISCLOSURE REPORT")
        logger.info("=" * 80)
        
        # Build WHERE clause for series filter
        series_where_clause = "s.is_active = 1"
        series_params = []
        
        if series_id:
            series_where_clause += " AND s.id = %s"
            series_params.append(series_id)
            logger.info(f"🔍 Filtering by series_id: {series_id}")
        
        # ============================================================
        # QUERY 1: SUMMARY STATISTICS
        # ============================================================
        
        # Total Series Count
        total_series_query = f"""
        SELECT COUNT(*) as total_series
        FROM ncd_series s
        WHERE {series_where_clause}
        """
        total_series_result = db.execute_query(total_series_query, tuple(series_params) if series_params else None)
        total_series = total_series_result[0]['total_series'] if total_series_result else 0
        
        # Active Series Count (status = 'active')
        active_series_query = f"""
        SELECT COUNT(*) as active_series
        FROM ncd_series s
        WHERE {series_where_clause}
        AND s.status = 'active'
        """
        active_series_result = db.execute_query(active_series_query, tuple(series_params) if series_params else None)
        active_series = active_series_result[0]['active_series'] if active_series_result else 0
        
        # Average Interest Rate
        avg_interest_query = f"""
        SELECT AVG(s.interest_rate) as avg_interest_rate
        FROM ncd_series s
        WHERE {series_where_clause}
        """
        avg_interest_result = db.execute_query(avg_interest_query, tuple(series_params) if series_params else None)
        avg_interest_rate = float(avg_interest_result[0]['avg_interest_rate'] or 0) if avg_interest_result else 0
        
        # Average Investment Per Series
        avg_investment_query = f"""
        SELECT 
            AVG(series_investment) as avg_investment_per_series
        FROM (
            SELECT 
                s.id,
                COALESCE(SUM(i.amount), 0) as series_investment
            FROM ncd_series s
            LEFT JOIN investments i ON s.id = i.series_id AND i.status = 'confirmed'
            WHERE {series_where_clause}
            GROUP BY s.id
        ) as series_totals
        """
        avg_investment_result = db.execute_query(avg_investment_query, tuple(series_params) if series_params else None)
        avg_investment_per_series = float(avg_investment_result[0]['avg_investment_per_series'] or 0) if avg_investment_result else 0
        
        logger.info(f"📈 Summary: {total_series} total series, {active_series} active, avg interest: {avg_interest_rate:.2f}%")
        
        # ============================================================
        # QUERY 2: SERIES DETAILS (SEBI Required Information)
        # ============================================================
        
        series_details_query = f"""
        SELECT 
            s.id,
            s.series_code,
            s.name as series_name,
            s.status,
            s.issue_date,
            s.maturity_date,
            s.tenure,
            s.target_amount,
            s.interest_rate,
            s.interest_frequency,
            s.credit_rating,
            s.security_type,
            s.debenture_trustee_name,
            s.face_value,
            s.total_issue_size,
            s.subscription_start_date,
            s.subscription_end_date,
            COALESCE(SUM(CASE WHEN i.status = 'confirmed' THEN i.amount ELSE 0 END), 0) as funds_raised,
            COUNT(DISTINCT CASE WHEN i.status = 'confirmed' THEN i.investor_id END) as investor_count
        FROM ncd_series s
        LEFT JOIN investments i ON s.id = i.series_id
        WHERE {series_where_clause}
        GROUP BY s.id, s.series_code, s.name, s.status, s.issue_date, s.maturity_date, 
                 s.tenure, s.target_amount, s.interest_rate, s.interest_frequency, 
                 s.credit_rating, s.security_type, s.debenture_trustee_name, 
                 s.face_value, s.total_issue_size, s.subscription_start_date, s.subscription_end_date
        ORDER BY s.series_code
        """
        
        series_details_result = db.execute_query(series_details_query, tuple(series_params) if series_params else None)
        
        logger.info(f"📋 Retrieved {len(series_details_result)} series for SEBI disclosure")
        
        # Process series details
        series_details = []
        
        for row in series_details_result:
            series_id_current = row['id']
            funds_raised = float(row['funds_raised'] or 0)
            target_amount = float(row['target_amount'] or 0)
            
            # Calculate subscription percentage
            subscription_percentage = (funds_raised / target_amount * 100) if target_amount > 0 else 0
            
            # Get allotment date (earliest confirmed investment date for this series)
            allotment_query = """
            SELECT MIN(date_received) as allotment_date
            FROM investments
            WHERE series_id = %s AND status = 'confirmed'
            """
            allotment_result = db.execute_query(allotment_query, (series_id_current,))
            allotment_date = allotment_result[0]['allotment_date'] if allotment_result and allotment_result[0]['allotment_date'] else None
            
            # Calculate outstanding amount (funds raised - any redemptions if applicable)
            # For now, outstanding = funds_raised (no redemption tracking yet)
            outstanding_amount = funds_raised
            
            # Format dates
            issue_date_str = row['issue_date'].strftime('%d/%m/%Y') if row['issue_date'] else ''
            maturity_date_str = row['maturity_date'].strftime('%d/%m/%Y') if row['maturity_date'] else ''
            allotment_date_str = allotment_date.strftime('%d/%m/%Y') if allotment_date else ''
            subscription_start_str = row['subscription_start_date'].strftime('%d/%m/%Y') if row['subscription_start_date'] else ''
            subscription_end_str = row['subscription_end_date'].strftime('%d/%m/%Y') if row['subscription_end_date'] else ''
            
            series_details.append({
                'series_id': series_id_current,
                'series_code': row['series_code'],
                'series_name': row['series_name'],
                'status': row['status'],
                'issue_date': issue_date_str,
                'allotment_date': allotment_date_str,
                'maturity_date': maturity_date_str,
                'tenure_days': row['tenure'] or 0,
                'subscription_start_date': subscription_start_str,
                'subscription_end_date': subscription_end_str,
                'target_amount': target_amount,
                'funds_raised': funds_raised,
                'outstanding_amount': outstanding_amount,
                'subscription_percentage': round(subscription_percentage, 2),
                'interest_rate': float(row['interest_rate'] or 0),
                'interest_frequency': row['interest_frequency'] or '',
                'credit_rating': row['credit_rating'] or 'Not Rated',
                'security_type': row['security_type'] or '',
                'debenture_trustee_name': row['debenture_trustee_name'] or '',
                'face_value': float(row['face_value'] or 0),
                'total_issue_size': float(row['total_issue_size'] or 0),
                'investor_count': row['investor_count'] or 0
            })
            
            logger.info(f"  ✓ {row['series_code']}: {funds_raised:,.2f} / {target_amount:,.2f} ({subscription_percentage:.1f}%)")
        
        # ============================================================
        # PREPARE SUMMARY
        # ============================================================
        
        summary = {
            'total_series': total_series,
            'active_series': active_series,
            'avg_interest_rate': round(avg_interest_rate, 2),
            'avg_investment_per_series': round(avg_investment_per_series, 2)
        }
        
        # ============================================================
        # QUERY 3: PAYMENT COMPLIANCE & DEFAULTS (LODR Regulation 57)
        # ============================================================
        
        logger.info("📋 Fetching Payment Compliance data...")
        
        # Import calculation functions from payouts module
        from routes.payouts import (
            calculate_monthly_interest,
            calculate_first_month_interest,
            calculate_exit_interest,
            calculate_maturity_interest,
            is_first_payout,
            is_final_payout_after_exit,
            is_last_payout_before_maturity,
            should_skip_payout,
            get_last_payout_date
        )
        from datetime import date
        import calendar
        
        # Calculate upcoming obligations dynamically (next 90 days = next 3 months)
        current_date = datetime.now()
        
        # Get investments for calculation
        investments_query = f"""
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            i.id as investment_id,
            i.amount as investment_amount,
            i.exit_date,
            i.status as investment_status,
            i.series_id,
            s.series_code,
            s.name as series_name,
            s.interest_rate,
            s.interest_payment_day,
            s.series_start_date,
            s.maturity_date,
            s.lock_in_date
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        AND {series_where_clause}
        ORDER BY inv.investor_id, s.name
        """
        
        investments_result = db.execute_query(investments_query, tuple(series_params) if series_params else None)
        
        # Calculate payouts for next 3 months
        # CRITICAL: Interest for month X is PAID in month X+1
        # So for upcoming payouts in months M1, M2, M3, we calculate interest for M1-1, M2-1, M3-1
        upcoming_obligations = []
        upcoming_by_series_month = {}  # Track by (series_id, payout_month) for aggregation
        
        for month_offset in range(1, 4):  # Next 3 months (payout months)
            payout_month = current_date.month + month_offset
            payout_year = current_date.year
            
            # Handle year rollover
            while payout_month > 12:
                payout_month -= 12
                payout_year += 1
            
            # Calculate interest for the PREVIOUS month (interest month)
            interest_month = payout_month - 1
            interest_year = payout_year
            if interest_month < 1:
                interest_month = 12
                interest_year -= 1
            
            payout_month_str = f"{payout_year}-{payout_month:02d}"
            
            for row in investments_result:
                # Get series start date
                series_start_date = row['series_start_date']
                if isinstance(series_start_date, str):
                    try:
                        series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                    except:
                        series_start_date = None
                
                # Skip if series hasn't started yet in the interest month
                if series_start_date:
                    series_start_year_month = series_start_date.year * 12 + series_start_date.month
                    interest_year_month = interest_year * 12 + interest_month
                    if series_start_year_month > interest_year_month:
                        continue
                
                # Get maturity date
                maturity_date = row.get('maturity_date')
                if isinstance(maturity_date, str):
                    try:
                        maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                    except:
                        maturity_date = None
                
                # Get exit date
                exit_date = row.get('exit_date')
                if isinstance(exit_date, str):
                    try:
                        exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                    except:
                        exit_date = None
                
                # Generate payout date (in payout month)
                payment_day = row['interest_payment_day'] or 15
                max_day_in_month = calendar.monthrange(payout_year, payout_month)[1]
                actual_payment_day = min(payment_day, max_day_in_month)
                
                payout_date_obj = date(payout_year, payout_month, actual_payment_day)
                
                # Get last payout date for period calculation
                last_payout_date = get_last_payout_date(
                    series_start_date if series_start_date else payout_date_obj,
                    row['interest_payment_day'] or 15,
                    payout_date_obj
                )
                
                # Check if we should skip this payout
                if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                    continue
                
                # Calculate interest amount for the INTEREST MONTH (previous month)
                if series_start_date and is_first_payout(series_start_date, interest_month, interest_year):
                    monthly_interest = calculate_first_month_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        series_start_date,
                        interest_month,
                        interest_year
                    )
                elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                    monthly_interest = calculate_exit_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        exit_date,
                        interest_month,
                        interest_year
                    )
                elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                    monthly_interest = calculate_maturity_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        maturity_date,
                        interest_month,
                        interest_year
                    )
                else:
                    monthly_interest = calculate_monthly_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate'])
                    )
                
                # Aggregate by series and payout month
                key = (row['series_id'], payout_month_str)
                if key not in upcoming_by_series_month:
                    upcoming_by_series_month[key] = {
                        'series_id': row['series_id'],
                        'series_code': row['series_code'],
                        'series_name': row['series_name'],
                        'payout_date': payout_date_obj,
                        'payout_month': payout_month_str,
                        'amount': 0.0,
                        'investor_count': set()
                    }
                
                upcoming_by_series_month[key]['amount'] += monthly_interest
                upcoming_by_series_month[key]['investor_count'].add(row['investor_id'])
        
        # Convert to list and check status in interest_payouts table
        for key, data in upcoming_by_series_month.items():
            # Check if this payout exists in interest_payouts table and get status
            status_query = """
            SELECT status
            FROM interest_payouts
            WHERE series_id = %s AND payout_month = %s
            LIMIT 1
            """
            status_result = db.execute_query(status_query, (data['series_id'], data['payout_month']))
            payout_status = status_result[0]['status'] if status_result and len(status_result) > 0 else 'Scheduled'
            
            upcoming_obligations.append({
                'series_code': data['series_code'],
                'series_name': data['series_name'],
                'payout_date': data['payout_date'].strftime('%d-%b-%Y'),  # Format as DD-Mon-YYYY
                'payout_month': data['payout_month'],
                'amount': round(data['amount'], 2),
                'status': payout_status,
                'investor_count': len(data['investor_count'])
            })
        
        # Sort by payout date
        upcoming_obligations.sort(key=lambda x: datetime.strptime(x['payout_date'], '%d-%b-%Y'))
        
        logger.info(f"📅 Calculated {len(upcoming_obligations)} upcoming obligations for next 90 days")
        
        # Calculate ALL historical payouts dynamically from series start till current date
        payment_records = []
        all_payouts_by_series_month = {}
        
        # Calculate from series start till current month
        for row in investments_result:
            series_start_date = row['series_start_date']
            if isinstance(series_start_date, str):
                try:
                    series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                except:
                    continue
            
            if not series_start_date:
                continue
            
            # Get maturity date
            maturity_date = row.get('maturity_date')
            if isinstance(maturity_date, str):
                try:
                    maturity_date = datetime.strptime(maturity_date, '%Y-%m-%d').date()
                except:
                    maturity_date = None
            
            # Get exit date
            exit_date = row.get('exit_date')
            if isinstance(exit_date, str):
                try:
                    exit_date = datetime.strptime(exit_date, '%Y-%m-%d').date()
                except:
                    exit_date = None
            
            # Calculate interest from series start month till current month
            # Payouts happen in the NEXT month
            interest_year = series_start_date.year
            interest_month = series_start_date.month
            
            while (interest_year < current_date.year) or (interest_year == current_date.year and interest_month <= current_date.month):
                # Payout happens in the NEXT month
                payout_month = interest_month + 1
                payout_year = interest_year
                if payout_month > 12:
                    payout_month = 1
                    payout_year += 1
                
                payout_month_str = f"{payout_year}-{payout_month:02d}"
                
                # Generate payout date (in payout month)
                payment_day = row['interest_payment_day'] or 15
                max_day_in_month = calendar.monthrange(payout_year, payout_month)[1]
                actual_payment_day = min(payment_day, max_day_in_month)
                
                payout_date_obj = date(payout_year, payout_month, actual_payment_day)
                
                # Get last payout date
                last_payout_date = get_last_payout_date(
                    series_start_date,
                    row['interest_payment_day'] or 15,
                    payout_date_obj
                )
                
                # Check if we should skip
                if not should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                    # Calculate interest for the INTEREST MONTH (not payout month)
                    if is_first_payout(series_start_date, interest_month, interest_year):
                        monthly_interest = calculate_first_month_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            series_start_date,
                            interest_month,
                            interest_year
                        )
                    elif exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                        monthly_interest = calculate_exit_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            exit_date,
                            interest_month,
                            interest_year
                        )
                    elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                        monthly_interest = calculate_maturity_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate']),
                            maturity_date,
                            interest_month,
                            interest_year
                        )
                    else:
                        monthly_interest = calculate_monthly_interest(
                            float(row['investment_amount']),
                            float(row['interest_rate'])
                        )
                    
                    # Aggregate by series and PAYOUT month
                    key = (row['series_id'], payout_month_str)
                    if key not in all_payouts_by_series_month:
                        all_payouts_by_series_month[key] = {
                            'series_id': row['series_id'],
                            'series_code': row['series_code'],
                            'series_name': row['series_name'],
                            'payout_date': payout_date_obj,
                            'payout_month': payout_month_str,
                            'amount': 0.0
                        }
                    
                    all_payouts_by_series_month[key]['amount'] += monthly_interest
                
                # Move to next interest month
                interest_month += 1
                if interest_month > 12:
                    interest_month = 1
                    interest_year += 1
        
        # Check status in interest_payouts table and build payment records
        payouts_paid_count = 0
        total_paid_amount = 0.0
        total_overdue_amount = 0.0
        
        for key, data in all_payouts_by_series_month.items():
            # Check status in interest_payouts table
            status_query = """
            SELECT status, paid_date, payout_date
            FROM interest_payouts
            WHERE series_id = %s AND payout_month = %s
            LIMIT 1
            """
            status_result = db.execute_query(status_query, (data['series_id'], data['payout_month']))
            
            if status_result and len(status_result) > 0:
                payout_status = status_result[0]['status']
                
                if payout_status == 'Paid':
                    payouts_paid_count += 1
                    total_paid_amount += data['amount']
            else:
                payout_status = 'Scheduled'
            
            # Check if overdue
            if payout_status in ('Pending', 'Scheduled') and data['payout_date'] < current_date.date():
                total_overdue_amount += data['amount']
            
            payment_records.append({
                'series_code': data['series_code'],
                'series_name': data['series_name'],
                'payout_date': data['payout_date'].strftime('%d-%b-%Y'),  # Format as DD-Mon-YYYY
                'payout_month': data['payout_month'],
                'amount': round(data['amount'], 2),
                'status': payout_status
            })
        
        # Sort by payout date descending and limit to 100
        payment_records.sort(key=lambda x: datetime.strptime(x['payout_date'], '%d-%b-%Y'), reverse=True)
        payment_records = payment_records[:100]
        
        # ============================================================
        # QUERY 4: INVESTOR GRIEVANCE MECHANISM (LODR Regulation 13)
        # ============================================================
        
        logger.info("📋 Fetching Investor Grievance data...")
        
        # Simple grievance counts - no quarter complexity
        
        # Total grievances (all time)
        total_grievances_query = """
        SELECT COUNT(*) as count
        FROM grievances
        WHERE is_active = 1
        """
        total_grievances_result = db.execute_query(total_grievances_query)
        total_grievances = total_grievances_result[0]['count'] if total_grievances_result else 0
        
        # Open grievances (pending resolution)
        open_grievances_query = """
        SELECT COUNT(*) as count
        FROM grievances
        WHERE is_active = 1
        AND status IN ('pending', 'in-progress')
        """
        open_grievances_result = db.execute_query(open_grievances_query)
        open_grievances = open_grievances_result[0]['count'] if open_grievances_result else 0
        
        # Resolved grievances (all time)
        resolved_grievances_query = """
        SELECT COUNT(*) as count
        FROM grievances
        WHERE is_active = 1
        AND status IN ('resolved', 'closed')
        """
        resolved_grievances_result = db.execute_query(resolved_grievances_query)
        resolved_grievances = resolved_grievances_result[0]['count'] if resolved_grievances_result else 0
        
        # High priority grievances (open)
        high_priority_query = """
        SELECT COUNT(*) as count
        FROM grievances
        WHERE is_active = 1
        AND status IN ('pending', 'in-progress')
        AND priority IN ('high', 'critical')
        """
        high_priority_result = db.execute_query(high_priority_query)
        high_priority_grievances = high_priority_result[0]['count'] if high_priority_result else 0
        
        grievance_summary = {
            'total_grievances': total_grievances,
            'open_grievances': open_grievances,
            'resolved_grievances': resolved_grievances,
            'high_priority_grievances': high_priority_grievances
        }
        
        # Get detailed grievance records
        grievance_details_query = """
        SELECT 
            g.grievance_id,
            g.investor_id,
            i.full_name as investor_name,
            g.series_id,
            s.series_code,
            g.category,
            g.grievance_type,
            g.description,
            g.status,
            g.priority,
            g.created_at,
            g.resolved_at,
            CASE 
                WHEN g.resolved_at IS NOT NULL THEN DATEDIFF(g.resolved_at, g.created_at)
                ELSE DATEDIFF(CURDATE(), g.created_at)
            END as days_pending
        FROM grievances g
        LEFT JOIN investors i ON g.investor_id = i.investor_id
        LEFT JOIN ncd_series s ON g.series_id = s.id
        WHERE g.is_active = 1
        ORDER BY g.created_at DESC
        LIMIT 50
        """
        grievance_details_result = db.execute_query(grievance_details_query)
        
        grievance_records = []
        for row in grievance_details_result:
            # Safely format created_at
            created_at_str = ''
            if row['created_at']:
                if isinstance(row['created_at'], str):
                    created_at_str = row['created_at']
                else:
                    created_at_str = row['created_at'].strftime('%d/%m/%Y')
            
            # Safely format resolved_at
            resolved_at_str = 'Pending'
            if row['resolved_at']:
                if isinstance(row['resolved_at'], str):
                    resolved_at_str = row['resolved_at']
                else:
                    resolved_at_str = row['resolved_at'].strftime('%d/%m/%Y')
            
            grievance_records.append({
                'grievance_id': row['grievance_id'],
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'] or 'N/A',
                'series_code': row['series_code'] or 'General',
                'category': row['category'] or 'N/A',
                'grievance_type': row['grievance_type'] or 'N/A',
                'description': row['description'] or '',
                'status': row['status'],
                'priority': row['priority'] or 'Medium',
                'filed_date': created_at_str,
                'resolved_date': resolved_at_str,
                'days_pending': row['days_pending'] or 0
            })
        
        logger.info(f"📞 Grievance Summary: Total: {total_grievances}, Open: {open_grievances}, Resolved: {resolved_grievances}, High Priority: {high_priority_grievances}")
        
        # ============================================================
        # 4. CONTINUOUS COMPLIANCE TRACKING (LODR Regulation 46)
        # ============================================================
        
        logger.info("=" * 80)
        logger.info("📋 SECTION 4: CONTINUOUS COMPLIANCE TRACKING")
        logger.info("=" * 80)
        
        # Get master item counts for each section (26 pre, 11 post, 5 recurring)
        master_counts_query = """
        SELECT 
            section,
            COUNT(*) as total_items
        FROM compliance_master_items
        WHERE is_active = 1
        GROUP BY section
        """
        master_counts = db.execute_query(master_counts_query)
        
        # Default totals
        pre_total = 26
        post_total = 11
        recurring_total = 5
        
        for mc_row in master_counts:
            if mc_row['section'] == 'pre':
                pre_total = mc_row['total_items']
            elif mc_row['section'] == 'post':
                post_total = mc_row['total_items']
            elif mc_row['section'] == 'recurring':
                recurring_total = mc_row['total_items']
        
        total_compliance_items = pre_total + post_total + recurring_total
        
        # Build compliance attention items for each series
        compliance_attention_items = []
        
        # Track totals across all series
        total_pre_pending = 0
        total_post_pending = 0
        total_recurring_pending = 0
        total_pre_completed = 0
        total_post_completed = 0
        total_recurring_completed = 0
        
        for series_row in series_details:
            series_id = series_row['series_id']
            series_code = series_row['series_code']
            
            # Get compliance document counts by section for this series
            compliance_sections_query = """
            SELECT 
                section,
                COUNT(*) as total_items,
                SUM(CASE WHEN status IN ('received', 'submitted') THEN 1 ELSE 0 END) as completed_items
            FROM series_compliance_status
            WHERE series_id = %s
            GROUP BY section
            """
            sections_result = db.execute_query(compliance_sections_query, (series_id,))
            
            # Create lookup for section counts
            section_counts = {}
            for sec_row in sections_result:
                section_counts[sec_row['section']] = {
                    'total': sec_row['total_items'],
                    'completed': sec_row['completed_items'] or 0
                }
            
            # Calculate pending documents for each section
            pre_completed = section_counts.get('pre', {}).get('completed', 0)
            post_completed = section_counts.get('post', {}).get('completed', 0)
            recurring_completed = section_counts.get('recurring', {}).get('completed', 0)
            
            pre_pending = pre_total - pre_completed
            post_pending = post_total - post_completed
            recurring_pending = recurring_total - recurring_completed
            
            # Add to totals
            total_pre_pending += pre_pending
            total_post_pending += post_pending
            total_recurring_pending += recurring_pending
            total_pre_completed += pre_completed
            total_post_completed += post_completed
            total_recurring_completed += recurring_completed
            
            # Add to attention items if there are pending items
            if pre_pending > 0 or post_pending > 0 or recurring_pending > 0:
                compliance_attention_items.append({
                    'series_code': series_code,
                    'series_name': series_row['series_name'],
                    'pre_compliance_pending': pre_pending,
                    'pre_compliance_completed': pre_completed,
                    'pre_compliance_total': pre_total,
                    'post_compliance_pending': post_pending,
                    'post_compliance_completed': post_completed,
                    'post_compliance_total': post_total,
                    'recurring_compliance_pending': recurring_pending,
                    'recurring_compliance_completed': recurring_completed,
                    'recurring_compliance_total': recurring_total
                })
        
        # Calculate summary statistics
        total_completed = total_pre_completed + total_post_completed + total_recurring_completed
        total_pending = total_pre_pending + total_post_pending + total_recurring_pending
        total_expected = total_compliance_items * len(series_details)
        compliance_rate = (total_completed / total_expected * 100) if total_expected > 0 else 0
        
        compliance_tracking_summary = {
            'total_compliance_items': total_compliance_items,
            'total_series': len(series_details),
            'total_completed': total_completed,
            'total_pending': total_pending,
            'compliance_rate': round(compliance_rate, 1),
            'series_with_pending': len(compliance_attention_items)
        }
        
        logger.info(f"📋 Compliance Tracking: {len(compliance_attention_items)} series with pending compliance, {compliance_rate:.1f}% completion rate")
        
        logger.info("=" * 80)
        logger.info("✅ SEBI DISCLOSURE REPORT GENERATED SUCCESSFULLY")
        logger.info("=" * 80)
        
        # ============================================================
        # RETURN COMPLETE REPORT DATA
        # ============================================================
        
        return {
            "summary": summary,
            "series_details": series_details,
            "upcoming_obligations": upcoming_obligations,
            "payment_records": payment_records,
            "grievance_summary": grievance_summary,
            "grievance_records": grievance_records,
            "compliance_tracking_summary": compliance_tracking_summary,
            "compliance_attention_items": compliance_attention_items,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error generating SEBI disclosure report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving SEBI disclosure report: {str(e)}"
        )


@router.get("/daily-activity")
async def get_daily_activity_report(
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    role: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Daily Activity Report data
    Shows user activity including login/logout times and time spent
    PERMISSION REQUIRED: view_reports
    """
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("📊 GENERATING DAILY ACTIVITY REPORT")
        logger.info("=" * 80)
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_daily_activity_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Parse dates or use defaults (last 7 days)
        if from_date:
            start_date = datetime.strptime(from_date, '%Y-%m-%d').date()
        else:
            start_date = date.today() - timedelta(days=7)
        
        if to_date:
            end_date = datetime.strptime(to_date, '%Y-%m-%d').date()
        else:
            end_date = date.today()
        
        logger.info(f"📅 Date Range: {start_date} to {end_date}")
        logger.info(f"👤 Role Filter: {role if role else 'All Roles'}")
        
        # ============================================================
        # GET ALL ROLES
        # ============================================================
        
        roles_query = """
        SELECT DISTINCT role
        FROM users
        WHERE is_active = 1
        ORDER BY role
        """
        roles_result = db.execute_query(roles_query)
        all_roles = [row['role'] for row in roles_result] if roles_result else []
        
        logger.info(f"📋 Available Roles: {all_roles}")
        
        # ============================================================
        # SUMMARY CARDS
        # ============================================================
        
        # Build role filter condition
        role_filter = ""
        role_params = []
        if role and role != 'all':
            role_filter = "AND u.role = %s"
            role_params = [role]
        
        # 1. Total Users (active users who logged in during the period)
        total_users_query = f"""
        SELECT COUNT(DISTINCT u.id) as count
        FROM users u
        INNER JOIN audit_logs al ON al.admin_name = u.full_name
        WHERE u.is_active = 1
        AND al.action = 'User Login'
        AND DATE(al.timestamp) >= %s
        AND DATE(al.timestamp) <= %s
        {role_filter}
        """
        total_users_result = db.execute_query(
            total_users_query,
            [start_date, end_date] + role_params
        )
        total_users = total_users_result[0]['count'] if total_users_result else 0
        
        # 2. Total Number of Roles
        if role and role != 'all':
            total_roles = 1
        else:
            total_roles = len(all_roles)
        
        # 3. Calculate Average Time Spent from actual login/logout sessions
        avg_time_spent = 0
        
        # Get all user activities (login, logout, session end) in the date range
        activities_query = f"""
        SELECT 
            u.id as user_id,
            u.user_id as user_code,
            u.full_name as user_name,
            u.role,
            al.action,
            al.timestamp
        FROM users u
        INNER JOIN audit_logs al ON al.admin_name = u.full_name
        WHERE u.is_active = 1
        AND al.action IN ('User Login', 'User Logout', 'Session End')
        AND DATE(al.timestamp) >= %s
        AND DATE(al.timestamp) <= %s
        {role_filter}
        ORDER BY u.id, al.timestamp
        """
        activities_result = db.execute_query(
            activities_query,
            [start_date, end_date] + role_params
        )
        
        # Calculate time spent for each user by matching login with logout/session end
        user_sessions = {}
        for row in activities_result:
            user_id = row['user_id']
            if user_id not in user_sessions:
                user_sessions[user_id] = {
                    'user_code': row['user_code'],
                    'user_name': row['user_name'],
                    'role': row['role'],
                    'sessions': [],
                    'current_login': None,
                    'total_time_minutes': 0
                }
            
            action = row['action']
            timestamp = row['timestamp']
            
            if action == 'User Login':
                # Start a new session
                user_sessions[user_id]['current_login'] = timestamp
            elif action in ('User Logout', 'Session End'):
                # End the current session
                if user_sessions[user_id]['current_login']:
                    login_time = user_sessions[user_id]['current_login']
                    logout_time = timestamp
                    
                    # Calculate session duration in minutes
                    if isinstance(login_time, str):
                        login_time = datetime.fromisoformat(login_time.replace('Z', '+00:00'))
                    if isinstance(logout_time, str):
                        logout_time = datetime.fromisoformat(logout_time.replace('Z', '+00:00'))
                    
                    duration = (logout_time - login_time).total_seconds() / 60
                    user_sessions[user_id]['sessions'].append({
                        'login': login_time,
                        'logout': logout_time,
                        'duration_minutes': duration
                    })
                    user_sessions[user_id]['total_time_minutes'] += duration
                    user_sessions[user_id]['current_login'] = None
        
        # Handle sessions that don't have logout (still active or browser closed without tracking)
        # Assume 30 minutes for unclosed sessions
        for user_id, session_data in user_sessions.items():
            if session_data['current_login']:
                # Session still open - estimate 30 minutes
                session_data['total_time_minutes'] += 30
                session_data['sessions'].append({
                    'login': session_data['current_login'],
                    'logout': None,
                    'duration_minutes': 30,
                    'estimated': True
                })
        
        # Calculate total time and average
        total_time_all_users = sum(s['total_time_minutes'] for s in user_sessions.values())
        if total_users > 0:
            avg_time_spent = total_time_all_users / total_users
        
        summary = {
            'total_users': total_users,
            'avg_time_spent_minutes': round(avg_time_spent, 1),
            'total_roles': total_roles
        }
        
        logger.info(f"👥 Total Users: {total_users}")
        logger.info(f"⏱️  Avg Time Spent: {avg_time_spent:.1f} minutes")
        logger.info(f"🎭 Total Roles: {total_roles}")
        
        # ============================================================
        # USER ACTIVITY TABLE
        # ============================================================
        
        user_activities = []
        for user_id, session_data in user_sessions.items():
            # Format time spent
            total_minutes = session_data['total_time_minutes']
            hours = int(total_minutes // 60)
            minutes = int(total_minutes % 60)
            time_spent_formatted = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
            
            user_activities.append({
                'user_id': session_data['user_code'],
                'user_name': session_data['user_name'],
                'role': session_data['role'],
                'total_time_minutes': total_minutes,
                'time_spent_formatted': time_spent_formatted,
                'login_count': len(session_data['sessions']),
                'session_count': len(session_data['sessions'])
            })
        
        # Sort by total time spent (descending)
        user_activities.sort(key=lambda x: x['total_time_minutes'], reverse=True)
        
        logger.info(f"📊 User Activities: {len(user_activities)} records")
        
        # ============================================================
        # ROLE-WISE TIME SPENT (for pie chart)
        # ============================================================
        
        role_time_spent = {}
        for activity in user_activities:
            role_name = activity['role']
            if role_name not in role_time_spent:
                role_time_spent[role_name] = 0
            role_time_spent[role_name] += activity['total_time_minutes']
        
        role_breakdown = [
            {
                'role': role_name,
                'total_time_minutes': time_minutes,
                'percentage': round((time_minutes / total_time_all_users * 100), 1) if total_time_all_users > 0 else 0
            }
            for role_name, time_minutes in role_time_spent.items()
        ]
        
        # Sort by time spent (descending)
        role_breakdown.sort(key=lambda x: x['total_time_minutes'], reverse=True)
        
        logger.info(f"🎭 Role Breakdown: {len(role_breakdown)} roles")
        
        logger.info("=" * 80)
        logger.info("✅ DAILY ACTIVITY REPORT GENERATED SUCCESSFULLY")
        logger.info("=" * 80)
        
        return {
            "filters": {
                "from_date": start_date.strftime('%Y-%m-%d'),
                "to_date": end_date.strftime('%Y-%m-%d'),
                "role": role
            },
            "summary": summary,
            "user_activities": user_activities,
            "role_breakdown": role_breakdown,
            "all_roles": all_roles,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting daily activity report: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving daily activity report: {str(e)}"
        )


@router.get("/subscription-trend-analysis")
async def get_subscription_trend_analysis(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Subscription Trend Analysis Report
    Shows comprehensive subscription trends, investor behavior, and series performance
    PERMISSION REQUIRED: view_reports
    """
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("📊 GENERATING SUBSCRIPTION TREND ANALYSIS REPORT")
        logger.info("=" * 80)
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_subscription_trend_analysis", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # ============================================================
        # SECTION 1: SUMMARY CARDS (Top)
        # ============================================================
        
        # Total Series
        total_series_query = "SELECT COUNT(*) as count FROM ncd_series"
        total_series_result = db.execute_query(total_series_query)
        total_series = total_series_result[0]['count'] if total_series_result else 0
        
        # Active Series
        active_series_query = "SELECT COUNT(*) as count FROM ncd_series WHERE status = 'active'"
        active_series_result = db.execute_query(active_series_query)
        active_series = active_series_result[0]['count'] if active_series_result else 0
        
        # Total Investors
        total_investors_query = "SELECT COUNT(*) as count FROM investors WHERE is_active = 1"
        total_investors_result = db.execute_query(total_investors_query)
        total_investors = total_investors_result[0]['count'] if total_investors_result else 0
        
        # Active Investors (investors who have at least one ACTIVE investment)
        # FIXED: Filter by status = 'active' to exclude exited investors
        active_investors_query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investor_series
        WHERE status = 'active'
        """
        active_investors_result = db.execute_query(active_investors_query)
        active_investors = active_investors_result[0]['count'] if active_investors_result else 0
        
        summary_top = {
            'total_series': total_series,
            'active_series': active_series,
            'total_investors': total_investors,
            'active_investors': active_investors
        }
        
        logger.info(f"📈 Total Series: {total_series}, Active: {active_series}")
        logger.info(f"👥 Total Investors: {total_investors}, Active: {active_investors}")
        
        # ============================================================
        # SECTION 2: INVESTOR DETAILS TABLE (LIFETIME totals)
        # ============================================================
        
        investor_details_query = """
        SELECT 
            i.investor_id,
            i.full_name as investor_name,
            i.email,
            i.phone,
            COALESCE(SUM(inv.amount), 0) as total_investment,
            COUNT(DISTINCT CASE WHEN inv.series_id IS NOT NULL THEN inv.series_id END) as series_count,
            COALESCE(AVG(CASE WHEN inv.amount IS NOT NULL THEN inv.amount END), 0) as avg_investment
        FROM investors i
        LEFT JOIN investments inv ON i.id = inv.investor_id AND inv.status IN ('confirmed', 'cancelled')
        WHERE i.is_active = 1
        GROUP BY i.investor_id, i.full_name, i.email, i.phone
        ORDER BY total_investment DESC
        """
        investor_details_result = db.execute_query(investor_details_query)
        
        investor_details = []
        for row in investor_details_result:
            investor_details.append({
                'investor_id': row['investor_id'],
                'investor_name': row['investor_name'],
                'email': row['email'] or '',
                'phone': row['phone'] or '',
                'total_investment': float(row['total_investment']),
                'series_count': row['series_count'],
                'avg_investment': round(float(row['avg_investment']), 2)
            })
        
        logger.info(f"📊 Investor Details: {len(investor_details)} records")
        
        # ============================================================
        # SECTION 3: RETENTION SUMMARY CARDS (Middle)
        # ============================================================
        
        # Retained Investors (invested in more than 1 ACTIVE series)
        # FIXED: Filter by status = 'active' to exclude exited series
        retained_investors_query = """
        SELECT COUNT(DISTINCT investor_id) as count
        FROM investor_series
        WHERE status = 'active'
        GROUP BY investor_id
        HAVING COUNT(DISTINCT series_id) > 1
        """
        retained_investors_result = db.execute_query(retained_investors_query)
        retained_investors = len(retained_investors_result) if retained_investors_result else 0
        
        # Retention Rate (percentage of active investors who are retained)
        retention_rate = round((retained_investors / active_investors * 100), 2) if active_investors > 0 else 0
        
        # Average Investors Increasing Per Series
        # FIXED: Filter by status = 'active' to count only active investors
        series_investor_counts_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.subscription_start_date,
            COUNT(DISTINCT isr.investor_id) as investor_count
        FROM ncd_series ns
        LEFT JOIN investor_series isr ON ns.id = isr.series_id AND isr.status = 'active'
        GROUP BY ns.id, ns.name, ns.subscription_start_date
        ORDER BY ns.subscription_start_date
        """
        series_investor_counts_result = db.execute_query(series_investor_counts_query)
        
        # Calculate average increase in investors per series
        investor_increases = []
        for i in range(1, len(series_investor_counts_result)):
            prev_count = series_investor_counts_result[i-1]['investor_count']
            curr_count = series_investor_counts_result[i]['investor_count']
            increase = curr_count - prev_count
            investor_increases.append(increase)
        
        avg_investors_increase = round(sum(investor_increases) / len(investor_increases), 2) if investor_increases else 0
        
        # Average Investment Increasing Per Series (LIFETIME totals)
        series_investment_totals_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.subscription_start_date,
            COALESCE(SUM(inv.amount), 0) as total_investment
        FROM ncd_series ns
        LEFT JOIN investments inv ON ns.id = inv.series_id AND inv.status IN ('confirmed', 'cancelled')
        GROUP BY ns.id, ns.name, ns.subscription_start_date
        ORDER BY ns.subscription_start_date
        """
        series_investment_totals_result = db.execute_query(series_investment_totals_query)
        
        # Calculate average increase in investment per series
        investment_increases = []
        for i in range(1, len(series_investment_totals_result)):
            prev_total = float(series_investment_totals_result[i-1]['total_investment'])
            curr_total = float(series_investment_totals_result[i]['total_investment'])
            increase = curr_total - prev_total
            investment_increases.append(increase)
        
        avg_investment_increase = round(sum(investment_increases) / len(investment_increases), 2) if investment_increases else 0
        
        summary_retention = {
            'retained_investors': retained_investors,
            'retention_rate': retention_rate,
            'avg_investors_increase': avg_investors_increase,
            'avg_investment_increase': avg_investment_increase
        }
        
        logger.info(f"🔄 Retained Investors: {retained_investors}, Rate: {retention_rate}%")
        logger.info(f"📈 Avg Investors Increase: {avg_investors_increase}, Avg Investment Increase: {avg_investment_increase}")
        
        # ============================================================
        # SECTION 4: SERIES TREND TABLE (Order by Release Date)
        # ============================================================
        
        series_trend = []
        for i, row in enumerate(series_investor_counts_result):
            series_id = row['series_id']
            series_name = row['series_name']
            investor_count = row['investor_count']
            
            # Get total investment for this series
            total_investment = 0
            for inv_row in series_investment_totals_result:
                if inv_row['series_id'] == series_id:
                    total_investment = float(inv_row['total_investment'])
                    break
            
            # Calculate percentage change from previous series
            investor_change_pct = 0
            investment_change_pct = 0
            
            if i > 0:
                prev_investor_count = series_investor_counts_result[i-1]['investor_count']
                prev_investment = float(series_investment_totals_result[i-1]['total_investment'])
                
                if prev_investor_count > 0:
                    investor_change_pct = round(((investor_count - prev_investor_count) / prev_investor_count * 100), 2)
                
                if prev_investment > 0:
                    investment_change_pct = round(((total_investment - prev_investment) / prev_investment * 100), 2)
            
            series_trend.append({
                'series_id': series_id,
                'series_name': series_name,
                'total_investors': investor_count,
                'investor_change_pct': investor_change_pct,
                'total_investment': total_investment,
                'investment_change_pct': investment_change_pct
            })
        
        logger.info(f"📊 Series Trend: {len(series_trend)} records")
        
        # ============================================================
        # SECTION 5: TOP PERFORMING SERIES TABLE (By Investment %)
        # ============================================================
        
        # DEBUG: Check investor_series data for verification
        debug_investor_series_query = """
        SELECT 
            isr.series_id,
            ns.name as series_name,
            isr.investor_id,
            isr.total_invested,
            isr.investment_count
        FROM investor_series isr
        INNER JOIN ncd_series ns ON isr.series_id = ns.id
        ORDER BY isr.series_id, isr.investor_id
        """
        debug_isr_result = db.execute_query(debug_investor_series_query)
        
        logger.info("=" * 80)
        logger.info("🔍 DEBUG: INVESTOR_SERIES TABLE DATA:")
        series_totals = {}
        for row in debug_isr_result:
            series_id = row['series_id']
            series_name = row['series_name']
            if series_id not in series_totals:
                series_totals[series_id] = {'name': series_name, 'total': 0, 'count': 0}
            series_totals[series_id]['total'] += float(row['total_invested'])
            series_totals[series_id]['count'] += 1
            logger.info(f"  Series: {series_name} (ID: {series_id}), Investor: {row['investor_id']}, Invested: {row['total_invested']}")
        
        logger.info("-" * 80)
        logger.info("CALCULATED TOTALS PER SERIES:")
        for series_id, data in series_totals.items():
            logger.info(f"  {data['name']}: ₹{data['total']:,.2f} (from {data['count']} investor records)")
        logger.info("=" * 80)
        
        top_series_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.interest_rate,
            ns.debenture_trustee_name as trustee,
            ns.security_type,
            ns.subscription_start_date as start_date,
            ns.maturity_date as end_date,
            ns.target_amount,
            COALESCE(SUM(inv.amount), 0) as total_invested
        FROM ncd_series ns
        LEFT JOIN investments inv ON ns.id = inv.series_id AND inv.status IN ('confirmed', 'cancelled')
        GROUP BY ns.id, ns.name, ns.interest_rate, ns.debenture_trustee_name, 
                 ns.security_type, ns.subscription_start_date, ns.maturity_date, ns.target_amount
        ORDER BY (COALESCE(SUM(inv.amount), 0) / NULLIF(ns.target_amount, 0)) DESC
        """
        top_series_result = db.execute_query(top_series_query)
        
        logger.info("=" * 80)
        logger.info("🔍 TOP PERFORMING SERIES - RAW DATABASE RESULTS:")
        for row in top_series_result:
            logger.info(f"  Series: {row['series_name']}")
            logger.info(f"    - Series ID: {row['series_id']}")
            logger.info(f"    - Target Amount: {row['target_amount']}")
            logger.info(f"    - Total Invested (from DB): {row['total_invested']}")
            logger.info(f"    - Investment %: {(float(row['total_invested']) / float(row['target_amount']) * 100) if row['target_amount'] else 0:.2f}%")
        logger.info("=" * 80)
        
        top_performing_series = []
        for row in top_series_result:
            target_amount = float(row['target_amount']) if row['target_amount'] else 0
            total_invested = float(row['total_invested'])
            investment_percentage = round((total_invested / target_amount * 100), 2) if target_amount > 0 else 0
            
            top_performing_series.append({
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'interest_rate': float(row['interest_rate']) if row['interest_rate'] else 0,
                'trustee': row['trustee'] or '',
                'security_type': row['security_type'] or '',
                'start_date': row['start_date'].strftime('%Y-%m-%d') if row['start_date'] else '',
                'end_date': row['end_date'].strftime('%Y-%m-%d') if row['end_date'] else '',
                'target_amount': target_amount,
                'total_invested': total_invested,
                'investment_percentage': investment_percentage
            })
        
        logger.info(f"🏆 Top Performing Series: {len(top_performing_series)} records")
        
        logger.info("=" * 80)
        logger.info("✅ SUBSCRIPTION TREND ANALYSIS REPORT GENERATED SUCCESSFULLY")
        logger.info("=" * 80)
        
        return {
            "summary_top": summary_top,
            "investor_details": investor_details,
            "summary_retention": summary_retention,
            "series_trend": series_trend,
            "top_performing_series": top_performing_series,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting subscription trend analysis: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving subscription trend analysis: {str(e)}"
        )


@router.get("/series-maturity")
async def get_series_maturity_report(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get Series Maturity Report
    Shows series maturity analysis with investor details
    PERMISSION REQUIRED: view_reports
    """
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("📊 GENERATING SERIES MATURITY REPORT")
        logger.info("=" * 80)
        
        if not has_permission(current_user, "view_reports", db):
            log_unauthorized_access(db, current_user, "get_series_maturity_report", "view_reports")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        ninety_days_from_now = today + timedelta(days=90)
        six_months_from_now = today + timedelta(days=180)
        
        # ============================================================
        # SECTION 1: SUMMARY CARDS
        # ============================================================
        
        # Total Series
        total_series_query = "SELECT COUNT(*) as count FROM ncd_series WHERE is_active = 1"
        total_series_result = db.execute_query(total_series_query)
        total_series = total_series_result[0]['count'] if total_series_result else 0
        
        # Series maturing within 90 days
        series_90_days_query = """
        SELECT COUNT(*) as count 
        FROM ncd_series 
        WHERE is_active = 1 
        AND maturity_date <= %s 
        AND maturity_date >= %s
        """
        series_90_days_result = db.execute_query(series_90_days_query, (ninety_days_from_now, today))
        series_maturing_soon = series_90_days_result[0]['count'] if series_90_days_result else 0
        
        # Total Investors
        total_investors_query = "SELECT COUNT(*) as count FROM investors WHERE is_active = 1"
        total_investors_result = db.execute_query(total_investors_query)
        total_investors = total_investors_result[0]['count'] if total_investors_result else 0
        
        summary = {
            'total_series': total_series,
            'series_maturing_soon': series_maturing_soon,
            'total_investors': total_investors
        }
        
        logger.info(f"📈 Total Series: {total_series}, Maturing Soon (≤90 days): {series_maturing_soon}")
        logger.info(f"👥 Total Investors: {total_investors}")
        
        # ============================================================
        # SECTION 2: SERIES MATURING WITHIN 90 DAYS
        # ============================================================
        
        # FIXED: Use investments table (real-time data) instead of investor_series (stale data)
        series_90_days_details_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.maturity_date,
            COUNT(DISTINCT i.investor_id) as investor_count,
            COALESCE(SUM(i.amount), 0) as total_funds_raised
        FROM ncd_series ns
        LEFT JOIN investments i ON ns.id = i.series_id AND i.status = 'confirmed'
        WHERE ns.is_active = 1 
        AND ns.maturity_date <= %s 
        AND ns.maturity_date >= %s
        GROUP BY ns.id, ns.name, ns.maturity_date
        ORDER BY ns.maturity_date ASC
        """
        series_90_days_details = db.execute_query(series_90_days_details_query, (ninety_days_from_now, today))
        
        series_maturing_90_days = []
        for row in series_90_days_details:
            series_maturing_90_days.append({
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'investor_count': row['investor_count'],
                'maturity_date': row['maturity_date'].strftime('%Y-%m-%d') if row['maturity_date'] else '',
                'total_amount_to_return': float(row['total_funds_raised'])
            })
        
        logger.info(f"📊 Series Maturing Within 90 Days: {len(series_maturing_90_days)} records")
        
        # ============================================================
        # SECTION 3: INVESTOR DETAILS FOR EACH SERIES (≤90 DAYS)
        # ============================================================
        
        investors_by_series_90_days = {}
        
        for series in series_maturing_90_days:
            series_id = series['series_id']
            
            # FIXED: Use investments table (real-time data) instead of investor_series
            investors_query = """
            SELECT 
                inv.investor_id,
                inv.full_name as investor_name,
                COUNT(DISTINCT i2.series_id) as active_series_count,
                i.amount as amount_to_receive
            FROM investments i
            INNER JOIN investors inv ON i.investor_id = inv.id
            LEFT JOIN investments i2 ON inv.id = i2.investor_id AND i2.status = 'confirmed'
            WHERE i.series_id = %s AND i.status = 'confirmed'
            GROUP BY inv.investor_id, inv.full_name, i.amount, i.id
            ORDER BY i.amount DESC
            """
            
            investors_result = db.execute_query(investors_query, (series_id,))
            
            logger.info(f"🔍 DEBUG: Series ID {series_id} - Found {len(investors_result)} investor records")
            for inv_row in investors_result:
                logger.info(f"  - {inv_row['investor_name']}: Rs.{inv_row['amount_to_receive']:,.2f}")
            
            investors_list = []
            for inv_row in investors_result:
                investors_list.append({
                    'investor_id': inv_row['investor_id'],
                    'investor_name': inv_row['investor_name'],
                    'active_series_count': inv_row['active_series_count'],
                    'amount_to_receive': float(inv_row['amount_to_receive'])
                })
            
            investors_by_series_90_days[series_id] = investors_list
        
        logger.info(f"📊 Investor Details Fetched for {len(investors_by_series_90_days)} series")
        
        # ============================================================
        # SECTION 4: SERIES MATURING BETWEEN 90 DAYS AND 6 MONTHS
        # ============================================================
        
        # FIXED: Use investments table (real-time data) instead of investor_series
        series_90_to_180_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.maturity_date,
            COUNT(DISTINCT i.investor_id) as investor_count,
            COALESCE(SUM(i.amount), 0) as total_funds_raised
        FROM ncd_series ns
        LEFT JOIN investments i ON ns.id = i.series_id AND i.status = 'confirmed'
        WHERE ns.is_active = 1 
        AND ns.maturity_date > %s 
        AND ns.maturity_date <= %s
        GROUP BY ns.id, ns.name, ns.maturity_date
        ORDER BY ns.maturity_date ASC
        """
        series_90_to_180_details = db.execute_query(series_90_to_180_query, (ninety_days_from_now, six_months_from_now))
        
        series_maturing_90_to_180_days = []
        for row in series_90_to_180_details:
            series_maturing_90_to_180_days.append({
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'investor_count': row['investor_count'],
                'maturity_date': row['maturity_date'].strftime('%Y-%m-%d') if row['maturity_date'] else '',
                'total_amount_to_return': float(row['total_funds_raised'])
            })
        
        logger.info(f"📊 Series Maturing Between 90 Days and 6 Months: {len(series_maturing_90_to_180_days)} records")
        
        # ============================================================
        # SECTION 5: SERIES MATURING AFTER 6 MONTHS
        # ============================================================
        
        # FIXED: Use investments table (real-time data) instead of investor_series
        series_after_6_months_query = """
        SELECT 
            ns.id as series_id,
            ns.name as series_name,
            ns.maturity_date,
            COUNT(DISTINCT i.investor_id) as investor_count,
            COALESCE(SUM(i.amount), 0) as total_funds_raised
        FROM ncd_series ns
        LEFT JOIN investments i ON ns.id = i.series_id AND i.status = 'confirmed'
        WHERE ns.is_active = 1 
        AND ns.maturity_date > %s
        GROUP BY ns.id, ns.name, ns.maturity_date
        ORDER BY ns.maturity_date ASC
        """
        series_after_6_months_details = db.execute_query(series_after_6_months_query, (six_months_from_now,))
        
        series_maturing_after_6_months = []
        for row in series_after_6_months_details:
            series_maturing_after_6_months.append({
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'investor_count': row['investor_count'],
                'maturity_date': row['maturity_date'].strftime('%Y-%m-%d') if row['maturity_date'] else '',
                'total_amount_to_return': float(row['total_funds_raised'])
            })
        
        logger.info(f"📊 Series Maturing After 6 Months: {len(series_maturing_after_6_months)} records")
        
        logger.info("=" * 80)
        logger.info("✅ SERIES MATURITY REPORT GENERATED SUCCESSFULLY")
        logger.info("=" * 80)
        
        return {
            "summary": summary,
            "series_maturing_90_days": series_maturing_90_days,
            "investors_by_series_90_days": investors_by_series_90_days,
            "series_maturing_90_to_180_days": series_maturing_90_to_180_days,
            "series_maturing_after_6_months": series_maturing_after_6_months,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting series maturity report: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving series maturity report: {str(e)}"
        )


@router.post("/log-download")
async def log_report_download(
    request: dict,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Log report download activity
    This endpoint is called from frontend after successful report generation
    Expects JSON body: {report_name, report_type, record_count}
    """
    try:
        from report_logger import log_report_generation
        
        db = get_db()
        
        report_name = request.get('report_name')
        report_type = request.get('report_type')
        record_count = request.get('record_count', 0)
        
        # Log the report generation
        log_report_generation(
            db=db,
            report_name=report_name,
            report_type=report_type,
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_role=current_user.role,
            record_count=record_count,
            status="success"
        )
        
        logger.info(f"✅ Logged report download: {report_name} ({report_type}) by {current_user.full_name}")
        
        return {"success": True, "message": "Report download logged successfully"}
        
    except Exception as e:
        logger.error(f"❌ Error logging report download: {e}")
        # Don't fail the request if logging fails
        return {"success": False, "message": str(e)}


@router.get("/logs")
async def get_report_logs_endpoint(
    user_id: Optional[int] = None,
    report_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get report generation logs
    PERMISSION REQUIRED: view_reports
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "view_reports", db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view report logs"
            )
        
        from report_logger import get_report_logs
        
        logs = get_report_logs(
            db=db,
            user_id=user_id,
            report_name=report_name,
            start_date=start_date,
            end_date=end_date,
            limit=limit
        )
        
        return logs
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting report logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving report logs: {str(e)}"
        )




@router.get("/last-generated")
async def get_last_generated_dates(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get last generated date for each report type
    PERMISSION REQUIRED: view_reports
    Returns: Dictionary with report names as keys and last generated dates as values
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_reports", db):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view reports"
            )
        
        # Check if report_logs table exists
        check_table_query = """
        SELECT COUNT(*) as count
        FROM information_schema.tables 
        WHERE table_schema = DATABASE() 
        AND table_name = 'report_logs'
        """
        table_exists = db.execute_query(check_table_query)
        use_report_logs = table_exists and table_exists[0]['count'] > 0
        
        if use_report_logs:
            # Use report_logs table
            query = """
            SELECT 
                report_name,
                MAX(generated_at) as last_generated
            FROM report_logs
            WHERE status = 'success'
            GROUP BY report_name
            """
            results = db.execute_query(query)
            
            # Convert to dictionary
            last_generated_dates = {}
            for row in results:
                report_name = row['report_name']
                last_date = row['last_generated']
                if last_date:
                    last_generated_dates[report_name] = last_date.strftime('%d/%m/%Y')
                else:
                    last_generated_dates[report_name] = 'Never'
            
            return last_generated_dates
            
        else:
            # Fallback: return empty dict or use audit_logs
            # For now, return empty dict as audit_logs doesn't store report names separately
            return {}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting last generated dates: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving last generated dates: {str(e)}"
        )


