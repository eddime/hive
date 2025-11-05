// 🥐 Bunery Cross-Platform Build Script
import config from "../bunery.config";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dir, "..");

const targets = [
  { platform: "darwin", arch: "x64", ext: "", name: "macOS-Intel" },
  { platform: "darwin", arch: "arm64", ext: "", name: "macOS-ARM" },
  { platform: "linux", arch: "x64", ext: "", name: "Linux-x64" },
  { platform: "linux", arch: "arm64", ext: "", name: "Linux-ARM64" },
  { platform: "windows", arch: "x64", ext: ".exe", name: "Windows-x64" },
];

console.log(`🥐 Building ${config.app.name} v${config.app.version} for all platforms...\n`);

// Info about baseline builds for maximum compatibility
console.log("ℹ️  Using baseline builds for Windows/Linux (maximum CPU compatibility)");
console.log("   Supports CPUs from 2008+ (no AVX2 required)");
console.log("   Slightly slower but works on ALL machines\n");

// Clean dist directory first
console.log("🗑️  Cleaning dist directory...");
try {
  const distFiles = await Array.fromAsync(new Bun.Glob("*").scan(config.build.outdir));
  for (const file of distFiles) {
    const fullPath = `${config.build.outdir}/${file}`;
    try {
      // Skip .gitkeep
      if (file !== ".gitkeep") {
        Bun.spawnSync(["rm", "-rf", fullPath]);
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

// Embed native libraries (if enabled)
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

console.log("\n🔨 Compiling binaries...\n");

const buildResults = [];

for (const target of targets) {
  const outfile = `${config.build.outdir}/${config.build.outfile}-${target.platform}-${target.arch}${target.ext}`;
  // Use baseline for better CPU compatibility (supports CPUs from before 2013)
  const targetStr = target.platform === "windows" || target.platform === "linux" 
    ? `bun-${target.platform}-${target.arch}-baseline`  // baseline = older CPUs (no AVX2)
    : `bun-${target.platform}-${target.arch}`;          // modern for macOS
  
  console.log(`⚙️  Building ${target.name}...`);
  
  // Platform-specific flags (only work when building ON that platform)
  const platformFlags = [];
  if (target.platform === "windows" && process.platform === "win32") {
    // Windows-specific flags only work when building ON Windows
    if (config.build.windows?.icon) {
      platformFlags.push(`--windows-icon=${config.build.windows.icon}`);
    }
    if (config.build.windows?.hideConsole) {
      platformFlags.push("--windows-hide-console");
    }
  }
  
  const buildArgs = [
    "build",
    "--compile",
    "--target",
    targetStr,
    "--minify",
    // Bytecode disabled on Windows due to segfault issues
    // See: https://github.com/oven-sh/bun/issues
    (config.build.bytecode && target.platform !== "windows") ? "--bytecode" : "",
    ...platformFlags,
    "./src/main.ts",
    "--outfile",
    outfile,
  ].filter(Boolean);

  const startTime = performance.now();
  const proc = Bun.spawnSync(["bun", ...buildArgs], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const buildTime = ((performance.now() - startTime) / 1000).toFixed(1);

  if (proc.exitCode === 0) {
    const stats = await Bun.file(outfile).stat();
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    
    // macOS .app bundle creation (if enabled)
    if (target.platform === "darwin" && config.build.macos?.createAppBundle !== false) {
      try {
        const iconPath = config.build.macos.icon;
        const iconFile = Bun.file(iconPath);
        
        if (await iconFile.exists()) {
          const appName = `${config.build.outfile}-${target.platform}-${target.arch}`;
          const appPath = `${config.build.outdir}/${appName}.app`;
          const contentsPath = `${appPath}/Contents`;
          const macosPath = `${contentsPath}/MacOS`;
          const resourcesPath = `${contentsPath}/Resources`;
          
          // Create .app bundle
          await Bun.write(`${macosPath}/.gitkeep`, "");
          await Bun.write(`${resourcesPath}/.gitkeep`, "");
          
          // Copy binary (handling embedded vs external mode)
          if (config.build.embedNativeLibs !== false) {
            // Embedded mode: Copy binary directly (no launcher needed)
            const bundledBinary = `${macosPath}/${config.build.outfile}`;
            await Bun.write(bundledBinary, Bun.file(outfile));
            Bun.spawnSync(["chmod", "+x", bundledBinary]);
          } else {
            // External mode: Copy binary and dylib, create launcher
            const bundledBinary = `${macosPath}/${config.build.outfile}-bin`;
            await Bun.write(bundledBinary, Bun.file(outfile));
            Bun.spawnSync(["chmod", "+x", bundledBinary]);
            
            // Copy dylib
            await Bun.write(`${macosPath}/libwebview.dylib`, Bun.file(`node_modules/webview-bun/build/libwebview.dylib`));
            
            // Create launcher script that sets DYLD_LIBRARY_PATH
            const launcher = `#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
export DYLD_LIBRARY_PATH="$DIR:$DYLD_LIBRARY_PATH"
exec "$DIR/${config.build.outfile}-bin" "$@"
`;
            await Bun.write(`${macosPath}/${config.build.outfile}`, launcher);
            Bun.spawnSync(["chmod", "+x", `${macosPath}/${config.build.outfile}`]);
          }
          
          // Copy icon
          await Bun.write(`${resourcesPath}/icon.icns`, iconFile);
          
          // Create Info.plist
          const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${config.build.outfile}</string>
  <key>CFBundleIconFile</key>
  <string>icon</string>
  <key>CFBundleIdentifier</key>
  <string>com.${config.app.name}.app</string>
  <key>CFBundleName</key>
  <string>${config.window.title}</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
  <key>CFBundleShortVersionString</key>
  <string>${config.app.version}</string>
  <key>NSHighResolutionCapable</key>
  <true/>
</dict>
</plist>`;
          await Bun.write(`${contentsPath}/Info.plist`, plist);
          
          // Code signing (if enabled and building for macOS)
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
            
            codesignArgs.push(appPath);
            
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
                appPath,
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
          
          // Delete standalone binary (we only need the .app)
          try {
            await Bun.write(outfile, ""); // Clear file
            Bun.spawnSync(["rm", outfile]); // Delete it
          } catch (e) {
            // Ignore if already deleted
          }
        }
      } catch (e) {
        console.warn(`   ⚠️  Icon setup failed: ${e}`);
      }
    }
    
    // Copy or embed native libraries based on config
    if (target.platform === "windows") {
      if (config.build.embedNativeLibs !== false) {
        console.log(`   ✨ Native library embedded (single-file executable)`);
        console.log(`   🎨 Extensions embedded (setIcon, setMinSize, frameless, fullscreen, alwaysOnTop)`);
      } else {
        const libSource = `node_modules/webview-bun/build/libwebview.dll`;
        const libDest = `${config.build.outdir}/libwebview.dll`;
        try {
          await Bun.write(libDest, Bun.file(libSource));
          console.log(`   📚 libwebview.dll copied (external library mode)`);
        } catch (e) {
          console.warn(`   ⚠️  Failed to copy libwebview.dll:`, e);
        }
      }
      
      // Auto-apply icon with rcedit if cross-compiling (macOS/Linux → Windows)
      if (process.platform !== "win32" && config.build.windows?.icon) {
        console.log(`   🎨 Applying icon with rcedit...`);
        
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
    } else if (target.platform === "linux") {
      if (config.build.embedNativeLibs !== false) {
        console.log(`   ✨ Native library embedded (single-file executable)`);
        console.log(`   🎨 Extensions embedded (setIcon, setMinSize, frameless, fullscreen, alwaysOnTop)`);
      } else{
        const libName = `libwebview-${target.arch}.so`;
        const libSource = `node_modules/webview-bun/build/${libName}`;
        const libDest = `${config.build.outdir}/${libName}`;
        try {
          await Bun.write(libDest, Bun.file(libSource));
          console.log(`   📚 ${libName} copied (external library mode)`);
        } catch (e) {
          console.warn(`   ⚠️  Failed to copy ${libName}:`, e);
        }
      }
    }
    
    // For macOS builds, use .app path in results if bundle was created
    const finalPath = target.platform === "darwin" && config.build.macos?.createAppBundle !== false
      ? `${config.build.outdir}/${config.build.outfile}-${target.platform}-${target.arch}.app`
      : outfile;
    
    buildResults.push({
      name: target.name,
      file: finalPath,
      size: sizeMB,
      time: buildTime,
      success: true,
    });
    
    console.log(`   ✅ ${finalPath} (${sizeMB} MB) in ${buildTime}s`);
  } else {
    buildResults.push({
      name: target.name,
      file: outfile,
      success: false,
      error: proc.stderr.toString(),
    });
    console.error(`   ❌ Failed: ${proc.stderr.toString().slice(0, 100)}...`);
  }
  console.log();
}

// Summary
console.log("━".repeat(60));
console.log("📊 Build Summary\n");

const successful = buildResults.filter((r) => r.success);
const failed = buildResults.filter((r) => !r.success);

if (successful.length > 0) {
  console.log(`✅ Successful Builds (${successful.length}):`);
  for (const build of successful) {
    console.log(`   ${build.name.padEnd(15)} → ${build.file} (${build.size} MB)`);
  }
}

if (failed.length > 0) {
  console.log(`\n❌ Failed Builds (${failed.length}):`);
  for (const build of failed) {
    console.log(`   ${build.name}`);
  }
}

const totalSize = successful.reduce((sum, b) => sum + parseFloat(b.size), 0).toFixed(1);
console.log(`\n💾 Total Size: ${totalSize} MB`);
console.log("━".repeat(60));

if (failed.length > 0) {
  process.exit(1);
}

