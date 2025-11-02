# 🪟 Windows Icon Issue

## ⚠️ Problem

`--windows-icon` flag only works when building **ON** Windows!

When cross-compiling from macOS/Linux, the icon is **not** embedded.

## ✅ Solutions

### Option 1: Build on Windows (Recommended)

```bash
# On Windows machine
bun bake win
```

✅ Icon is automatically embedded  
✅ Uses `--windows-icon=assets/icon.ico`

### Option 2: Post-Build Icon Injection (Cross-Platform)

Use `rcedit` to add icon after building:

```bash
# Install rcedit (on macOS/Linux)
npm install -g rcedit

# Build without icon
bun bake win

# Add icon manually
rcedit dist/bunery-windows-x64.exe --set-icon assets/icon.ico
```

### Option 3: GitHub Actions (Automated)

```yaml
# .github/workflows/build-windows.yml
name: Build Windows

on: [push]

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      
      - run: bun install
      - run: bun bake win
      
      - uses: actions/upload-artifact@v3
        with:
          name: windows-build
          path: dist/bunery-windows-x64.exe
```

## 📊 Why This Limitation?

Bun's `--windows-icon` uses native Windows APIs:
- **On Windows**: Direct API calls work ✅
- **Cross-compile**: APIs not available ❌

This is the same limitation as:
- Electron's `electron-builder`
- Tauri's icon embedding
- Go's `rsrc` tool

## 💡 Recommendation

For **production builds**:
- Build Windows `.exe` on Windows (native or CI)
- Build macOS `.app` on macOS
- Build Linux on Linux

For **development/testing**:
- Cross-compilation works fine
- Just no custom icon (uses default)

## 🚀 Future Solution

We could add automatic `rcedit` in `build-all.ts`:

```typescript
// After building Windows exe
if (target.platform === "windows" && process.platform !== "win32") {
  console.log("   🎨 Adding icon with rcedit...");
  const rcedit = Bun.spawnSync([
    "rcedit",
    outfile,
    "--set-icon",
    config.build.windows.icon
  ]);
  
  if (rcedit.exitCode === 0) {
    console.log("   ✅ Icon added");
  }
}
```

But this requires `rcedit` to be installed globally.

## 📝 Current Status

✅ Icon works when building on Windows  
🔧 **Auto-rcedit**: Bunery automatically applies icons via `rcedit` when cross-compiling!  
💡 Install `rcedit` once: `npm install -g rcedit` (or use CI on Windows)

### Auto-Icon Workflow

When you run `bun bake win` or `bun bake all` on macOS/Linux:

1. ✅ Bun builds the `.exe` (without icon due to API limitation)
2. 🔍 Bunery checks if `rcedit` is installed
3. 🎨 If found: Automatically applies icon with `rcedit`
4. 🎉 Result: `.exe` with correct icon!

No manual steps needed!

