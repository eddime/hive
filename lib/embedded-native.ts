/**
 * 🥐 Bunery - Embedded Native Libraries
 * Extracts and loads native webview libraries from embedded Base64 data
 */

import { writeFileSync, existsSync } from "fs";
import { resolve, join } from "path";
import { tmpdir } from "os";
import { EMBEDDED_LIBS, EMBEDDED_EXTS } from "./embedded-libs-data";

/**
 * Extracts the native webview library and returns its path.
 * Sets process.env.WEBVIEW_PATH for webview-bun to find the library.
 */
export function getNativeLibraryPath(): string {
  const platform = process.platform;
  const arch = process.arch;
  
  // Determine library name and key
  let libName: string;
  let libKey: string;
  let devPath: string;

  if (platform === "darwin") {
    libName = "libwebview.dylib";
    libKey = "darwin";
    devPath = resolve(import.meta.dir, "../lib/native/libwebview.dylib");
  } else if (platform === "win32") {
    libName = "libwebview.dll";
    libKey = "win32";
    devPath = resolve(import.meta.dir, "../lib/native/libwebview.dll");
  } else if (platform === "linux") {
    libName = `libwebview-${arch}.so`;
    libKey = `linux-${arch}` as keyof typeof EMBEDDED_LIBS;
    devPath = resolve(import.meta.dir, `../lib/native/libwebview-${arch}.so`);
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Check if we should use embedded libs (from config or env)
  const useEmbedded = process.env.BUNERY_EMBED_NATIVE !== "false";
  
  // In development: Always use lib/native directory
  if (process.env.NODE_ENV !== "production") {
    if (existsSync(devPath)) {
      // Set env var for webview-bun to find the library
      process.env.WEBVIEW_PATH = devPath;
      return devPath;
    }
  }
  
  // In production with embedNativeLibs=false: Look for external file next to binary
  if (!useEmbedded) {
    // Try to find the library next to the executable
    const exePath = process.execPath;
    const exeDir = exePath.substring(0, exePath.lastIndexOf("/"));
    const externalPath = join(exeDir, libName);
    
    if (existsSync(externalPath)) {
      console.log(`📚 Using external native library: ${libName}`);
      // Set env var for webview-bun to find the library
      process.env.WEBVIEW_PATH = externalPath;
      return externalPath;
    }
    
    // Also check in dist directory (for .app bundles on macOS)
    const appBundlePath = join(exeDir, "..", "..", "..", libName);
    if (existsSync(appBundlePath)) {
      console.log(`📚 Using external native library: ${libName}`);
      // Set env var for webview-bun to find the library
      process.env.WEBVIEW_PATH = appBundlePath;
      return appBundlePath;
    }
  }

  // In production: Extract embedded library to temp directory
  const tempDir = join(tmpdir(), "bunery-native");
  const libPath = join(tempDir, libName);

  // Get the base64 data
  const base64Data = EMBEDDED_LIBS[libKey as keyof typeof EMBEDDED_LIBS];
  if (!base64Data) {
    throw new Error(
      `No embedded library found for ${platform}${arch ? ` ${arch}` : ""}. ` +
        `Run 'bun scripts/embed-native-libs.ts' to embed libraries.`
    );
  }

  // Decode to compare
  const binaryData = Buffer.from(base64Data, "base64");

  // Check if already extracted AND has correct size (avoid stale cache)
  if (existsSync(libPath)) {
    try {
      const stats = Bun.file(libPath).size;
      if (stats === binaryData.length) {
        // Same size - assume it's current
        console.log(`✅ Native library already extracted (${(stats / 1024).toFixed(1)}KB): ${libPath}`);
        process.env.WEBVIEW_PATH = libPath;
        return libPath;
      } else {
        // Different size - old version! Delete and re-extract
        console.log(`🔄 Updating cached library (${(stats / 1024).toFixed(1)}KB → ${(binaryData.length / 1024).toFixed(1)}KB)...`);
        try {
          if (platform === "win32") {
            Bun.spawnSync(["cmd", "/c", "del", "/f", "/q", libPath]);
          } else {
            Bun.spawnSync(["rm", "-f", libPath]);
          }
        } catch {}
      }
    } catch (e) {
      // Can't check size, just delete and re-extract
      console.log(`🔄 Re-extracting library (cache check failed)...`);
      try {
        if (platform === "win32") {
          Bun.spawnSync(["cmd", "/c", "del", "/f", "/q", libPath]);
        } else {
          Bun.spawnSync(["rm", "-f", libPath]);
        }
      } catch {}
    }
  }

  // Write to temp directory

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    writeFileSync(tempDir + "/.keep", "");
  }

  // Write library
  writeFileSync(libPath, binaryData);

  // Make executable on Unix-like systems
  if (platform !== "win32") {
    Bun.spawnSync(["chmod", "+x", libPath]);
  }
  
  console.log(`✅ Native library extracted: ${libPath}`);
  
  // Set env var for webview-bun to find the library
  process.env.WEBVIEW_PATH = libPath;
  
  return libPath;
}

/**
 * Extracts the extension library and returns its path.
 * Returns null if not available for the current platform.
 */
export function getExtensionLibraryPath(): string | null {
  const platform = process.platform;
  let extName: string;
  let extKey: string;

  if (platform === "darwin") {
    extName = "libwebview_ext.dylib";
    extKey = "darwin";
  } else if (platform === "win32") {
    extName = "libwebview_ext.dll";
    extKey = "win32";
  } else if (platform === "linux") {
    extName = "libwebview_ext.so";
    extKey = "linux";
  } else {
    return null; // Unsupported platform
  }

  const tempDir = join(tmpdir(), "bunery-native");
  const extPath = join(tempDir, extName);

  // Check if already extracted
  if (existsSync(extPath)) {
    return extPath;
  }

  const base64Data = EMBEDDED_EXTS[extKey as keyof typeof EMBEDDED_EXTS];
  if (!base64Data) {
    console.warn(`Extension library not embedded for ${platform}. Extended features disabled.`);
    return null;
  }

  const binaryData = Buffer.from(base64Data, "base64");

  // Ensure temp directory exists
  if (!existsSync(tempDir)) {
    writeFileSync(tempDir + "/.keep", "");
  }

  // Write extension
  writeFileSync(extPath, binaryData);

  // Make executable on Unix-like systems
  if (platform !== "win32") {
    Bun.spawnSync(["chmod", "+x", extPath]);
  }

  return extPath;
}
