// 🐝 Hive Configuration
export default {
  // Window settings
  window: {
    title: "Hive - Fullstack Desktop App",
    width: 900,
    height: 700,
    resizable: true,    // Allow window resizing (enables maximize button)
    fullscreen: false,  // Start in fullscreen mode (F11 to toggle)
    debug: true,        // Enable DevTools/Inspector
  },

  // Server settings
  server: {
    port: 3000,
    cors: true,
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
    sourcemap: true,    // Generate source maps
    bytecode: false,    // Bytecode compilation (experimental, faster startup but incompatible with top-level await)
    outdir: "dist",     // Output directory
    outfile: "hive",    // Executable name
  },
};
