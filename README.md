# 🐝 Hive

A lightweight fullstack desktop framework with Bun + Webview. Like Tauri, Neutralino.js or Electron, but powered by Bun's native APIs with direct frontend-backend communication via Webview Bindings.

**Fast. Lean. Native.**

## Features

- ✨ Fullstack Architecture with Bun
- 🚀 Hot Reloading in Development
- 📦 Automatic TypeScript/JavaScript & CSS Bundling
- ⚡ Optimized Compilation with Minification & Treeshaking
- 🎨 Modern UI with Glassmorphism Design
- 💾 Direct Frontend ↔ Backend Communication (Webview Bindings)
- 🌐 Cross-Platform Desktop App (macOS, Linux, Windows)
- 📱 Single Executable - Frontend & Backend in one file

## Project Structure

```
hive/
├── hive.config.ts              # 🔧 App configuration
├── src/
│   ├── index.ts                # 🚀 Main entry (don't edit)
│   ├── embedded-html.ts        # 📦 Auto-generated (don't edit)
│   ├── frontend/               # 🎨 YOUR UI CODE HERE
│   │   ├── index.html          # HTML structure
│   │   ├── app.ts              # Frontend logic
│   │   └── styles.css          # Styling
│   └── backend/                # ⚙️  YOUR BACKEND CODE HERE
│       ├── server.ts           # Server & state
│       └── bindings.ts         # Frontend ↔ Backend bridge
├── scripts/                    # Build scripts (don't edit)
│   ├── dev.ts                  # Dev server with hot reload
│   ├── build.ts                # Single platform build
│   ├── build-all.ts            # Cross-platform build
│   └── build-frontend.ts       # Frontend bundler
└── dist/                       # Build output (executables)
```

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start development
bun run dev

# 3. Build for production
bun run build
```

👉 **New to Hive?** Check out [GETTING_STARTED.md](GETTING_STARTED.md) for a step-by-step guide!

## Configuration

All settings in `hive.config.ts`:

```typescript
export default {
  window: {
    title: "Hive - Fullstack Desktop App",
    width: 900,
    height: 700,
    resizable: true,    // Allow window resizing (enables maximize button)
    fullscreen: false,  // Start in fullscreen mode (F11 to toggle)
    debug: true,        // Enable DevTools/Inspector
  },
  server: {
    port: 3000,
    cors: true,
    hmr: true,  // Enable Hot Module Replacement
  },
  app: {
    name: "hive",
    version: "1.0.0",
    description: "A lightweight fullstack desktop framework with Bun + Webview",
  },
  build: {
    minify: true,       // Reduce code size
    sourcemap: true,    // Generate source maps
    bytecode: false,    // Bytecode compilation (experimental)
    outdir: "dist",     // Output directory
    outfile: "hive",    // Executable name
  },
};
```

### Keyboard Shortcuts

- **F11** - Toggle fullscreen mode
- **Cmd/Ctrl + R** - Reload (Dev mode only)
- **Cmd/Ctrl + Shift + I** - DevTools (if debug enabled)

## Development

```bash
# Start app with Hot Reload (recommended)
bun run dev

# Start app without file watching
bun run dev:simple

# Clean build artifacts
bun run clean
```

**Hot Reload Features:**
- 🔥 Automatic frontend rebuild on file changes
- ⚡ Instant app restart on backend changes
- 👀 Watches `src/frontend/` and `src/backend/` directories
- 🎯 Preserves application state when possible

## Building

```bash
# Build for current platform
bun run build

# Build for ALL platforms (macOS, Linux, Windows)
bun run build:all
```

**Single Platform Output:**
- `dist/hive` or `dist/hive.exe` (~58-100 MB)
- `dist/hive.map` - Source map

**All Platforms Output:**
- `dist/hive-darwin-x64` - macOS Intel (~64 MB)
- `dist/hive-darwin-arm64` - macOS ARM (~58 MB)
- `dist/hive-linux-x64` - Linux x64 (~100 MB)
- `dist/hive-linux-arm64` - Linux ARM64 (~93 MB)
- `dist/hive-windows-x64.exe` - Windows x64 (~114 MB)

**What's included:**
- ✅ Bun Runtime (optimized)
- ✅ Webview Binaries
- ✅ Backend Logic & State (minified)
- ✅ Frontend (inlined HTML/CSS/JS ~8 KB, minified)
- ✅ Webview Bindings (Frontend ↔ Backend)
- ✅ Source Maps (for debugging)

**Performance:**
- Startup: ~100-200ms (or ~50ms with bytecode)
- Response time: <1ms (via Bindings)
- Memory: ~50-100 MB
- Frontend bundle: ~8 KB (minified + treeshaken)
- Binary size: Reduced by ~200 KB with minification

**Optimization Options:**
- `minify: true` - Reduces code size (~200 KB smaller)
- `sourcemap: true` - Generates `.map` files for debugging
- `bytecode: true` - Experimental! 2x faster startup but incompatible with `webview-bun` due to top-level await ([Bun Docs](https://bun.com/docs/bundler/executables#bytecode-compilation))

## Platform Requirements

### Linux
Install GTK 4 and WebkitGTK 6:

**Debian/Ubuntu:**
```bash
sudo apt install libgtk-4-1 libwebkitgtk-6.0-4
```

**Arch:**
```bash
sudo pacman -S gtk4 webkitgtk-6.0
```

**Fedora:**
```bash
sudo dnf install gtk4 webkitgtk6.0
```

### Windows
Requires Microsoft Edge WebView2 runtime (pre-installed on Windows 11).

### macOS
No additional dependencies required.

## Architecture

### Frontend ↔ Backend Communication

Hive uses **Webview Bindings** for direct, synchronous communication between frontend and backend:

```typescript
// Backend (src/backend/bindings.ts)
webview.bind("__getUsers", () => {
  return JSON.stringify(getUsers());
});

// Frontend (src/frontend/app.ts)
const users = JSON.parse(await window.__getUsers());
```

**Benefits:**
- ⚡ **< 1ms response time** (no HTTP overhead)
- 🔒 **No CORS issues** (direct memory access)
- 🎯 **Type-safe** (with TypeScript)
- 📦 **Smaller bundle** (no HTTP client needed)

## License

MIT

