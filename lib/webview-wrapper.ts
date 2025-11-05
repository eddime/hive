/**
 * 🥐 Bunery Webview Wrapper
 * 
 * Uses bunery-webview fork with integrated extensions and performance optimizations!
 * All features (setIcon, setMinSize, frameless, fullscreen, alwaysOnTop, performance mode)
 * are now built directly into the webview library - no separate extensions needed!
 */

import { Webview as WebviewBun, SizeHint } from "webview-bun";

export { SizeHint };

// Re-export WebviewBun with all integrated features
// (setIcon, setMinSize, setFrameless, toggleFullscreen, setAlwaysOnTop, setPerformanceMode)
export { Webview } from "webview-bun";
