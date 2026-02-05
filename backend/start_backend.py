#!/usr/bin/env python3
"""
Backend startup script
"""
import subprocess
import sys
import os
import time

def install_requirements():
    """Install required packages"""
    print("Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False
    return True

def setup_admin():
    """Setup admin user"""
    print("Setting up admin user...")
    try:
        subprocess.check_call([sys.executable, "setup_admin.py"])
        print("✅ Admin user setup completed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error setting up admin user: {e}")
        return False
    return True

def start_server():
    """Start the FastAPI server"""
    print("Starting FastAPI server...")
    try:
        subprocess.check_call([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error starting server: {e}")
        return False
    return True

def main():
    print("🚀 NCD Management System Backend Startup")
    print("=" * 50)
    
    # Change to backend directory
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(backend_dir)
    
    # Install requirements
    if not install_requirements():
        sys.exit(1)
    
    # Setup admin user
    if not setup_admin():
        sys.exit(1)
    
    print("\n🎉 Backend setup completed!")
    print("📡 Starting server on http://localhost:8000")
    print("📚 API docs available at http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()