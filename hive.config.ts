// 🐝 Hive Configuration
const isDev = process.env.NODE_ENV !== "production";

export default {
  // Window settings
  window: {
    title: "Candy Catch - Hive",
    width: 1280,
    height: 720,
    resizable: true,        // Allow window resizing
    fullscreen: false,      // F11 to toggle fullscreen
    startFullscreen: false,  // Auto-fullscreen on launch (games, kiosk mode)
    debug: true,            // Enable debug logs (set to false for production)
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
    strip: true,        // Strip debug symbols (smaller binary, ~30% size reduction)
    outdir: "dist",     // Output directory
    outfile: "hive",    // Executable name
    
    // Frontend build mode
    frontend: {
      // Asset server: Embeds all files in binary, serves via HTTP at runtime
      // NO SIZE LIMITS! Works in dev AND production! 🚀
      assetServer: true,
      entryPoint: "index.html",  // Entry HTML file (Phaser Candy Catch game)
    },
    
    // Platform-specific settings
    windows: {
      icon: "assets/icon.ico",  // Windows .ico file
      hideConsole: true,        // Hide console window for GUI apps
    },
    macos: {
      icon: "assets/icon.icns", // macOS .icns file (optional)
      createAppBundle: true,    // Create .app bundle (true) or standalone binary (false)
      codesign: {
        enabled: false,         // Enable code signing (requires Apple Developer ID)
        identity: "",           // Your signing identity (e.g., "Developer ID Application: Your Name (XXXXXXXXXX)")
        entitlements: "entitlements.plist", // Path to entitlements file (for JIT support)
      },
    },
    linux: {
      icon: "assets/icon.png",  // Linux .png file (for desktop entries)
    },
  },
};
