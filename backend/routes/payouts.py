"""
Interest Payout API Routes
===========================
Manage interest payouts for investors

IMPORTANT: ALL business logic in backend, NO logic in frontend
Data fetched from investors and ncd_series tables
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import Optional
from models import UserInDB
from auth import get_current_user
from database import get_db
from permissions_checker import has_permission, log_unauthorized_access
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payouts", tags=["Interest Payouts"])


def calculate_monthly_interest(principal_amount: float, annual_interest_rate: float, month: int = None, year: int = None) -> float:
    """
    Calculate FIXED monthly interest amount for REGULAR FULL MONTHS
    
    CORRECT LOGIC:
    - Calculate: Annual Interest / 12
    - Pay the SAME FIXED amount every month
    - Month/year parameters are optional (not used in calculation, just for logging)
    
    Formula: (Principal × Rate%) / 12
    
    Example:
    - Principal: Rs.10,00,000
    - Rate: 12% per annum
    - Annual Interest: Rs.1,20,000
    - Monthly Interest: Rs.10,000 (SAME EVERY MONTH)
    
    This FIXED amount is paid for:
    - February (28 days): Rs.10,000
    - March (31 days): Rs.10,000
    - April (30 days): Rs.10,000
    - ALL months get the SAME amount!
    
    ALL LOGIC IN BACKEND
    """
    try:
        # Calculate annual interest
        annual_interest = (principal_amount * annual_interest_rate) / 100
        
        # Divide by 12 for FIXED monthly amount
        monthly_interest = annual_interest / 12
        
        return round(monthly_interest, 2)
    except Exception as e:
        logger.error(f"Error calculating monthly interest: {e}")
        return 0.0


def calculate_first_month_interest(
    principal_amount: float,
    annual_interest_rate: float,
    series_start_date: date,
    month: int,
    year: int,
    interest_payment_day: int = 15
) -> float:
    """
    Calculate interest for FIRST month (when series starts mid-month)
    
    CORRECT LOGIC:
    - If series starts on 1st: Pay FULL monthly amount (Annual / 12)
    - If series starts mid-month: Prorate by DAYS from start to end of month
    - Payment day is just a PROMISE (when we PAY), NOT used in calculation!
    
    Formula for mid-month start:
    Interest = (Principal × Rate% × Days) / Days_in_Year
    
    Where Days = From series start date to LAST DAY of that month
    
    Examples:
    1. Series starts Feb 1:
       - Pay FULL monthly = Rs.10,000
    
    2. Series starts Feb 2:
       - Calculate: Feb 2 to Feb 28 = 27 days
       - Interest: (10,00,000 × 12% × 27) / 365 = Rs.8,876.71
       - Payment Date: Feb 20 (just when we PAY)
    
    3. Series starts Feb 15:
       - Calculate: Feb 15 to Feb 28 = 14 days
       - Interest: (10,00,000 × 12% × 14) / 365 = Rs.4,602.74
       - Payment Date: Feb 20 (just when we PAY)
    
    ALL LOGIC IN BACKEND
    """
    try:
        import calendar
        
        # If series starts on 1st of month, pay FULL monthly amount
        if series_start_date.day == 1:
            annual_interest = (principal_amount * annual_interest_rate) / 100
            monthly_interest = annual_interest / 12
            logger.info(f"First month (starts on 1st): FULL monthly = Rs.{monthly_interest:.2f}")
            return round(monthly_interest, 2)
        
        # Series starts mid-month: Prorate by days
        # Get last day of the month
        last_day_of_month = calendar.monthrange(year, month)[1]
        end_date = date(year, month, last_day_of_month)
        
        # Calculate days from series start to end of month
        days = (end_date - series_start_date).days + 1  # +1 to include both start and end day
        
        if days <= 0:
            return 0.0
        
        # Determine if we're in a leap year
        days_in_year = 366 if calendar.isleap(year) else 365
        
        # Calculate prorated interest
        interest = (principal_amount * annual_interest_rate * days) / 100 / days_in_year
        
        print(f"CALCULATION: ({principal_amount} × {annual_interest_rate} × {days}) / 100 / {days_in_year} = {interest}")
        
        logger.info(f"First month (starts mid-month): {series_start_date} to {end_date} = {days} days, Interest = Rs.{interest:.2f}")
        
        return round(interest, 2)
    except Exception as e:
        logger.error(f"Error calculating first month interest: {e}")
        return 0.0


def calculate_exit_interest(
    principal_amount: float,
    annual_interest_rate: float,
    exit_date: date,
    last_payout_month: int,
    last_payout_year: int
) -> float:
    """
    Calculate interest for EXIT after lock-in
    
    CORRECT LOGIC:
    - If exit is on LAST day of month → Pay FULL monthly amount (Annual / 12)
    - If exit is mid-month (e.g., Feb 15) → Calculate ONLY from Feb 1 to Feb 15 (days-wise)
    
    Example 1 - Exit on last day:
    - Last payout: January 2026 (paid until Jan 31)
    - Exit: Feb 28, 2026 (last day of Feb)
    - Calculate: FULL monthly = (10,00,000 × 12%) / 12 = ₹10,000
    
    Example 2 - Exit mid-month:
    - Last payout: January 2026 (paid until Jan 31)
    - Exit date: Feb 15, 2026
    - Calculate: Feb 1 to Feb 15 = 15 days
    - Interest: (10,00,000 × 12% × 15) / 365 = ₹4,931.51
    
    ALL LOGIC IN BACKEND
    """
    try:
        import calendar
        
        # Get last day of exit month
        last_day_of_month = calendar.monthrange(exit_date.year, exit_date.month)[1]
        
        # Check if exit is on last day of month
        if exit_date.day == last_day_of_month:
            # Exit on last day → Pay FULL monthly amount
            annual_interest = (principal_amount * annual_interest_rate) / 100
            monthly_interest = annual_interest / 12
            logger.info(f"Exit (on last day): FULL monthly = ₹{monthly_interest:.2f}")
            return round(monthly_interest, 2)
        else:
            # Exit mid-month → Calculate days-wise from 1st to exit date
            start_date = date(exit_date.year, exit_date.month, 1)
            
            # Calculate days from start of month to exit date
            days = (exit_date - start_date).days + 1  # +1 to include both days
            
            if days <= 0:
                return 0.0
            
            # Determine if we're in a leap year
            days_in_year = 366 if calendar.isleap(exit_date.year) else 365
            
            # Calculate prorated interest
            interest = (principal_amount * annual_interest_rate * days) / 100 / days_in_year
            
            logger.info(f"Exit (mid-month): {start_date} to {exit_date} = {days} days, Interest = ₹{interest:.2f}")
            
            return round(interest, 2)
    except Exception as e:
        logger.error(f"Error calculating exit interest: {e}")
        return 0.0


def calculate_maturity_interest(
    principal_amount: float,
    annual_interest_rate: float,
    maturity_date: date,
    last_payout_month: int,
    last_payout_year: int
) -> float:
    """
    Calculate interest for MATURITY month
    
    CORRECT LOGIC:
    - If maturity is on LAST day of month → Pay FULL monthly amount (Annual / 12)
    - If maturity is mid-month (e.g., Mar 18) → Calculate ONLY from Mar 1 to Mar 18 (days-wise)
    
    Example 1 - Maturity on last day:
    - Last payout: January 2026 (paid until Jan 31)
    - Maturity: Feb 28, 2026 (last day of Feb)
    - Calculate: FULL monthly = (10,00,000 × 12%) / 12 = ₹10,000
    
    Example 2 - Maturity mid-month:
    - Last payout: January 2026 (paid until Jan 31)
    - Maturity: Feb 18, 2026
    - Calculate: Feb 1 to Feb 18 = 18 days
    - Interest: (10,00,000 × 12% × 18) / 365 = ₹5,917.81
    
    ALL LOGIC IN BACKEND
    """
    try:
        import calendar
        
        # Get last day of maturity month
        last_day_of_month = calendar.monthrange(maturity_date.year, maturity_date.month)[1]
        
        # Check if maturity is on last day of month
        if maturity_date.day == last_day_of_month:
            # Maturity on last day → Pay FULL monthly amount
            annual_interest = (principal_amount * annual_interest_rate) / 100
            monthly_interest = annual_interest / 12
            logger.info(f"Maturity (on last day): FULL monthly = ₹{monthly_interest:.2f}")
            return round(monthly_interest, 2)
        else:
            # Maturity mid-month → Calculate days-wise from 1st to maturity date
            start_date = date(maturity_date.year, maturity_date.month, 1)
            
            # Calculate days from start of month to maturity date
            days = (maturity_date - start_date).days + 1  # +1 to include both days
            
            if days <= 0:
                return 0.0
            
            # Determine if we're in a leap year
            days_in_year = 366 if calendar.isleap(maturity_date.year) else 365
            
            # Calculate prorated interest
            interest = (principal_amount * annual_interest_rate * days) / 100 / days_in_year
            
            logger.info(f"Maturity (mid-month): {start_date} to {maturity_date} = {days} days, Interest = ₹{interest:.2f}")
            
            return round(interest, 2)
    except Exception as e:
        logger.error(f"Error calculating maturity interest: {e}")
        return 0.0


def get_last_payout_date(series_start_date: date, payment_day: int, current_payout_date: date) -> date:
    """
    Get the date of the last payout before current one
    Used to calculate the period for prorated interest
    
    ALL LOGIC IN BACKEND
    """
    try:
        # If current payout is in the same month as series start, return series start date
        if (current_payout_date.year == series_start_date.year and 
            current_payout_date.month == series_start_date.month):
            return series_start_date
        
        # Calculate previous month's payout date
        if current_payout_date.month == 1:
            prev_month = 12
            prev_year = current_payout_date.year - 1
        else:
            prev_month = current_payout_date.month - 1
            prev_year = current_payout_date.year
        
        import calendar
        max_day = calendar.monthrange(prev_year, prev_month)[1]
        actual_day = min(payment_day, max_day)
        
        return date(prev_year, prev_month, actual_day)
    except Exception as e:
        logger.error(f"Error getting last payout date: {e}")
        return series_start_date


def is_first_payout(series_start_date: date, current_month: int, current_year: int) -> bool:
    """
    Check if this is the first payout for the series
    
    CORRECT RULE: First payout is when we're calculating for the same month as series start
    
    Example:
    - Series starts: Feb 10, 2026
    - Calculating for: February 2026
    - Result: YES, first payout (calculate Feb 10 to Feb 28)
    
    The interest_payment_day is just a PROMISE about WHEN we pay, NOT used in calculation!
    
    ALL LOGIC IN BACKEND
    """
    try:
        # Check if we're calculating for the same month as series start
        if current_year == series_start_date.year and current_month == series_start_date.month:
            return True
        
        return False
    except Exception as e:
        logger.error(f"Error checking first payout: {e}")
        return False


def is_last_payout_before_maturity(payout_date: date, maturity_date: date) -> bool:
    """
    Check if this payout date is in the maturity month
    If maturity is mid-month, the payout should be prorated
    
    CORRECT LOGIC:
    - Check if maturity happened in the SAME MONTH/YEAR as the payout
    - If yes, this is the final payout (prorate from start of month to maturity date)
    - If maturity is in a future month, return False (not final yet)
    - If maturity is in a past month, this payout should be skipped (handled by should_skip_payout)
    
    ALL LOGIC IN BACKEND
    """
    try:
        if not maturity_date:
            return False
        
        # Check if maturity is in the same month and year as payout
        return (payout_date.year == maturity_date.year and 
                payout_date.month == maturity_date.month)
    except Exception as e:
        logger.error(f"Error checking last payout before maturity: {e}")
        return False


def is_final_payout_after_exit(payout_date: date, exit_date: date) -> bool:
    """
    Check if investor has exited and this payout should be their final one
    If exit is mid-month, the payout should be prorated
    
    CORRECT LOGIC:
    - Check if exit happened in the SAME MONTH/YEAR as the payout
    - If yes, this is the final payout (prorate from start of month to exit date)
    - If exit is in a future month, return False (not final yet)
    - If exit is in a past month, this payout should be skipped (handled by should_skip_payout)
    
    ALL LOGIC IN BACKEND
    """
    try:
        if not exit_date:
            return False
        
        # Check if exit is in the same month and year as payout
        return (payout_date.year == exit_date.year and 
                payout_date.month == exit_date.month)
    except Exception as e:
        logger.error(f"Error checking final payout after exit: {e}")
        return False


def should_skip_payout(payout_date: date, maturity_date: date, exit_date: date, last_payout_date: date) -> bool:
    """
    Check if payout should be skipped because series has matured or investor has exited
    
    CRITICAL RULES:
    1. After maturity: NO MORE PAYOUTS (stop completely)
    2. After exit: NO MORE PAYOUTS (stop completely)
    3. Only generate ONE FINAL prorated payout for the exit/maturity month
    
    ALL LOGIC IN BACKEND
    """
    try:
        # RULE 1: If maturity date exists and CURRENT payout is AFTER maturity month, skip
        if maturity_date:
            # Check if payout is for a month AFTER maturity
            if payout_date.year > maturity_date.year:
                return True
            elif payout_date.year == maturity_date.year and payout_date.month > maturity_date.month:
                return True
        
        # RULE 2: If exit date exists and CURRENT payout is AFTER exit month, skip
        if exit_date:
            # Check if payout is for a month AFTER exit
            if payout_date.year > exit_date.year:
                return True
            elif payout_date.year == exit_date.year and payout_date.month > exit_date.month:
                return True
        
        return False
    except Exception as e:
        logger.error(f"Error checking skip payout: {e}")
        return False


def generate_payout_date(year: int, month: int, payment_day: int) -> str:
    """
    Generate payout date string in format: DD-MMM-YYYY
    
    CRITICAL BUSINESS RULE:
    Interest for a month is PAID in the NEXT month!
    
    Example:
    - Interest Period: February 2026 (Feb 2-28)
    - Payout Date: March 5, 2026 (NEXT month)
    
    - Interest Period: March 2026 (Mar 1-31)
    - Payout Date: April 5, 2026 (NEXT month)
    
    ALL LOGIC IN BACKEND
    """
    try:
        import calendar
        
        logger.info(f"🔍 generate_payout_date called: interest_month={month}/{year}, payment_day={payment_day}")
        
        # Calculate NEXT month for payout
        if month == 12:
            payout_month = 1
            payout_year = year + 1
        else:
            payout_month = month + 1
            payout_year = year
        
        # Handle months with fewer days
        max_day = calendar.monthrange(payout_year, payout_month)[1]
        actual_day = min(payment_day, max_day)
        
        payout_date = date(payout_year, payout_month, actual_day)
        result = payout_date.strftime('%d-%b-%Y')
        
        logger.info(f"🔍 generate_payout_date result: Interest for {month}/{year} → Payout on {result}")
        return result
    except Exception as e:
        logger.error(f"Error generating payout date: {e}")
        return f"{payment_day}-{month}-{year}"


def generate_payout_month(year: int, month: int) -> str:
    """
    Generate payout month string in format: February 2026
    ALL LOGIC IN BACKEND
    """
    try:
        month_date = date(year, month, 1)
        return month_date.strftime('%B %Y')
    except Exception as e:
        logger.error(f"Error generating payout month: {e}")
        return f"Month-{month} {year}"


@router.get("/")
async def get_all_payouts(
    series_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get all interest payouts
    Fetches data from investors and ncd_series tables
    ALL CALCULATIONS AND FILTERING IN BACKEND
    """
    try:
        db = get_db()
        
        logger.info("=" * 80)
        logger.info("🚀 GET_ALL_PAYOUTS CALLED - USING NEW CALCULATION LOGIC")
        logger.info("=" * 80)
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "get_all_payouts", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view payouts"
            )
        
        logger.info(f"📊 Fetching all payouts for user: {current_user.username}")
        
        # CRITICAL BUSINESS RULE:
        # Interest for a month is PAID in the NEXT month
        # 
        # When viewing in February 2026:
        #   - Calculate interest for: February 2026 (current month)
        #   - Payout date will be: March 2026 (next month)
        #
        # When viewing in March 2026:
        #   - Calculate interest for: March 2026 (current month)
        #   - Payout date will be: April 2026 (next month)
        #
        # The interest month is ALWAYS the current month
        # The payout date is ALWAYS in the next month
        
        current_date = datetime.now()
        interest_year = current_date.year
        interest_month = current_date.month
        
        current_month_str = generate_payout_month(interest_year, interest_month)
        
        # FIXED: Query to get investments for payout calculation
        # RULE 1: Include ACTIVE investments (status = 'confirmed')
        # RULE 2: Include EXITED investments (status = 'cancelled') ONLY if exit is in current month or future
        #         This ensures we generate the final prorated payout for exit month
        # RULE 3: Exclude investments where exit/maturity was in past months (already paid final payout)
        query = """
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            inv.bank_name,
            inv.account_number,
            inv.ifsc_code,
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
            s.lock_in_date,
            s.status as series_status
        FROM investors inv
        INNER JOIN investments i ON inv.id = i.investor_id
        INNER JOIN ncd_series s ON i.series_id = s.id
        WHERE (
            (i.status = 'confirmed' AND inv.is_active = 1)
            OR 
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL 
             AND YEAR(i.exit_date) * 12 + MONTH(i.exit_date) >= %s)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        AND s.series_start_date <= CURDATE()
        """
        
        # Calculate current month as a comparable number (YYYY * 12 + MM)
        current_month_number = current_date.year * 12 + current_date.month
        params = [current_month_number]
        
        if series_id:
            query += " AND s.id = %s"
            params.append(series_id)
        
        # Add search filter
        if search:
            query += " AND (inv.full_name LIKE %s OR inv.investor_id LIKE %s OR s.name LIKE %s)"
            search_pattern = f"%{search}%"
            params.extend([search_pattern, search_pattern, search_pattern])
        
        query += " ORDER BY inv.investor_id, s.name"
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        logger.info(f"✅ Found {len(result)} investment records")
        
        # Generate payout records
        payouts = []
        payout_id = 1
        
        for row in result:
            # Get series start date
            series_start_date = row['series_start_date']
            if isinstance(series_start_date, str):
                # Parse date if it's a string
                try:
                    series_start_date = datetime.strptime(series_start_date, '%Y-%m-%d').date()
                except:
                    series_start_date = None
            
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
            
            # Generate payout date for the interest period
            # CRITICAL: Interest for interest_month is PAID in the NEXT month
            # Use proper calendar logic to handle months with different days
            import calendar
            payment_day = row['interest_payment_day'] or 15
            
            # The payout_date_obj is used for checking exit/maturity month
            # It should be in the interest month, not the payment month
            max_day_in_month = calendar.monthrange(interest_year, interest_month)[1]
            actual_payment_day = min(payment_day, max_day_in_month)
            
            payout_date_obj = date(
                interest_year,
                interest_month,
                actual_payment_day
            )
            
            # Get last payout date for period calculation
            last_payout_date = get_last_payout_date(
                series_start_date if series_start_date else payout_date_obj,
                row['interest_payment_day'] or 15,
                payout_date_obj
            )
            
            # Check if we should skip this payout (already past maturity or exit)
            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                logger.info(f"Skipping payout for {row['investor_code']}: Already past maturity/exit")
                continue
            
            # Calculate interest amount based on CORRECT LOGIC
            # RULE 1: Exit → Calculate from series start (or 1st of month) to exit date (HIGHEST PRIORITY)
            # RULE 2: Maturity → Calculate from series start (or 1st of month) to maturity date
            # RULE 3: First partial month → Calculate from series start to END OF MONTH
            # RULE 4: Regular full months → FIXED monthly amount (1st to last day)
            
            # DEBUG: Log the check
            is_first = is_first_payout(series_start_date, interest_month, interest_year) if series_start_date else False
            logger.info(f"🔍 DEBUG {row['investor_code']}: series_start={series_start_date}, interest_period={interest_year}-{interest_month}, is_first={is_first}, exit={exit_date}")
            
            if exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                # SCENARIO 1: Investor has exited - Calculate from series start (or 1st) to exit date
                # This takes PRIORITY over first month calculation
                # If exit is in first month: Calculate from series start to exit date
                # If exit is in later month: Calculate from 1st of month to exit date
                
                print(f"\n{'='*100}")
                print(f"🚨 EXIT DETECTED for {row['investor_code']}")
                print(f"   Series Start: {series_start_date}")
                print(f"   Exit Date: {exit_date}")
                print(f"   Interest Period: {interest_month}/{interest_year}")
                print(f"   Is First Payout: {is_first_payout(series_start_date, interest_month, interest_year) if series_start_date else False}")
                print(f"{'='*100}\n")
                
                if series_start_date and is_first_payout(series_start_date, interest_month, interest_year):
                    # Exit in first month: Calculate from series start to exit date
                    days_from_start_to_exit = (exit_date - series_start_date).days + 1
                    import calendar
                    days_in_year = 366 if calendar.isleap(exit_date.year) else 365
                    monthly_interest = (float(row['investment_amount']) * float(row['interest_rate']) * days_from_start_to_exit) / 100 / days_in_year
                    
                    print(f"\n{'='*100}")
                    print(f"💰 EXIT IN FIRST MONTH CALCULATION for {row['investor_code']}")
                    print(f"   Principal: Rs.{row['investment_amount']:,.2f}")
                    print(f"   Rate: {row['interest_rate']}%")
                    print(f"   Period: {series_start_date} to {exit_date}")
                    print(f"   Days: {days_from_start_to_exit}")
                    print(f"   Formula: ({row['investment_amount']} × {row['interest_rate']}% × {days_from_start_to_exit}) / {days_in_year}")
                    print(f"   RESULT: Rs.{monthly_interest:,.2f}")
                    print(f"{'='*100}\n")
                    
                    logger.info(f"Final payout (exit in first month) for {row['investor_code']}: {series_start_date} to {exit_date} = {days_from_start_to_exit} days = Rs.{monthly_interest:.2f}")
                else:
                    # Exit in later month: Calculate from 1st of month to exit date
                    monthly_interest = calculate_exit_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        exit_date,
                        interest_month - 1 if interest_month > 1 else 12,
                        interest_year if interest_month > 1 else interest_year - 1
                    )
                    
                    print(f"\n{'='*100}")
                    print(f"💰 EXIT IN LATER MONTH CALCULATION for {row['investor_code']}")
                    print(f"   Exit Date: {exit_date}")
                    print(f"   RESULT: Rs.{monthly_interest:,.2f}")
                    print(f"{'='*100}\n")
                    
                    logger.info(f"Final payout (exit) for {row['investor_code']}: 1st of month to exit date = Rs.{monthly_interest:.2f}")
            
            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                # SCENARIO 2: Series has matured - Calculate from series start (or 1st) to maturity date
                # If maturity is in first month: Calculate from series start to maturity date
                # If maturity is in later month: Calculate from 1st of month to maturity date
                if series_start_date and is_first_payout(series_start_date, interest_month, interest_year):
                    # Maturity in first month: Calculate from series start to maturity date
                    days_from_start_to_maturity = (maturity_date - series_start_date).days + 1
                    import calendar
                    days_in_year = 366 if calendar.isleap(maturity_date.year) else 365
                    monthly_interest = (float(row['investment_amount']) * float(row['interest_rate']) * days_from_start_to_maturity) / 100 / days_in_year
                    logger.info(f"Last payout (maturity in first month) for {row['investor_code']}: {series_start_date} to {maturity_date} = {days_from_start_to_maturity} days = Rs.{monthly_interest:.2f}")
                else:
                    # Maturity in later month: Calculate from 1st of month to maturity date
                    monthly_interest = calculate_maturity_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        maturity_date,
                        interest_month - 1 if interest_month > 1 else 12,
                        interest_year if interest_month > 1 else interest_year - 1
                    )
                    logger.info(f"Last payout (maturity) for {row['investor_code']}: 1st of month to maturity date = Rs.{monthly_interest:.2f}")
            
            elif series_start_date and is_first_payout(series_start_date, interest_month, interest_year):
                # SCENARIO 3: First payout - Calculate from series start to END OF MONTH
                # Example: Series starts Feb 2 → Calculate Feb 2 to Feb 28 = 27 days = Rs.8,876.71
                # Payment day is just a PROMISE (when we PAY), not used in calculation
                monthly_interest = calculate_first_month_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    series_start_date,
                    interest_month,
                    interest_year,
                    row['interest_payment_day'] or 15
                )
                logger.info(f"First payout for {row['investor_code']}: Series start to end of month = Rs.{monthly_interest:.2f}")
            
            else:
                # SCENARIO 4: Regular monthly interest (FIXED AMOUNT)
                # Pay the SAME amount every month (Annual / 12)
                monthly_interest = calculate_monthly_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate'])
                )
                logger.info(f"Regular monthly payout for {row['investor_code']}: Rs.{monthly_interest}")
            
            # Check if payout record exists in database
            payout_query = """
            SELECT id, status, payout_month, payout_date, paid_date, amount
            FROM interest_payouts
            WHERE investor_id = %s 
            AND series_id = %s 
            AND payout_month = %s
            AND is_active = 1
            """
            
            payout_result = db.execute_query(payout_query, (
                row['investor_id'],
                row['series_id'],
                current_month_str
            ))
            
            # Always use the current interest_payment_day from series to calculate payout date
            # This ensures dates are always up-to-date with series settings
            payment_day = row['interest_payment_day'] or 15
            logger.info(f"🔍 DEBUG: Investor {row['investor_code']}, Series {row['series_name']}, Payment Day: {payment_day}")
            
            payout_date = generate_payout_date(
                interest_year,
                interest_month,
                payment_day
            )
            
            logger.info(f"🔍 DEBUG: Generated payout date: {payout_date}")
            
            if payout_result and len(payout_result) > 0:
                # Use existing payout record for status and month
                payout_record = payout_result[0]
                payout_status = payout_record['status']
                payout_month = payout_record['payout_month']
                # Always use CALCULATED amount, not stored amount
                # Note: We use the calculated payout_date, not the stored one
            else:
                # Generate default payout for current month
                payout_status = 'Scheduled'
                payout_month = current_month_str
            
            # Apply status filter if provided
            if status_filter and payout_status != status_filter:
                continue
            
            payouts.append({
                'id': payout_id,
                'investor_id': row['investor_code'],
                'investor_name': row['investor_name'],
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'interest_month': payout_month,
                'interest_date': payout_date,
                'amount': monthly_interest,
                'status': payout_status,
                'bank_name': row['bank_name'] or 'N/A',
                'bank_account_number': row['account_number'] or 'N/A',
                'ifsc_code': row['ifsc_code'] or 'N/A'
            })
            
            payout_id += 1
        
        logger.info(f"✅ Generated {len(payouts)} payout records")
        
        return {
            'payouts': payouts,
            'count': len(payouts)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching payouts: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payouts: {str(e)}"
        )


