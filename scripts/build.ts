// 🥐 Bunery Build Script (Current Platform)
import config from "../bunery.config";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dir, "..");

console.log(`🥐 Building ${config.app.name} v${config.app.version}...`);
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
const frontendBuild = Bun.spawnSync(["bun", "run", "scripts/build-frontend.ts"], {
  stdout: "inherit",
  stderr: "inherit",
});

if (frontendBuild.exitCode !== 0) {
  console.error("❌ Frontend build failed!");
  process.exit(1);
}

// Embed native libraries (if enabled in config)
if (config.build.embedNativeLibs !== false) {
  console.log("\n📦 Embedding native libraries...");
  const embedResult = Bun.spawnSync(["bun", "run", "scripts/embed-native-libs.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });

  if (embedResult.exitCode !== 0) {
    console.error("❌ Failed to embed native libraries!");
    process.exit(1);
  }
} else {
  console.log("\n📚 Using external native libraries (embedNativeLibs=false)");
}

console.log("\n🔨 Compiling binary...");

const outfile = `${config.build.outdir}/${config.build.outfile}`;
const buildArgs = [
  "build",
  "--compile",
  config.build.minify ? "--minify" : "",
  // Bytecode disabled on Windows due to segfault issues
  (config.build.bytecode && process.platform !== "win32") ? "--bytecode" : "",
  // Windows-specific flags (only work when building ON Windows)
  ...(process.platform === "win32" && config.build.windows?.icon ? [`--windows-icon=${config.build.windows.icon}`] : []),
  ...(process.platform === "win32" && config.build.windows?.hideConsole ? ["--windows-hide-console"] : []),
  "./src/main.ts",
  "--outfile",
  outfile,
].filter(Boolean);

if (config.build.bytecode && process.platform !== "win32") {
  console.log("⚡ Bytecode compilation enabled (faster startup)");
} else if (config.build.bytecode && process.platform === "win32") {
  console.log("ℹ️  Bytecode disabled on Windows (stability)");
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
  
  // Copy or embed native libraries based on config
  if (config.build.embedNativeLibs !== false) {
    console.log(`   ✨ Native libraries embedded (single-file executable)`);
  } else {
    // Copy external library file next to binary
    const libName = process.platform === "darwin" ? "libwebview.dylib" :
                     process.platform === "win32" ? "libwebview.dll" :
                     "libwebview.so";
    const libSource = `lib/native/${libName}`;
    const libDest = `${config.build.outdir}/${libName}`;
    
    try {
      await Bun.write(libDest, Bun.file(libSource));
      console.log(`   📚 ${libName} copied (external library mode)`);
    } catch (e) {
      console.warn(`   ⚠️  Failed to copy ${libName}:`, e);
    }
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
        
        // Copy binary (handling embedded vs external mode)
        if (config.build.embedNativeLibs !== false) {
          // Embedded mode: Copy binary directly (no launcher needed)
          const bundledBinary = `${macosPath}/${appName}`;
          await Bun.write(bundledBinary, Bun.file(outfile));
          Bun.spawnSync(["chmod", "+x", bundledBinary]);
          
          // Copy extension dylib (libwebview_ext.dylib)
          const extDylib = `${PROJECT_ROOT}/lib/native/libwebview_ext.dylib`;
          if (await Bun.file(extDylib).exists()) {
            await Bun.write(`${macosPath}/libwebview_ext.dylib`, Bun.file(extDylib));
            console.log(`   📚 libwebview_ext.dylib bundled`);
          }
          
          // Strip the bundled binary too
          if (config.build.strip !== false) {
            Bun.spawnSync(["strip", bundledBinary], { stdout: "pipe", stderr: "pipe" });
          }
        } else {
          // External mode: Copy binary and dylib, create launcher
          const bundledBinary = `${macosPath}/${appName}-bin`;
          await Bun.write(bundledBinary, Bun.file(outfile));
          Bun.spawnSync(["chmod", "+x", bundledBinary]);
          
          // Strip the bundled binary too
          if (config.build.strip !== false) {
            Bun.spawnSync(["strip", bundledBinary], { stdout: "pipe", stderr: "pipe" });
          }
          
          // Copy dylib
          await Bun.write(`${macosPath}/libwebview.dylib`, Bun.file(`lib/native/libwebview.dylib`));
          
          // Create launcher script that sets DYLD_LIBRARY_PATH
          const launcher = `#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export DYLD_LIBRARY_PATH="$DIR:$DYLD_LIBRARY_PATH"
exec "$DIR/${appName}-bin" "$@"
`;
          await Bun.write(`${macosPath}/${appName}`, launcher);
          Bun.spawnSync(["chmod", "+x", `${macosPath}/${appName}`]);
        }
        
        // Copy icon
        await Bun.write(`${resourcesPath}/icon.icns`, iconFile);
        
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
        
        // Code signing (if enabled)
        if (config.build.macos?.codesign?.enabled && config.build.macos?.codesign?.identity) {
          console.log(`   🔐 Code signing .app bundle...`);
          
          const codesignArgs = [
            "codesign",
            "--deep",
            "--force",
            "-vvvv",
            "--sign",
            config.build.macos.codesign.identity,
          ];
          
          // Add entitlements if specified
          if (config.build.macos.codesign.entitlements) {
            const entitlementsPath = config.build.macos.codesign.entitlements;
            const entitlementsFile = Bun.file(entitlementsPath);
            if (await entitlementsFile.exists()) {
              codesignArgs.push("--entitlements", entitlementsPath);
              console.log(`   📜 Using entitlements: ${entitlementsPath}`);
            } else {
              console.warn(`   ⚠️  Entitlements file not found: ${entitlementsPath}`);
            }
          }
          
          codesignArgs.push(`${config.build.outdir}/${appName}.app`);
          
          const codesignResult = Bun.spawnSync(codesignArgs, {
            stdout: "pipe",
            stderr: "pipe",
          });
          
          if (codesignResult.exitCode === 0) {
            console.log(`   ✅ Code signing successful`);
            
            // Verify the signature
            const verifyResult = Bun.spawnSync([
              "codesign",
              "-vvv",
              "--verify",
              `${config.build.outdir}/${appName}.app`,
            ], {
              stdout: "pipe",
              stderr: "pipe",
            });
            
            if (verifyResult.exitCode === 0) {
              console.log(`   ✅ Signature verified`);
            } else {
              console.warn(`   ⚠️  Signature verification failed`);
            }
          } else {
            console.error(`   ❌ Code signing failed:`);
            console.error(codesignResult.stderr.toString());
          }
        }
        
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
  
  // Auto-apply icon with rcedit if cross-compiling to Windows (macOS/Linux → Windows)
  const isWindowsBuild = outfile.endsWith(".exe");
  if (isWindowsBuild && process.platform !== "win32" && config.build.windows?.icon) {
    console.log(`\n🎨 Applying icon with rcedit...`);
    
    // Check if rcedit is available
    const rceditCheck = Bun.spawnSync(["which", "rcedit"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    
    if (rceditCheck.exitCode === 0) {
      const rceditResult = Bun.spawnSync([
        "rcedit",
        outfile,
        "--set-icon",
        config.build.windows.icon
      ], {
        stdout: "pipe",
        stderr: "pipe",
      });
      
      if (rceditResult.exitCode === 0) {
        console.log(`   ✅ Icon applied successfully`);
      } else {
        console.warn(`   ⚠️  rcedit failed: ${rceditResult.stderr.toString()}`);
      }
    } else {
      console.log(`   💡 rcedit not found - install with: npm install -g rcedit`);
      console.log(`   ℹ️  Or build on Windows for automatic icon embedding`);
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

