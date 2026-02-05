#!/usr/bin/env python3
"""
Add unique constraint to phone_number field in admin_users table
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def add_phone_unique_constraint():
    """Add unique constraint to phone_number field"""
    
    try:
        # Database connection
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'ncd_management'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', '')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            
            print("🔍 Checking current phone_number constraints...")
            
            # Check if unique constraint already exists
            cursor.execute("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'admin_users' 
                AND CONSTRAINT_TYPE = 'UNIQUE'
                AND CONSTRAINT_NAME LIKE '%phone%'
            """, (os.getenv('DB_NAME', 'ncd_management'),))
            
            existing_constraints = cursor.fetchall()
            
            if existing_constraints:
                print("✅ Phone number unique constraint already exists:")
                for constraint in existing_constraints:
                    print(f"   - {constraint[0]}")
                return
            
            print("📝 Adding unique constraint to phone_number field...")
            
            # First, check for duplicate phone numbers
            cursor.execute("""
                SELECT phone_number, COUNT(*) as count 
                FROM admin_users 
                WHERE phone_number IS NOT NULL 
                AND phone_number != '' 
                GROUP BY phone_number 
                HAVING COUNT(*) > 1
            """)
            
            duplicates = cursor.fetchall()
            
            if duplicates:
                print("⚠️ Found duplicate phone numbers that need to be resolved:")
                for phone, count in duplicates:
                    print(f"   - {phone}: {count} users")
                
                print("\n🔧 Resolving duplicates by adding suffixes...")
                
                for phone, count in duplicates:
                    # Get all users with this phone number
                    cursor.execute("""
                        SELECT id, username, phone_number 
                        FROM admin_users 
                        WHERE phone_number = %s 
                        ORDER BY id
                    """, (phone,))
                    
                    duplicate_users = cursor.fetchall()
                    
                    # Keep the first user's phone as is, modify others
                    for i, (user_id, username, original_phone) in enumerate(duplicate_users[1:], 1):
                        # Extract the number part and add suffix
                        if original_phone.startswith('+91 '):
                            base_number = original_phone[4:]  # Remove '+91 '
                            new_phone = f"+91 {base_number[:-1]}{i}"  # Add suffix before last digit
                        else:
                            new_phone = f"{original_phone}_{i}"
                        
                        cursor.execute("""
                            UPDATE admin_users 
                            SET phone_number = %s 
                            WHERE id = %s
                        """, (new_phone, user_id))
                        
                        print(f"   ✅ Updated user {username} (ID: {user_id}): {original_phone} → {new_phone}")
                
                connection.commit()
                print("✅ Duplicate phone numbers resolved")
            
            # Now add the unique constraint
            cursor.execute("""
                ALTER TABLE admin_users 
                ADD CONSTRAINT uk_admin_users_phone_number 
                UNIQUE (phone_number)
            """)
            
            connection.commit()
            print("✅ Unique constraint added to phone_number field")
            
            # Verify the constraint was added
            cursor.execute("""
                SELECT CONSTRAINT_NAME 
                FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = %s 
                AND TABLE_NAME = 'admin_users' 
                AND CONSTRAINT_TYPE = 'UNIQUE'
            """, (os.getenv('DB_NAME', 'ncd_management'),))
            
            constraints = cursor.fetchall()
            print("\n📋 Current unique constraints on admin_users table:")
            for constraint in constraints:
                print(f"   - {constraint[0]}")
            
    except Error as e:
        print(f"❌ Database error: {e}")
        if connection:
            connection.rollback()
    
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
            print("\n🔌 Database connection closed")

if __name__ == "__main__":
    print("🚀 Adding unique constraint to phone_number field...")
    add_phone_unique_constraint()
    print("\n✅ Migration completed!")
    print("\n💡 Benefits:")
    print("   - Prevents duplicate phone numbers")
    print("   - Ensures unique user identification")
    print("   - Improves data integrity")
    print("   - Prevents authentication confusion")