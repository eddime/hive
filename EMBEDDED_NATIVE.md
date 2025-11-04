# 🥐 Embedded Native Libraries

Bunery now supports **embedding native libraries directly into the executable**! This means **single-file executables** with no external `.dylib`, `.dll`, or `.so` files needed.

## How It Works

### 1. Development Mode
- Uses the `lib/native/libwebview.dylib` file directly from disk
- Fast iteration, no embedding needed
- Run with `bun dev`

### 2. Production Build
- Native libraries are embedded as **base64** in the source code
- At runtime, the library is extracted to a temp directory and loaded
- Result: **Single-file executable** that works standalone!

## Build Process

### Automatic (Recommended)
```bash
bun bake mac    # Builds for macOS with embedded dylib
bun bake win    # Builds for Windows with embedded dll
bun bake linux  # Builds for Linux with embedded so
bun bake all    # Builds for all platforms
```

### Manual Steps
```bash
# 1. Build the native library
cd bunery-webview
./scripts/build-macos.sh  # or build-windows.sh, build-linux.sh

# 2. Copy to Bunery
cp lib/libwebview.dylib ../bunery/lib/native/

# 3. Embed the library
cd ../bunery
bun run scripts/embed-native-libs.ts

# 4. Build the executable
bun run scripts/build.ts
```

## Cross-Platform

The embedding system supports **all three platforms**:

- **macOS**: `libwebview.dylib` (79 KB)
- **Windows**: `libwebview.dll` (~100 KB)
- **Linux**: `libwebview.so` (~80 KB)

Each platform's library is embedded separately, and the correct one is extracted at runtime based on `process.platform`.

## Benefits

✅ **Single-File Executable**: No external dependencies  
✅ **Easy Distribution**: Just ship one file!  
✅ **No Installation**: Users can run it immediately  
✅ **Cross-Platform**: Same approach works on macOS, Windows, Linux  
✅ **Small Overhead**: Only ~100 KB added to binary size  

## Technical Details

### Embedding Process
1. Native library is read as binary data
2. Encoded to base64 string
3. Injected into `lib/embedded-native.ts` source code
4. Compiled into the Bun executable

### Runtime Extraction
1. Detect current platform (`process.platform`)
2. Decode base64 to binary data
3. Extract to `os.tmpdir()/bunery-native/`
4. Load with `dlopen()` (FFI)

### Caching
- Extracted library is cached in temp directory
- Subsequent runs skip extraction (instant startup!)
- Survives system restarts

## Comparison with Alternatives

### Electron
- **Electron**: 150+ MB (includes Chromium + Node.js)
- **Bunery**: 15 MB + 0.1 MB native lib = **15.1 MB total**
- **10x smaller!**

### Tauri
- **Tauri**: 5-10 MB binary + system WebView
- **Bunery**: 15 MB binary (includes Bun runtime)
- **Similar size, but Bunery has full Bun runtime!**

### Neutralino
- **Neutralino**: 3 MB + separate native files
- **Bunery**: 15 MB single file (no external dependencies)
- **True single-file executable!**

## Future: Static Linking

Currently, we embed and extract at runtime. A future optimization would be **static linking**, where the native library is compiled directly into the Bun executable at compile time. This would:

- ✅ Eliminate runtime extraction
- ✅ Faster startup (no I/O)
- ✅ Smaller binary (no base64 overhead)

However, this requires Bun to support custom linker flags in `bun build --compile`, which is not yet available.

## Building for Other Platforms

### On macOS → Build for Windows/Linux
```bash
cd bunery-webview
./scripts/build-static-all.sh  # Uses Zig for cross-compilation
```

### Copy all libraries
```bash
cp lib/libwebview.dylib ../bunery/lib/native/
cp lib/libwebview.dll ../bunery/lib/native/
cp lib/libwebview.so ../bunery/lib/native/
```

### Embed all
```bash
cd ../bunery
bun run scripts/embed-native-libs.ts
```

Now `bun bake all` will create executables for all platforms with embedded libraries! 🚀

