// 🥐 Bunery Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

// IMPORTANT: Fix webview DLL path before importing webview-bun
import "./fix-webview-path";

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath, embeddedAssets } from "./embedded-html";
import config from "../bunery.config";
import { registerBindings } from "./backend/bindings";
import { AssetServer } from "../lib/asset-server";

// Main entry - optimized for speed
async function main() {
  // 🚀 PERFORMANCE: Load icon in parallel with webview creation
  const iconPromise = (async () => {
    try {
      const iconPath = process.platform === "darwin" ? "assets/icon.png" : 
                       process.platform === "win32" ? "assets/icon.ico" : 
                       "assets/icon.png";
      const iconFile = Bun.file(iconPath);
      if (await iconFile.exists()) {
        const iconBuffer = await iconFile.arrayBuffer();
        return Buffer.from(iconBuffer).toString('base64');
      }
    } catch (e) {
      // Icon not found, skip
    }
    return "";
  })();

  // Create webview (parallel with icon loading)
  const webview = new Webview(config.window.debug, {
    width: config.window.width,
    height: config.window.height,
    hint: config.window.resizable ? SizeHint.NONE : SizeHint.FIXED,
  });

  webview.title = config.window.title;

  // Register bindings FIRST (before navigate!)
  registerBindings(webview);
  
  // Test binding to verify bindings work
  if (config.window.debug) {
    webview.bind("__test", (args: string) => {
      console.log("🔧 Test binding called with:", args);
      return JSON.stringify({ success: true, echo: args });
    });
  }

  // Wait for icon to finish loading
  const faviconBase64 = await iconPromise;

  // Build fullscreen script (F11 toggle only, no auto-fullscreen due to browser restrictions)
  const fullscreenScript = `document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`;

  // Check if asset server mode is enabled
  if (htmlPath === "ASSET_SERVER") {
    // FINAL SOLUTION: Background AssetServer (via Worker) + setHTML + <base> tag!
    // Worker runs in separate thread so server can handle requests even when webview.run() blocks!
    
    // Load assets from embedded files
    if (!embeddedAssets || Object.keys(embeddedAssets).length === 0) {
      throw new Error("No embedded assets found! Run 'bun run build:frontend' first.");
    }
    
    if (config.window.debug) {
      console.log(`📦 Embedded assets: ${Object.keys(embeddedAssets).length} files`);
      console.log(`📝 Assets:`, Object.keys(embeddedAssets).join(", "));
    }
    
    // Create worker code (works in both dev and production!)
    // Import AssetServer in main thread and pass the class to worker
    const assetsJSON = JSON.stringify(Object.fromEntries(Object.entries(embeddedAssets)));
    
    // Inline AssetServer code (embedded at compile time)
    const workerCode = `
// AssetServer class embedded directly
class AssetServer {
  constructor() {
    this.server = null;
    this.port = 0;
    // 🚀 OPTIMAL: Lazy loading + LRU cache (50MB)
    this.assetPaths = new Map();
    this.cache = new Map();
    this.MAX_CACHE_SIZE = 50 * 1024 * 1024;
    this.cacheSize = 0;
  }

  async addAsset(virtualPath, source, contentType) {
    if (typeof source === "string" && (source.startsWith("./") || source.startsWith("/"))) {
      // 🚀 LAZY: Just store the path
      const file = Bun.file(source);
      let type = file.type || this.guessContentType(source);
      
      // TypeScript files should be served as JavaScript
      if (source.endsWith('.ts') || source.endsWith('.tsx')) {
        type = 'application/javascript';
      }
      
      this.assetPaths.set(virtualPath, { filePath: source, type, size: file.size || 0 });
    } else {
      // For inline content, cache immediately
      const content = source instanceof Uint8Array ? source : new Uint8Array(source);
      const type = contentType || this.guessContentType(virtualPath);
      this.assetPaths.set(virtualPath, { filePath: \`inline:\${virtualPath}\`, type, size: content.length });
      this.cache.set(virtualPath, { content, lastUsed: Date.now() });
      this.cacheSize += content.length;
    }
  }

  evictOldest() {
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    for (const [path, entry] of sorted) {
      if (this.cacheSize <= this.MAX_CACHE_SIZE) break;
      const size = entry.content.length + (entry.compressed?.length || 0);
      this.cache.delete(path);
      this.cacheSize -= size;
    }
  }

  async loadIntoCache(virtualPath, filePath, type) {
    const file = Bun.file(filePath);
    let content;
    
    // 🚀 TYPESCRIPT TRANSPILATION: Convert .ts to .js on-the-fly
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const transpiler = new Bun.Transpiler({ loader: 'tsx' });
      const code = await transpiler.transform(await file.text());
      content = new TextEncoder().encode(code);
    } else {
      content = new Uint8Array(await file.arrayBuffer());
    }
    
    const compressible = ['text/', 'application/javascript', 'application/json', 'image/svg'];
    let compressed;
    
    if (compressible.some(ct => type.includes(ct)) && content.length > 1024) {
      try {
        const gzipped = Bun.gzipSync(content);
        if (gzipped.length < content.length * 0.9) compressed = gzipped;
      } catch (e) {}
    }

    const entrySize = content.length + (compressed?.length || 0);
    this.cacheSize += entrySize;
    this.cache.set(virtualPath, { content, compressed, lastUsed: Date.now() });
    
    if (this.cacheSize > this.MAX_CACHE_SIZE) this.evictOldest();
  }

  async start(preferredPort = 0) {
    this.server = Bun.serve({
      port: preferredPort,
      // 🚀 NATIVE PERFORMANCE: TCP optimizations
      reusePort: true,
      development: false,
      fetch: async (req) => {
        const url = new URL(req.url);
        let path = decodeURIComponent(url.pathname);

        if (path === "/" || path === "") {
          path = "/index.html";
        }

        const assetMeta = this.assetPaths.get(path);

        if (assetMeta) {
          const acceptsGzip = req.headers.get("accept-encoding")?.includes("gzip");
          let cached = this.cache.get(path);
          
          if (cached) {
            // 🚀 CACHE HIT!
            cached.lastUsed = Date.now();
            if (acceptsGzip && cached.compressed) {
              return new Response(cached.compressed, {
                headers: {
                  "Content-Type": assetMeta.type,
                  "Content-Encoding": "gzip",
                  "Cache-Control": "public, max-age=31536000, immutable",
                  "Access-Control-Allow-Origin": "*",
                  "X-Content-Type-Options": "nosniff",
                  "Vary": "Accept-Encoding",
                },
              });
            }
            return new Response(cached.content, {
              headers: {
                "Content-Type": assetMeta.type,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
          
          // 🚀 CACHE MISS: Load now
          await this.loadIntoCache(path, assetMeta.filePath, assetMeta.type);
          cached = this.cache.get(path);
          
          if (acceptsGzip && cached.compressed) {
            return new Response(cached.compressed, {
              headers: {
                "Content-Type": assetMeta.type,
                "Content-Encoding": "gzip",
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
                "Vary": "Accept-Encoding",
              },
            });
          }
          
          return new Response(cached.content, {
            headers: {
              "Content-Type": assetMeta.type,
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }

        const htmlPath = \`\${path}.html\`;
        const htmlMeta = this.assetPaths.get(htmlPath);
        if (htmlMeta) {
          let cached = this.cache.get(htmlPath);
          if (!cached) {
            await this.loadIntoCache(htmlPath, htmlMeta.filePath, htmlMeta.type);
            cached = this.cache.get(htmlPath);
          }
          return new Response(cached.content, {
            headers: {
              "Content-Type": htmlMeta.type,
              "Cache-Control": "no-cache",
            },
          });
        }

        return new Response(\`Not Found: \${path}\`, { status: 404 });
      },
    });

    this.port = this.server.port;
    return this.port;
  }

  getURL() {
    return \`http://localhost:\${this.port}\`;
  }

  stop() {
    if (this.server) {
      this.server.stop();
    }
  }

  guessContentType(path) {
    const ext = path.split(".").pop()?.toLowerCase();
    const types = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      ts: "application/javascript",     // TypeScript served as JavaScript
      tsx: "application/javascript",    // TSX served as JavaScript
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      ico: "image/x-icon",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      mp4: "video/mp4",
      webm: "video/webm",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      otf: "font/otf",
      wasm: "application/wasm",
      txt: "text/plain",
    };
    return types[ext || ""] || "application/octet-stream";
  }
}

declare var self: Worker;

const assets = JSON.parse('${assetsJSON.replace(/'/g, "\\'")}');
const server = new AssetServer();

(async () => {
  // 🚀 PERFORMANCE: Load all assets in parallel!
  const assetEntries = Object.entries(assets);
  const BATCH_SIZE = 50; // Process 50 assets at a time
  
  for (let i = 0; i < assetEntries.length; i += BATCH_SIZE) {
    const batch = assetEntries.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(([path, dataUrl]) => {
        // Decode base64 data URL: "data:base64,<base64string>"
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:base64,')) {
          const base64Data = dataUrl.substring('data:base64,'.length);
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          return server.addAsset(path as string, bytes);
        } else {
          // Legacy: file path (for dev mode)
          return server.addAsset(path as string, dataUrl as string);
        }
      })
    );
  }
  
  await server.start(0);
  const url = server.getURL();
  
  self.postMessage({ type: 'ready', url });
  
  self.addEventListener('message', (event) => {
    if (event.data === 'stop') {
      server.stop();
      process.exit(0);
    } else if (event.data.type === 'injectHTML') {
      // Replace HTML content for game mode
      const path = event.data.path;
      const modifiedHTML = event.data.html;
      const bytes = new TextEncoder().encode(modifiedHTML);
      
      // Update cache directly
      server.cache.set(path, {
        content: bytes,
        lastUsed: Date.now()
      });
      
      console.log('✅ HTML injected:', path, bytes.length, 'bytes');
      self.postMessage({ type: 'htmlInjected', path });
    }
  });
})();
    `;
    
    // Create blob URL and worker
    const blob = new Blob([workerCode], { type: "application/typescript" });
    const workerURL = URL.createObjectURL(blob);
    const worker = new Worker(workerURL);
    
    // Wait for worker to be ready and get URL
    let serverURL = "";
    await new Promise<void>((resolve) => {
      worker.onmessage = (event) => {
        if (event.data.type === 'ready') {
          serverURL = event.data.url;
          if (config.window.debug) {
            console.log(`🌐 Asset Server ready: ${serverURL}`);
          }
          resolve();
        }
      };
    });
    
    const entryPoint = config.build.frontend.entryPoint || "index.html";
    const entryPath = entryPoint.startsWith('/') ? entryPoint : `/${entryPoint}`;
    const baseURL = `${serverURL}${entryPoint.includes('/') ? '/' + entryPoint.substring(0, entryPoint.lastIndexOf('/') + 1) : '/'}`;
    
    if (config.window.debug) {
      console.log(`📄 Entry point: ${entryPath}`);
      console.log(`🔗 Base URL: ${baseURL}`);
      console.log(`🌐 Fetching HTML from: ${serverURL}${entryPath}`);
    }
    
    // Fetch the HTML
    const html = await fetch(`${serverURL}${entryPath}`).then(r => r.text());
    
    if (config.window.debug) {
      console.log(`✅ HTML fetched: ${html.length} bytes`);
      console.log(`📝 HTML preview: ${html.substring(0, 200)}...`);
    }
    
    // Inject <base> tag and favicon to make ALL relative URLs point to HTTP server!
    const faviconTag = faviconBase64 ? `<link rel="icon" type="image/png" href="data:image/png;base64,${faviconBase64}">` : '';
    
    // 🚀 NATIVE PERFORMANCE: Inject performance optimizations
    const performanceScript = `
      <script>
        // GPU acceleration & passive listeners
        (function() {
          // Force GPU compositing on body
          document.addEventListener('DOMContentLoaded', () => {
            document.body.style.transform = 'translateZ(0)';
            document.body.style.backfaceVisibility = 'hidden';
          });
          
          // 🔇 MACOS FIX: Prevent system beep sounds on keypress
          // See: https://github.com/tauri-apps/wry/issues/799
          document.addEventListener('keydown', (e) => {
            // Prevent beep for all keys except when typing in input/textarea
            const target = e.target;
            if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
              return; // Allow normal behavior in text inputs
            }
            // For all other elements, prevent default to avoid beep
            if (!e.metaKey && !e.ctrlKey && !e.altKey) {
              // Only prevent for non-modifier keys
              const allowedKeys = ['Tab', 'Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'F11'];
              if (!allowedKeys.includes(e.key)) {
                e.preventDefault();
              }
            }
          }, true); // Use capture phase to catch all events
          
          // Override addEventListener to use passive listeners by default
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (typeof options === 'boolean') {
              options = { capture: options, passive: true };
            } else if (typeof options === 'object' && options !== null) {
              options.passive = options.passive !== false;
            } else {
              options = { passive: true };
            }
            return originalAddEventListener.call(this, type, listener, options);
          };
          
          // Optimize requestAnimationFrame
          if (window.requestAnimationFrame) {
            const raf = window.requestAnimationFrame;
            window.requestAnimationFrame = (callback) => {
              return raf(() => {
                try { callback(performance.now()); } catch(e) { console.error(e); }
              });
            };
          }
        })();
      </script>
    `.trim();
    
    // 🚀 NATIVE PERFORMANCE: Meta tags for hardware acceleration
    const performanceTags = `
      <meta name="renderer" content="webkit">
      <meta name="force-rendering" content="webkit">
      <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
      <style>
        * { 
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      </style>
      ${performanceScript}
    `.trim();
    
    // Test bindings in debug mode
    const bindingTestScript = config.window.debug ? `
      <script>
        // Test if bindings are available
        window.addEventListener('DOMContentLoaded', () => {
          console.log('🔍 Testing bindings...');
          console.log('📦 Window object keys:', Object.keys(window).filter(k => k.startsWith('__')));
          
          // Test if __test binding exists
          if (typeof window.__test === 'function') {
            window.__test('hello').then(result => {
              console.log('✅ Test binding works!', result);
            }).catch(err => {
              console.error('❌ Test binding failed:', err);
            });
          } else {
            console.error('❌ __test binding not found!');
          }
          
          // Test counter bindings
          if (typeof window.__getCounter === 'function') {
            console.log('✅ __getCounter found');
          } else {
            console.error('❌ __getCounter not found!');
          }
        });
      </script>
    ` : '';
    
    const htmlWithBase = html.replace(
      /<head>/i,
      `<head><base href="${baseURL}">${faviconTag}${performanceTags}${bindingTestScript}`
    );
    
    if (config.window.debug) {
      console.log(`🌐 Server: ${serverURL}`);
      console.log(`📄 Base: ${baseURL}`);
    }
    
    // Prevent reload from breaking the app (causes white screen)
    const reloadPreventionScript = `
      // Warn about reload
      window.addEventListener('contextmenu', (e) => {
        console.warn('⚠️  Right-click reload will cause white screen. Restart dev server instead.');
      });
      
      // Block F5 and Ctrl+R reload
      window.addEventListener('keydown', (e) => {
        if ((e.key === 'F5') || (e.ctrlKey && e.key === 'r') || (e.metaKey && e.key === 'r')) {
          e.preventDefault();
          console.error('❌ Reload blocked! Asset server cannot be reloaded.');
          console.log('💡 To reload: Stop app (Ctrl+C) and run: bun dev');
          alert('⚠️ Reload disabled\\n\\nAsset server cannot be reloaded.\\n\\nTo see changes:\\n• Stop app (Ctrl+C)\\n• Run: bun dev');
        }
      });
    `.trim();
    
    // Inject JS utilities
    const finalHTML = htmlWithBase.replace(
      /<\/head>/i,
      `<script>${fullscreenScript} window.BUN_VERSION="${Bun.version}"; ${reloadPreventionScript}</script></head>`
    );

    // CRITICAL: Use navigate() for WebGL/WASM/localStorage support
    // setHTML() uses 'about:blank' origin which has security restrictions
    // navigate() uses 'http://localhost' origin which is a proper origin
    console.log("🎮 Using navigate() for proper HTTP origin (required for WebGL on Windows)");
    
    // Inject modified HTML into asset server cache FIRST
    worker.postMessage({
      type: 'injectHTML',
      path: entryPath,
      html: finalHTML
    });
    
    // Wait for HTML injection confirmation
    await new Promise<void>((resolve) => {
      const handler = (event: MessageEvent) => {
        if (event.data.type === 'htmlInjected' && event.data.path === entryPath) {
          worker.removeEventListener('message', handler);
          resolve();
        }
      };
      worker.addEventListener('message', handler);
    });
    
    console.log(`📍 Navigating to: ${serverURL}${entryPath}`);
    
    // Navigate to the HTTP URL (proper origin = WebGL works!)
    webview.navigate(`${serverURL}${entryPath}`);
    
    // Run webview (blocking - returns when window closes)
    webview.run();
    
    // Clean up
    worker.postMessage('stop');
    worker.terminate();
    
  } else {
    // Fallback: Embedded mode (if asset server disabled)
    if (!htmlContent) {
      throw new Error("No HTML content found!");
    }

    const faviconTag = faviconBase64 ? `<link rel="icon" type="image/png" href="data:image/png;base64,${faviconBase64}">` : '';
    let finalHTML = htmlContent.replace(
      /<head>/i,
      `<head>${faviconTag}`
    );
    finalHTML = finalHTML.replace(
    /<script>/,
    `<script>window.BUN_VERSION="${Bun.version}";${fullscreenScript}`
  );

  webview.setHTML(finalHTML);
    
    // Run webview (blocking - returns when window closes)
  webview.run();
  }

  // webview.run() blocks until window is closed
  // Process ends naturally after this
}

// Start immediately
try {
  await main();
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
