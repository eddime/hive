# PowerShell Debug Runner for Hive
# Usage: .\run-debug.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Hive Debug Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Change to dist directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$distPath = Join-Path $scriptPath "dist"
Set-Location $distPath

Write-Host "📂 Working directory: $distPath" -ForegroundColor Yellow
Write-Host ""

# Check if exe exists
if (-not (Test-Path "hive-windows-x64.exe")) {
    Write-Host "❌ ERROR: hive-windows-x64.exe not found!" -ForegroundColor Red
    Write-Host "   Build the app first with: bun run build:all" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if DLL exists
if (-not (Test-Path "libwebview.dll")) {
    Write-Host "❌ ERROR: libwebview.dll not found!" -ForegroundColor Red
    Write-Host "   This file is required to run the app." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Get file sizes
$exeSize = (Get-Item "hive-windows-x64.exe").Length / 1MB
$dllSize = (Get-Item "libwebview.dll").Length / 1KB

Write-Host "✅ Files found:" -ForegroundColor Green
Write-Host "   - hive-windows-x64.exe ($([math]::Round($exeSize, 1)) MB)" -ForegroundColor Gray
Write-Host "   - libwebview.dll ($([math]::Round($dllSize, 0)) KB)" -ForegroundColor Gray
Write-Host ""

# System info
Write-Host "💻 System Info:" -ForegroundColor Cyan
Write-Host "   - OS: $([System.Environment]::OSVersion.VersionString)" -ForegroundColor Gray
Write-Host "   - CPU: $env:PROCESSOR_IDENTIFIER" -ForegroundColor Gray
Write-Host "   - .NET: $($PSVersionTable.PSVersion)" -ForegroundColor Gray
Write-Host ""

$logFile = "hive-debug-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss').log"
Write-Host "📝 Logs will be saved to: $logFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Starting app..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start the app and capture output
$process = Start-Process -FilePath ".\hive-windows-x64.exe" `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput "$logFile.stdout" `
    -RedirectStandardError "$logFile.stderr" `
    -Wait

$exitCode = $process.ExitCode

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host "✅ App exited successfully (code: $exitCode)" -ForegroundColor Green
} else {
    Write-Host "❌ App exited with error code: $exitCode (0x$($exitCode.ToString('X')))" -ForegroundColor Red
    
    # Show common error codes
    switch ($exitCode) {
        3221225501 { 
            Write-Host "   This is error 0xc000001d - Illegal Instruction" -ForegroundColor Yellow
            Write-Host "   Your CPU may not support required instructions" -ForegroundColor Yellow
        }
        3221225477 { 
            Write-Host "   This is error 0xc0000005 - Access Violation" -ForegroundColor Yellow
            Write-Host "   The app tried to access protected memory" -ForegroundColor Yellow
        }
        -1073741819 { 
            Write-Host "   This is error 0xc0000005 - Access Violation" -ForegroundColor Yellow
        }
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if there's any output
$stdoutContent = Get-Content "$logFile.stdout" -Raw -ErrorAction SilentlyContinue
$stderrContent = Get-Content "$logFile.stderr" -Raw -ErrorAction SilentlyContinue

if ($stdoutContent) {
    Write-Host "📄 Standard Output:" -ForegroundColor Cyan
    Write-Host $stdoutContent -ForegroundColor Gray
    Write-Host ""
}

if ($stderrContent) {
    Write-Host "⚠️  Standard Error:" -ForegroundColor Yellow
    Write-Host $stderrContent -ForegroundColor Red
    Write-Host ""
}

# Merge logs
$allLogs = @"
========================================
Hive Debug Log
Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Exit Code: $exitCode (0x$($exitCode.ToString('X')))
========================================

STANDARD OUTPUT:
$stdoutContent

STANDARD ERROR:
$stderrContent
"@

$allLogs | Out-File -FilePath $logFile -Encoding UTF8

Write-Host "💾 Full log saved to: $logFile" -ForegroundColor Green

if ($exitCode -ne 0) {
    Write-Host ""
    $openLog = Read-Host "Open log file in notepad? (y/n)"
    if ($openLog -eq 'y') {
        notepad $logFile
    }
}

Write-Host ""
Read-Host "Press Enter to exit"

