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

  // Build fullscreen script
  const isFullscreen = config.window.startFullscreen;
  const fullscreenScript = isFullscreen
    ? `setTimeout(()=>document.documentElement.requestFullscreen().catch(e=>console.warn('Fullscreen failed:',e)),100);document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`
    : `document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`;

  // Register bindings
  registerBindings(webview);

  // Check if asset server mode is enabled
  if (htmlPath === "ASSET_SERVER") {
    // Asset Server Mode: Serve embedded assets via HTTP (no size limits!)
    const server = new AssetServer();
    
    // Load assets from embedded files (bundled in binary)
    if (!embeddedAssets || Object.keys(embeddedAssets).length === 0) {
      throw new Error("No embedded assets found! Run 'bun run build:frontend' first.");
    }
    
    // Add all embedded assets in PARALLEL (much faster!)
    const assetEntries = Object.entries(embeddedAssets);
    await Promise.all(
      assetEntries.map(([path, filePath]) => server.addAsset(path, filePath))
    );
    
    await server.start(0);
    const serverURL = server.getURL();
    
    // Fetch HTML
    let html = await fetch(`${serverURL}/index.html`).then(r => r.text());
    
    // Find all CSS and JS/TS files FIRST (avoid regex in loop)
    const cssMatches = Array.from(html.matchAll(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi));
    const jsMatches = Array.from(html.matchAll(/<script[^>]*src=["']([^"']+\.(js|ts))["'][^>]*><\/script>/gi));
    
    // Fetch all CSS files in PARALLEL
    const cssContents = await Promise.all(
      cssMatches.map(match => {
        const cssPath = match[1].startsWith('/') ? match[1].substring(1) : match[1];
        return fetch(`${serverURL}/${cssPath}`).then(r => r.text());
      })
    );
    
    // Replace CSS files with inlined styles
    cssMatches.forEach((match, i) => {
      html = html.replace(match[0], `<style>${cssContents[i]}</style>`);
    });
    
    // Create single transpiler instance (reuse for all files)
    const transpiler = new Bun.Transpiler({
      loader: 'ts',
      target: 'browser',
    });
    
    // Fetch all JS/TS files in PARALLEL
    const jsContents = await Promise.all(
      jsMatches.map(async (match) => {
        const jsPath = match[1].startsWith('/') ? match[1].substring(1) : match[1];
        let jsContent = await fetch(`${serverURL}/${jsPath}`).then(r => r.text());
        
        // Transpile TypeScript if needed
        if (jsPath.endsWith('.ts')) {
          jsContent = transpiler.transformSync(jsContent);
        }
        
        return jsContent;
      })
    );
    
    // Replace JS/TS files with inlined scripts
    jsMatches.forEach((match, i) => {
      const moduleAttr = match[0].includes('type="module"') ? ' type="module"' : '';
      html = html.replace(match[0], `<script${moduleAttr}>${jsContents[i]}</script>`);
    });
    
    // Inject HTML (preserves bindings!)
    webview.setHTML(html);
    
    // Run webview (blocking - returns when window closes)
    webview.run();
    
    // Clean up: Stop asset server after webview closes
    server.stop();
    
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
