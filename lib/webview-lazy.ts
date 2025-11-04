/**
 * 🥐 Bunery Lazy Webview Loader
 * 
 * Lazy-loads webview-bun to avoid top-level await
 * Enables bytecode caching for faster startup!
 */

import type { Webview as WebviewType, SizeHint as SizeHintType } from "webview-bun";

// Re-export SizeHint enum values
export const SizeHint = {
  NONE: 0,
  MIN: 1,
  MAX: 2,
  FIXED: 3,
} as const;

export type SizeHint = typeof SizeHint[keyof typeof SizeHint];

// Lazy-loaded module
let webviewModule: typeof import("webview-bun") | null = null;

async function loadWebviewModule() {
  if (!webviewModule) {
    webviewModule = await import("webview-bun");
  }
  return webviewModule;
}

/**
 * Webview class with lazy loading
 */
export class Webview {
  private instance: WebviewType | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(
    private debug: boolean = false,
    private options: {
      width?: number;
      height?: number;
      hint?: SizeHint;
    } = {}
  ) {
    // Don't initialize here - do it lazily
  }

  private async ensureInitialized(): Promise<void> {
    if (this.instance) return;
    
    if (!this.initPromise) {
      this.initPromise = (async () => {
        const mod = await loadWebviewModule();
        this.instance = new mod.Webview(this.debug, this.options);
      })();
    }
    
    await this.initPromise;
  }

  // Proxy all methods with lazy initialization
  async navigate(url: string): Promise<void> {
    await this.ensureInitialized();
    return this.instance!.navigate(url);
  }

  async run(): Promise<void> {
    await this.ensureInitialized();
    return this.instance!.run();
  }

  bind(name: string, callback: (...args: any[]) => any): void {
    // This needs to be sync, so we initialize synchronously if needed
    if (!this.instance) {
      throw new Error("Webview not initialized. Call navigate() or run() first.");
    }
    return this.instance.bind(name, callback);
  }

  async eval(js: string): Promise<void> {
    await this.ensureInitialized();
    return this.instance!.eval(js);
  }

  set title(value: string) {
    if (!this.instance) {
      throw new Error("Webview not initialized. Call navigate() or run() first.");
    }
    this.instance.title = value;
  }

  get title(): string {
    if (!this.instance) {
      throw new Error("Webview not initialized. Call navigate() or run() first.");
    }
    return this.instance.title;
  }

  set size(value: { width: number; height: number; hint: SizeHint }) {
    if (!this.instance) {
      throw new Error("Webview not initialized. Call navigate() or run() first.");
    }
    this.instance.size = value;
  }

  get size(): { width: number; height: number; hint: SizeHint } {
    if (!this.instance) {
      throw new Error("Webview not initialized. Call navigate() or run() first.");
    }
    return this.instance.size;
  }

  unbind(name: string): void {
    if (!this.instance) return;
    return this.instance.unbind(name);
  }

  terminate(): void {
    if (!this.instance) return;
    return this.instance.terminate();
  }
}