@router.get("/export")
async def get_export_payouts(
    series_id: Optional[int] = None,
    month_type: str = 'current',  # 'current' or 'upcoming'
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get payouts for export (current or upcoming month)
    ALL CALCULATIONS IN BACKEND
    """
    try:
        db = get_db()
        
        print("=" * 100)
        print("🚀🚀🚀 EXPORT PAYOUTS CALLED - NEW CODE IS RUNNING 🚀🚀🚀")
        print("=" * 100)
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "get_export_payouts", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view payouts"
            )
        
        logger.info(f"📊 Fetching export payouts: month_type={month_type}, series_id={series_id}")
        
        # CRITICAL BUSINESS RULE:
        # Interest for a month is PAID in the NEXT month
        # 
        # "Current Month" Export = Interest for THIS month (to be paid NEXT month)
        #   - Interest Period: CURRENT month
        #   - Payout Date: NEXT month
        #   Example: In February, show February interest (to be paid in March)
        #
        # "Upcoming Month" Export = Interest for NEXT month (to be paid in month after)
        #   - Interest Period: NEXT month
        #   - Payout Date: Month after next
        #   Example: In February, show March interest (to be paid in April)
        
        current_date = datetime.now()
        
        if month_type == 'upcoming':
            # Upcoming = Interest for NEXT month
            if current_date.month == 12:
                interest_year = current_date.year + 1
                interest_month = 1
            else:
                interest_year = current_date.year
                interest_month = current_date.month + 1
        else:
            # Current = Interest for THIS month
            interest_year = current_date.year
            interest_month = current_date.month
        
        target_year = interest_year
        target_month = interest_month
        
        target_month_str = generate_payout_month(target_year, target_month)
        
        logger.info(f"📅 Target month: {target_month_str}")
        
        # FIXED: Query to get investments for payout calculation
        # RULE 1: Include ACTIVE investments (status = 'confirmed')
        # RULE 2: Include EXITED investments (status = 'cancelled') ONLY if exit is in target month or future
        # RULE 3: Exclude investments where exit/maturity was in past months
        query = """
        SELECT 
            inv.id as investor_id,
            inv.investor_id as investor_code,
            inv.full_name as investor_name,
            inv.bank_name,
            inv.account_number,
            inv.ifsc_code,
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
            (i.status = 'cancelled' AND i.exit_date IS NOT NULL 
             AND YEAR(i.exit_date) * 12 + MONTH(i.exit_date) >= %s)
        )
        AND s.is_active = 1
        AND s.status = 'active'
        AND s.series_start_date <= CURDATE()
        """
        
        # Calculate target month as a comparable number (YYYY * 12 + MM)
        target_month_number = target_year * 12 + target_month
        params = [target_month_number]
        
        if series_id:
            query += " AND s.id = %s"
            params.append(series_id)
        
        query += " ORDER BY inv.investor_id, s.name"
        
        result = db.execute_query(query, tuple(params) if params else None)
        
        # Generate payout records
        payouts = []
        payout_id = 1
        
        for row in result:
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
            
            # Generate payout date for target month
            # Use proper calendar logic to handle months with different days
            import calendar
            payment_day = row['interest_payment_day'] or 15
            max_day_in_month = calendar.monthrange(target_year, target_month)[1]
            actual_payment_day = min(payment_day, max_day_in_month)
            
            payout_date_obj = date(
                target_year,
                target_month,
                actual_payment_day
            )
            
            # Get last payout date for period calculation
            last_payout_date = get_last_payout_date(
                series_start_date if series_start_date else payout_date_obj,
                row['interest_payment_day'] or 15,
                payout_date_obj
            )
            
            # Check if we should skip this payout (already past maturity or exit)
            if should_skip_payout(payout_date_obj, maturity_date, exit_date, last_payout_date):
                logger.info(f"Skipping export payout for {row['investor_code']}: Already past maturity/exit")
                continue
            
            # Calculate interest amount based on CORRECT LOGIC
            # RULE 1: Exit → Calculate from series start (or 1st of month) to exit date (HIGHEST PRIORITY)
            # RULE 2: Maturity → Calculate from series start (or 1st of month) to maturity date
            # RULE 3: First partial month → Calculate from series start to END OF MONTH
            # RULE 4: Regular full months → FIXED monthly amount (1st to last day)
            
            if exit_date and is_final_payout_after_exit(payout_date_obj, exit_date):
                # SCENARIO 1: Investor has exited - Calculate from series start (or 1st) to exit date
                # This takes PRIORITY over first month calculation
                
                print(f"\n{'='*100}")
                print(f"🚨 EXPORT: EXIT DETECTED for {row['investor_code']}")
                print(f"   Series Start: {series_start_date}")
                print(f"   Exit Date: {exit_date}")
                print(f"   Target Month: {target_month}/{target_year}")
                print(f"   Is First Payout: {is_first_payout(series_start_date, target_month, target_year) if series_start_date else False}")
                print(f"{'='*100}\n")
                
                if series_start_date and is_first_payout(series_start_date, target_month, target_year):
                    # Exit in first month: Calculate from series start to exit date
                    days_from_start_to_exit = (exit_date - series_start_date).days + 1
                    import calendar
                    days_in_year = 366 if calendar.isleap(exit_date.year) else 365
                    monthly_interest = (float(row['investment_amount']) * float(row['interest_rate']) * days_from_start_to_exit) / 100 / days_in_year
                    
                    print(f"\n{'='*100}")
                    print(f"💰 EXPORT: EXIT IN FIRST MONTH CALCULATION for {row['investor_code']}")
                    print(f"   Principal: Rs.{row['investment_amount']:,.2f}")
                    print(f"   Rate: {row['interest_rate']}%")
                    print(f"   Period: {series_start_date} to {exit_date}")
                    print(f"   Days: {days_from_start_to_exit}")
                    print(f"   Formula: ({row['investment_amount']} × {row['interest_rate']}% × {days_from_start_to_exit}) / {days_in_year}")
                    print(f"   RESULT: Rs.{monthly_interest:,.2f}")
                    print(f"{'='*100}\n")
                    
                    logger.info(f"Final payout (exit in first month) for {row['investor_code']}: {series_start_date} to {exit_date} = {days_from_start_to_exit} days")
                else:
                    # Exit in later month: Calculate from 1st of month to exit date
                    monthly_interest = calculate_exit_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        exit_date,
                        target_month - 1 if target_month > 1 else 12,
                        target_year if target_month > 1 else target_year - 1
                    )
                    
                    print(f"\n{'='*100}")
                    print(f"💰 EXPORT: EXIT IN LATER MONTH CALCULATION for {row['investor_code']}")
                    print(f"   Exit Date: {exit_date}")
                    print(f"   RESULT: Rs.{monthly_interest:,.2f}")
                    print(f"{'='*100}\n")
                    
                    logger.info(f"Final payout (exit) for {row['investor_code']}: 1st of month to exit date")
            
            elif maturity_date and is_last_payout_before_maturity(payout_date_obj, maturity_date):
                # SCENARIO 2: Series has matured - Calculate from series start (or 1st) to maturity date
                if series_start_date and is_first_payout(series_start_date, target_month, target_year):
                    # Maturity in first month: Calculate from series start to maturity date
                    days_from_start_to_maturity = (maturity_date - series_start_date).days + 1
                    import calendar
                    days_in_year = 366 if calendar.isleap(maturity_date.year) else 365
                    monthly_interest = (float(row['investment_amount']) * float(row['interest_rate']) * days_from_start_to_maturity) / 100 / days_in_year
                    logger.info(f"Last payout (maturity in first month) for {row['investor_code']}: {series_start_date} to {maturity_date} = {days_from_start_to_maturity} days")
                else:
                    # Maturity in later month: Calculate from 1st of month to maturity date
                    monthly_interest = calculate_maturity_interest(
                        float(row['investment_amount']),
                        float(row['interest_rate']),
                        maturity_date,
                        target_month - 1 if target_month > 1 else 12,
                        target_year if target_month > 1 else target_year - 1
                    )
                    logger.info(f"Last payout (maturity) for {row['investor_code']}: 1st of month to maturity date")
            
            elif series_start_date and is_first_payout(series_start_date, target_month, target_year):
                # SCENARIO 3: First payout - Calculate from series start to END OF MONTH
                # Example: Series starts Feb 2 → Calculate Feb 2 to Feb 28 = 27 days = Rs.8,876.71
                # Payment day is just a PROMISE (when we PAY), not used in calculation
                
                print(f"\n{'='*80}")
                print(f"CALCULATING FIRST MONTH FOR {row['investor_code']}")
                print(f"Principal: {row['investment_amount']}")
                print(f"Rate: {row['interest_rate']}%")
                print(f"Series Start: {series_start_date}")
                print(f"Target Month: {target_month}/{target_year}")
                print(f"{'='*80}\n")
                
                monthly_interest = calculate_first_month_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate']),
                    series_start_date,
                    target_month,
                    target_year,
                    row['interest_payment_day'] or 15
                )
                
                print(f"\n{'='*80}")
                print(f"RESULT FOR {row['investor_code']}: Rs.{monthly_interest:.2f}")
                print(f"{'='*80}\n")
                
                logger.info(f"First payout for {row['investor_code']}: Series start to end of month")
            
            else:
                # SCENARIO 4: Regular monthly interest (FIXED AMOUNT)
                monthly_interest = calculate_monthly_interest(
                    float(row['investment_amount']),
                    float(row['interest_rate'])
                )
            
            # Check if payout record exists
            payout_query = """
            SELECT id, status, payout_date
            FROM interest_payouts
            WHERE investor_id = %s 
            AND series_id = %s 
            AND payout_month = %s
            AND is_active = 1
            """
            
            payout_result = db.execute_query(payout_query, (
                row['investor_id'],
                row['series_id'],
                target_month_str
            ))
            
            # Always use the current interest_payment_day from series to calculate payout date
            # This ensures dates are always up-to-date with series settings
            payout_date = generate_payout_date(
                target_year,
                target_month,
                row['interest_payment_day'] or 15
            )
            
            if payout_result and len(payout_result) > 0:
                payout_status = payout_result[0]['status']
                # Note: We use the calculated payout_date, not the stored one
            else:
                # Default status: Always 'Scheduled' for future payouts
                # Status should only be 'Paid' if marked in database
                payout_status = 'Scheduled'
            
            payouts.append({
                'id': payout_id,
                'investor_id': row['investor_code'],
                'investor_name': row['investor_name'],
                'series_id': row['series_id'],
                'series_name': row['series_name'],
                'interest_month': target_month_str,
                'interest_date': payout_date,
                'amount': monthly_interest,
                'status': payout_status,
                'bank_name': row['bank_name'] or 'N/A',
                'bank_account_number': row['account_number'] or 'N/A',
                'ifsc_code': row['ifsc_code'] or 'N/A'
            })
            
            logger.info(f"✅ EXPORT: {row['investor_code']} - {row['series_name']} - Rs.{monthly_interest:.2f}")
            
            payout_id += 1
        
        # Calculate summary
        total_amount = sum(p['amount'] for p in payouts)
        investor_count = len(set(p['investor_id'] for p in payouts))
        avg_per_investor = total_amount / investor_count if investor_count > 0 else 0
        
        logger.info(f"✅ Generated {len(payouts)} export payout records")
        
        return {
            'payouts': payouts,
            'summary': {
                'total_amount': round(total_amount, 2),
                'investor_count': investor_count,
                'avg_per_investor': round(avg_per_investor, 2),
                'payout_count': len(payouts)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching export payouts: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching export payouts: {str(e)}"
        )


@router.get("/summary")
async def get_payout_summary(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get payout summary statistics for current month
    ALL CALCULATIONS IN BACKEND
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "get_payout_summary", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view payouts"
            )
        
        current_date = datetime.now()
        current_month_str = generate_payout_month(current_date.year, current_date.month)
        
        # Get all payouts for current month
        payouts_response = await get_all_payouts(current_user=current_user)
        payouts = payouts_response['payouts']
        
        # Calculate summary
        total_interest_paid = sum(
            p['amount'] for p in payouts if p['status'] == 'Paid'
        )
        
        total_payouts = len(payouts)
        
        total_investors = len(set(p['investor_id'] for p in payouts))
        
        return {
            'total_interest_paid': round(total_interest_paid, 2),
            'total_payouts': total_payouts,
            'total_investors': total_investors,
            'current_month': current_month_str
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching payout summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching payout summary: {str(e)}"
        )


@router.post("/import")
async def import_payouts(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Import payout data from Excel file
    Updates payout status, interest month, and interest date
    ALL LOGIC IN BACKEND - NO FRONTEND CALCULATIONS
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "edit_interestPayout", db):
            log_unauthorized_access(db, current_user, "import_payouts", "edit_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to import payouts"
            )
        
        logger.info(f"📤 Importing payouts from file: {file.filename}")
        
        # Validate file type
        if not file.filename.endswith(('.xlsx', '.xls')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Please upload an Excel file (.xlsx or .xls)"
            )
        
        # Read Excel file
        try:
            import pandas as pd
            import io
            
            contents = await file.read()
            excel_file = io.BytesIO(contents)
            df = pd.read_excel(excel_file)
            
            logger.info(f"📊 Read {len(df)} rows from Excel file")
            logger.info(f"📊 Columns: {df.columns.tolist()}")
            
        except Exception as e:
            logger.error(f"❌ Error reading Excel file: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error reading Excel file: {str(e)}"
            )
        
        # Validate required columns
        required_columns = ['Investor ID', 'Series Name', 'Status']
        optional_columns = ['Interest Month', 'Interest Date']
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process each row
        updated_count = 0
        error_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                investor_code = str(row['Investor ID']).strip()
                series_name = str(row['Series Name']).strip()
                payout_status = str(row['Status']).strip()
                
                # Optional fields
                interest_month = None
                interest_date = None
                
                if 'Interest Month' in df.columns and pd.notna(row['Interest Month']):
                    interest_month = str(row['Interest Month']).strip()
                
                if 'Interest Date' in df.columns and pd.notna(row['Interest Date']):
                    interest_date = str(row['Interest Date']).strip()
                
                logger.info(f"Processing row {index + 1}: {investor_code}, {series_name}, {payout_status}")
                
                # Validate status
                valid_statuses = ['Paid', 'Pending', 'Scheduled']
                if payout_status not in valid_statuses:
                    errors.append(f"Row {index + 2}: Invalid status '{payout_status}'. Must be one of: {', '.join(valid_statuses)}")
                    error_count += 1
                    continue
                
                # Find investor by investor_id (code)
                investor_query = """
                SELECT id, investor_id, full_name
                FROM investors
                WHERE investor_id = %s AND is_active = 1
                """
                
                investor_result = db.execute_query(investor_query, (investor_code,))
                
                if not investor_result or len(investor_result) == 0:
                    errors.append(f"Row {index + 2}: Investor '{investor_code}' not found")
                    error_count += 1
                    continue
                
                investor = investor_result[0]
                investor_db_id = investor['id']
                
                # Find series by name
                series_query = """
                SELECT id, name, interest_payment_day
                FROM ncd_series
                WHERE name = %s AND is_active = 1
                """
                
                series_result = db.execute_query(series_query, (series_name,))
                
                if not series_result or len(series_result) == 0:
                    errors.append(f"Row {index + 2}: Series '{series_name}' not found")
                    error_count += 1
                    continue
                
                series = series_result[0]
                series_db_id = series['id']
                
                # Check if investor is invested in this series
                investment_query = """
                SELECT id, amount
                FROM investments
                WHERE investor_id = %s AND series_id = %s AND status = 'confirmed'
                """
                
                investment_result = db.execute_query(investment_query, (investor_db_id, series_db_id))
                
                if not investment_result or len(investment_result) == 0:
                    errors.append(f"Row {index + 2}: Investor '{investor_code}' is not invested in series '{series_name}'")
                    error_count += 1
                    continue
                
                # Determine payout month
                if interest_month:
                    payout_month = interest_month
                else:
                    # Use current month as default
                    current_date = datetime.now()
                    payout_month = generate_payout_month(current_date.year, current_date.month)
                
                # Determine payout date
                if interest_date:
                    payout_date = interest_date
                else:
                    # Generate default date based on interest_payment_day
                    current_date = datetime.now()
                    payout_date = generate_payout_date(
                        current_date.year,
                        current_date.month,
                        series['interest_payment_day'] or 15
                    )
                
                # Check if payout record already exists
                check_query = """
                SELECT id, status
                FROM interest_payouts
                WHERE investor_id = %s 
                AND series_id = %s 
                AND payout_month = %s
                AND is_active = 1
                """
                
                existing_payout = db.execute_query(check_query, (
                    investor_db_id,
                    series_db_id,
                    payout_month
                ))
                
                if existing_payout and len(existing_payout) > 0:
                    # SECURITY CHECK: Prevent changing "Paid" back to "Scheduled" or "Pending"
                    existing_status = existing_payout[0]['status']
                    
                    if existing_status == 'Paid' and payout_status in ['Scheduled', 'Pending']:
                        errors.append(f"Row {index + 2}: Cannot change status from 'Paid' to '{payout_status}' for {investor_code}. This is not allowed for audit compliance.")
                        error_count += 1
                        logger.warning(f"⚠️ BLOCKED: Attempt to change Paid status back to {payout_status} for {investor_code}")
                        continue
                    
                    # Update existing payout
                    update_query = """
                    UPDATE interest_payouts
                    SET status = %s,
                        payout_date = %s,
                        paid_date = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    """
                    
                    paid_date = datetime.now().date() if payout_status == 'Paid' else None
                    
                    db.execute_query(update_query, (
                        payout_status,
                        payout_date,
                        paid_date,
                        existing_payout[0]['id']
                    ))
                    
                    logger.info(f"✅ Updated payout for {investor_code} - {series_name} - {payout_month}")
                else:
                    # Create new payout record
                    # First get the investment details to calculate amount
                    investment = investment_result[0]
                    
                    # Get series interest rate
                    series_detail_query = """
                    SELECT interest_rate
                    FROM ncd_series
                    WHERE id = %s
                    """
                    
                    series_detail = db.execute_query(series_detail_query, (series_db_id,))
                    interest_rate = float(series_detail[0]['interest_rate'])
                    
                    # Calculate FIXED monthly interest
                    monthly_interest = calculate_monthly_interest(
                        float(investment['amount']),
                        interest_rate
                    )
                    
                    insert_query = """
                    INSERT INTO interest_payouts (
                        investor_id,
                        series_id,
                        payout_month,
                        payout_date,
                        amount,
                        status,
                        paid_date,
                        created_at,
                        updated_at
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                    """
                    
                    paid_date = datetime.now().date() if payout_status == 'Paid' else None
                    
                    db.execute_query(insert_query, (
                        investor_db_id,
                        series_db_id,
                        payout_month,
                        payout_date,
                        monthly_interest,
                        payout_status,
                        paid_date
                    ))
                    
                    logger.info(f"✅ Created payout for {investor_code} - {series_name} - {payout_month}")
                
                updated_count += 1
                
            except Exception as row_error:
                logger.error(f"❌ Error processing row {index + 2}: {row_error}")
                errors.append(f"Row {index + 2}: {str(row_error)}")
                error_count += 1
                continue
        
        # Prepare response
        success = updated_count > 0
        message = f"Successfully processed {updated_count} payout(s)"
        
        if error_count > 0:
            message += f". {error_count} error(s) encountered."
        
        logger.info(f"✅ Import complete: {updated_count} updated, {error_count} errors")
        
        return {
            'success': success,
            'message': message,
            'updated_count': updated_count,
            'error_count': error_count,
            'errors': errors[:10]  # Return first 10 errors
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error importing payouts: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error importing payouts: {str(e)}"
        )


@router.put("/update-status/{payout_id}")
async def update_payout_status(
    payout_id: int,
    new_status: str,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Update payout status for a single payout
    
    PERMISSION REQUIRED: edit_interestPayout
    
    Parameters:
    - payout_id: ID of the payout to update
    - new_status: New status ('Paid', 'Pending', 'Scheduled', 'Processing')
    
    ALL LOGIC IN BACKEND
    """
    try:
        db = get_db()
        
        if not has_permission(current_user, "edit_interestPayout", db):
            log_unauthorized_access(db, current_user, "update_payout_status", "edit_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to update payouts"
            )
        
        # Validate status
        valid_statuses = ['Paid', 'Pending', 'Scheduled', 'Processing']
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        # Get existing payout
        existing_query = """
        SELECT id, status, investor_id, series_id, amount
        FROM interest_payouts
        WHERE id = %s AND is_active = 1
        """
        
        existing_result = db.execute_query(existing_query, (payout_id,))
        
        if not existing_result or len(existing_result) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payout with ID {payout_id} not found"
            )
        
        existing_payout = existing_result[0]
        existing_status = existing_payout['status']
        
        # SECURITY CHECK: Prevent changing "Paid" back to "Scheduled" or "Pending"
        if existing_status == 'Paid' and new_status in ['Scheduled', 'Pending']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change status from 'Paid' to 'Scheduled' or 'Pending'. This is not allowed for audit compliance."
            )
        
        # Update payout status
        paid_date = datetime.now().date() if new_status == 'Paid' else None
        
        update_query = """
        UPDATE interest_payouts
        SET status = %s,
            paid_date = %s,
            updated_at = NOW()
        WHERE id = %s
        """
        
        db.execute_query(update_query, (new_status, paid_date, payout_id))
        
        logger.info(f"✅ Payout {payout_id} status updated from '{existing_status}' to '{new_status}' by {current_user.username}")
        
        return {
            "success": True,
            "message": f"Payout status updated to '{new_status}' successfully",
            "payout_id": payout_id,
            "old_status": existing_status,
            "new_status": new_status,
            "paid_date": paid_date.isoformat() if paid_date else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error updating payout status: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating payout status: {str(e)}"
        )


