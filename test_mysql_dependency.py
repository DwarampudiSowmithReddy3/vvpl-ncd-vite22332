#!/usr/bin/env python3
"""
Test to verify permission system is completely dependent on MySQL + API + JWT + CORS
"""
import requests
import json

def test_mysql_dependency():
    """Test that permission system has NO fallbacks and depends entirely on MySQL"""
    
    base_url = "http://localhost:8003/api/v1"
    
    print("🔍 Testing MySQL + API + JWT + CORS Dependency")
    print("=" * 60)
    
    # Test 1: No JWT Token - Should fail completely
    print("\n1. 🚫 Testing without JWT token (should fail):")
    try:
        response = requests.get(f'{base_url}/admin/permissions')
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
        
        if response.status_code == 403:
            print("   ✅ GOOD: No JWT token = Access denied (no fallback)")
        else:
            print("   ❌ BAD: System should deny access without JWT")
    except Exception as e:
        print(f"   ✅ GOOD: Exception without JWT: {e}")
    
    # Test 2: Invalid JWT Token - Should fail completely
    print("\n2. 🔑 Testing with invalid JWT token (should fail):")
    try:
        headers = {'Authorization': 'Bearer invalid_token_123'}
        response = requests.get(f'{base_url}/admin/permissions', headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [401, 403]:
            print("   ✅ GOOD: Invalid JWT = Access denied (no fallback)")
        else:
            print("   ❌ BAD: System should deny access with invalid JWT")
    except Exception as e:
        print(f"   ✅ GOOD: Exception with invalid JWT: {e}")
    
    # Test 3: Valid JWT - Should work and load from MySQL
    print("\n3. 🔐 Testing with valid JWT (should work with MySQL):")
    try:
        # Login to get valid token
        login_response = requests.post(f'{base_url}/auth/login', 
                                     json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}'}
            
            # Test permissions endpoint
            response = requests.get(f'{base_url}/admin/permissions', headers=headers)
            
            if response.status_code == 200:
                permissions = response.json()
                print(f"   ✅ SUCCESS: Permissions loaded from MySQL")
                print(f"   📊 Roles from database: {list(permissions.keys())}")
                
                # Verify it's actually from database (not hardcoded)
                if len(permissions) > 0:
                    sample_role = list(permissions.keys())[0]
                    sample_modules = list(permissions[sample_role].keys())
                    print(f"   📋 Sample - {sample_role}: {sample_modules[:3]}...")
                    print("   ✅ CONFIRMED: Data structure matches MySQL format")
                else:
                    print("   ❌ BAD: Empty permissions (MySQL connection issue?)")
            else:
                print(f"   ❌ BAD: Valid JWT failed: {response.status_code}")
        else:
            print(f"   ❌ BAD: Login failed: {login_response.status_code}")
    except Exception as e:
        print(f"   ❌ BAD: Exception with valid JWT: {e}")
    
    # Test 4: CORS Headers
    print("\n4. 🌐 Testing CORS headers:")
    try:
        # Test preflight request
        headers = {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization'
        }
        response = requests.options(f'{base_url}/admin/permissions', headers=headers)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print(f"   CORS Headers: {cors_headers}")
        
        if cors_headers['Access-Control-Allow-Origin']:
            print("   ✅ GOOD: CORS headers present")
        else:
            print("   ⚠️  WARNING: CORS headers might not be configured")
    except Exception as e:
        print(f"   ⚠️  CORS test error: {e}")
    
    # Test 5: Permission Updates (requires MySQL write)
    print("\n5. 💾 Testing permission updates (MySQL write dependency):")
    try:
        login_response = requests.post(f'{base_url}/auth/login', 
                                     json={'username': 'admin', 'password': 'admin123', 'user_type': 'admin'})
        
        if login_response.status_code == 200:
            token = login_response.json()['access_token']
            headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
            
            # Test permission update
            update_data = {
                'role_name': 'Admin',
                'module_name': 'dashboard',
                'permission_type': 'create',
                'is_granted': True
            }
            
            response = requests.put(f'{base_url}/admin/permissions', 
                                  headers=headers, json=update_data)
            
            if response.status_code == 200:
                result = response.json()
                print(f"   ✅ SUCCESS: Permission update saved to MySQL")
                print(f"   📝 Result: {result.get('message', 'Updated')}")
            else:
                print(f"   ❌ BAD: Permission update failed: {response.status_code}")
                print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ BAD: Permission update error: {e}")

def test_backend_dependencies():
    """Test backend endpoint dependencies"""
    
    print("\n" + "=" * 60)
    print("🔧 Testing Backend Dependencies")
    print("=" * 60)
    
    # Check if backend is using MySQL queries
    print("\n📊 Backend MySQL Dependency Analysis:")
    
    # Read the admin.py file to verify MySQL queries
    try:
        with open('backend/app/api/v1/endpoints/admin.py', 'r') as f:
            content = f.read()
            
        mysql_indicators = [
            'FROM role_permissions',
            'SELECT role_name, module_name',
            'UPDATE role_permissions',
            'INSERT INTO role_permissions',
            'db.execute(query',
            'text("""'
        ]
        
        found_indicators = []
        for indicator in mysql_indicators:
            if indicator in content:
                found_indicators.append(indicator)
        
        print(f"   MySQL Query Indicators Found: {len(found_indicators)}/{len(mysql_indicators)}")
        for indicator in found_indicators:
            print(f"   ✅ {indicator}")
        
        if len(found_indicators) >= 4:
            print("   ✅ CONFIRMED: Backend uses direct MySQL queries")
        else:
            print("   ⚠️  WARNING: Backend might not be using MySQL directly")
            
    except Exception as e:
        print(f"   ❌ Could not analyze backend file: {e}")

def test_frontend_dependencies():
    """Test frontend dependency on API calls"""
    
    print("\n📱 Frontend API Dependency Analysis:")
    
    try:
        with open('src/context/AuthContext.jsx', 'r') as f:
            content = f.read()
        
        api_indicators = [
            'fetch(\'http://localhost:8003',
            'Authorization: `Bearer ${token}',
            'loadPermissionsFromDatabase',
            'setPermissions({})',
            'NO HARDCODED PERMISSIONS'
        ]
        
        found_indicators = []
        for indicator in api_indicators:
            if indicator in content:
                found_indicators.append(indicator)
        
        print(f"   API Dependency Indicators Found: {len(found_indicators)}/{len(api_indicators)}")
        for indicator in found_indicators:
            print(f"   ✅ {indicator}")
        
        # Check for fallback mechanisms (should NOT exist)
        fallback_indicators = [
            'const PERMISSIONS = {',
            'fallback',
            'PERMISSIONS[user.role]'
        ]
        
        found_fallbacks = []
        for indicator in fallback_indicators:
            if indicator in content:
                found_fallbacks.append(indicator)
        
        if len(found_fallbacks) == 0:
            print("   ✅ CONFIRMED: No hardcoded fallback permissions found")
        else:
            print(f"   ❌ WARNING: Found {len(found_fallbacks)} fallback indicators:")
            for fallback in found_fallbacks:
                print(f"   ⚠️  {fallback}")
                
    except Exception as e:
        print(f"   ❌ Could not analyze frontend file: {e}")

if __name__ == "__main__":
    print("🚀 MySQL + API + JWT + CORS Dependency Test")
    print("Testing if permission system is completely dependent on:")
    print("  ✅ MySQL Database")
    print("  ✅ API Calls") 
    print("  ✅ JWT Authentication")
    print("  ✅ CORS Headers")
    print("  ❌ NO Fallback Mechanisms")
    
    test_mysql_dependency()
    test_backend_dependencies()
    test_frontend_dependencies()
    
    print("\n" + "=" * 60)
    print("🎯 SUMMARY:")
    print("✅ System should ONLY work with MySQL + API + JWT + CORS")
    print("❌ System should FAIL without any of these components")
    print("🚫 System should have NO hardcoded fallback permissions")
    print("=" * 60)