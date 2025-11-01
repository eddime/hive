# 🐝 Hive Project Overview

## What is Hive?

Hive is a **lightweight fullstack desktop framework** that combines:
- 🚀 Bun (fastest JavaScript runtime)
- 🌐 Webview (native OS webview for UI)
- ⚡ Direct Frontend ↔ Backend communication (no HTTP overhead)

**Like Tauri, Neutralino.js, or Electron - but leaner and faster!**

## Key Features

- ✅ **Single Executable** - Everything in one file (~58-114 MB)
- ✅ **Hot Reload** - Instant updates during development
- ✅ **Cross-Platform** - Build for macOS, Linux, Windows
- ✅ **Tiny Frontend** - ~8 KB bundle (minified + treeshaken)
- ✅ **Blazing Fast** - <1ms backend communication
- ✅ **Native Performance** - Uses OS webview (no Chromium!)

## For Developers

### Quick Start
```bash
git clone <your-hive-repo>
cd hive
bun install
bun run dev
```

### Project Structure
```
hive/
├── hive.config.ts       # ⚙️  Configure your app here
├── src/
│   ├── frontend/        # 🎨 Edit your UI here
│   │   ├── index.html
│   │   ├── app.ts
│   │   └── styles.css
│   └── backend/         # ⚡ Edit your logic here
│       ├── server.ts
│       └── bindings.ts
├── scripts/             # Don't edit (build scripts)
└── dist/                # Build output
```

### Development Workflow

1. **Edit Frontend** (`src/frontend/`)
   - Modify HTML, CSS, or TypeScript
   - Save → Auto-rebuild + restart

2. **Edit Backend** (`src/backend/server.ts`)
   - Add functions, manage state
   - Export functions for frontend use

3. **Connect Frontend ↔ Backend** (`src/backend/bindings.ts`)
   ```typescript
   // Register backend function
   webview.bind("__myFunction", (args) => {
     return JSON.stringify(myFunction());
   });
   
   // Call from frontend
   const result = await window.__myFunction();
   ```

4. **Build for Production**
   ```bash
   bun run build      # Current platform
   bun run build:all  # All platforms
   ```

### Commands

| Command            | Description                        |
|--------------------|------------------------------------|
| `bun run dev`      | Start with hot reload (recommended)|
| `bun run dev:simple` | Start without file watching      |
| `bun run build`    | Build for current platform         |
| `bun run build:all`| Build for all platforms            |
| `bun run clean`    | Clean build artifacts              |

### Configuration (`hive.config.ts`)

```typescript
export default {
  window: {
    title: "My App",      // Window title
    width: 1200,          // Window width
    height: 800,          // Window height
    resizable: true,      // Allow resizing
    fullscreen: false,    // Start fullscreen
    debug: true,          // Enable DevTools
  },
  server: {
    port: 3000,           // Dev server port
    hmr: true,            // Hot module replacement
  },
  app: {
    name: "my-app",       // App name (for builds)
    version: "1.0.0",     // App version
  },
  build: {
    minify: true,         // Minify output
    sourcemap: true,      // Generate source maps
    outdir: "dist",       // Output directory
    outfile: "my-app",    // Executable name
  },
};
```

## Architecture

### Communication Flow
```
Frontend (HTML/CSS/JS)
       ↕
Webview Bindings (<1ms)
       ↕
Backend (Bun)
       ↕
System/APIs
```

### Why Webview Bindings?
- **Fast**: Direct memory access, no HTTP
- **Simple**: Just function calls
- **Type-safe**: Full TypeScript support
- **Small**: No HTTP client needed

## Use Cases

- ✅ Desktop Tools
- ✅ Admin Panels
- ✅ Data Dashboards
- ✅ Local-first Apps
- ✅ Developer Tools
- ✅ System Utilities

## Performance

| Metric | Value |
|--------|-------|
| Startup | ~100-200ms |
| Response | <1ms (bindings) |
| Memory | ~50-100 MB |
| Frontend | ~8 KB |
| Binary | 58-114 MB |

## Comparison

| Feature | Hive | Tauri | Electron | Neutralino |
|---------|------|-------|----------|------------|
| Runtime | Bun | Rust | Node | C++ |
| Bundle | 58MB | 5MB | 150MB | 3MB |
| Speed | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ |
| Dev Setup | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| Hot Reload | ✅ | ✅ | ✅ | ❌ |
| TypeScript | ✅ | ✅ | ✅ | ❌ |

## Next Steps

1. Read [GETTING_STARTED.md](GETTING_STARTED.md) for detailed guide
2. Check example code in `src/frontend/` and `src/backend/`
3. Customize `hive.config.ts`
4. Build something awesome! 🚀

---

**Made with 🐝 and Bun**
