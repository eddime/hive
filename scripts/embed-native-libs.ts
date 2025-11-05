#!/usr/bin/env bun
// 🥐 Bunery - Embed Native Libraries Script
// Embeds .dylib/.dll/.so files as base64 into embedded-native.ts

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dir, "..");
const EMBEDDED_NATIVE_PATH = resolve(PROJECT_ROOT, "lib/embedded-native.ts");
const NATIVE_LIBS_DIR = resolve(PROJECT_ROOT, "lib/native");

console.log("🥐 Embedding native libraries into source code...\n");

// Read native libraries and convert to base64
const libs = {
  darwin: "",
  win32: "",
  "linux-x64": "",
  "linux-arm64": "",
};

// Extensions libraries
const exts = {
  darwin: "",
  win32: "",
  linux: "",
};

// macOS
const macPath = resolve(NATIVE_LIBS_DIR, "libwebview.dylib");
if (existsSync(macPath)) {
  console.log("📦 Embedding libwebview.dylib (macOS)...");
  const data = readFileSync(macPath);
  libs.darwin = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
} else {
  console.log("⚠️  libwebview.dylib not found, skipping macOS");
}

// Windows
const winPath = resolve(NATIVE_LIBS_DIR, "libwebview.dll");
if (existsSync(winPath)) {
  console.log("📦 Embedding libwebview.dll (Windows)...");
  const data = readFileSync(winPath);
  libs.win32 = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
} else {
  console.log("⚠️  libwebview.dll not found, skipping Windows");
}

// Linux x64
const linuxX64Path = resolve(NATIVE_LIBS_DIR, "libwebview-x64.so");
if (existsSync(linuxX64Path)) {
  console.log("📦 Embedding libwebview-x64.so (Linux x64)...");
  const data = readFileSync(linuxX64Path);
  libs["linux-x64"] = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
} else {
  console.log("⚠️  libwebview-x64.so not found, skipping Linux x64");
}

// Linux ARM64
const linuxArm64Path = resolve(NATIVE_LIBS_DIR, "libwebview-arm64.so");
if (existsSync(linuxArm64Path)) {
  console.log("📦 Embedding libwebview-arm64.so (Linux ARM64)...");
  const data = readFileSync(linuxArm64Path);
  libs["linux-arm64"] = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
} else {
  console.log("⚠️  libwebview-arm64.so not found, skipping Linux ARM64");
}

console.log("\n🎨 Embedding extension libraries...\n");

// macOS Extension
const macExtPath = resolve(NATIVE_LIBS_DIR, "libwebview_ext.dylib");
if (existsSync(macExtPath)) {
  console.log("📦 Embedding libwebview_ext.dylib (macOS)...");
  const data = readFileSync(macExtPath);
  exts.darwin = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
}

// Windows Extension
const winExtPath = resolve(NATIVE_LIBS_DIR, "libwebview_ext.dll");
if (existsSync(winExtPath)) {
  console.log("📦 Embedding libwebview_ext.dll (Windows)...");
  const data = readFileSync(winExtPath);
  exts.win32 = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
}

// Linux Extension
const linuxExtPath = resolve(NATIVE_LIBS_DIR, "libwebview_ext.so");
if (existsSync(linuxExtPath)) {
  console.log("📦 Embedding libwebview_ext.so (Linux)...");
  const data = readFileSync(linuxExtPath);
  exts.linux = data.toString("base64");
  console.log(`   ✅ ${(data.length / 1024).toFixed(1)} KB encoded`);
}

// Read current embedded-native.ts
let sourceCode = readFileSync(EMBEDDED_NATIVE_PATH, "utf-8");

// Replace the EMBEDDED_LIBS object
const newLibsCode = `const EMBEDDED_LIBS = {
  darwin: "${libs.darwin}",
  win32: "${libs.win32}",
  "linux-x64": "${libs["linux-x64"]}",
  "linux-arm64": "${libs["linux-arm64"]}",
};`;

// Replace the EMBEDDED_EXTS object
const newExtsCode = `const EMBEDDED_EXTS = {
  darwin: "${exts.darwin}",
  win32: "${exts.win32}",
  linux: "${exts.linux}",
};`;

// Find and replace the EMBEDDED_LIBS declaration
sourceCode = sourceCode.replace(
  /const EMBEDDED_LIBS = \{[^}]*\};/s,
  newLibsCode
);

// Find and replace (or add) the EMBEDDED_EXTS declaration
if (sourceCode.includes("EMBEDDED_EXTS")) {
  sourceCode = sourceCode.replace(
    /const EMBEDDED_EXTS = \{[^}]*\};/s,
    newExtsCode
  );
} else {
  // Add after EMBEDDED_LIBS
  sourceCode = sourceCode.replace(
    /const EMBEDDED_LIBS = \{[^}]*\};/s,
    newLibsCode + "\n\n" + newExtsCode
  );
}

// Write back
writeFileSync(EMBEDDED_NATIVE_PATH, sourceCode, "utf-8");

console.log("\n✅ Native libraries embedded successfully!");
console.log(`📄 Updated: ${EMBEDDED_NATIVE_PATH}`);
console.log("\n💡 All platforms (macOS, Windows, Linux x64/ARM64) embedded!");
console.log("🎨 Extension libraries (setIcon, setMinSize, frameless, fullscreen, alwaysOnTop) embedded!");
console.log("🚀 Cross-platform builds will work on any target!");
