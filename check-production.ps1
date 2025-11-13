# Production Readiness Check Script
# Run this before deploying to production

Write-Host "🔍 Checking Production Readiness..." -ForegroundColor Cyan
Write-Host ""

$issues = @()
$warnings = @()

# Check 1: TypeScript build
Write-Host "📝 Checking TypeScript compilation..." -ForegroundColor Yellow
Set-Location client
$tsCheck = & npm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    $issues += "TypeScript compilation failed in client"
}
Set-Location ..

# Check 2: Environment files
Write-Host "🌍 Checking environment files..." -ForegroundColor Yellow
if (-not (Test-Path "client/.env.production")) {
    $issues += "Missing client/.env.production file"
}
if (-not (Test-Path "server/.env")) {
    $warnings += "Missing server/.env file (required for production)"
}

# Check 3: Vercel config
Write-Host "🚀 Checking Vercel configuration..." -ForegroundColor Yellow
if (-not (Test-Path "client/vercel.json")) {
    $warnings += "Missing client/vercel.json"
}

# Check 4: Render config
Write-Host "🎨 Checking Render configuration..." -ForegroundColor Yellow
if (-not (Test-Path "config/render.yaml")) {
    $warnings += "Missing config/render.yaml"
}

# Check 5: Package.json scripts
Write-Host "📦 Checking package.json scripts..." -ForegroundColor Yellow
$clientPackage = Get-Content "client/package.json" | ConvertFrom-Json
if (-not $clientPackage.scripts.build) {
    $issues += "Missing build script in client/package.json"
}

$serverPackage = Get-Content "server/package.json" | ConvertFrom-Json
if (-not $serverPackage.scripts.build) {
    $issues += "Missing build script in server/package.json"
}
if (-not $serverPackage.scripts.start) {
    $issues += "Missing start script in server/package.json"
}

# Check 6: Search for console.log without DEV check
Write-Host "🐛 Checking for unprotected console.logs..." -ForegroundColor Yellow
$consoleLogs = Select-String -Path "client/src/**/*.tsx", "client/src/**/*.ts" -Pattern "console\.log\(" -Exclude "*node_modules*"
$unprotectedLogs = 0
foreach ($log in $consoleLogs) {
    $context = Get-Content $log.Path | Select-Object -Skip ($log.LineNumber - 2) -First 3
    if ($context -notmatch "import\.meta\.env\.DEV") {
        $unprotectedLogs++
    }
}
if ($unprotectedLogs -gt 5) {
    $warnings += "$unprotectedLogs unprotected console.log statements found"
}

# Results
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

if ($issues.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "✅ All checks passed! Ready for production deployment." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Update environment variables with production URLs"
    Write-Host "2. Run 'cd client && vercel --prod'"
    Write-Host "3. Push to GitHub and deploy via Render dashboard"
    Write-Host "4. Test the production deployment"
} else {
    if ($issues.Count -gt 0) {
        Write-Host "❌ Critical Issues Found:" -ForegroundColor Red
        foreach ($issue in $issues) {
            Write-Host "   • $issue" -ForegroundColor Red
        }
        Write-Host ""
    }
    
    if ($warnings.Count -gt 0) {
        Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "   • $warning" -ForegroundColor Yellow
        }
        Write-Host ""
    }
    
    if ($issues.Count -eq 0) {
        Write-Host "✅ No critical issues, but review warnings before deploying." -ForegroundColor Green
    } else {
        Write-Host "❌ Fix critical issues before deploying to production." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
