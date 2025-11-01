// 🐝 Hive Main Entry Point
// ⚠️  DON'T EDIT THIS FILE unless you know what you're doing!
// 👉 Edit your app in src/frontend/ and src/backend/

import { Webview, SizeHint } from "webview-bun";
import server, { port, getUsers, createUser, deleteUser } from "./backend/server";
import { htmlContent } from "./embedded-html";
import config from "../hive.config";

// Wrap everything in an async function
async function main() {
  const SERVER_URL = `http://localhost:${port}`;

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log(`🌐 Server running at ${SERVER_URL}`);
  console.log(`📱 Opening webview...`);

  // Inject the API base URL and Bun version into the HTML
  const modifiedHTML = htmlContent.replace(
    /<script>/,
    `<script>
      window.API_BASE_URL = "${SERVER_URL}";
      window.BUN_VERSION = "${Bun.version}";
    `
  );

  // Create webview with config
  const webview = new Webview(config.window.debug, {
    width: config.window.width,
    height: config.window.height,
    hint: config.window.resizable ? SizeHint.NONE : SizeHint.FIXED,
  });

  webview.title = config.window.title;

  // Set fullscreen if configured
  if (config.window.fullscreen) {
    // Note: webview-bun doesn't have direct fullscreen API
    // We inject JavaScript to handle fullscreen via HTML5 Fullscreen API
    console.log("⚠️  Fullscreen mode requested - use F11 to toggle fullscreen");
  }

  // Register bindings (moved to separate module for cleaner code)
  const { registerBindings } = await import("./backend/bindings");
  registerBindings(webview, SERVER_URL, getUsers, createUser, deleteUser);

  // Inject fullscreen toggle capability
  const htmlWithFullscreen = modifiedHTML.replace(
    '</body>',
    `
    <script>
      // F11 for fullscreen toggle
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F11') {
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }
      });
      
      // Auto-fullscreen on load if configured
      if (${config.window.fullscreen}) {
        window.addEventListener('load', () => {
          setTimeout(() => {
            document.documentElement.requestFullscreen().catch(err => {
              console.log('Fullscreen request failed:', err);
            });
          }, 500);
        });
      }
    </script>
    </body>`
  );

  // Use setHTML with fully inlined content
  webview.setHTML(htmlWithFullscreen);
  console.log("✅ HTML set");

  // Run webview (blocks until window is closed)
  webview.run();

  console.log("👋 Webview closed");
  process.exit(0);
}

// Start the application
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
