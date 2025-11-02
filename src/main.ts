// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import { htmlContent, htmlPath } from "./embedded-html";
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

  // Build fullscreen script
  const isFullscreen = config.window.startFullscreen;
  const fullscreenScript = isFullscreen
    ? `setTimeout(()=>document.documentElement.requestFullscreen().catch(e=>console.warn('Fullscreen failed:',e)),100);document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`
    : `document.addEventListener('keydown',(e)=>{if(e.key==='F11'){e.preventDefault();document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()}});`;

  // Register bindings first (works for both modes)
  registerBindings(webview);

  // Inject version and fullscreen
  if (!htmlContent) {
    throw new Error("No HTML content found!");
  }

  const finalHTML = htmlContent.replace(
    /<script>/,
    `<script>window.BUN_VERSION="${Bun.version}";${fullscreenScript}`
  );

  // Load HTML based on mode
  if (htmlPath === "EMBEDDED_SERVER") {
    // External mode: Use Data URL to bypass size limits while keeping bindings!
    // Data URLs support much larger content than setHTML()
    const base64Html = btoa(finalHTML); // Bun's native base64 encoding
    const dataUrl = `data:text/html;base64,${base64Html}`;
    webview.navigate(dataUrl);
    
  } else {
    // Embedded mode: Direct HTML injection (< 2MB)
    webview.setHTML(finalHTML);
  }

  // Run webview (blocking - returns when window closes)
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
