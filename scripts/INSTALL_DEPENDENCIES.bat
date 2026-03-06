@echo off
echo ============================================
echo INSTALLING DEPENDENCIES FOR NCD MANAGEMENT SYSTEM
echo ============================================
echo.

cd ..\backend

echo Installing Python packages...
echo.

pip install -r requirements.txt

echo.
echo ============================================
echo INSTALLATION COMPLETE!
echo ============================================
echo.
echo Next steps:
echo 1. Create MySQL database: ncd_management
echo 2. Configure backend/.env with database credentials
echo 3. Run: scripts\START_BACKEND.bat
echo.
echo ============================================

pause
