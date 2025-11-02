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
  // Create webview with normal size first
  const webview = new Webview(config.window.debug, {
    width: config.window.width,
    height: config.window.height,
    hint: config.window.resizable ? SizeHint.NONE : SizeHint.FIXED,
  });

  webview.title = config.window.title;

  // Register bindings FIRST (before navigate!)
  registerBindings(webview);
  
  // Build fullscreen script (F11 toggle only, no auto-fullscreen due to browser restrictions)
  const fullscreenScript = `document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`;

  // Check if asset server mode is enabled
  if (htmlPath === "ASSET_SERVER") {
    // FINAL SOLUTION: Background server + setHTML + <base> tag!
    // Server runs in separate process so it can handle requests even when webview.run() blocks!
    
    // Load assets from embedded files
    if (!embeddedAssets || Object.keys(embeddedAssets).length === 0) {
      throw new Error("No embedded assets found! Run 'bun run build:frontend' first.");
    }
    
    // Start AssetServer in background process
    const assetsJSON = JSON.stringify(Object.fromEntries(Object.entries(embeddedAssets)));
    const serverProcess = Bun.spawn(["bun", "run", "lib/asset-server-worker.ts", assetsJSON], {
      stdout: "pipe",
      stderr: "inherit",
    });
    
    // Wait for server to be ready and get URL
    const reader = serverProcess.stdout.getReader();
    let serverURL = "";
    
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      
      const text = new TextDecoder().decode(value);
      const match = text.match(/SERVER_READY:(.+)/);
      if (match) {
        serverURL = match[1].trim();
        break;
      }
    }
    
    if (!serverURL) {
      throw new Error("Failed to start AssetServer!");
    }
    
    const entryPoint = config.build.frontend.entryPoint || "index.html";
    const entryPath = entryPoint.startsWith('/') ? entryPoint : `/${entryPoint}`;
    const baseURL = `${serverURL}${entryPoint.includes('/') ? '/' + entryPoint.substring(0, entryPoint.lastIndexOf('/') + 1) : '/'}`;
    
    // Fetch the HTML
    const html = await fetch(`${serverURL}${entryPath}`).then(r => r.text());
    
    // Inject <base> tag to make ALL relative URLs point to HTTP server!
    const htmlWithBase = html.replace(
      /<head>/i,
      `<head><base href="${baseURL}">`
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
    serverProcess.kill();
    await serverProcess.exited;
    
  } else {
    // Fallback: Embedded mode (if asset server disabled)
    if (!htmlContent) {
      throw new Error("No HTML content found!");
    }

    const finalHTML = htmlContent.replace(
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
