// Fix webview library path for compiled executables
// This must be imported BEFORE webview-bun

import { resolve, dirname } from "path";

// On Windows, webview-bun looks for the DLL relative to node_modules
// In a compiled binary, we need to tell it to look in the exe directory
if (process.platform === "win32" && typeof Bun.main !== "undefined") {
  // Get the directory where the executable is located
  const exeDir = dirname(process.execPath);
  const dllPath = resolve(exeDir, "libwebview.dll");
  
  // Set environment variable for webview-bun to find the DLL
  process.env.WEBVIEW_PATH = dllPath;
  
  if (process.env.DEBUG) {
    console.log(`🔧 Set WEBVIEW_PATH to: ${dllPath}`);
  }
}

