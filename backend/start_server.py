#!/usr/bin/env python3
"""
Simple server startup script
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting NCD Management System Backend")
    print("📡 Server will be available at: http://localhost:8000")
    print("📚 API docs will be available at: http://localhost:8000/docs")
    print("🔍 Health check: http://localhost:8000/health")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 50)
    
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)