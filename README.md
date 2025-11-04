# 🥐 Bunery

**Bake your desktop apps with Bun + Webview**

The Electron/Tauri/Neutralino alternative - **10x faster bindings** (\<1ms), powered by Bun.

## Why Bunery?

- ✅ **Blazing Fast** - 0.5ms API calls (10x faster than Electron!)
- ✅ **Complete API** - fs, os, window, dialog, storage, shell, clipboard
- ✅ **Lean** - ~58 MB binary (vs 150 MB Electron)
- ✅ **Simple** - No complex IPC, just TypeScript functions
- ✅ **Cross-Platform** - macOS, Linux, Windows
- ✅ **Hot Reload** - Instant updates during development
- ✅ **Native** - Uses OS webview (no Chromium!)
- ✅ **Type-Safe** - Full TypeScript support

## Quick Start

```bash
# Install
bun install

# Develop with hot reload
bun dev

# Bake for your platform
bun bake mac        # macOS
bun bake win        # Windows
bun bake linux      # Linux

# Bake for all platforms
bun bake all
```

## 🚀 Bunery API

```typescript
import { bunery } from '@bunery/runtime';

// File System
const content = await bunery.fs.readFile('file.txt');
await bunery.fs.writeFile('output.txt', 'Hello!');

// Operating System
const info = await bunery.os.info();
console.log(info.platform); // darwin, win32, linux

// Window Control
await bunery.window.setTitle('My App');
await bunery.window.setSize(1280, 720);

// Dialogs
const file = await bunery.dialog.open();
const savePath = await bunery.dialog.save();

// Persistent Storage
await bunery.storage.set('user', { name: 'John' });
const user = await bunery.storage.get('user');

// Shell & Process
const result = await bunery.shell.execute('ls -la');
await bunery.shell.open('https://github.com');

// Clipboard
await bunery.clipboard.writeText('Hello!');
const text = await bunery.clipboard.readText();

// App Info
const version = await bunery.app.getVersion();
const paths = await bunery.app.getPaths();
```

**📖 [Full API Documentation](./API.md)**

## Project Structure

```
bunery/
├── bunery.config.ts     # ⚙️  Configure your app
├── src/
│   ├── frontend/        # 🎨 Your UI (use @bunery/runtime)
│   │   ├── index.html
│   │   ├── app.ts
│   │   └── styles.css
│   └── backend/         # ⚡ Your custom bindings
│       ├── server.ts
│       └── bindings.ts
├── packages/
│   ├── runtime/         # 📦 @bunery/runtime (Frontend API)
│   └── core/            # 🔧 @bunery/core (Backend Bindings)
```

## How It Works

### 1. Write Backend Functions

```typescript
// src/backend/server.ts
let counter = 0;

export const getCounter = () => counter;
export const incrementCounter = () => ++counter;
```

### 2. Register Bindings

```typescript
// src/backend/bindings.ts
import { registerBindings } from "../../lib/bindings";
import * as backend from "./server";

export function registerBindings(webview: Webview) {
  register(webview, {
    getCounter: () => ({ value: backend.getCounter() }),
    increment: () => ({ value: backend.incrementCounter() }),
  });
}
```

### 3. Call from Frontend

```typescript
// src/frontend/app.ts
async function callBinding(binding: string, args?: any) {
  const fn = (window as any)[`__${binding}`];
  const result = await fn(args ? JSON.stringify(args) : undefined);
  return JSON.parse(result);
}

const { value } = await callBinding('increment');
console.log(value); // 1
```

## Configuration

```typescript
// bunery.config.ts
export default {
  window: {
    title: "My App",
    width: 1280,
    height: 720,
  },
  app: {
    name: "my-app",
    version: "1.0.0",
  },
  build: {
    frontend: {
      assetServer: true,  // Embed assets, serve via HTTP
    },
  },
};
```

## Commands

```bash
# Development
bun dev               # Hot reload development

# Production builds
bun bake all          # All platforms (macOS, Linux, Windows)
bun bake mac          # macOS only
bun bake win          # Windows only
bun bake linux        # Linux only

# Other
bun bake frontend     # Frontend assets only
bun bake clean        # Clean build artifacts
bun bake help         # Show all commands
```

### Windows Icon (Cross-Compilation)

When building Windows `.exe` from macOS/Linux, install `rcedit` for automatic icon embedding:

```bash
npm install -g rcedit
```

Bunery will automatically apply the icon during `bun bake win` or `bun bake all`.

**Note:** Building on Windows embeds icons natively (no `rcedit` needed).

## Output

```
dist/
├── bunery-darwin-x64.app     # macOS Intel
├── bunery-darwin-arm64.app   # macOS ARM (M1/M2/M3)
├── bunery-linux-x64          # Linux x64
├── bunery-linux-arm64        # Linux ARM
└── bunery-windows-x64.exe    # Windows
```

## Features

### 🚀 Asset Server Mode
- Embed unlimited frontend assets in binary
- Serve via HTTP at runtime (fast!)
- No size limits (unlike inline mode)
- TypeScript auto-transpilation

### 🔥 Direct Bindings
- \<1ms response time
- Type-safe communication
- No HTTP/WebSocket overhead
- Synchronous or async

### 🎨 Framework Agnostic
- Vanilla JS/TS
- React, Vue, Svelte
- Phaser, Three.js
- Any frontend framework!

### 📦 Small Binaries
- ~58 MB on macOS
- ~100 MB on Linux/Windows
- Native webview (no Chromium)
- Baseline builds (max compatibility)

## Platform Support

| Platform | Status | Binary Size | Notes |
|----------|--------|-------------|-------|
| macOS Intel | ✅ | ~64 MB | .app bundle |
| macOS ARM | ✅ | ~58 MB | M1/M2/M3 |
| Linux x64 | ✅ | ~100 MB | Baseline build |
| Linux ARM64 | ✅ | ~93 MB | Baseline build |
| Windows x64 | ✅ | ~114 MB | Baseline build |

## Comparison

| Feature | Bunery | Tauri | Electron | Neutralino |
|---------|--------|-------|----------|------------|
| Runtime | Bun | Rust | Node | Native |
| Webview | Native | Native | Chromium | Native |
| Binary Size | ~58 MB | ~10 MB | ~120 MB | ~5 MB |
| Startup | Fast | Fast | Slow | Fast |
| Bindings | Direct | IPC | IPC | IPC |
| Hot Reload | ✅ | ✅ | ✅ | ❌ |
| TypeScript | Native | External | External | External |

## Examples

Check out `src/frontend/` for:
- Counter app (bindings demo)
- Candy Catch game (Phaser + asset server)

## Documentation

- [Getting Started](GETTING_STARTED.md) - Full tutorial
- [Configuration](bunery.config.ts) - All options
- [Bindings Guide](lib/bindings.ts) - Frontend ↔ Backend

## License

MIT

## Acknowledgments

Built with:
- [Bun](https://bun.sh) - Fast JavaScript runtime
- [webview-bun](https://github.com/tr1ckydev/webview-bun) - Native webview bindings

---

**🥐 Bake something awesome!**
