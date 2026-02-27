@echo off
echo ============================================
echo TESTING DATABASE AUTO-INITIALIZATION
echo ============================================
echo.
echo This will test if tables are created automatically
echo when the backend starts.
echo.
echo STEPS:
echo 1. Backend will start
echo 2. Watch console for table creation messages
echo 3. Press Ctrl+C to stop when done
echo.
pause
echo.
echo Starting backend...
echo.

cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

pause
