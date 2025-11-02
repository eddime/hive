// 🎮 Embedded Game Server
// Serves game assets from embedded files

import { readdir } from "fs/promises";
import { join } from "path";

export class GameServer {
  private server: any;
  private port: number = 0;
  private assets: Map<string, { content: string | ArrayBuffer; type: string }> = new Map();

  /**
   * Load all assets from game directory
   */
  async loadAssets(gameDir: string) {
    await this.scanDirectory(gameDir, gameDir);
    console.log(`📦 Loaded ${this.assets.size} game assets`);
  }

  private async scanDirectory(dir: string, baseDir: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, baseDir);
        } else {
          // Get relative path
          let relativePath = fullPath.replace(baseDir, "").replace(/\\/g, "/");
          if (!relativePath.startsWith("/")) relativePath = "/" + relativePath;
          
          // Determine content type
          const ext = entry.name.split(".").pop()?.toLowerCase() || "";
          const contentType = this.getContentType(ext);
          
          // Read file
          const file = Bun.file(fullPath);
          const isText = ["js", "css", "json", "html", "txt", "svg", "xml"].includes(ext);
          const content = isText ? await file.text() : await file.arrayBuffer();
          
          this.assets.set(relativePath, { content, type: contentType });
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      html: "text/html",
      js: "application/javascript",
      json: "application/json",
      css: "text/css",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      svg: "image/svg+xml",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      ttf: "font/ttf",
      otf: "font/otf",
      woff: "font/woff",
      woff2: "font/woff2",
    };
    return types[ext] || "application/octet-stream";
  }

  /**
   * Start the embedded server
   */
  async start(preferredPort: number = 0): Promise<number> {
    this.server = Bun.serve({
      port: preferredPort,
      fetch: (req) => {
        const url = new URL(req.url);
        let path = url.pathname;
        
        // Default to index.html
        if (path === "/" || path === "") {
          path = "/index.html";
        }
        
        const asset = this.assets.get(path);
        
        if (asset) {
          return new Response(asset.content, {
            headers: {
              "Content-Type": asset.type,
              "Cache-Control": "no-cache",
            },
          });
        }
        
        return new Response("Not Found", { status: 404 });
      },
    });
    
    this.port = this.server.port;
    return this.port;
  }

  /**
   * Get the server URL
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
}

