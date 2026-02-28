@echo off
echo ========================================
echo Starting NCD Management System - BACKEND
echo ========================================
echo.

cd ..\backend
echo Activating Python virtual environment...
call ..\.venv\Scripts\activate.bat

echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
