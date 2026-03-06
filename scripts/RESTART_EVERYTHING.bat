@echo off
echo ========================================
echo RESTARTING NCD MANAGEMENT SYSTEM
echo ========================================
echo.

echo Killing existing processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2

echo.
echo ========================================
echo Starting Backend Server...
echo ========================================
start "NCD Backend" cmd /k "cd backend && call ..\.venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3

echo.
echo ========================================
echo Starting Frontend Server...
echo ========================================
start "NCD Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo SERVERS STARTED!
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to exit this window...
pause >nul
