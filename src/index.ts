// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent } from "./embedded-html";
import config from "../hive.config";
import { registerBindings } from "./backend/bindings";

// Main entry - optimized for speed
function main() {
  // Create webview with normal size first
  const webview = new Webview(config.window.debug, {
    width: config.window.width,
    height: config.window.height,
    hint: config.window.resizable ? SizeHint.NONE : SizeHint.FIXED,
  });

  webview.title = config.window.title;

  // Register bindings before HTML injection
  registerBindings(webview);

  // Build fullscreen script
  const isFullscreen = config.window.startFullscreen;
  const fullscreenScript = isFullscreen
    ? `setTimeout(()=>document.documentElement.requestFullscreen().catch(e=>console.warn('Fullscreen failed:',e)),100);document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`
    : `document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`;

  // Single-pass HTML injection
  const finalHTML = htmlContent.replace(
    /<script>/,
    `<script>window.BUN_VERSION="${Bun.version}";${fullscreenScript}`
  );

  // Set HTML and run (blocking - returns when window closes)
  webview.setHTML(finalHTML);
  webview.run();

  // webview.run() blocks until window is closed
  // No need for process.exit() - process ends naturally
}

// Start immediately
try {
  main();
} catch (error) {
  console.error("Fatal error:", error);
  process.exit(1);
}
