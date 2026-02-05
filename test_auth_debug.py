#!/usr/bin/env python3
"""
Debug authentication issues
"""
import sys
import os
sys.path.append('backend')

from auth import authenticate_user, get_user_by_username, verify_password, get_password_hash
from database import get_db
import hashlib

def test_authentication():
    print("🔍 DEBUGGING AUTHENTICATION ISSUES")
    print("=" * 50)
    
    # Test 1: Check if admin user exists
    print("\n1. Checking if admin user exists...")
    user = get_user_by_username("admin")
    if user:
        print(f"✅ Admin user found:")
        print(f"   - ID: {user.id}")
        print(f"   - Username: {user.username}")
        print(f"   - Full Name: {user.full_name}")
        print(f"   - Role: {user.role}")
        print(f"   - Is Active: {user.is_active}")
        print(f"   - Password Hash: {user.password_hash}")
    else:
        print("❌ Admin user NOT found in database")
        return
    
    # Test 2: Check password hashing
    print("\n2. Testing password verification...")
    test_password = "admin123"
    expected_hash = get_password_hash(test_password)
    print(f"   - Test password: {test_password}")
    print(f"   - Expected hash: {expected_hash}")
    print(f"   - Stored hash:   {user.password_hash}")
    print(f"   - Hashes match:  {expected_hash == user.password_hash}")
    
    # Test 3: Test verify_password function
    print("\n3. Testing verify_password function...")
    password_valid = verify_password(test_password, user.password_hash)
    print(f"   - Password verification result: {password_valid}")
    
    # Test 4: Test full authentication
    print("\n4. Testing full authentication...")
    auth_result = authenticate_user("admin", "admin123")
    if auth_result:
        print("✅ Authentication successful")
        print(f"   - Authenticated user: {auth_result.username}")
    else:
        print("❌ Authentication failed")
    
    # Test 5: Check database connection
    print("\n5. Testing database connection...")
    try:
        db = get_db()
        result = db.execute_query("SELECT COUNT(*) as count FROM users")
        print(f"✅ Database connected - {result[0]['count']} users found")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
    
    # Test 6: Manual password hash check
    print("\n6. Manual password hash verification...")
    manual_hash = hashlib.sha256("admin123".encode()).hexdigest()
    print(f"   - Manual SHA256 hash: {manual_hash}")
    print(f"   - Stored hash:        {user.password_hash}")
    print(f"   - Manual match:       {manual_hash == user.password_hash}")

if __name__ == "__main__":
    test_authentication()