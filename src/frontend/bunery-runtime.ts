// 🥐 Bunery Runtime API
// Frontend API for desktop apps built with Bunery

/**
 * Invokes a backend binding with type-safe return value
 * @internal Use namespaced APIs (bunery.fs, bunery.window, etc.) instead
 */
function invoke<T = any>(name: string, ...args: any[]): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const fn = (window as any)[`__${name}`];
      if (!fn) {
        reject(new Error(`[Bunery] Binding "${name}" not found`));
        return;
      }
      // Core bindings expect JSON string with array of args
      // Bindings may return Promise or string, so we await
      const result = await fn(JSON.stringify(args));
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      
      // Handle error responses
      if (parsed && parsed.__bunery_error) {
        reject(new Error(parsed.message || 'Unknown error'));
        return;
      }
      
      resolve(parsed);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * File System API
 */
export const fs = {
  /**
   * Read file contents as string
   * @param path - File path
   * @returns File contents
   */
  readFile: (path: string): Promise<string> => 
    invoke('fsReadFile', path),

  /**
   * Write string to file
   * @param path - File path
   * @param data - Content to write
   */
  writeFile: (path: string, data: string): Promise<void> => 
    invoke('fsWriteFile', path, data),

  /**
   * Read directory contents
   * @param path - Directory path
   * @returns Array of file/folder names
   */
  readDir: (path: string): Promise<string[]> => 
    invoke('fsReadDir', path),

  /**
   * Check if path exists
   * @param path - File or directory path
   */
  exists: (path: string): Promise<boolean> => 
    invoke('fsExists', path),

  /**
   * Delete file
   * @param path - File path
   */
  remove: (path: string): Promise<void> => 
    invoke('fsRemove', path),

  /**
   * Create directory
   * @param path - Directory path
   * @param recursive - Create parent directories if needed
   */
  mkdir: (path: string, recursive?: boolean): Promise<void> => 
    invoke('fsMkdir', path, recursive),

  /**
   * Get file/directory stats
   * @param path - Path to check
   */
  stat: (path: string): Promise<{
    isFile: boolean;
    isDirectory: boolean;
    size: number;
    modified: number;
    created: number;
  }> => invoke('fsStat', path),
};

/**
 * Operating System API
 */
export const os = {
  /**
   * Get platform name
   * @returns 'darwin' | 'windows' | 'linux'
   */
  platform: (): Promise<string> => 
    invoke('osPlatform'),

  /**
   * Get OS version
   */
  version: (): Promise<string> => 
    invoke('osVersion'),

  /**
   * Get OS architecture
   * @returns 'x64' | 'arm64'
   */
  arch: (): Promise<string> => 
    invoke('osArch'),

  /**
   * Get OS info
   */
  info: (): Promise<{
    platform: string;
    version: string;
    arch: string;
    hostname: string;
    username: string;
  }> => invoke('osInfo'),

  /**
   * Get environment variable
   * @param name - Variable name
   */
  env: (name: string): Promise<string | undefined> => 
    invoke('osEnv', name),
};

/**
 * Window Control API
 */
export const window = {
  /**
   * Set window title
   * @param title - New window title
   */
  setTitle: (title: string): Promise<void> => 
    invoke('windowSetTitle', title),

  /**
   * Minimize window
   */
  minimize: (): Promise<void> => 
    invoke('windowMinimize'),

  /**
   * Maximize window
   */
  maximize: (): Promise<void> => 
    invoke('windowMaximize'),

  /**
   * Restore window to normal size
   */
  restore: (): Promise<void> => 
    invoke('windowRestore'),

  /**
   * Close window (quits app)
   */
  close: (): Promise<void> => 
    invoke('windowClose'),

  /**
   * Set window size
   * @param width - Width in pixels
   * @param height - Height in pixels
   */
  setSize: (width: number, height: number): Promise<void> => 
    invoke('windowSetSize', width, height),

  /**
   * Set window position
   * @param x - X coordinate
   * @param y - Y coordinate
   */
  setPosition: (x: number, y: number): Promise<void> => 
    invoke('windowSetPosition', x, y),

  /**
   * Toggle fullscreen
   * @param enabled - Fullscreen state
   */
  setFullscreen: (enabled: boolean): Promise<void> => 
    invoke('windowSetFullscreen', enabled),

  /**
   * Get window state
   */
  getState: (): Promise<{
    width: number;
    height: number;
    x: number;
    y: number;
    isMaximized: boolean;
    isMinimized: boolean;
    isFullscreen: boolean;
  }> => invoke('windowGetState'),
};

