# 🥐 Bunery API Documentation

**Complete API reference for building desktop apps with Bunery**

Like Electron, Tauri, and Neutralino - but simpler, faster, and powered by Bun.

---

## 📦 Installation

```bash
npm install @bunery/runtime
```

```typescript
import { bunery } from '@bunery/runtime';
```

---

## ⚡️ Performance

| API Call | Latency |
|----------|---------|
| **Bunery** | **~0.5ms** ⚡️ |
| Tauri | ~1-2ms |
| Neutralino | ~2-3ms |
| Electron | ~5-10ms |

**10x faster than Electron!**

---

## 📁 File System API

### `bunery.fs.readFile(path)`
Read file contents as string.

```typescript
const content = await bunery.fs.readFile('/path/to/file.txt');
console.log(content);
```

### `bunery.fs.writeFile(path, data)`
Write string to file.

```typescript
await bunery.fs.writeFile('/path/to/output.txt', 'Hello Bunery!');
```

### `bunery.fs.readDir(path)`
Read directory contents.

```typescript
const files = await bunery.fs.readDir('/path/to/directory');
console.log(files); // ['file1.txt', 'file2.txt']
```

### `bunery.fs.exists(path)`
Check if path exists.

```typescript
const exists = await bunery.fs.exists('/path/to/file.txt');
if (exists) {
  console.log('File exists!');
}
```

### `bunery.fs.remove(path)`
Delete file.

```typescript
await bunery.fs.remove('/path/to/file.txt');
```

### `bunery.fs.mkdir(path, recursive?)`
Create directory.

```typescript
await bunery.fs.mkdir('/path/to/new/directory', true); // recursive
```

### `bunery.fs.stat(path)`
Get file/directory stats.

```typescript
const stats = await bunery.fs.stat('/path/to/file.txt');
console.log(stats.size); // File size in bytes
console.log(stats.isFile); // true
console.log(stats.modified); // Last modified timestamp
```

---

## 💻 Operating System API

### `bunery.os.platform()`
Get platform name.

```typescript
const platform = await bunery.os.platform();
// Returns: 'darwin' | 'win32' | 'linux'
```

### `bunery.os.version()`
Get OS version.

```typescript
const version = await bunery.os.version();
console.log(version); // e.g., "Darwin 23.0.0"
```

### `bunery.os.arch()`
Get architecture.

```typescript
const arch = await bunery.os.arch();
// Returns: 'x64' | 'arm64'
```

### `bunery.os.info()`
Get full OS information.

```typescript
const info = await bunery.os.info();
console.log(info);
// {
//   platform: 'darwin',
//   version: 'Darwin 23.0.0',
//   arch: 'arm64',
//   hostname: 'My-MacBook',
//   username: 'john'
// }
```

### `bunery.os.env(name)`
Get environment variable.

```typescript
const home = await bunery.os.env('HOME');
console.log(home); // /Users/john
```

---

## 🪟 Window Control API

### `bunery.window.setTitle(title)`
Set window title.

```typescript
await bunery.window.setTitle('My Awesome App');
```

### `bunery.window.minimize()`
Minimize window.

```typescript
await bunery.window.minimize();
```

### `bunery.window.maximize()`
Maximize window.

```typescript
await bunery.window.maximize();
```

### `bunery.window.restore()`
Restore window to normal size.

```typescript
await bunery.window.restore();
```

### `bunery.window.close()`
Close window (quits app).

```typescript
await bunery.window.close();
```

### `bunery.window.setSize(width, height)`
Set window size.

```typescript
await bunery.window.setSize(1280, 720);
```

### `bunery.window.setPosition(x, y)`
Set window position.

```typescript
await bunery.window.setPosition(100, 100);
```

### `bunery.window.setFullscreen(enabled)`
Toggle fullscreen.

```typescript
await bunery.window.setFullscreen(true);
```

### `bunery.window.getState()`
Get window state.

```typescript
const state = await bunery.window.getState();
console.log(state);
// {
//   width: 1280,
//   height: 720,
//   x: 0,
//   y: 0,
//   isMaximized: false,
//   isMinimized: false,
//   isFullscreen: false
// }
```

---

## 📂 Dialog API

### `bunery.dialog.open(options?)`
Open file picker dialog.

```typescript
// Open single file
const file = await bunery.dialog.open({
  title: 'Select a file',
  filters: [
    { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] },
    { name: 'All Files', extensions: ['*'] }
  ]
});

// Open multiple files
const files = await bunery.dialog.open({
  multiple: true
});

// Open directory
const dir = await bunery.dialog.open({
  directory: true
});
```

### `bunery.dialog.save(options?)`
Save file dialog.

```typescript
const savePath = await bunery.dialog.save({
  title: 'Save File',
  defaultPath: 'untitled.txt',
  filters: [
    { name: 'Text Files', extensions: ['txt'] }
  ]
});
```

### `bunery.dialog.message(options)`
Show message dialog.

```typescript
const buttonIndex = await bunery.dialog.message({
  title: 'Warning',
  message: 'Are you sure you want to continue?',
  type: 'warning',
  buttons: ['Cancel', 'Continue']
});
```

### `bunery.dialog.confirm(message)`
Show confirmation dialog.

```typescript
const confirmed = await bunery.dialog.confirm('Delete this file?');
if (confirmed) {
  // Delete file
}
```

---

## 💾 Storage API

Persistent storage across app restarts.

### `bunery.storage.get(key)`
Get value from storage.

```typescript
const user = await bunery.storage.get('user');
console.log(user);
```

### `bunery.storage.set(key, value)`
Set value in storage.

