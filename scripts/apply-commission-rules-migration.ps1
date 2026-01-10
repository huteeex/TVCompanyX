# Apply commission rules migration
# Run this script to create commission_rules table in database

Write-Host "Applying commission rules migration..." -ForegroundColor Cyan

# Database connection details from .env
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

$dbHost = $env:DB_HOST
$dbPort = $env:DB_PORT
$dbName = $env:DB_NAME
$dbUser = $env:DB_USER
$dbPassword = $env:DB_PASSWORD

if (-not $dbHost -or -not $dbName -or -not $dbUser) {
    Write-Host "Error: Database connection details not found in .env.local" -ForegroundColor Red
    Write-Host "Please ensure DB_HOST, DB_NAME, DB_USER are set" -ForegroundColor Yellow
    exit 1
}

$migrationFile = "docs\db\migrations\2026-01-10-add-commission-rules.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host "Connecting to database: $dbName@$dbHost" -ForegroundColor Yellow

# Set PGPASSWORD for psql
$env:PGPASSWORD = $dbPassword

# Run migration
try {
    $psqlCommand = "psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -f `"$migrationFile`""
    
    Write-Host "Executing migration..." -ForegroundColor Yellow
    Invoke-Expression $psqlCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nMigration applied successfully!" -ForegroundColor Green
        Write-Host "✓ commission_rules table created" -ForegroundColor Green
        Write-Host "✓ Default rules inserted for agent and commercial roles" -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Restart the development server (npm run dev)" -ForegroundColor White
        Write-Host "2. Open director commissions page to test the functionality" -ForegroundColor White
    } else {
        Write-Host "`nMigration failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "`nError executing migration: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    $env:PGPASSWORD = $null
}