@router.get("/download/csv")
async def download_payouts_csv(
    series_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Download payouts as CSV file
    ALL CSV GENERATION IN BACKEND
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "download_payouts_csv", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to download payouts"
            )
        
        logger.info(f"📥 Generating CSV for user: {current_user.username}")
        
        # Get payouts data
        payouts_response = await get_all_payouts(
            series_id=series_id,
            status_filter=status_filter,
            current_user=current_user
        )
        
        payouts = payouts_response['payouts']
        
        # Generate CSV content
        import csv
        import io
        
        output = io.StringIO()
        
        # Add UTF-8 BOM for Excel
        output.write('\ufeff')
        
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            'Investor ID', 'Investor Name', 'Series Name', 
            'Interest Month', 'Interest Date', 'Amount', 
            'Status', 'Bank Name', 'Account Number', 'IFSC Code'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for payout in payouts:
            writer.writerow([
                payout['investor_id'],
                payout['investor_name'],
                payout['series_name'],
                payout['interest_month'],
                payout['interest_date'],
                payout['amount'],
                payout['status'],
                payout['bank_name'] or 'N/A',
                payout['bank_account_number'] or 'N/A',
                payout['ifsc_code'] or 'N/A'
            ])
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Return as downloadable file
        from fastapi.responses import Response
        
        filename = f"interest-payouts-{datetime.now().strftime('%Y-%m-%d')}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating CSV: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating CSV: {str(e)}"
        )


