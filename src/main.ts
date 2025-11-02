// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath } from "./embedded-html";
import config from "../hive.config";
import { registerBindings } from "./backend/bindings";
import { GameServer } from "../lib/game-server";
import { existsSync } from "fs";

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
  const gameDir = "./src/frontend/game";
  const hasGame = existsSync(gameDir);

  if (hasGame) {
    // Game mode: Serve game via embedded HTTP server
    console.log("🎮 Starting game server...");
    const gameServer = new GameServer();
    await gameServer.loadAssets(gameDir);
    await gameServer.start(0);
    
    // Register bindings (even though game might not use them)
    registerBindings(webview);
    
    console.log(`🌐 Game server running at ${gameServer.getURL()}`);
    
    // Navigate directly to game
    webview.navigate(gameServer.getURL());
    
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
