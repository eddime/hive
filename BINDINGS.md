# 🔗 Bunery Bindings System

Ultra-fast, type-safe communication between Frontend ↔ Backend.

## Why Custom Bindings?

✅ **Type-Safe** - Full TypeScript support  
✅ **Auto-Serialization** - JSON handled automatically  
✅ **Error Handling** - Consistent error format  
✅ **Clean API** - No manual `JSON.stringify/parse`  
✅ **Extensible** - Easy to add features  

## Basic Usage

### Backend (Register Bindings)

```typescript
// src/backend/bindings.ts
import { registerBindings as register } from "../core/bindings";
import * as backend from "./server";

export function registerBindings(webview: Webview) {
  register(webview, {
    // Simple sync function
    getCounter: () => ({ value: backend.getCounter() }),
    
    // Async function
    fetchData: async () => {
      const data = await fetch('https://api.example.com/data');
      return { data };
    },
    
    // With arguments
    setCounter: (args) => {
      backend.setCounter(args.value);
      return { success: true };
    },
    
    // Complex logic
    calculate: (args) => {
      const { a, b, operation } = args;
      const result = operation === 'add' ? a + b : a - b;
      return { result };
    },
  });
}
```

### Frontend (Call Bindings)

```typescript
// Simple call
const { value } = JSON.parse(await window.__getCounter());

// With arguments
const args = JSON.stringify({ value: 42 });
const { success } = JSON.parse(await window.__setCounter(args));

// Complex calculation
const calcArgs = JSON.stringify({ a: 10, b: 5, operation: 'add' });
const { result } = JSON.parse(await window.__calculate(calcArgs));
```

## Advanced: Type-Safe Helper

Create a typed API wrapper:

```typescript
// src/frontend/api.ts
async function call<T>(binding: string, args?: any): Promise<T> {
  const fn = (window as any)[`__${binding}`];
  if (!fn) throw new Error(`Binding ${binding} not found`);
  
  const resultStr = await fn(args ? JSON.stringify(args) : undefined);
  const result = JSON.parse(resultStr);
  
  if (result.error) {
    throw new Error(result.message);
  }
  
  return result;
}

// Type-safe API
export const api = {
  getCounter: () => call<{ value: number }>('getCounter'),
  setCounter: (value: number) => call<{ success: boolean }>('setCounter', { value }),
  calculate: (a: number, b: number, op: 'add' | 'sub') => 
    call<{ result: number }>('calculate', { a, b, operation: op }),
};

// Usage
const { value } = await api.getCounter();
const { result } = await api.calculate(10, 5, 'add');
```

## Error Handling

Bindings automatically catch errors:

```typescript
// Backend
register(webview, {
  riskyOperation: (args) => {
    if (!args.value) {
      throw new Error('Value is required');
    }
    return { result: args.value * 2 };
  },
});

// Frontend
try {
  const result = await api.riskyOperation();
} catch (error) {
  console.error('Backend error:', error.message);
}
```

## Performance

- **Direct bindings**: <1ms
- **Auto JSON**: ~0.1ms overhead
- **Total**: Still <2ms (vs 5-10ms HTTP)

## Comparison

### Old Way (Manual)
```typescript
// Backend
webview.bind("__getCounter", () => {
  return JSON.stringify({ value: getCounter() });
});

// Frontend
const result = await window.__getCounter();
const { value } = JSON.parse(result);
```

### New Way (Bunery System)
```typescript
// Backend
register(webview, {
  getCounter: () => ({ value: getCounter() }),
});

// Frontend
const { value } = await api.getCounter();
```

**50% less code, type-safe, cleaner!**

## Best Practices

### 1. Group Related Functions
```typescript
register(webview, {
  // User operations
  getUser: () => ({ user }),
  updateUser: (args) => ({ success: updateUser(args) }),
  deleteUser: (args) => ({ success: deleteUser(args.id) }),
  
  // Game operations
  saveGame: (args) => ({ saved: saveGame(args.state) }),
  loadGame: () => ({ state: loadGame() }),
});
```

### 2. Use Namespaces
```typescript
register(webview, {
  'user:get': () => getUser(),
  'user:update': (args) => updateUser(args),
  'game:save': (args) => saveGame(args),
  'game:load': () => loadGame(),
});
```

### 3. Return Consistent Shapes
```typescript
// Good: Always return { data } or { error }
register(webview, {
  getData: () => ({ data: fetchData() }),
  saveData: (args) => ({ data: save(args) }),
});

// Bad: Inconsistent return types
register(webview, {
  getData: () => fetchData(),  // returns array
  saveData: (args) => true,    // returns boolean
});
```

## Configuration Options

### Fullscreen Support

```typescript
// bunery.config.ts
export default {
  window: {
    startFullscreen: true,  // Start in fullscreen
    fullscreen: true,       // F11 toggle enabled
  }
};
```

**Fullscreen modes:**
- `startFullscreen: false` - Normal window (can F11)
- `startFullscreen: true` - Launch fullscreen (perfect for games/kiosk)
- Width/Height: `0` = use screen size

### Binding a Fullscreen Toggle

```typescript
register(webview, {
  toggleFullscreen: () => {
    // This would need native implementation
    // For now, use F11 or HTML5 Fullscreen API
    return { fullscreen: true };
  },
});
```

## Examples

### Counter App
```typescript
register(webview, {
  getCounter: () => ({ value: counter }),
  increment: () => ({ value: ++counter }),
  decrement: () => ({ value: --counter }),
  reset: () => ({ value: counter = 0 }),
});
```

### Todo App
```typescript
register(webview, {
  getTodos: () => ({ todos }),
  addTodo: (args) => {
    const todo = { id: nextId++, text: args.text, done: false };
    todos.push(todo);
    return { todo };
  },
  toggleTodo: (args) => {
    const todo = todos.find(t => t.id === args.id);
    if (todo) todo.done = !todo.done;
    return { todo };
  },
  deleteTodo: (args) => {
    todos = todos.filter(t => t.id !== args.id);
    return { success: true };
  },
});
```

### Game State
```typescript
register(webview, {
  'game:init': () => ({ state: initGame() }),
  'game:update': (args) => ({ state: updateGame(args.delta) }),
  'game:save': () => ({ saved: saveToFile(gameState) }),
  'game:load': () => ({ state: loadFromFile() }),
  'player:move': (args) => {
    movePlayer(args.x, args.y);
    return { position: player.position };
  },
});
```

## Migration Guide

### From Raw Webview Bindings

**Before:**
```typescript
webview.bind("__myFunc", (argsStr) => {
  try {
    const args = JSON.parse(argsStr);
    const result = doSomething(args);
    return JSON.stringify({ result });
  } catch (error) {
    return JSON.stringify({ error: error.message });
  }
});
```

**After:**
```typescript
register(webview, {
  myFunc: (args) => ({ result: doSomething(args) }),
});
```

### From HTTP API

**Before (HTTP):**
```typescript
// Backend
app.get('/api/data', (req, res) => {
  res.json({ data: getData() });
});

// Frontend (~5-10ms)
const response = await fetch('/api/data');
const { data } = await response.json();
```

**After (Bindings):**
```typescript
// Backend
register(webview, {
  getData: () => ({ data: getData() }),
});

// Frontend (<1ms)
const { data } = await api.getData();
```

**10x faster!**

---

**Made with 🥐 and Bun**

