// 🐝 Hive Configuration
const isDev = process.env.NODE_ENV !== "production";

export default {
  // Window settings
  window: {
    title: "Hive - Fullstack Desktop App",
    width: 1200,
    height: 720,
    resizable: true,        // Allow window resizing
    fullscreen: false,      // F11 to toggle fullscreen
    startFullscreen: false, // Auto-fullscreen on launch (games, kiosk mode)
    debug: isDev,           // DevTools only in development
  },

  // Development settings
  dev: {
    hmr: true,  // Enable Hot Module Replacement
  },

  // App metadata
  app: {
    name: "hive",
    version: "1.0.0",
    description: "A lightweight fullstack desktop framework with Bun + Webview",
  },

  // Build settings
  build: {
    minify: true,       // Reduce code size
    sourcemap: false,   // Disabled for smaller binaries
    bytecode: false,    // Disabled (webview-bun uses top-level await)
    outdir: "dist",     // Output directory
    outfile: "hive",    // Executable name
    
    // Frontend build mode (asset server = no limits!)
    frontend: {
      assetServer: true,  // Serve assets via HTTP (supports large files, images, audio, etc.)
    },
    
    // Platform-specific settings
    windows: {
      icon: "assets/icon.ico",  // Windows .ico file
      hideConsole: true,        // Hide console window for GUI apps
    },
    macos: {
      icon: "assets/icon.icns", // macOS .icns file (optional)
      createAppBundle: true,    // Create .app bundle (true) or standalone binary (false)
    },
    linux: {
      icon: "assets/icon.png",  // Linux .png file (for desktop entries)
    },
  },
};
