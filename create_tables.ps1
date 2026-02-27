# PowerShell script to create communication tables
$sqlFile = "CREATE_TEMPLATES_SIMPLE.sql"
$mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$username = "root"
$password = "sowmith"
$database = "ncd_management"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Creating Communication Templates Tables" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if MySQL exists
if (Test-Path $mysqlPath) {
    Write-Host "✓ MySQL found at: $mysqlPath" -ForegroundColor Green
} else {
    Write-Host "✗ MySQL not found at default location" -ForegroundColor Red
    Write-Host "Searching for MySQL..." -ForegroundColor Yellow
    
    # Try to find MySQL in common locations
    $possiblePaths = @(
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $mysqlPath = $path
            Write-Host "✓ Found MySQL at: $mysqlPath" -ForegroundColor Green
            break
        }
    }
}

Write-Host ""
Write-Host "Executing SQL script..." -ForegroundColor Yellow
Write-Host ""

# Execute SQL file
& $mysqlPath -u $username -p$password $database -e "source $sqlFile"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "SUCCESS! Tables created successfully!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Created tables:" -ForegroundColor Cyan
    Write-Host "  ✓ communication_templates (6 templates)" -ForegroundColor Green
    Write-Host "  ✓ communication_variables (7 variables)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Restart backend: START_BACKEND.bat" -ForegroundColor White
    Write-Host "  2. Open Communication Center in browser" -ForegroundColor White
    Write-Host "  3. Check 'Quick Templates:' dropdown" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "ERROR! Failed to create tables" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the SQL file manually in MySQL Workbench" -ForegroundColor Yellow
    Write-Host "File: CREATE_TEMPLATES_SIMPLE.sql" -ForegroundColor White
    Write-Host ""
}

Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
