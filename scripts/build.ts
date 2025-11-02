// 🐝 Hive Build Script (Current Platform)
import config from "../hive.config";

console.log(`🐝 Building ${config.app.name} v${config.app.version}...`);
console.log(`🎯 Target: ${process.platform}-${process.arch}\n`);

// Clean dist directory first
console.log("🗑️  Cleaning dist directory...");
try {
  const distFiles = await Array.fromAsync(new Bun.Glob("*").scan(config.build.outdir));
  for (const file of distFiles) {
    const fullPath = `${config.build.outdir}/${file}`;
    try {
      // Skip .gitkeep
      if (file !== ".gitkeep") {
        // Cross-platform file deletion
        if (process.platform === "win32") {
          // Windows: Use native Bun.fs or PowerShell
          const stat = await Bun.file(fullPath).stat();
          if (stat.isDirectory()) {
            Bun.spawnSync(["cmd", "/c", "rmdir", "/s", "/q", fullPath]);
          } else {
            Bun.spawnSync(["cmd", "/c", "del", "/f", "/q", fullPath]);
          }
        } else {
          // Unix: Use rm -rf
          Bun.spawnSync(["rm", "-rf", fullPath]);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
} catch (e) {
  // dist folder might not exist yet
}

// Ensure dist directory exists
await Bun.write(`${config.build.outdir}/.gitkeep`, "");

// Build frontend first
console.log("📦 Building frontend...");
const frontendBuild = Bun.spawnSync(["bun", "run", "build:frontend"], {
  stdout: "inherit",
  stderr: "inherit",
});

if (frontendBuild.exitCode !== 0) {
  console.error("❌ Frontend build failed!");
  process.exit(1);
}

console.log("\n🔨 Compiling binary...");

const outfile = `${config.build.outdir}/${config.build.outfile}`;
const buildArgs = [
  "build",
  "--compile",
  config.build.minify ? "--minify" : "",
  // Sourcemaps disabled in production builds to reduce size
  config.build.bytecode ? "--bytecode" : "",
  // Windows-specific flags (only work when building ON Windows)
  ...(process.platform === "win32" && config.build.windows?.icon ? [`--windows-icon=${config.build.windows.icon}`] : []),
  ...(process.platform === "win32" && config.build.windows?.hideConsole ? ["--windows-hide-console"] : []),
  "./src/main.ts",
  "--outfile",
  outfile,
].filter(Boolean);

if (config.build.bytecode) {
  console.log("⚡ Bytecode compilation enabled (faster startup)");
}

const startTime = performance.now();
const proc = Bun.spawn(["bun", ...buildArgs], {
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await proc.exited;
const buildTime = ((performance.now() - startTime) / 1000).toFixed(1);

if (exitCode === 0) {
  // 🚀 PERFORMANCE: Strip debug symbols to reduce binary size
  if (config.build.strip !== false && process.platform !== "win32") {
    console.log("   🔧 Stripping debug symbols...");
    const stripResult = Bun.spawnSync(["strip", outfile], {
      stdout: "pipe",
      stderr: "pipe",
    });
    if (stripResult.exitCode === 0) {
      console.log("   ✅ Symbols stripped (smaller binary size)");
    }
  }
  
  const stats = await Bun.file(outfile).stat();
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  
  // Copy webview library next to binary
  const libName = process.platform === "win32" 
    ? "libwebview.dll" 
    : process.platform === "linux"
    ? `libwebview-${process.arch}.so`
    : "libwebview.dylib";
  
  const libSource = `node_modules/webview-bun/build/${libName}`;
  const libDest = `${config.build.outdir}/${libName}`;
  
  try {
    await Bun.write(libDest, Bun.file(libSource));
    console.log(`   📚 ${libName} copied`);
  } catch (e) {
    console.warn(`   ⚠️  Failed to copy ${libName}:`, e);
  }
  
  // macOS .app bundle creation (if enabled)
  if (process.platform === "darwin" && config.build.macos?.createAppBundle !== false) {
    try {
      const iconPath = config.build.macos.icon;
      const iconFile = Bun.file(iconPath);
      
      if (await iconFile.exists()) {
        console.log(`   🎨 Adding macOS icon...`);
        
        // Create .app bundle structure
        const appName = config.app.name || "hive";
        const appPath = `${config.build.outdir}/${appName}.app`;
        const contentsPath = `${appPath}/Contents`;
        const macosPath = `${contentsPath}/MacOS`;
        const resourcesPath = `${contentsPath}/Resources`;
        
        // Create directories
        await Bun.write(`${macosPath}/.gitkeep`, "");
        await Bun.write(`${resourcesPath}/.gitkeep`, "");
        
        // Copy binary to .app bundle (rename to avoid conflict with launcher)
        const bundledBinary = `${macosPath}/${appName}-bin`;
        await Bun.write(bundledBinary, Bun.file(outfile));
        Bun.spawnSync(["chmod", "+x", bundledBinary]);
        
        // Strip the bundled binary too
        if (config.build.strip !== false) {
          Bun.spawnSync(["strip", bundledBinary], { stdout: "pipe", stderr: "pipe" });
        }
        
        // Copy icon and dylib
        await Bun.write(`${resourcesPath}/icon.icns`, iconFile);
        await Bun.write(`${macosPath}/libwebview.dylib`, Bun.file(libDest));
        
        // Create launcher script that sets DYLD_LIBRARY_PATH
        const launcher = `#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export DYLD_LIBRARY_PATH="$DIR:$DYLD_LIBRARY_PATH"
exec "$DIR/${appName}-bin" "$@"
`;
        await Bun.write(`${macosPath}/${appName}`, launcher);
        Bun.spawnSync(["chmod", "+x", `${macosPath}/${appName}`]);
        
        // Create Info.plist
        const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${appName}</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>CFBundleIdentifier</key>
  <string>com.${appName}.app</string>
  <key>CFBundleName</key>
  <string>${config.window.title || appName}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${config.app.version}</string>
  <key>CFBundleVersion</key>
  <string>${config.app.version}</string>
  <key>LSMinimumSystemVersion</key>
  <string>10.13</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>`;
        
        await Bun.write(`${contentsPath}/Info.plist`, plist);
        
        // Delete standalone binary and dylib (we only need the .app)
        try {
          Bun.spawnSync(["rm", outfile]);
          Bun.spawnSync(["rm", libDest]); // Remove dylib from dist root
          console.log(`   ✅ ${appName}.app bundle created with icon`);
          console.log(`   🗑️  Standalone binary and dylib removed (bundled in .app)`);
        } catch (e) {
          console.log(`   ✅ ${appName}.app bundle created with icon`);
        }
      }
    } catch (e) {
      console.warn(`   ⚠️  macOS icon setup failed:`, e);
    }
  }
  
  console.log(`\n✅ Build successful in ${buildTime}s!`);
  if (process.platform === "darwin" && config.build.macos?.createAppBundle !== false) {
    console.log(`   📦 ${config.build.outdir}/${config.app.name}.app`);
  } else {
  console.log(`   📦 ${outfile} (${sizeMB} MB)`);
  }
  console.log(`   🎯 Platform: ${process.platform}-${process.arch}`);
  console.log(`\n💡 Tip: Run "bun run build:all" to build for all platforms`);
} else {
  console.error(`\n❌ Build failed with exit code ${exitCode}`);
  process.exit(exitCode);
}

