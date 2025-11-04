# 📦 Native Library Configuration

Bunery supports two modes for native library distribution: **embedded** (single-file) and **external** (separate `.dll`/`.so`/`.dylib` files).

## Configuration

In `bunery.config.ts`, use the `embedNativeLibs` option:

```typescript
export default {
  build: {
    // true = Embedded in binary (single-file, +100KB, recommended)
    // false = External .dll/.so/.dylib files (smaller binary, needs external files)
    embedNativeLibs: true, // Default: true
  }
};
```

## Option 1: Embedded Libraries (Recommended) ✨

**When:** `embedNativeLibs: true` (default)

### Benefits:
- ✅ **Single-file executable** - No external dependencies
- ✅ **Easy distribution** - Just ship one file
- ✅ **No PATH issues** - Library always found
- ✅ **Portable** - Works anywhere

### Trade-offs:
- Binary size increases by ~100KB (macOS `.dylib`)

### How It Works:
1. Native libraries are base64-encoded during build
2. Embedded into `lib/embedded-native.ts`
3. Extracted to temp directory at runtime (first launch only)
4. Loaded via FFI from temp location

### Build Output:
```
dist/
├── bunery.app               ← macOS .app bundle (single-file)
├── bunery-windows-x64.exe   ← Windows executable (single-file)
└── bunery-linux-x64         ← Linux executable (single-file)
```

---

## Option 2: External Libraries 📚

**When:** `embedNativeLibs: false`

### Benefits:
- ✅ **Smaller binary** - Native lib not embedded
- ✅ **Faster builds** - No embedding step

### Trade-offs:
- ❌ **Requires external files** - Must ship `.dll`/`.so`/`.dylib` alongside binary
- ❌ **Distribution complexity** - Need to package multiple files
- ❌ **PATH issues** - Library must be in correct location

### How It Works:
1. Native library copied to `dist/` during build
2. Loaded via FFI from same directory as executable

### Build Output:
```
dist/
├── bunery.app                ← macOS .app bundle
│   └── Contents/MacOS/
│       ├── bunery            ← Launcher script
│       ├── bunery-bin        ← Actual binary
│       └── libwebview.dylib  ← Native library
├── bunery-windows-x64.exe    ← Windows executable
├── libwebview.dll            ← Required for Windows
├── bunery-linux-x64          ← Linux executable
├── libwebview-x64.so         ← Required for Linux x64
└── libwebview-arm64.so       ← Required for Linux ARM64
```

---

## Runtime Detection

The runtime automatically detects which mode to use:

```typescript
// In production, checks:
const useEmbedded = process.env.BUNERY_EMBED_NATIVE !== "false";

if (useEmbedded) {
  // Extract from embedded base64
} else {
  // Load from external file next to binary
}
```

You can override at runtime:
```bash
# Force external mode (even if embedded)
BUNERY_EMBED_NATIVE=false ./bunery
```

---

## Recommendations

### For End-Users (Desktop Apps):
✅ **Use `embedNativeLibs: true`**  
- Simplest distribution
- No user confusion about missing files

### For Developers (Tools/CLIs):
✅ **Use `embedNativeLibs: true`**  
- Easier to distribute via `npm install -g`

### For Size-Critical Deployments:
⚠️ **Consider `embedNativeLibs: false`**  
- If you absolutely need minimal binary size
- If you have a robust distribution system

---

## Build Commands

Both modes work with all build commands:

```bash
# Development
bun run dev              # Uses lib/native/ directory

# Production (single platform)
bun bake mac             # Respects embedNativeLibs
bun bake win
bun bake linux

# Production (all platforms)
bun bake all             # Respects embedNativeLibs for all targets
```

---

## Troubleshooting

### "Native library not found"
- **Embedded mode:** Run `bun bake` to embed libraries
- **External mode:** Ensure `.dll`/`.so`/`.dylib` is next to executable

### "Library not embedded"
- Check `bunery.config.ts` has `embedNativeLibs: true`
- Re-run `bun bake` after changing config
- Check `lib/embedded-native.ts` contains base64 data

### Windows/Linux builds missing libraries
- Cross-compilation requires Zig for external mode
- Embedded mode: macOS lib embedded, but won't work on Windows/Linux
- Solution: Build on native platform OR use GitHub Actions

---

## Technical Details

### Embedded Mode Architecture:
```
┌─────────────┐
│  Binary     │
│  ┌────────┐ │
│  │ Bun    │ │
│  │Runtime │ │
│  └────┬───┘ │
│       │     │
│  ┌────▼───┐ │
│  │base64  │ │  1. Extract
│  │.dylib  ├─┼──────────┐
│  └────────┘ │          │
└─────────────┘          ▼
                    /tmp/bunery-native/
                    └── libwebview.dylib
                             │
                    2. Load via FFI
                             ▼
                        Native WebView
```

### External Mode Architecture:
```
dist/
├── bunery               ← Binary
│                            │
│                            │ 1. Load via FFI
│                            ▼
└── libwebview.dylib     ← Native WebView
```

