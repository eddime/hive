@echo off
REM Debug Runner for Windows - Logs everything and keeps window open

echo ========================================
echo Starting Hive with Debug Logging
echo ========================================
echo.

REM Change to script directory
cd /d "%~dp0"
cd dist

REM Check if exe exists
if not exist "hive-windows-x64.exe" (
    echo ERROR: hive-windows-x64.exe not found!
    echo Build the app first with: bun run build:all
    pause
    exit /b 1
)

REM Check if DLL exists
if not exist "libwebview.dll" (
    echo ERROR: libwebview.dll not found!
    echo This file is required to run the app.
    pause
    exit /b 1
)

echo Starting app...
echo Logs will be saved to: hive-debug.log
echo.

REM Run the app and capture all output
hive-windows-x64.exe 2>&1 | tee hive-debug.log

REM Show exit code
echo.
echo ========================================
echo App exited with code: %ERRORLEVEL%
echo ========================================
echo.

REM Open log file if there was an error
if %ERRORLEVEL% NEQ 0 (
    echo Opening log file...
    notepad hive-debug.log
)

echo Press any key to close...
pause > nul

