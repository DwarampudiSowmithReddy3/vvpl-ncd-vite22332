# PowerShell script to convert CSS files to responsive units
# This script will backup original files and convert px values to responsive units

$cssFiles = @(
    "src/App.css",
    "src/index.css",
    "src/components/Layout.css",
    "src/components/Sidebar.css",
    "src/pages/Dashboard.css",
    "src/pages/Investors.css",
    "src/pages/InvestorsNew.css",
    "src/pages/Communication.css",
    "src/pages/Reports.css",
    "src/pages/InterestPayout.css",
    "src/pages/NCDSeries.css",
    "src/pages/Compliance.css",
    "src/pages/Administrator.css",
    "src/pages/AuditLog.css",
    "src/pages/Login.css"
)

# Create backup directory
$backupDir = "css-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force

Write-Host "Starting CSS conversion to responsive units..." -ForegroundColor Green
Write-Host "Backup directory: $backupDir" -ForegroundColor Yellow

foreach ($file in $cssFiles) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Cyan
        
        # Create backup
        $backupFile = Join-Path $backupDir (Split-Path $file -Leaf)
        Copy-Item $file $backupFile
        
        # Read file content
        $content = Get-Content $file -Raw
        
        # Convert common px values to rem (16px = 1rem base)
        $content = $content -replace '(\d+)px', {
            param($match)
            $px = [int]$match.Groups[1].Value
            
            # Convert to rem (assuming 16px = 1rem)
            $rem = $px / 16
            
            # Round to reasonable precision
            if ($rem -eq [math]::Floor($rem)) {
                return "${rem}rem"
            } elseif ($rem -lt 0.1) {
                return "0.0625rem"  # 1px
            } else {
                return "$([math]::Round($rem, 4))rem"
            }
        }
        
        # Write back to file
        Set-Content $file $content -Encoding UTF8
        
        Write-Host "Converted: $file" -ForegroundColor Green
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "Conversion completed!" -ForegroundColor Green
Write-Host "Backup files saved in: $backupDir" -ForegroundColor Yellow