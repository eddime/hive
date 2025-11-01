# 🚀 Getting Started with Hive

## Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start development
bun run dev

# 3. Build for production
bun run build
```

Your app is now running! 🎉

## Project Structure

```
hive/
├── src/
│   ├── frontend/          # 🎨 Your UI Code
│   │   ├── index.html     # HTML structure
│   │   ├── app.ts         # Frontend logic
│   │   └── styles.css     # Styling
│   ├── backend/           # ⚙️  Your Backend Logic
│   │   ├── server.ts      # Server & state management
│   │   └── bindings.ts    # Frontend ↔ Backend communication
│   └── index.ts           # Main entry point (don't edit)
├── scripts/               # Build scripts (don't edit)
└── hive.config.ts         # 🔧 App configuration
```

## Building Your App

### 1. Configure Your App (`hive.config.ts`)

```typescript
export default {
  window: {
    title: "My Awesome App",  // Change this!
    width: 1200,
    height: 800,
    resizable: true,
    fullscreen: false,
    debug: true,
  },
  app: {
    name: "my-app",           // Change this!
    version: "1.0.0",
    description: "My cool desktop app",
  },
};
```

### 2. Build Your Frontend (`src/frontend/`)

**HTML** (`index.html`):
- Add your UI structure
- Scripts and styles are auto-injected

**TypeScript** (`app.ts`):
- Write your frontend logic
- Call backend functions via bindings (see below)

**CSS** (`styles.css`):
- Style your app
- Auto-minified in production

### 3. Build Your Backend (`src/backend/`)

**Server** (`server.ts`):
- Manage your app state
- Export functions for frontend to call

**Bindings** (`bindings.ts`):
- Connect frontend to backend
- Super fast (<1ms) communication

## Frontend ↔ Backend Communication

### Backend Function

```typescript
// src/backend/server.ts
export function getTodos() {
  return todos; // your data
}

export function addTodo(title: string) {
  const todo = { id: nextId++, title, done: false };
  todos.push(todo);
  return todo;
}
```

### Register Binding

```typescript
// src/backend/bindings.ts
webview.bind("__getTodos", () => {
  return JSON.stringify(getTodos());
});

webview.bind("__addTodo", (args: string) => {
  const { title } = JSON.parse(args);
  return JSON.stringify(addTodo(title));
});
```

### Call from Frontend

```typescript
// src/frontend/app.ts
async function loadTodos() {
  const todosJson = await (window as any).__getTodos();
  const todos = JSON.parse(todosJson);
  renderTodos(todos);
}

async function addTodo(title: string) {
  const args = JSON.stringify({ title });
  const todoJson = await (window as any).__addTodo(args);
  const todo = JSON.parse(todoJson);
  return todo;
}
```

## Development Tips

### Hot Reload
- Save any file in `src/frontend/` → Auto-rebuild + restart
- Save any file in `src/backend/` → Auto-restart
- No page reload needed!

### Debugging
- Press **Cmd/Ctrl + Shift + I** to open DevTools
- Press **F11** for fullscreen

### State Management
Use `import.meta.hot.data` to preserve state:

```typescript
// Frontend hot reload state
if (import.meta.hot) {
  import.meta.hot.accept();
  
  // Preserve data between reloads
  const state = import.meta.hot.data.state ??= { count: 0 };
  state.count++;
}
```

## Building for Production

```bash
# Single platform (current OS)
bun run build
# Output: dist/hive or dist/hive.exe

# All platforms
bun run build:all
# Output:
#   dist/hive-darwin-arm64
#   dist/hive-darwin-x64
#   dist/hive-linux-x64
#   dist/hive-linux-arm64
#   dist/hive-windows-x64.exe
```

## Example: Todo App

Check out the included user management example to see how everything works together!

## Need Help?

- Check `README.md` for full documentation
- Read the code comments in `src/`
- Review the example user management implementation

Happy coding! 🐝

