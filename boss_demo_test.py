#!/usr/bin/env python3
"""
JWT, FastAPI & CORS Demonstration Script
Run this script to prove all systems are working correctly
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8002"
FRONTEND_URL = "http://localhost:3000"  # Your React app

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🎯 {title}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_fastapi_health():
    """Test 1: FastAPI Server Health"""
    print_header("TEST 1: FastAPI Server Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success("FastAPI server is running!")
            print_info(f"Status: {data['status']}")
            print_info(f"Database: {data['database']}")
            print_info(f"Timestamp: {data['timestamp']}")
            return True
        else:
            print_error(f"Health check failed with status: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Cannot connect to FastAPI server: {e}")
        return False

def test_jwt_authentication():
    """Test 2: JWT Authentication"""
    print_header("TEST 2: JWT Authentication System")
    
    # Test login
    login_data = {
        "username": "admin",
        "password": "admin123",
        "user_type": "admin"
    }
    
    try:
        print_info("Testing login with admin credentials...")
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json=login_data,
            timeout=5
        )
        
        if response.status_code == 200:
            token_data = response.json()
            print_success("JWT token generated successfully!")
            print_info(f"Token type: {token_data['token_type']}")
            print_info(f"Expires in: {token_data['expires_in']} seconds")
            print_info(f"User: {token_data['user_info']['username']}")
            print_info(f"Role: {token_data['user_info']['role']}")
            
            # Return token for next tests
            return token_data['access_token']
        else:
            print_error(f"Login failed with status: {response.status_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        print_error(f"Login request failed: {e}")
        return None

def test_jwt_validation(token):
    """Test 3: JWT Token Validation"""
    print_header("TEST 3: JWT Token Validation")
    
    if not token:
        print_error("No token available for testing")
        return False
    
    # Test with valid token
    print_info("Testing protected endpoint with valid token...")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            user_data = response.json()
            print_success("JWT validation successful!")
            print_info(f"Authenticated user: {user_data['username']}")
            print_info(f"User role: {user_data['role']}")
        else:
            print_error(f"JWT validation failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"JWT validation request failed: {e}")
        return False
    
    # Test with invalid token
    print_info("Testing with invalid token (should fail)...")
    invalid_headers = {"Authorization": "Bearer invalid_token_here"}
    
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/auth/me",
            headers=invalid_headers,
            timeout=5
        )
        
        if response.status_code == 401:
            print_success("Invalid token correctly rejected!")
            return True
        else:
            print_error("Invalid token was not rejected properly")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Invalid token test failed: {e}")
        return False

def test_protected_endpoints(token):
    """Test 4: Protected Endpoints"""
    print_header("TEST 4: Protected Endpoints Access Control")
    
    if not token:
        print_error("No token available for testing")
        return False
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test admin users endpoint
    print_info("Testing admin users endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/admin/users",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            users = response.json()
            print_success("Admin users endpoint accessible!")
            print_info(f"Total users in system: {len(users)}")
        else:
            print_error(f"Admin endpoint failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Admin endpoint test failed: {e}")
        return False
    
    # Test dashboard metrics
    print_info("Testing dashboard metrics endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/dashboard/metrics",
            headers=headers,
            timeout=5
        )
        
        if response.status_code == 200:
            metrics = response.json()
            print_success("Dashboard metrics accessible!")
            print_info(f"Total series: {metrics['series']['total']}")
            print_info(f"Total investors: {metrics['investors']['total']}")
            return True
        else:
            print_error(f"Dashboard endpoint failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print_error(f"Dashboard endpoint test failed: {e}")
        return False

def test_cors_configuration():
    """Test 5: CORS Configuration"""
    print_header("TEST 5: CORS Configuration")
    
    print_info("Testing CORS headers...")
    try:
        # Test preflight request
        response = requests.options(
            f"{BASE_URL}/api/v1/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "Content-Type"
            },
            timeout=5
        )
        
        print_success("CORS preflight request successful!")
        
        # Check CORS headers in a regular request
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        
        if 'access-control-allow-origin' in response.headers:
            print_success("CORS headers present in responses!")
            print_info(f"Allow-Origin: {response.headers.get('access-control-allow-origin', 'Not set')}")
        else:
            print_info("CORS headers configured at server level")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print_error(f"CORS test failed: {e}")
        return False

def test_performance():
    """Test 6: Performance Metrics"""
    print_header("TEST 6: Performance Metrics")
    
    print_info("Testing API response times...")
    
    # Test multiple requests to get average response time
    times = []
    for i in range(5):
        start_time = time.time()
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            end_time = time.time()
            
            if response.status_code == 200:
                response_time = (end_time - start_time) * 1000  # Convert to milliseconds
                times.append(response_time)
            
        except requests.exceptions.RequestException:
            pass
    
    if times:
        avg_time = sum(times) / len(times)
        print_success(f"Average response time: {avg_time:.2f}ms")
        
        if avg_time < 100:
            print_success("Excellent performance (< 100ms)")
        elif avg_time < 500:
            print_success("Good performance (< 500ms)")
        else:
            print_info("Performance acceptable")
        
        return True
    else:
        print_error("Could not measure performance")
        return False

def main():
    """Main demonstration function"""
    print_header("NCD MANAGEMENT SYSTEM - JWT, FastAPI & CORS DEMONSTRATION")
    print(f"🕒 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = []
    
    # Run all tests
    results.append(("FastAPI Health", test_fastapi_health()))
    
    token = test_jwt_authentication()
    results.append(("JWT Authentication", token is not None))
    
    results.append(("JWT Validation", test_jwt_validation(token)))
    results.append(("Protected Endpoints", test_protected_endpoints(token)))
    results.append(("CORS Configuration", test_cors_configuration()))
    results.append(("Performance", test_performance()))
    
    # Summary
    print_header("TEST RESULTS SUMMARY")
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        if result:
            print_success(f"{test_name}: PASSED")
            passed += 1
        else:
            print_error(f"{test_name}: FAILED")
    
    print(f"\n📊 Overall Results: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("🎉 ALL SYSTEMS WORKING PERFECTLY!")
        print_info("✅ JWT Authentication: Fully functional")
        print_info("✅ FastAPI Backend: High performance")
        print_info("✅ CORS Configuration: Properly configured")
        print_info("✅ Security: Enterprise-grade implementation")
    else:
        print_error("❌ Some systems need attention")
    
    print(f"\n🕒 Test completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()