/**
 * Dialog API
 */
export const dialog = {
  /**
   * Open file picker dialog
   * @param options - Dialog options
   * @returns Selected file path or null if cancelled
   */
  open: (options?: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
    multiple?: boolean;
    directory?: boolean;
  }): Promise<string | string[] | null> => 
    invoke('dialogOpen', options),

  /**
   * Save file dialog
   * @param options - Dialog options
   * @returns Selected save path or null if cancelled
   */
  save: (options?: {
    title?: string;
    defaultPath?: string;
    filters?: Array<{ name: string; extensions: string[] }>;
  }): Promise<string | null> => 
    invoke('dialogSave', options),

  /**
   * Show message dialog
   * @param options - Dialog options
   */
  message: (options: {
    title?: string;
    message: string;
    type?: 'info' | 'warning' | 'error';
    buttons?: string[];
  }): Promise<number> => 
    invoke('dialogMessage', options),

  /**
   * Show confirmation dialog
   * @param message - Confirmation message
   * @returns true if confirmed, false if cancelled
   */
  confirm: (message: string): Promise<boolean> => 
    invoke('dialogConfirm', message),
};

/**
 * Persistent Storage API
 */
export const storage = {
  /**
   * Get value from storage
   * @param key - Storage key
   */
  get: <T = any>(key: string): Promise<T | null> => 
    invoke('storageGet', key),

  /**
   * Set value in storage
   * @param key - Storage key
   * @param value - Value to store (must be JSON-serializable)
   */
  set: (key: string, value: any): Promise<void> => 
    invoke('storageSet', key, value),

  /**
   * Remove value from storage
   * @param key - Storage key
   */
  remove: (key: string): Promise<void> => 
    invoke('storageRemove', key),

  /**
   * Clear all storage
   */
  clear: (): Promise<void> => 
    invoke('storageClear'),

  /**
   * Get all keys
   */
  keys: (): Promise<string[]> => 
    invoke('storageKeys'),
};

/**
 * Shell/Process API
 */
export const shell = {
  /**
   * Execute shell command
   * @param command - Command to execute
   * @returns Command output
   */
  execute: (command: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> => invoke('shellExecute', command),

  /**
   * Open URL in default browser
   * @param url - URL to open
   */
  open: (url: string): Promise<void> => 
    invoke('shellOpen', url),

  /**
   * Open file or folder in default application
   * @param path - Path to open
   */
  openPath: (path: string): Promise<void> => 
    invoke('shellOpenPath', path),
};

/**
 * Clipboard API
 */
export const clipboard = {
  /**
   * Write text to clipboard
   * @param text - Text to copy
   */
  writeText: (text: string): Promise<void> => 
    invoke('clipboardWriteText', text),

  /**
   * Read text from clipboard
   */
  readText: (): Promise<string> => 
    invoke('clipboardReadText'),
};

/**
 * App API
 */
export const app = {
  /**
   * Get app version
   */
  getVersion: (): Promise<string> => 
    invoke('appGetVersion'),

  /**
   * Get app name
   */
  getName: (): Promise<string> => 
    invoke('appGetName'),

  /**
   * Quit application
   */
  quit: (): Promise<void> => 
    invoke('appQuit'),

  /**
   * Get app paths
   */
  getPaths: (): Promise<{
    app: string;
    userData: string;
    temp: string;
    home: string;
    documents: string;
    downloads: string;
  }> => invoke('appGetPaths'),
};

/**
 * Main Bunery API namespace
 */
export const bunery = {
  fs,
  os,
  window,
  dialog,
  storage,
  shell,
  clipboard,
  app,
  
  /**
   * Raw invoke for custom bindings
   * @param name - Binding name (without __ prefix)
   * @param args - Arguments to pass
   */
  invoke,
};

// Default export
export default bunery;

