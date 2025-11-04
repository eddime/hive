/**
 * 🥐 Bunery Sync Webview Wrapper
 * 
 * Synchronous FFI wrapper for webview - NO top-level await!
 * Enables bytecode caching for 10x faster startup! ⚡
 */

import { dlopen, FFIType, suffix, CFunction, JSCallback } from "bun:ffi";
import { resolve } from "path";

export const SizeHint = {
  NONE: 0,
  MIN: 1,
  MAX: 2,
  FIXED: 3,
} as const;

export type SizeHint = typeof SizeHint[keyof typeof SizeHint];

// Get library path (synchronous!)
function getLibraryPath(): string {
  const libDir = resolve(import.meta.dir, "./native");
  
  if (process.platform === "darwin") {
    return `${libDir}/libwebview.dylib`;
  } else if (process.platform === "win32") {
    return `${libDir}/libwebview.dll`;
  } else {
    return `${libDir}/libwebview-${process.arch}.so`;
  }
}

// Load library synchronously
const lib = dlopen(getLibraryPath(), {
  webview_create: {
    args: [FFIType.i32, FFIType.ptr],
    returns: FFIType.ptr,
  },
  webview_destroy: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  webview_run: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  webview_terminate: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
  webview_set_title: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.void,
  },
  webview_set_size: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32],
    returns: FFIType.void,
  },
  webview_navigate: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.void,
  },
  webview_eval: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.void,
  },
  webview_bind: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.function],
    returns: FFIType.void,
  },
  webview_unbind: {
    args: [FFIType.ptr, FFIType.cstring],
    returns: FFIType.void,
  },
  webview_return: {
    args: [FFIType.ptr, FFIType.cstring, FFIType.i32, FFIType.cstring],
    returns: FFIType.void,
  },
});

interface WebviewOptions {
  width?: number;
  height?: number;
  hint?: SizeHint;
}

export class Webview {
  private handle: number;
  private callbacks = new Map<string, any>();

  constructor(debug: boolean = false, options: WebviewOptions = {}) {
    this.handle = lib.symbols.webview_create(debug ? 1 : 0, null) as number;
    
    if (options.width && options.height) {
      this.size = {
        width: options.width,
        height: options.height,
        hint: options.hint ?? SizeHint.NONE,
      };
    }
  }

  navigate(url: string): void {
    lib.symbols.webview_navigate(this.handle, Buffer.from(url + "\0"));
  }

  run(): void {
    lib.symbols.webview_run(this.handle);
  }

  terminate(): void {
    lib.symbols.webview_terminate(this.handle);
  }

  eval(js: string): void {
    lib.symbols.webview_eval(this.handle, Buffer.from(js + "\0"));
  }

  set title(value: string) {
    lib.symbols.webview_set_title(this.handle, Buffer.from(value + "\0"));
  }

  set size(value: { width: number; height: number; hint: SizeHint }) {
    lib.symbols.webview_set_size(
      this.handle,
      value.width,
      value.height,
      value.hint
    );
  }

  bind(name: string, callback: (...args: any[]) => any): void {
    const cb = new JSCallback(
      (seqPtr: number, reqPtr: number, _arg: number) => {
        const seq = new CString(seqPtr);
        const req = new CString(reqPtr);
        
        try {
          const args = req.toString() ? JSON.parse(req.toString()) : undefined;
          const result = callback(args);
          const resultJson = JSON.stringify(result);
          
          lib.symbols.webview_return(
            this.handle,
            Buffer.from(seq.toString() + "\0"),
            0,
            Buffer.from(resultJson + "\0")
          );
        } catch (error) {
          const errorJson = JSON.stringify({
            error: true,
            message: error instanceof Error ? error.message : String(error),
          });
          
          lib.symbols.webview_return(
            this.handle,
            Buffer.from(seq.toString() + "\0"),
            1,
            Buffer.from(errorJson + "\0")
          );
        }
      },
      {
        args: [FFIType.ptr, FFIType.ptr, FFIType.ptr],
        returns: FFIType.void,
      }
    );

    this.callbacks.set(name, cb);
    lib.symbols.webview_bind(
      this.handle,
      Buffer.from(name + "\0"),
      cb.ptr
    );
  }

  unbind(name: string): void {
    lib.symbols.webview_unbind(this.handle, Buffer.from(name + "\0"));
    this.callbacks.delete(name);
  }
}

// Helper to read C strings
class CString {
  constructor(private ptr: number) {}

  toString(): string {
    if (!this.ptr) return "";
    const bytes: number[] = [];
    let offset = 0;
    
    while (true) {
      const byte = new Uint8Array(new BigUint64Array([BigInt(this.ptr + offset)]).buffer)[0];
      if (byte === 0) break;
      bytes.push(byte);
      offset++;
    }
    
    return new TextDecoder().decode(new Uint8Array(bytes));
  }
}

