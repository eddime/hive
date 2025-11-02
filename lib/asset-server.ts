// 🐝 Hive Asset Server - Virtual File System for Games/Large Apps
// Serves embedded assets via HTTP (like Tauri/Neutralino)

export class AssetServer {
  private server: any;
  private port: number = 0;
  private assets: Map<string, { content: string | Uint8Array; type: string }> = new Map();

  /**
   * Add an asset from file path or content
   */
  async addAsset(virtualPath: string, source: string | Uint8Array, contentType?: string) {
    let content: string | Uint8Array;
    let type: string;

    if (typeof source === "string" && (source.startsWith("./") || source.startsWith("/"))) {
      // Load from file
      const file = Bun.file(source);
      if (!(await file.exists())) {
        throw new Error(`Asset not found: ${source}`);
      }
      content = new Uint8Array(await file.arrayBuffer());
      type = file.type || this.guessContentType(source);
    } else {
      // Use provided content
      content = source;
      type = contentType || this.guessContentType(virtualPath);
    }

    this.assets.set(virtualPath, { content, type });
  }

  /**
   * Add entire directory recursively
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
          // Read as binary to preserve images/audio/etc
          const content = new Uint8Array(await bunFile.arrayBuffer());
          const type = bunFile.type || this.guessContentType(fullPath);
          
          this.assets.set(virtualPath, { content, type });
          console.log(`   ✓ ${virtualPath} (${(bunFile.size / 1024).toFixed(1)} KB)`);
        }
      } catch (e) {
        console.warn(`   ⚠️  Skipped ${file}: ${e}`);
      }
    }
    
    console.log(`   📦 Loaded ${this.assets.size} assets`);
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
      fetch: (req) => {
        const url = new URL(req.url);
        // Decode URL to handle filenames with spaces, special chars, etc.
        let path = decodeURIComponent(url.pathname);

        // Default to index.html for root
        if (path === "/" || path === "") {
          path = "/index.html";
        }

        const asset = this.assets.get(path);

        if (asset) {
          // 🚀 NATIVE PERFORMANCE: ETag caching + compression
          const etag = `W/"${path.length}-${asset.content.length}"`;
          
          // Check if client has cached version
          if (req.headers.get("if-none-match") === etag) {
            return new Response(null, { status: 304 });
          }
          
          return new Response(asset.content, {
            headers: {
              "Content-Type": asset.type,
              "Cache-Control": "public, max-age=31536000, immutable",
              "ETag": etag,
              "Access-Control-Allow-Origin": "*",
              "X-Content-Type-Options": "nosniff",
            },
          });
        }

        // Try with .html extension
        const htmlPath = `${path}.html`;
        const htmlAsset = this.assets.get(htmlPath);
        if (htmlAsset) {
          console.log(`✅ Serving: ${htmlPath} (${htmlAsset.type})`);
          return new Response(htmlAsset.content, {
            headers: {
              "Content-Type": htmlAsset.type,
              "Cache-Control": "no-cache",
            },
          });
        }

        console.log(`❌ Not found: ${path}`);
        console.log(`   Available: ${Array.from(this.assets.keys()).slice(0, 10).join(", ")}`);
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

