# DubMyYT Security Check Before GitHub Upload
Write-Host "🔒 DubMyYT Security Check Before GitHub Upload" -ForegroundColor Yellow
Write-Host "==============================================`n" -ForegroundColor Yellow

# Set location to project directory
Set-Location "G:\dem\DubMyYT"

# Check for .env files
Write-Host "🔍 Checking for .env files..." -ForegroundColor Cyan
$envFiles = Get-ChildItem -Recurse -Name ".env" -File | Where-Object { $_ -notlike "*node_modules*" }
if ($envFiles) {
    Write-Host "❌ DANGER: .env files found!" -ForegroundColor Red
    $envFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host "🚨 Remove these files before uploading to GitHub!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ No .env files found" -ForegroundColor Green
}
Write-Host ""

# Check for potential API keys
Write-Host "🔍 Checking for potential API keys..." -ForegroundColor Cyan
$apiKeyPattern = "api.*key|secret|token"
$suspiciousFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Extension -notmatch "\.(md|log|json)$" -and 
    $_.FullName -notlike "*node_modules*" -and
    $_.Name -notlike "security_check.ps1"
} | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match $apiKeyPattern -and $content -notmatch "your_.*_key_here|API_KEY|SUPABASE_KEY|template") {
        $_.FullName
    }
}

if ($suspiciousFiles) {
    Write-Host "❌ POTENTIAL RISK: API keys found in code!" -ForegroundColor Red
    $suspiciousFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Red }
    Write-Host "🚨 Review the files above and ensure no real keys are present!" -ForegroundColor Red
} else {
    Write-Host "✅ No hardcoded API keys detected" -ForegroundColor Green
}
Write-Host ""

# Check for local paths
Write-Host "🔍 Checking for local file paths..." -ForegroundColor Cyan
$localPathPattern = "G:\\|G:/"
$pathFiles = Get-ChildItem -Recurse -File | Where-Object { 
    $_.Extension -notmatch "\.(md|log)$" -and 
    $_.FullName -notlike "*node_modules*" -and
    $_.Name -notlike "security_check.ps1"
} | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content -and $content -match $localPathPattern -and $content -notmatch "example|template") {
        $_.FullName
    }
}

if ($pathFiles) {
    Write-Host "❌ WARNING: Local paths found!" -ForegroundColor Yellow
    $pathFiles | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    Write-Host "🚨 Replace with relative paths!" -ForegroundColor Yellow
} else {
    Write-Host "✅ No hardcoded local paths found" -ForegroundColor Green
}
Write-Host ""

# Check .gitignore exists
Write-Host "🔍 Checking .gitignore..." -ForegroundColor Cyan
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore file exists" -ForegroundColor Green
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "\.env") {
        Write-Host "✅ .gitignore includes .env files" -ForegroundColor Green
    } else {
        Write-Host "❌ WARNING: .gitignore doesn't include .env files!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ DANGER: No .gitignore file found!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Final verdict
Write-Host "🎯 SECURITY CHECK COMPLETE" -ForegroundColor Yellow
Write-Host "==========================" -ForegroundColor Yellow
Write-Host "If all checks passed, your project is ready for GitHub!" -ForegroundColor Green
Write-Host "Run the upload commands from GITHUB_UPLOAD_GUIDE.md" -ForegroundColor Green
Write-Host ""

# Pause for user review
Read-Host "Press Enter to continue..."
