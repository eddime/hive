// Post-build script for Windows: Create launcher that sets DLL path
import config from "../hive.config";

console.log("🪟 Creating Windows launcher with DLL path...");

const launcherBat = `@echo off
REM Launcher for ${config.app.name}
REM Sets the DLL search path to current directory

REM Get the directory where this script is located
set "APP_DIR=%~dp0"

REM Add current directory to DLL search path
set "PATH=%APP_DIR%;%PATH%"

REM Run the app
"%APP_DIR%hive-windows-x64.exe" %*
`;

const launcherPs1 = `# PowerShell Launcher for ${config.app.name}
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:PATH = "$scriptPath;$env:PATH"
& "$scriptPath\\hive-windows-x64.exe" @args
`;

await Bun.write(`${config.build.outdir}/hive.bat`, launcherBat);
await Bun.write(`${config.build.outdir}/hive.ps1`, launcherPs1);

console.log("✅ Windows launchers created:");
console.log("   - hive.bat (CMD)");
console.log("   - hive.ps1 (PowerShell)");
console.log("\n💡 Users can run: .\\hive.bat");

