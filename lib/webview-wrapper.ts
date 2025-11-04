/**
 * 🥐 Bunery Webview Wrapper
 * 
 * webview-bun + native extensions for missing features (macOS only)
 * On Windows/Linux: Uses pure webview-bun (no extensions)
 */

import { Webview as WebviewBun, SizeHint } from "webview-bun";
import { dlopen, FFIType } from "bun:ffi";
import { resolve } from "path";

export { SizeHint };

// Load native extensions (check multiple paths for dev vs production)
function loadExtensions() {
  if (process.platform !== "darwin") return null;
  
  const possiblePaths = [
    resolve(import.meta.dir, "../lib/native/libwebview_ext.dylib"), // Dev mode
    resolve(process.execPath, "../libwebview_ext.dylib"), // Production .app bundle
    "./libwebview_ext.dylib", // Relative
  ];
  
  for (const path of possiblePaths) {
    try {
      return dlopen(path, {
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
      continue;
    }
  }
  
  console.warn("[Bunery] libwebview_ext.dylib not found, extended features disabled");
  return null;
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
    
    // Get native window handle (macOS only)
    if (process.platform === "darwin" && ext) {
      try {
        this.windowHandle = (this as any).unsafeWindowHandle;
      } catch (e) {
        // Silent fail - extensions not available
      }

      // Apply options after window is created
      if (this.windowHandle) {
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