@router.get("/download/export-csv")
async def download_export_csv(
    series_id: Optional[int] = None,
    month_type: str = 'current',
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Download export payouts as CSV file
    ALL CSV GENERATION IN BACKEND
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "download_export_csv", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to download payouts"
            )
        
        logger.info(f"📥 Generating export CSV: series_id={series_id}, month_type={month_type}")
        
        # Get export data
        export_response = await get_export_payouts(
            series_id=series_id,
            month_type=month_type,
            current_user=current_user
        )
        
        payouts = export_response['payouts']
        summary = export_response['summary']
        
        # Generate CSV content
        import csv
        import io
        
        output = io.StringIO()
        
        # Add UTF-8 BOM for Excel
        output.write('\ufeff')
        
        writer = csv.writer(output)
        
        # Write headers
        headers = [
            'Investor ID', 'Investor Name', 'Series', 
            'Month', 'Date', 'Amount', 
            'Status', 'Bank Account', 'IFSC Code', 'Bank Name'
        ]
        writer.writerow(headers)
        
        # Write data rows
        for payout in payouts:
            writer.writerow([
                payout['investor_id'],
                payout['investor_name'],
                payout['series_name'],
                payout['interest_month'],
                payout['interest_date'],
                payout['amount'],
                payout['status'],
                payout['bank_account_number'] or 'N/A',
                payout['ifsc_code'] or 'N/A',
                payout['bank_name'] or 'N/A'
            ])
        
        # Add summary rows
        writer.writerow([])
        writer.writerow(['Summary'])
        writer.writerow(['Total Amount', summary['total_amount']])
        writer.writerow(['Total Investors', summary['investor_count']])
        writer.writerow(['Average per Investor', round(summary['avg_per_investor'], 2)])
        writer.writerow(['Total Payouts', summary['payout_count']])
        
        # Get CSV content
        csv_content = output.getvalue()
        output.close()
        
        # Return as downloadable file
        from fastapi.responses import Response
        
        series_name = 'all' if not series_id else f'series-{series_id}'
        filename = f"interest-payout-{series_name}-{month_type}-{datetime.now().strftime('%Y-%m-%d')}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv; charset=utf-8",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating export CSV: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating export CSV: {str(e)}"
        )


