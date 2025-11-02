// 🐝 Asset Server Worker - Runs in background process
// This allows the server to handle requests even when webview.run() blocks!

import { AssetServer } from "./asset-server";

// Parse command line args
const assetsJSON = process.argv[2];
if (!assetsJSON) {
  console.error("❌ No assets provided!");
  process.exit(1);
}

const assets = JSON.parse(assetsJSON);

// Start server
const server = new AssetServer();

(async () => {
  // Add all assets
  for (const [path, filePath] of Object.entries(assets)) {
    await server.addAsset(path, filePath as string);
  }

  // Start server on random port
  const port = await server.start(0);
  const url = server.getURL();

  // Send URL back to parent via stdout
  console.log(`SERVER_READY:${url}`);

  // Keep process alive
  process.on("SIGTERM", () => {
    server.stop();
    process.exit(0);
  });
})();

