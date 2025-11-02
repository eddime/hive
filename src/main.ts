// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath, embeddedAssets } from "./embedded-html";
import config from "../hive.config";
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
    this.assets = new Map();
  }

  async addAsset(virtualPath, source, contentType) {
    let content;
    let type;

    if (typeof source === "string" && (source.startsWith("./") || source.startsWith("/"))) {
      const file = Bun.file(source);
      if (!(await file.exists())) {
        throw new Error(\`Asset not found: \${source}\`);
      }
      content = new Uint8Array(await file.arrayBuffer());
      type = file.type || this.guessContentType(source);
    } else {
      content = source;
      type = contentType || this.guessContentType(virtualPath);
    }

    this.assets.set(virtualPath, { content, type });
  }

  async start(preferredPort = 0) {
    this.server = Bun.serve({
      port: preferredPort,
      // 🚀 NATIVE PERFORMANCE: TCP optimizations
      reusePort: true,
      development: false,
      fetch: (req) => {
        const url = new URL(req.url);
        let path = decodeURIComponent(url.pathname);

        if (path === "/" || path === "") {
          path = "/index.html";
        }

        const asset = this.assets.get(path);

        if (asset) {
          // 🚀 NATIVE PERFORMANCE: Aggressive caching + ETag + compression
          const etag = \`W/"\${path.length}-\${asset.content.length}"\`;
          
          // Check if client has cached version
          if (req.headers.get("if-none-match") === etag) {
            return new Response(null, { status: 304 });
          }
          
          const headers = {
            "Content-Type": asset.type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": etag,
            "Access-Control-Allow-Origin": "*",
            "X-Content-Type-Options": "nosniff",
          };
          
          return new Response(asset.content, { headers });
        }

        const htmlPath = \`\${path}.html\`;
        const htmlAsset = this.assets.get(htmlPath);
        if (htmlAsset) {
          const headers = {
            "Content-Type": htmlAsset.type,
            "Cache-Control": "public, max-age=31536000, immutable",
          };
          
          return new Response(htmlAsset.content, { headers });
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
      batch.map(([path, filePath]) => 
        server.addAsset(path as string, filePath as string)
      )
    );
  }
  
  await server.start(0);
  const url = server.getURL();
  
  self.postMessage({ type: 'ready', url });
  
  self.addEventListener('message', (event) => {
    if (event.data === 'stop') {
      server.stop();
      process.exit(0);
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
          resolve();
        }
      };
    });
    
    const entryPoint = config.build.frontend.entryPoint || "index.html";
    const entryPath = entryPoint.startsWith('/') ? entryPoint : `/${entryPoint}`;
    const baseURL = `${serverURL}${entryPoint.includes('/') ? '/' + entryPoint.substring(0, entryPoint.lastIndexOf('/') + 1) : '/'}`;
    
    // Fetch the HTML
    const html = await fetch(`${serverURL}${entryPath}`).then(r => r.text());
    
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
    
    const htmlWithBase = html.replace(
      /<head>/i,
      `<head><base href="${baseURL}">${faviconTag}${performanceTags}`
    );
    
    if (config.window.debug) {
      console.log(`🌐 Server: ${serverURL}`);
      console.log(`📄 Base: ${baseURL}`);
    }
    
    // Inject JS utilities
    const finalHTML = htmlWithBase.replace(
      /<\/head>/i,
      `<script>${fullscreenScript} window.BUN_VERSION="${Bun.version}";</script></head>`
    );

    // Use setHTML - bindings work!
    webview.setHTML(finalHTML);
    
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
