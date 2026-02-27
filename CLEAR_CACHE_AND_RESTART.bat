@echo off
echo ========================================
echo CLEARING CACHE AND RESTARTING
echo ========================================
echo.

echo Killing existing processes...
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2

echo.
echo Clearing Python cache...
cd backend
if exist __pycache__ rmdir /s /q __pycache__
if exist routes\__pycache__ rmdir /s /q routes\__pycache__
cd ..

echo.
echo Clearing Frontend cache...
cd frontend
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist
cd ..

echo.
echo Cache cleared!
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
echo.
echo Press any key to exit this window...
pause >nul