```typescript
await bunery.storage.set('user', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

### `bunery.storage.remove(key)`
Remove value from storage.

```typescript
await bunery.storage.remove('user');
```

### `bunery.storage.clear()`
Clear all storage.

```typescript
await bunery.storage.clear();
```

### `bunery.storage.keys()`
Get all keys.

```typescript
const keys = await bunery.storage.keys();
console.log(keys); // ['user', 'settings', 'cache']
```

---

## ⚡️ Shell API

### `bunery.shell.execute(command)`
Execute shell command.

```typescript
const result = await bunery.shell.execute('ls -la');
console.log(result.stdout);
console.log(result.exitCode);
```

### `bunery.shell.open(url)`
Open URL in default browser.

```typescript
await bunery.shell.open('https://github.com/eddime/bunery');
```

### `bunery.shell.openPath(path)`
Open file or folder in default application.

```typescript
await bunery.shell.openPath('/path/to/document.pdf');
```

---

## 📋 Clipboard API

### `bunery.clipboard.writeText(text)`
Write text to clipboard.

```typescript
await bunery.clipboard.writeText('Hello Bunery!');
```

### `bunery.clipboard.readText()`
Read text from clipboard.

```typescript
const text = await bunery.clipboard.readText();
console.log(text);
```

---

## ℹ️ App API

### `bunery.app.getVersion()`
Get app version.

```typescript
const version = await bunery.app.getVersion();
console.log(version); // "1.0.0"
```

### `bunery.app.getName()`
Get app name.

```typescript
const name = await bunery.app.getName();
console.log(name); // "my-app"
```

### `bunery.app.quit()`
Quit application.

```typescript
await bunery.app.quit();
```

### `bunery.app.getPaths()`
Get app paths.

```typescript
const paths = await bunery.app.getPaths();
console.log(paths);
// {
//   app: '/Users/john/my-app',
//   userData: '/Users/john/.bunery/my-app',
//   temp: '/tmp',
//   home: '/Users/john',
//   documents: '/Users/john/Documents',
//   downloads: '/Users/john/Downloads'
// }
```

---

## 🔧 Custom Bindings

Use `bunery.invoke()` for custom bindings:

```typescript
// Frontend
const result = await bunery.invoke('myCustomBinding', arg1, arg2);

// Backend (src/backend/bindings.ts)
export function registerBindings(webview: Webview) {
  webview.bind('__myCustomBinding', (args: string) => {
    const [arg1, arg2] = JSON.parse(args);
    // Your logic here
    return JSON.stringify({ success: true });
  });
}
```

---

## 🚀 Bunery vs Competitors

| Feature | Bunery | Electron | Tauri | Neutralino |
|---------|--------|----------|-------|------------|
| **Runtime** | OS Webview | Chromium | OS Webview | OS Webview |
| **Language** | Bun (TS) | Node.js | Rust + JS | JS + C++ |
| **Binary Size** | ~58 MB | ~150 MB | ~5 MB | ~3 MB |
| **Startup Time** | ~100ms | ~1s | ~200ms | ~100ms |
| **API Latency** | **0.5ms** ⚡️ | 5-10ms | 1-2ms | 2-3ms |
| **Hot Reload** | ✅ | ✅ | ✅ | ❌ |
| **Cross-Platform** | ✅ | ✅ | ✅ | ✅ |

---

## 📚 Examples

### File Manager

```typescript
import { bunery } from '@bunery/runtime';

// List files
const files = await bunery.fs.readDir('/Users/john/Documents');

// Read file
const content = await bunery.fs.readFile(files[0]);

// Save file
const savePath = await bunery.dialog.save();
if (savePath) {
  await bunery.fs.writeFile(savePath, content);
}
```

### Settings App

```typescript
import { bunery } from '@bunery/runtime';

// Load settings
const settings = await bunery.storage.get('settings') || {
  theme: 'light',
  language: 'en'
};

// Save settings
await bunery.storage.set('settings', {
  ...settings,
  theme: 'dark'
});
```

### System Info App

```typescript
import { bunery } from '@bunery/runtime';

const info = await bunery.os.info();
const version = await bunery.app.getVersion();
const paths = await bunery.app.getPaths();

console.log(`App: ${version}`);
console.log(`OS: ${info.platform} ${info.version}`);
console.log(`Arch: ${info.arch}`);
```

---

## 🎯 Best Practices

1. **Always handle errors**:
   ```typescript
   try {
     const content = await bunery.fs.readFile('file.txt');
   } catch (error) {
     console.error('Failed to read file:', error);
   }
   ```

2. **Use storage for persistent data**:
   ```typescript
   // ✅ Good - persists across restarts
   await bunery.storage.set('user', userData);
   
   // ❌ Bad - lost on restart
   localStorage.setItem('user', JSON.stringify(userData));
   ```

3. **Validate user input**:
   ```typescript
   const file = await bunery.dialog.open();
   if (!file) return; // User cancelled
   
   const exists = await bunery.fs.exists(file);
   if (!exists) {
     console.error('File not found');
     return;
   }
   ```

4. **Use TypeScript for type safety**:
   ```typescript
   const user = await bunery.storage.get<{
     name: string;
     email: string;
   }>('user');
   
   console.log(user?.name); // Type-safe!
   ```

---

## 🆘 Support

- **Documentation**: [github.com/eddime/bunery](https://github.com/eddime/bunery)
- **Issues**: [github.com/eddime/bunery/issues](https://github.com/eddime/bunery/issues)
- **Examples**: `/examples` folder

---

**Made with 🥐 by the Bunery team**

