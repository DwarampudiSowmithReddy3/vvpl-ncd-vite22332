#!/usr/bin/env python3
"""
Check FastAPI routes
"""
import requests
import json

def check_routes():
    """Check available routes in FastAPI"""
    
    try:
        response = requests.get("http://localhost:8003/openapi.json", timeout=10)
        if response.status_code == 200:
            openapi_spec = response.json()
            paths = openapi_spec.get("paths", {})
            
            admin_routes = []
            for path in paths.keys():
                if "/admin/" in path:
                    admin_routes.append(path)
            
            print("🔍 Admin routes found:")
            for route in sorted(admin_routes):
                print(f"   {route}")
            
            # Check specifically for permissions routes
            permissions_routes = [r for r in admin_routes if "permission" in r.lower()]
            print(f"\n🔐 Permissions routes: {permissions_routes}")
            
        else:
            print(f"❌ Failed to get OpenAPI spec: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    check_routes()