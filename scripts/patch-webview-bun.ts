#!/usr/bin/env bun
/**
 * 🥐 Patch webview-bun to remove top-level await
 * Enables bytecode caching for faster startup!
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const FFI_PATH = resolve(PROJECT_ROOT, "node_modules/webview-bun/src/ffi.ts");

if (!existsSync(FFI_PATH)) {
  console.error("❌ webview-bun not found in node_modules");
  process.exit(1);
}

console.log("🔧 Patching webview-bun to remove top-level await...\n");

let content = readFileSync(FFI_PATH, "utf-8");

// Replace the async imports with sync path resolution
const original = `if (process.env.WEBVIEW_PATH) {
  lib_file = { default: process.env.WEBVIEW_PATH };
} else if (process.platform === "win32") {
  //@ts-expect-error
  lib_file = await import("../build/libwebview.dll");
} else if (process.platform === "linux") {
  lib_file = await import(\`../build/libwebview-\${process.arch}.so\`);
} else if (process.platform === "darwin") {
  //@ts-expect-error
  lib_file = await import("../build/libwebview.dylib");
}`;

const patched = `// Use WEBVIEW_PATH env var (set by Bunery's embedded-native.ts for single-file executables)
// This avoids path resolution issues in compiled binaries
if (process.env.WEBVIEW_PATH) {
  lib_file = { default: process.env.WEBVIEW_PATH };
} else if (process.platform === "win32") {
  lib_file = { default: new URL("../build/libwebview.dll", import.meta.url).pathname };
} else if (process.platform === "linux") {
  lib_file = { default: new URL(\`../build/libwebview-\${process.arch}.so\`, import.meta.url).pathname };
} else if (process.platform === "darwin") {
  lib_file = { default: new URL("../build/libwebview.dylib", import.meta.url).pathname };
}`;

if (content.includes(patched)) {
  console.log("✅ Already patched!");
  process.exit(0);
}

if (!content.includes(original)) {
  console.error("❌ Original code not found - webview-bun may have changed!");
  process.exit(1);
}

content = content.replace(original, patched);

writeFileSync(FFI_PATH, content, "utf-8");

console.log("✅ Patched successfully!");
console.log("   📄", FFI_PATH);
console.log("\n💡 Bytecode caching now enabled!");

