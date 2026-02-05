#!/usr/bin/env python3
"""
RUN ALL TESTS - One command to test everything
Ultimate testing orchestrator
"""
import subprocess
import sys
import time
import requests
import os
from datetime import datetime

def run_command(command, description, timeout=300):
    """Run command with timeout and return success status"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=timeout
        )
        
        if result.returncode == 0:
            print(f"✅ {description} - SUCCESS")
            return True, result.stdout
        else:
            print(f"❌ {description} - FAILED")
            print(f"Error: {result.stderr}")
            return False, result.stderr
    except subprocess.TimeoutExpired:
        print(f"⏰ {description} - TIMEOUT")
        return False, "Command timed out"
    except Exception as e:
        print(f"❌ {description} - ERROR: {e}")
        return False, str(e)

def check_server():
    """Check if server is running"""
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def main():
    print("🚀 ULTIMATE SEAMLESS API TESTING SUITE")
    print("=" * 80)
    print(f"🕐 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)
    
    # Change to backend directory if it exists
    if os.path.exists("backend"):
        os.chdir("backend")
    
    # Check if server is running
    if not check_server():
        print("❌ Backend server is not running!")
        print("\n📋 Please start the server first:")
        print("   cd backend")
        print("   python scripts/init_db.py  # First time only")
        print("   python run.py")
        return
    
    print("✅ Backend server is running")
    
    # Run all tests
    tests = [
        ("python ultimate_api_tester.py", "Ultimate API Testing", 600),
        ("python test_server.py", "Basic Server Tests", 60),
        ("python test_all_apis.py", "Comprehensive API Tests", 300)
    ]
    
    results = []
    
    for command, description, timeout in tests:
        success, output = run_command(command, description, timeout)
        results.append((description, success, output))
        time.sleep(2)  # Brief pause between tests
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 ULTIMATE TESTING SUMMARY")
    print("=" * 80)
    
    passed = sum(1 for _, success, _ in results if success)
    total = len(results)
    
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")
    
    success_rate = (passed / total) * 100
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate == 100:
        print("\n🎉 ALL TESTS PASSED! Backend is ready for production!")
    elif success_rate >= 80:
        print("\n👍 Most tests passed - minor issues to address")
    else:
        print("\n❌ Multiple test failures - needs debugging")
    
    print(f"\n📖 API Documentation: http://localhost:8000/docs")
    print(f"🔍 Frontend Testing: Use seamless_frontend_tester.js in browser")
    print(f"📋 Full Guide: See ULTIMATE_TESTING_GUIDE.md")

if __name__ == "__main__":
    main()