// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath } from "./embedded-html";
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
    // Asset Server Mode: Serve all files via HTTP (no size limits!)
    const server = new AssetServer();
    
    // Load assets from src/frontend directory
    const assetDir = "./src/frontend";
    const indexExists = await Bun.file(`${assetDir}/index.html`).exists();
    
    if (!indexExists) {
      throw new Error("No index.html found in src/frontend/");
    }
    
    await server.addDirectory(assetDir, "/");
    await server.start(0);
    
    const serverURL = server.getURL();
    
    // Fetch HTML and inline all assets (NO HTTP requests from Webview!)
    let html = await fetch(`${serverURL}/index.html`).then(r => r.text());
    
    // Find and inline all CSS files
    const cssMatches = html.matchAll(/<link[^>]*href=["']([^"']+\.css)["'][^>]*>/gi);
    for (const match of cssMatches) {
      const cssPath = match[1].startsWith('/') ? match[1].substring(1) : match[1];
      const cssContent = await fetch(`${serverURL}/${cssPath}`).then(r => r.text());
      html = html.replace(match[0], `<style>${cssContent}</style>`);
    }
    
    // Find and inline all JS/TS files (transpile TS to JS)
    const jsMatches = html.matchAll(/<script[^>]*src=["']([^"']+\.(js|ts))["'][^>]*><\/script>/gi);
    for (const match of jsMatches) {
      const jsPath = match[1].startsWith('/') ? match[1].substring(1) : match[1];
      let jsContent = await fetch(`${serverURL}/${jsPath}`).then(r => r.text());
      
      // Transpile TypeScript to JavaScript if needed
      if (jsPath.endsWith('.ts')) {
        const transpiled = await Bun.build({
          entrypoints: [`./src/frontend/${jsPath}`],
          target: 'browser',
          format: 'esm',
          minify: false,
        });
        
        if (transpiled.success && transpiled.outputs.length > 0) {
          jsContent = await transpiled.outputs[0].text();
        }
      }
      
      const moduleAttr = match[0].includes('type="module"') ? ' type="module"' : '';
      html = html.replace(match[0], `<script${moduleAttr}>${jsContent}</script>`);
    }
    
    console.log("✅ Inlined all CSS and JS assets");
    
    // Inject HTML (preserves bindings!)
    webview.setHTML(html);
    
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
  }

  // Run webview (blocking - returns when window closes)
  webview.run();

  // webview.run() blocks until window is closed
  // No need for process.exit() - process ends naturally
}

// Start immediately
try {
  await main();
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
