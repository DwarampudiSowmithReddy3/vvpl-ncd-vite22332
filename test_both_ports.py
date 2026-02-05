#!/usr/bin/env python3
"""
Test both ports to see which one the backend is running on
"""
import requests

def test_ports():
    """Test both ports"""
    
    ports = [8002, 8003]
    
    for port in ports:
        try:
            response = requests.get(f"http://localhost:{port}/docs", timeout=5)
            if response.status_code == 200:
                print(f"✅ Backend is running on port {port}")
                
                # Test permissions endpoint
                try:
                    perm_response = requests.get(f"http://localhost:{port}/api/v1/admin/public/permissions", timeout=5)
                    print(f"   Permissions endpoint status: {perm_response.status_code}")
                except:
                    print(f"   Permissions endpoint: Not accessible")
                    
            else:
                print(f"❌ Port {port}: Status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"❌ Port {port}: Not running")
        except Exception as e:
            print(f"❌ Port {port}: Error {e}")

if __name__ == "__main__":
    test_ports()