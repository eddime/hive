// 🐝 Hive Development Script with File Watching
import { watch } from "fs";
import { spawn } from "bun";
import config from "../hive.config";

console.log(`🐝 Starting ${config.app.name} in development mode...`);
console.log(`🔥 Hot Reload: ${config.dev.hmr ? "ENABLED" : "DISABLED"}\n`);

let appProcess: ReturnType<typeof spawn> | null = null;
let isRebuilding = false;

async function buildFrontend() {
  console.log("📦 Building frontend...");
  const build = spawn(["bun", "run", "scripts/build-frontend.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  await build.exited;
}

function startApp() {
  if (appProcess) {
    console.log("🔄 Restarting app...");
    appProcess.kill();
  }
  
  appProcess = spawn(["bun", "run", "src/index.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  });
  
  // Listen for app exit (when window is closed)
  appProcess.exited.then((exitCode) => {
    if (!isRebuilding && exitCode === 0) {
      console.log("\n👋 App closed. Shutting down dev server...");
      process.exit(0);
    }
  });
  
  console.log("✅ App started\n");
}

async function rebuild() {
  if (isRebuilding) return;
  isRebuilding = true;
  
  console.log("\n🔄 Change detected, rebuilding...");
  await buildFrontend();
  startApp();
  
  isRebuilding = false;
}

// Initial build and start
await buildFrontend();
startApp();

// Watch frontend files
if (config.dev.hmr) {
  console.log("👀 Watching for changes in src/frontend/...\n");
  
  watch("src/frontend", { recursive: true }, (event, filename) => {
    if (filename && (filename.endsWith('.ts') || filename.endsWith('.html') || filename.endsWith('.css'))) {
      console.log(`📝 ${event}: ${filename}`);
      rebuild();
    }
  });
  
  // Also watch backend files for changes
  watch("src/backend", { recursive: true }, (event, filename) => {
    if (filename && filename.endsWith('.ts')) {
      console.log(`📝 ${event}: ${filename}`);
      startApp(); // Just restart, no need to rebuild frontend
    }
  });
}

// Handle Ctrl+C gracefully
process.on("SIGINT", () => {
  console.log("\n\n👋 Shutting down...");
  if (appProcess) {
    appProcess.kill();
  }
  process.exit(0);
});

