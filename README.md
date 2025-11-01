# 🐝 Hive

**A lean, fast desktop framework powered by Bun + Webview**

Like Tauri/Electron/Neutralino - but simpler and with direct bindings (\<1ms).

## Why Hive?

- ✅ **Lean** - 4 KB frontend, ~58 MB binary
- ✅ **Fast** - Direct bindings (no HTTP overhead)
- ✅ **Simple** - No complex IPC, just function calls
- ✅ **Cross-Platform** - macOS, Linux, Windows
- ✅ **Hot Reload** - Instant updates during development
- ✅ **Native** - Uses OS webview (no Chromium!)

## Quick Start

```bash
# Install
bun install

# Develop with hot reload
bun run dev

# Build for your platform
bun run build

# Build for all platforms
bun run build:all
```

## Project Structure

```
hive/
├── hive.config.ts       # ⚙️  Configure your app
├── src/
│   ├── frontend/        # 🎨 Your UI
│   │   ├── index.html
│   │   ├── app.ts
│   │   └── styles.css
│   └── backend/         # ⚡ Your logic
│       ├── server.ts    # Backend functions
│       └── bindings.ts  # Connect frontend ↔ backend
```

## How It Works

### 1. Write Backend Functions

```typescript
// src/backend/server.ts
export function getData() {
  return { message: "Hello from backend!" };
}
```

### 2. Register Bindings

```typescript
// src/backend/bindings.ts
webview.bind("__getData", () => {
  const data = backend.getData();
  return JSON.stringify(data);
});
```

### 3. Call from Frontend

```typescript
// src/frontend/app.ts
const resultStr = await window.__getData();
const data = JSON.parse(resultStr);
console.log(data); // { message: "Hello from backend!" }
```

**That's it!** No HTTP servers, no REST APIs, no complex IPC. Just direct function calls.

## Use Cases

### Perfect For:
- ✅ Desktop tools & utilities
- ✅ Admin panels & dashboards
- ✅ Data visualization apps
- ✅ Local-first applications
- ✅ Developer tools
- ✅ **Games** (see below)

### Games with Hive?

**Yes! Hive can be used for games.** Here's how:

#### Canvas/WebGL Games
- Use HTML5 Canvas or WebGL for rendering
- Backend handles game logic, state, saves
- Direct bindings = fast game loop communication
- Perfect for 2D games, puzzle games, strategy games

#### Example Use Cases:
- 🎮 Roguelikes, RPGs, puzzle games
- 🎲 Board game implementations
- 🎯 2D platformers, arcade games
- 🃏 Card games, turn-based strategy

#### Performance:
- **Bindings: <1ms** - Fast enough for game loops
- **Webview rendering** - Hardware accelerated
- **Bun backend** - Native performance for game logic

#### Steamworks Integration?
**Yes!** You can use Bun + native addons:
- Use FFI to call Steamworks C++ API
- Or use a Bun-compatible Steam library
- Backend handles all Steam API calls
- Frontend just renders and sends input

Example structure:
```typescript
// Backend integrates with Steam via FFI
export function initSteam() { /* FFI call */ }
export function unlockAchievement(id: string) { /* FFI call */ }

// Frontend just calls backend
await window.__initSteam();
await window.__unlockAchievement("first_win");
```

#### Limitations:
- Not ideal for AAA 3D games (use Unity/Unreal)
- Webview rendering = limited to web tech
- No native gamepad API (needs workaround)

But for **indie games, retro games, or casual games** - Hive is perfect!

## Configuration

```typescript
// hive.config.ts
export default {
  window: {
    title: "My App",
    width: 1200,
    height: 800,
    resizable: true,
    fullscreen: false,  // Games can use this!
    debug: true,
  },
  dev: {
    hmr: true,  // Hot reload
  },
  build: {
    minify: true,
    outdir: "dist",
    outfile: "my-app",
  },
};
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start with hot reload |
| `bun run build` | Build for current platform |
| `bun run build:all` | Build for all platforms |
| `bun run clean` | Clean build artifacts |

## Comparison

| Feature | Hive | Tauri | Electron | Neutralino |
|---------|------|-------|----------|------------|
| Runtime | Bun | Rust | Node | C++ |
| Size | 58MB | 5MB | 150MB | 3MB |
| Setup | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ | ⚡⚡ |
| Speed | ⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡ | ⚡⚡⚡ |
| Hot Reload | ✅ | ✅ | ✅ | ❌ |
| Bindings | <1ms | ~5ms | IPC | WebSocket |

## Architecture

```
Frontend (HTML/CSS/JS)
       ↕ <1ms
Webview Bindings
       ↕
Backend (Bun/TypeScript)
       ↕
System/APIs/Steam/etc
```

## License

MIT

---

**Made with 🐝 and Bun**

*For more details, see [GETTING_STARTED.md](GETTING_STARTED.md) and [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)*
