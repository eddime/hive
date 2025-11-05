/**
 * 🥐 Bunery Webview Wrapper
 * 
 * webview-bun + native extensions for missing features
 * 
 * 🔧 IMPORTANT: This module lazy-loads webview-bun to ensure
 * WEBVIEW_PATH is set before the native library is loaded!
 */

import { dlopen, FFIType } from "bun:ffi";
import { resolve } from "path";

// Lazy-load webview-bun to ensure WEBVIEW_PATH is set first
let WebviewBun: any = null;
let SizeHint: any = null;

async function ensureWebviewLoaded() {
  if (!WebviewBun) {
    const webview = await import("webview-bun");
    WebviewBun = webview.Webview;
    SizeHint = webview.SizeHint;
  }
}

// Export SizeHint via getter to maintain lazy loading
export { SizeHint };

// Load native extensions (try embedded first, then fallback paths)
function loadExtensions() {
  // Try to get embedded extension first
  let extPath: string | null = null;
  try {
    const { getExtensionLibraryPath } = require("./embedded-native");
    extPath = getExtensionLibraryPath();
  } catch (e) {
    // embedded-native not available
  }
  
  // If no embedded path, try fallback paths
  if (!extPath) {
    let libName: string;
    if (process.platform === "darwin") {
      libName = "libwebview_ext.dylib";
    } else if (process.platform === "win32") {
      libName = "libwebview_ext.dll";
    } else if (process.platform === "linux") {
      libName = "libwebview_ext.so";
    } else {
      return null; // Unsupported platform
    }
    
    const possiblePaths = [
      resolve(import.meta.dir, `../lib/native/${libName}`), // Dev mode
      resolve(process.execPath, `../${libName}`), // Production bundle
      `./${libName}`, // Relative
    ];
    
    for (const path of possiblePaths) {
      try {
        extPath = path;
        break;
      } catch (e) {
        continue;
      }
    }
  }
  
  if (!extPath) {
    console.warn("[Bunery] Extension library not found, extended features disabled");
    return null;
  }
  
  try {
    return dlopen(extPath, {
      webview_set_icon: {
        args: [FFIType.ptr, FFIType.cstring],
        returns: FFIType.void,
      },
      webview_set_min_size: {
        args: [FFIType.ptr, FFIType.i32, FFIType.i32],
        returns: FFIType.void,
      },
      webview_set_frameless: {
        args: [FFIType.ptr, FFIType.bool],
        returns: FFIType.void,
      },
      webview_toggle_fullscreen: {
        args: [FFIType.ptr],
        returns: FFIType.void,
      },
      webview_set_always_on_top: {
        args: [FFIType.ptr, FFIType.bool],
        returns: FFIType.void,
      },
    });
  } catch (e) {
    console.warn("[Bunery] Failed to load extension library:", e);
    return null;
  }
}

const ext = loadExtensions();

interface WebviewOptions {
  width?: number;
  height?: number;
  hint?: SizeHint;
  frameless?: boolean;
  fullscreen?: boolean;
  alwaysOnTop?: boolean;
}

export class Webview extends WebviewBun {
  private windowHandle: any;
  private opts: WebviewOptions;

  constructor(debug: boolean = false, options: WebviewOptions = {}) {
    super(debug, {
      width: options.width || 800,
      height: options.height || 600,
      hint: options.hint,
    });

    this.opts = options;
    
    // Get native window handle
    try {
      this.windowHandle = (this as any).unsafeWindowHandle;
    } catch (e) {
      console.warn("[Bunery] Could not get window handle:", e);
    }

    // Apply options after window is created
    if (ext && this.windowHandle) {
      if (options.frameless) {
        ext.symbols.webview_set_frameless(this.windowHandle, true);
      }
      if (options.alwaysOnTop) {
        ext.symbols.webview_set_always_on_top(this.windowHandle, true);
      }
      if (options.fullscreen) {
        ext.symbols.webview_toggle_fullscreen(this.windowHandle);
      }
    }
  }

  setIcon(path: string): void {
    if (!ext || !this.windowHandle) return;
    const absPath = resolve(path);
    ext.symbols.webview_set_icon(this.windowHandle, Buffer.from(absPath + "\0"));
  }

  setMinSize(width: number, height: number): void {
    if (!ext || !this.windowHandle) return;
    ext.symbols.webview_set_min_size(this.windowHandle, width, height);
  }

  setFrameless(frameless: boolean): void {
    if (!ext || !this.windowHandle) return;
    ext.symbols.webview_set_frameless(this.windowHandle, frameless);
  }

  toggleFullscreen(): void {
    if (!ext || !this.windowHandle) return;
    ext.symbols.webview_toggle_fullscreen(this.windowHandle);
  }

  setAlwaysOnTop(alwaysOnTop: boolean): void {
    if (!ext || !this.windowHandle) return;
    ext.symbols.webview_set_always_on_top(this.windowHandle, alwaysOnTop);
  }
}
