// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath } from "./embedded-html";
import config from "../hive.config";
import { registerBindings } from "./backend/bindings";

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

  // Check if game directory exists
  // Dev: src/frontend/game
  // Prod macOS: ../../../game (relative to binary inside .app/Contents/MacOS/)
  // Prod other: ./game (relative to binary)
  
  const devGameDir = "./src/frontend/game";
  const prodGameDirMac = "../../../game"; // From .app/Contents/MacOS/ to dist/game
  const prodGameDir = "./game";
  
  let gameDir = null;
  if (await Bun.file(`${devGameDir}/index.html`).exists()) {
    gameDir = devGameDir;
    console.log("📂 Dev mode: using src/frontend/game");
  } else if (await Bun.file(`${prodGameDirMac}/index.html`).exists()) {
    gameDir = prodGameDirMac;
    console.log("📂 Prod mode (macOS): using ../../../game");
  } else if (await Bun.file(`${prodGameDir}/index.html`).exists()) {
    gameDir = prodGameDir;
    console.log("📂 Prod mode: using ./game");
  }

  if (gameDir) {
    // Game mode: Pure Bun.serve() + Bun.file() - like Neutralino/Tauri!
    console.log(`🎮 Starting game server (${gameDir})...`);
    
    const server = Bun.serve({
      port: 0,
      async fetch(req) {
        const url = new URL(req.url);
        let path = url.pathname === "/" ? "/index.html" : url.pathname;
        
        // Serve with Bun.file() - auto content-type!
        const file = Bun.file(gameDir + path);
        if (await file.exists()) {
          return new Response(file);
        }
        
        return new Response("Not Found", { status: 404 });
      },
    });
    
    registerBindings(webview);
    
    console.log(`🌐 Game at http://localhost:${server.port}`);
    webview.navigate(`http://localhost:${server.port}`);
    
  } else {
    // Normal app mode
    if (!htmlContent) {
      throw new Error("No HTML content found! Make sure to run 'bun run build:frontend' first.");
    }
    
    registerBindings(webview);

    const finalHTML = htmlContent.replace(
      /<script>/,
      `<script>window.BUN_VERSION="${Bun.version}";${fullscreenScript}`
    );

    // Load HTML based on mode
    if (htmlPath === "EMBEDDED_SERVER") {
      // External mode: Use Data URL to bypass size limits while keeping bindings!
      const base64Html = btoa(finalHTML);
      const dataUrl = `data:text/html;base64,${base64Html}`;
      webview.navigate(dataUrl);
    } else {
      // Embedded mode: Direct HTML injection (< 2MB)
      webview.setHTML(finalHTML);
    }
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
