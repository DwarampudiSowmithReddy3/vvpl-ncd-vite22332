@echo off
echo ============================================
echo Creating Communication Templates Tables
echo ============================================
echo.

REM Get MySQL credentials
set /p MYSQL_USER="Enter MySQL username (default: root): "
if "%MYSQL_USER%"=="" set MYSQL_USER=root

set /p MYSQL_PASSWORD="Enter MySQL password: "

echo.
echo Running SQL script...
echo.

REM Run the SQL script
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% < backend\CREATE_COMMUNICATION_TEMPLATES.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo SUCCESS! Communication templates created!
    echo ============================================
    echo.
    echo Templates have been added to the database:
    echo - 3 SMS templates
    echo - 3 Email templates
    echo - 7 message variables
    echo.
    echo You can now use these templates in the Communication page.
    echo.
) else (
    echo.
    echo ============================================
    echo ERROR! Failed to create templates
    echo ============================================
    echo.
    echo Please check:
    echo 1. MySQL is running
    echo 2. Username and password are correct
    echo 3. Database 'ncd_management' exists
    echo.
)

pause
