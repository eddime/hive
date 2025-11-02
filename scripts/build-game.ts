// Build game mode - Embed entire game folder with all assets
import { readdir } from "fs/promises";
import { join } from "path";

const gameDir = "./src/frontend/game";

console.log("🎮 Building game mode...");

// Read game HTML
const gameHtml = await Bun.file(`${gameDir}/index.html`).text();

// Get all JS, CSS, and asset files
async function collectAssets(dir: string, baseDir: string = dir): Promise<Map<string, string>> {
  const assets = new Map<string, string>();
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        const subAssets = await collectAssets(fullPath, baseDir);
        for (const [path, content] of subAssets) {
          assets.set(path, content);
        }
      } else {
        // Get relative path from game dir
        const relativePath = fullPath.replace(baseDir + "/", "");
        
        // Read file as text or base64
        const ext = entry.name.split('.').pop()?.toLowerCase();
        const textFormats = ['js', 'css', 'json', 'txt', 'html', 'svg', 'xml'];
        
        if (textFormats.includes(ext || '')) {
          const content = await Bun.file(fullPath).text();
          assets.set(relativePath, content);
        } else {
          // Binary files (images, audio) - convert to base64
          const buffer = await Bun.file(fullPath).arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
          assets.set(relativePath, `data:application/octet-stream;base64,${base64}`);
        }
      }
    }
  } catch (e) {
    // Directory might not exist
  }
  
  return assets;
}

// Collect all assets
console.log("📦 Collecting game assets...");
const assets = await collectAssets(gameDir);

console.log(`   Found ${assets.size} assets`);

// Create embedded assets map
let assetsCode = "export const gameAssets = new Map<string, string>([\n";
for (const [path, content] of assets) {
  if (path !== "index.html") {
    assetsCode += `  [${JSON.stringify(path)}, ${JSON.stringify(content)}],\n`;
  }
}
assetsCode += "]);\n\n";

// Modify HTML to use embedded assets via service worker or inline scripts
let modifiedHtml = gameHtml;

// Replace script src with inline scripts
for (const [path, content] of assets) {
  if (path.endsWith('.js') && !content.startsWith('data:')) {
    const scriptTag = new RegExp(`<script[^>]*src=["']${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*</script>`, 'gi');
    modifiedHtml = modifiedHtml.replace(scriptTag, `<script>${content}</script>`);
  }
}

// Minify HTML
modifiedHtml = modifiedHtml
  .replace(/<!--[\s\S]*?-->/g, "")
  .replace(/\s+/g, " ")
  .replace(/>\s+</g, "><")
  .trim();

// Create embedded-html.ts with game
const embeddedHtmlTs = `// Auto-generated - Game mode
export const htmlContent = ${JSON.stringify(modifiedHtml)};
export const htmlPath = "EMBEDDED_SERVER"; // Use data URL for large game
`;

await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);

const totalSize = (modifiedHtml.length / 1024 / 1024).toFixed(2);
console.log("✅ Game built successfully!");
console.log(`   📦 Total: ${totalSize} MB (embedded)`);
console.log(`   🎯 Mode: Data URL (NO LIMIT!)`);

