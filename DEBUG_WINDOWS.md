# 🔍 Windows Debug Guide

## Problem
User reports AVX crash on Windows even with baseline build.

## What We Know
1. ✅ Bun binary compiled with `bun-windows-x64-baseline`
2. ✅ No AVX2 instructions in Bun itself (`Features: jsc no_avx2 no_avx`)
3. ❌ Still crashes with "Segmentation fault at address 0x..."

## Possible Causes

### 1. libwebview.dll Compiled with AVX
The `libwebview.dll` from `webview-bun` might be compiled with `-O3` and AVX instructions.

**Check:**
```bash
# On Windows, check DLL dependencies
dumpbin /dependents libwebview.dll
```

**Solution:**
Recompile `libwebview.dll` without AVX using MinGW:
```bash
# Clone webview
git clone https://github.com/tauri-apps/webview.git

# Compile with baseline flags
x86_64-w64-mingw32-gcc -shared -o libwebview.dll \
  -I. webview.cc \
  -lole32 -lcomctl32 -loleaut32 -luuid -lgdi32 \
  -std=c++17 -O2 -march=x86-64 -mtune=generic \
  -DWEBVIEW_EDGE
```

### 2. Windows WebView2 Runtime Missing
The crash might be due to missing Microsoft Edge WebView2 Runtime.

**Solution:**
User needs to install: https://developer.microsoft.com/microsoft-edge/webview2/

### 3. Wrong Binary Being Tested
User might be testing cached/old binary.

**Solution:**
- Rename binary to force new download: `bunery-BASELINE-FIXED-v2.exe`
- Clear browser cache
- Download from fresh URL

## Quick Test

Add this to `src/main.ts` before webview creation:

```typescript
console.log("🔍 Platform:", process.platform);
console.log("🔍 Arch:", process.arch);
console.log("🔍 Bun version:", Bun.version);
console.log("🔍 Process features:", process.features);

try {
  const webview = new Webview(false, { width: 800, height: 600 });
  console.log("✅ Webview created successfully!");
} catch (e) {
  console.error("❌ Webview creation failed:", e);
  process.exit(1);
}
```

## Next Steps

1. **Ask user to download WebView2**: https://go.microsoft.com/fwlink/p/?LinkId=2124703
2. **Build with debug logging enabled**
3. **Get full error log from Windows Event Viewer**