@router.get("/download/sample-template")
async def download_sample_template(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Download sample Excel template for import
    ALL EXCEL GENERATION IN BACKEND
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(db, current_user, "download_sample_template", "view_interestPayout")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to download template"
            )
        
        logger.info(f"📥 Generating sample template for user: {current_user.username}")
        
        # Create sample data
        import pandas as pd
        import io
        
        sample_data = [
            {
                'Investor ID': 'INV001',
                'Series Name': 'SERIES-B',
                'Status': 'Paid',
                'Interest Month': 'February 2026',
                'Interest Date': '15-Feb-2026'
            },
            {
                'Investor ID': 'INV002',
                'Series Name': 'SERIES-B',
                'Status': 'Pending',
                'Interest Month': 'February 2026',
                'Interest Date': '15-Feb-2026'
            },
            {
                'Investor ID': 'INV001',
                'Series Name': 'SERIES-B',
                'Status': 'Scheduled',
                'Interest Month': 'March 2026',
                'Interest Date': '15-Mar-2026'
            }
        ]
        
        df = pd.DataFrame(sample_data)
        
        # Create Excel file in memory
        excel_buffer = io.BytesIO()
        
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Interest Payout')
            
            # Get the worksheet to set column widths
            worksheet = writer.sheets['Interest Payout']
            worksheet.column_dimensions['A'].width = 15  # Investor ID
            worksheet.column_dimensions['B'].width = 15  # Series Name
            worksheet.column_dimensions['C'].width = 12  # Status
            worksheet.column_dimensions['D'].width = 18  # Interest Month
            worksheet.column_dimensions['E'].width = 15  # Interest Date
        
        excel_buffer.seek(0)
        excel_content = excel_buffer.read()
        excel_buffer.close()
        
        # Return as downloadable file
        from fastapi.responses import Response
        
        filename = f"Interest_Payout_Sample_{datetime.now().strftime('%Y-%m-%d')}.xlsx"
        
        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating sample template: {e}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating sample template: {str(e)}"
        )



