/**
 * Direct bunery-webview test without full Bunery
 */

import { Webview, SizeHint } from "./lib/webview-wrapper";

console.log("🥐 Testing bunery-webview directly...");

try {
  const webview = new Webview(true, {
    width: 800,
    height: 600,
    hint: SizeHint.NONE,
  });

  console.log("✅ Webview created!");

  webview.title = "Bunery Test";
  console.log("✅ Title set!");

  webview.setHTML(`
    <html>
      <body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh; font-family:system-ui; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:white;">
        <div style="text-align:center;">
          <h1>🥐 bunery-webview works!</h1>
          <p>High-performance webview for Bunery</p>
        </div>
      </body>
    </html>
  `);

  console.log("✅ HTML set!");
  console.log("🚀 Running event loop...");

  webview.run();
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}

