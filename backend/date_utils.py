"""
Date utility functions for backend
Handles date format conversions - ALL LOGIC IN BACKEND
"""
from datetime import datetime, date
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def parse_date_flexible(date_input: any) -> Optional[date]:
    """
    Parse date from multiple formats - ALL LOGIC IN BACKEND
    Accepts:
    - DD/MM/YYYY (from frontend)
    - YYYY-MM-DD (database format)
    - date object
    - datetime object
    
    Returns: date object or None
    """
    if date_input is None:
        return None
    
    # Already a date object
    if isinstance(date_input, date):
        return date_input
    
    # datetime object
    if isinstance(date_input, datetime):
        return date_input.date()
    
    # String - try multiple formats
    if isinstance(date_input, str):
        date_str = date_input.strip()
        
        # Try DD/MM/YYYY format (from frontend)
        try:
            return datetime.strptime(date_str, '%d/%m/%Y').date()
        except ValueError:
            pass
        
        # Try YYYY-MM-DD format (database)
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            pass
        
        # Try DD-MM-YYYY format
        try:
            return datetime.strptime(date_str, '%d-%m-%Y').date()
        except ValueError:
            pass
        
        logger.warning(f"Could not parse date: {date_str}")
        return None
    
    logger.warning(f"Unexpected date type: {type(date_input)}")
    return None


def format_date_for_display(date_input: any) -> str:
    """
    Format date for display - DD/MM/YYYY
    """
    parsed_date = parse_date_flexible(date_input)
    if parsed_date:
        return parsed_date.strftime('%d/%m/%Y')
    return 'N/A'


def format_date_for_db(date_input: any) -> Optional[str]:
    """
    Format date for database - YYYY-MM-DD
    """
    parsed_date = parse_date_flexible(date_input)
    if parsed_date:
        return parsed_date.strftime('%Y-%m-%d')
    return None
