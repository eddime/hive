# 🪟 Building for Windows

## ✅ Cross-Compilation Works! (Baseline Build)

**Good news**: You can cross-compile Windows executables from macOS/Linux using **baseline builds**!

### What is Baseline?

Bun supports two build modes:
- **modern** (default): Uses AVX2 instructions (CPUs from 2013+) - Faster but limited compatibility
- **baseline**: Uses older instructions (CPUs from 2008+) - Slightly slower but works on ALL machines

**Hive automatically uses baseline for Windows/Linux** to ensure maximum compatibility!

### No Error 0xc000001d Anymore! ✅

Previous issue:
```
process exited with code 3221225501 (0xc000001d)  ❌ OLD
```

**Fixed**: Using `--target=bun-windows-x64-baseline` ensures compatibility with all Windows machines.

---

## Building on Windows

### Prerequisites

1. **Install Bun**:
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. **Install Build Tools**:
   - Go to https://visualstudio.microsoft.com/downloads
   - Download "Build Tools for Visual Studio 2022"
   - Select "Desktop development with C++"

3. **Clone the Repository**:
   ```powershell
   git clone https://github.com/eddime/hive.git
   cd hive
   ```

4. **Install Dependencies**:
   ```powershell
   bun install
   ```

### Build Commands

#### Single Platform (Windows only)
```powershell
bun run build
```

Output:
```
dist/
├── hive.exe              # 114 MB
└── libwebview.dll        # 107 KB
```

#### All Platforms (if on Windows)
```powershell
bun run build:all
```

This will build:
- ✅ Windows x64 (native, works perfectly!)
- ⚠️ macOS/Linux (cross-compiled, may have limitations)

---

## Distribution

### Required Files

Users need **BOTH** files to run the app:

```
YourApp-Windows/
├── hive.exe              ← Main executable
└── libwebview.dll        ← WebView library (REQUIRED!)
```

### Creating a Distributable Package

```powershell
# Create a ZIP file
Compress-Archive -Path dist/hive-windows-x64.exe, dist/libwebview.dll -DestinationPath Hive-Windows.zip
```

### Optional: Hide Console Window

Edit `hive.config.ts`:
```typescript
windows: {
  icon: "assets/icon.ico",
  hideConsole: true,  // ← Hide CMD window for GUI apps
}
```

---

## CI/CD: GitHub Actions

For automated Windows builds in CI/CD, use GitHub Actions:

```yaml
# .github/workflows/build-windows.yml
name: Build Windows

on: [push]

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install dependencies
        run: bun install
      
      - name: Build for Windows
        run: bun run build
      
      - name: Upload artifact
        uses: actions/upload-artifact@v3
        with:
          name: hive-windows
          path: |
            dist/hive.exe
            dist/libwebview.dll
```

---

## Adding a Windows Icon

1. **Create an `.ico` file** (256x256 recommended)
   - Use online tools like [icoconvert.com](https://icoconvert.com)
   - Save as `assets/icon.ico`

2. **Configure in `hive.config.ts`**:
   ```typescript
   windows: {
     icon: "assets/icon.ico",
   }
   ```

3. **Build**:
   ```powershell
   bun run build
   ```

The icon will be embedded in the `.exe` file automatically.

---

## Troubleshooting

### "libwebview.dll not found"

**Cause**: The DLL must be in the same folder as the .exe.

**Fix**: Copy `dist/libwebview.dll` next to your exe.

### "Microsoft Edge WebView2 not found"

**Cause**: Windows 10 (pre-Windows 11) requires WebView2 runtime.

**Fix**: Users need to install it from:
https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section

Or bundle it with your installer.

### "Access Denied" or "Virus Warning"

**Cause**: Windows SmartScreen blocks unsigned executables.

**Fix**: 
1. Right-click the exe → Properties → Check "Unblock"
2. Or: Code-sign your executable with a Windows certificate

---

## Code Signing (Optional)

For professional distribution, sign your Windows executable:

1. **Get a Code Signing Certificate**:
   - Purchase from DigiCert, Sectigo, etc. (~$200/year)
   - Or use Windows App Certification Kit (for Store apps)

2. **Sign the executable**:
   ```powershell
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com dist/hive.exe
   ```

3. **Verify**:
   ```powershell
   signtool verify /pa dist/hive.exe
   ```

Signed apps:
- ✅ No SmartScreen warnings
- ✅ Professional appearance
- ✅ Users trust the app

---

## Performance Tips

### 1. Strip Debug Symbols (automatically done)

The build script already strips symbols on Windows with UPX if available.

### 2. Enable Windows-Specific Optimizations

Edit `hive.config.ts`:
```typescript
build: {
  minify: true,
  strip: true,
}
```

### 3. Use Release Mode

Always build in release mode for distribution:
```powershell
$env:NODE_ENV="production"
bun run build
```

---

## Summary

| Build Location | Windows .exe | Compatibility |
|---------------|--------------|---------------|
| **Windows (native)** | ✅ Baseline + Modern available | 100% |
| **macOS/Linux** | ✅ Baseline (cross-compile) | 100% |

**Cross-compilation works perfectly with baseline builds!** 🎉

### Build Mode Comparison

| Mode | CPU Support | Speed | Compatibility |
|------|-------------|-------|---------------|
| **baseline** | 2008+ (no AVX2) | ~5% slower | ✅ All Windows PCs |
| **modern** | 2013+ (AVX2) | Fastest | ⚠️ Only newer PCs |

**Hive uses baseline by default for maximum compatibility!**

For more information, see:
- [Bun Documentation](https://bun.sh/docs/bundler/executables)
- [WebView-Bun README](https://github.com/tr1ckydev/webview-bun)

