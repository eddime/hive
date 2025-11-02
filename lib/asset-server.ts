// 🥐 Bunery Asset Server - Virtual File System for Games/Large Apps
// Serves embedded assets via HTTP (like Tauri/Neutralino)

export class AssetServer {
  private server: any;
  private port: number = 0;
  // 🚀 OPTIMAL: Store file paths (lazy) + LRU cache (fast repeat access)
  private assetPaths: Map<string, { filePath: string; type: string; size: number }> = new Map();
  private cache: Map<string, { content: Uint8Array; compressed?: Uint8Array; lastUsed: number }> = new Map();
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB cache
  private cacheSize = 0;

  /**
   * Add an asset from file path (LAZY - instant startup!)
   */
  async addAsset(virtualPath: string, source: string | Uint8Array, contentType?: string) {
    if (typeof source === "string" && (source.startsWith("./") || source.startsWith("/"))) {
      // 🚀 LAZY: Just store the path, load on-demand
      const file = Bun.file(source);
      let type = file.type || this.guessContentType(source);
      
      // TypeScript files should be served as JavaScript
      if (source.endsWith('.ts') || source.endsWith('.tsx')) {
        type = 'application/javascript';
      }
      
      this.assetPaths.set(virtualPath, { filePath: source, type, size: file.size || 0 });
    } else {
      // For inline content (rare), cache immediately
      const content = source instanceof Uint8Array ? source : new Uint8Array(source as any);
      const type = contentType || this.guessContentType(virtualPath);
      this.assetPaths.set(virtualPath, { filePath: `inline:${virtualPath}`, type, size: content.length });
      this.cache.set(virtualPath, { content, lastUsed: Date.now() });
      this.cacheSize += content.length;
    }
  }

  /**
   * LRU Cache: Evict oldest items when cache is full
   */
  private evictOldest() {
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => a[1].lastUsed - b[1].lastUsed);
    
