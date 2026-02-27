@echo off
echo ============================================
echo VERIFYING VARIABLES TABLE REMOVAL
echo ============================================
echo.

set MYSQL_PATH=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

echo Checking communication tables...
echo.

"%MYSQL_PATH%" -u root -psowmith ncd_management -e "SHOW TABLES LIKE 'communication_%%';"

echo.
echo ============================================
echo EXPECTED RESULT:
echo ============================================
echo.
echo You should see ONLY 2 tables:
echo   - communication_history
echo   - communication_templates
echo.
echo NOT PRESENT:
echo   - communication_variables (REMOVED)
echo.
echo ============================================
echo.

pause
