"""
Force fix SERIES C status
"""
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

try:
    connection = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        port=int(os.getenv('DB_PORT', 3306)),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', ''),
        database=os.getenv('DB_NAME', 'ncd_management'),
        autocommit=False
    )
    
    cursor = connection.cursor(dictionary=True)
    
    print("=" * 100)
    print("FORCE FIXING SERIES C STATUS")
    print("=" * 100)
    
    # Check current status
    cursor.execute("SELECT id, name, status, series_start_date FROM ncd_series WHERE name = 'SERIES C'")
    series = cursor.fetchone()
    
    if series:
        print(f"\nBEFORE:")
        print(f"  Name: {series['name']}")
        print(f"  Status: {series['status']}")
        print(f"  Series Start: {series['series_start_date']}")
        
        # Force update to 'upcoming'
        cursor.execute("UPDATE ncd_series SET status = 'upcoming' WHERE name = 'SERIES C'")
        connection.commit()
        
        # Verify
        cursor.execute("SELECT id, name, status, series_start_date FROM ncd_series WHERE name = 'SERIES C'")
        series_after = cursor.fetchone()
        
        print(f"\nAFTER:")
        print(f"  Name: {series_after['name']}")
        print(f"  Status: {series_after['status']}")
        print(f"  Series Start: {series_after['series_start_date']}")
        
        print(f"\n{'='*100}")
        print("✅ SERIES C status updated to 'upcoming'")
        print(f"{'='*100}")
        print("\nNow:")
        print("1. Hard refresh your browser (Ctrl+Shift+R)")
        print("2. Check if SERIES C shows 'UPCOMING' status")
    else:
        print("\n❌ SERIES C not found")
    
    cursor.close()
    connection.close()
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