@router.get("/unique-series-names")
async def get_unique_series_names(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get unique series names for filter dropdown
    PERMISSION REQUIRED: view_interestPayout
    Returns: List of unique series names sorted alphabetically
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(
                db, current_user, "get_unique_series_names", "view_interestPayout"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view payouts"
            )
        
        logger.info("📊 Fetching unique series names for filter dropdown")
        
        # Get unique series names from payouts table
        query = """
        SELECT DISTINCT s.name as series_name
        FROM interest_payouts p
        INNER JOIN ncd_series s ON p.series_id = s.id
        WHERE s.is_active = 1
        ORDER BY s.name ASC
        """
        
        result = db.execute_query(query)
        
        series_names = [row['series_name'] for row in result]
        
        logger.info(f"✅ Found {len(series_names)} unique series names")
        
        return {
            "series_names": series_names,
            "count": len(series_names)
        }
        
    except Exception as e:
        logger.error(f"Error getting unique series names: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving unique series names: {str(e)}"
        )


@router.get("/unique-series-for-export")
async def get_unique_series_for_export(
    current_user: UserInDB = Depends(get_current_user)
):
    """
    Get unique series with IDs for export dropdown
    PERMISSION REQUIRED: view_interestPayout
    Returns: List of {id, name} objects sorted alphabetically by name
    """
    try:
        db = get_db()
        
        # CHECK PERMISSION
        if not has_permission(current_user, "view_interestPayout", db):
            log_unauthorized_access(
                db, current_user, "get_unique_series_for_export", "view_interestPayout"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: You don't have permission to view payouts"
            )
        
        logger.info("📊 Fetching unique series for export dropdown")
        
        # Get unique series with IDs from payouts table
        query = """
        SELECT DISTINCT s.id, s.name
        FROM interest_payouts p
        INNER JOIN ncd_series s ON p.series_id = s.id
        WHERE s.is_active = 1
        ORDER BY s.name ASC
        """
        
        result = db.execute_query(query)
        
        series_list = [
            {
                "id": row['id'],
                "name": row['name']
            }
            for row in result
        ]
        
        logger.info(f"✅ Found {len(series_list)} unique series for export")
        
        return {
            "series": series_list,
            "count": len(series_list)
        }
        
    except Exception as e:
        logger.error(f"Error getting unique series for export: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving unique series for export: {str(e)}"
        )
