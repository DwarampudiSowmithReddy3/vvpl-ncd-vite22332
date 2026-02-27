@echo off
echo ============================================
echo Creating Communication Templates Tables
echo ============================================
echo.

REM Find MySQL installation
set MYSQL_PATH=
if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe
) else if exist "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe" (
    set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe
) else if exist "C:\xampp\mysql\bin\mysql.exe" (
    set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe
) else (
    echo ERROR: MySQL not found!
    echo Please install MySQL or check the path.
    pause
    exit /b 1
)

echo Found MySQL at: %MYSQL_PATH%
echo.
echo Executing SQL script...
echo.

REM Execute SQL file
"%MYSQL_PATH%" -u root -psowmith ncd_management < CREATE_TEMPLATES_SIMPLE.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Tables created successfully!
    echo ============================================
    echo.
    echo Created tables:
    echo   - communication_templates (6 templates)
    echo   - communication_variables (7 variables)
    echo.
    echo Next steps:
    echo   1. Restart backend: START_BACKEND.bat
    echo   2. Open Communication Center
    echo   3. Check 'Quick Templates:' dropdown
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR! Failed to create tables
    echo ============================================
    echo.
    echo Please check:
    echo   1. MySQL is running
    echo   2. Password is correct (sowmith)
    echo   3. Database 'ncd_management' exists
    echo.
    echo Or run CREATE_TEMPLATES_SIMPLE.sql manually in MySQL Workbench
    echo.
)

pause