    for (const [path, entry] of sorted) {
      if (this.cacheSize <= this.MAX_CACHE_SIZE) break;
      
      const size = entry.content.length + (entry.compressed?.length || 0);
      this.cache.delete(path);
      this.cacheSize -= size;
    }
  }

  /**
   * Load asset into cache (with compression and TypeScript transpilation)
   */
  private async loadIntoCache(virtualPath: string, filePath: string, type: string): Promise<void> {
    const file = Bun.file(filePath);
    let content: Uint8Array;
    
    // 🚀 TYPESCRIPT TRANSPILATION: Convert .ts to .js on-the-fly
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      const transpiler = new Bun.Transpiler({ loader: 'tsx' });
      const code = await transpiler.transform(await file.text());
      content = new TextEncoder().encode(code);
      type = 'application/javascript'; // Override type to JS
    } else {
      content = new Uint8Array(await file.arrayBuffer());
    }
    
    // Compress if applicable
    const compressible = ['text/', 'application/javascript', 'application/json', 'image/svg'];
    let compressed: Uint8Array | undefined;
    
    if (compressible.some(ct => type.includes(ct)) && content.length > 1024) {
      try {
        const gzipped = Bun.gzipSync(content);
        if (gzipped.length < content.length * 0.9) {
          compressed = gzipped;
        }
      } catch (e) {}
    }

    const entrySize = content.length + (compressed?.length || 0);
    this.cacheSize += entrySize;
    this.cache.set(virtualPath, { content, compressed, lastUsed: Date.now() });
    
    // Evict old items if cache is full
    if (this.cacheSize > this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }
  }

  /**
   * Add entire directory recursively (LAZY - stores paths, not content!)
   */
  async addDirectory(dirPath: string, virtualPrefix: string = "/") {
    const glob = new Bun.Glob("**/*");
    const files = await Array.fromAsync(glob.scan({ cwd: dirPath, onlyFiles: true }));

    console.log(`   📂 Scanning ${dirPath}...`);
    
    for (const file of files) {
      const fullPath = `${dirPath}/${file}`;
      const virtualPath = `${virtualPrefix}${file}`.replace(/\/+/g, "/");
      
      const bunFile = Bun.file(fullPath);
      
      try {
        if (await bunFile.exists()) {
          // 🚀 LAZY: Just store the path
          const type = bunFile.type || this.guessContentType(fullPath);
          this.assetPaths.set(virtualPath, { filePath: fullPath, type, size: bunFile.size || 0 });
          console.log(`   ✓ ${virtualPath} (${(bunFile.size / 1024).toFixed(1)} KB)`);
        }
      } catch (e) {
        console.warn(`   ⚠️  Skipped ${file}: ${e}`);
      }
    }
    
    console.log(`   📦 Registered ${this.assetPaths.size} assets (lazy-loaded)`);
  }

  /**
   * Start the asset server
   */
  async start(preferredPort: number = 0): Promise<number> {
    this.server = Bun.serve({
      port: preferredPort,
      // 🚀 NATIVE PERFORMANCE: TCP optimizations
      reusePort: true,
      development: false,
      fetch: async (req) => {
        const url = new URL(req.url);
        // Decode URL to handle filenames with spaces, special chars, etc.
        let path = decodeURIComponent(url.pathname);

        // Default to index.html for root
        if (path === "/" || path === "") {
          path = "/index.html";
        }

        const assetMeta = this.assetPaths.get(path);

        if (assetMeta) {
          const acceptsGzip = req.headers.get("accept-encoding")?.includes("gzip");
          
          // Check cache first
          let cached = this.cache.get(path);
          
          if (cached) {
            // 🚀 CACHE HIT: Instant serve from RAM!
            cached.lastUsed = Date.now();
            
            if (acceptsGzip && cached.compressed) {
              return new Response(cached.compressed, {
                headers: {
                  "Content-Type": assetMeta.type,
                  "Content-Encoding": "gzip",
                  "Cache-Control": "public, max-age=31536000, immutable",
                  "Access-Control-Allow-Origin": "*",
                  "X-Content-Type-Options": "nosniff",
                  "Vary": "Accept-Encoding",
                },
              });
            }
            
            return new Response(cached.content, {
              headers: {
                "Content-Type": assetMeta.type,
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
              },
            });
          }
          
          // 🚀 CACHE MISS: Load into cache
          await this.loadIntoCache(path, assetMeta.filePath, assetMeta.type);
          cached = this.cache.get(path)!;
          
          if (acceptsGzip && cached.compressed) {
            return new Response(cached.compressed, {
              headers: {
                "Content-Type": assetMeta.type,
                "Content-Encoding": "gzip",
                "Cache-Control": "public, max-age=31536000, immutable",
                "Access-Control-Allow-Origin": "*",
                "X-Content-Type-Options": "nosniff",
                "Vary": "Accept-Encoding",
              },
            });
          }
          
          return new Response(cached.content, {
            headers: {
              "Content-Type": assetMeta.type,
              "Cache-Control": "public, max-age=31536000, immutable",
              "Access-Control-Allow-Origin": "*",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }

        // Try with .html extension
        const htmlPath = `${path}.html`;
        const htmlMeta = this.assetPaths.get(htmlPath);
        if (htmlMeta) {
          let cached = this.cache.get(htmlPath);
          if (!cached) {
            await this.loadIntoCache(htmlPath, htmlMeta.filePath, htmlMeta.type);
            cached = this.cache.get(htmlPath)!;
          }
          return new Response(cached.content, {
            headers: {
              "Content-Type": htmlMeta.type,
              "Cache-Control": "no-cache",
            },
          });
        }

        return new Response(`Not Found: ${path}`, { status: 404 });
      },
    });

    this.port = this.server.port;
    return this.port;
  }

  /**
   * Get the server URL (without trailing slash)
   */
  getURL(): string {
    return `http://localhost:${this.port}`;
  }

  /**
   * Stop the server
   */
  stop() {
    if (this.server) {
      this.server.stop();
    }
  }

  /**
   * Guess content type from file extension
   */
  private guessContentType(path: string): string {
    const ext = path.split(".").pop()?.toLowerCase();
    const types: Record<string, string> = {
      html: "text/html",
      css: "text/css",
      js: "application/javascript",
      json: "application/json",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      webp: "image/webp",
      ico: "image/x-icon",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      mp4: "video/mp4",
      webm: "video/webm",
      woff: "font/woff",
      woff2: "font/woff2",
      ttf: "font/ttf",
      txt: "text/plain",
    };
    return types[ext || ""] || "application/octet-stream";
  }
}

