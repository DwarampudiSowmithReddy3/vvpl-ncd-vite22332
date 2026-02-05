#!/usr/bin/env python3
"""
Test if backend is running
"""
import requests

def test_backend():
    """Test if backend is running"""
    
    try:
        response = requests.get("http://localhost:8003/docs", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running - FastAPI docs accessible")
            return True
        else:
            print(f"❌ Backend responded with status: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend is not running - connection refused")
        return False
    except Exception as e:
        print(f"❌ Error testing backend: {e}")
        return False

if __name__ == "__main__":
    test_backend()