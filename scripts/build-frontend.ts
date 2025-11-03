// Build frontend - Asset Server or Embedded
import config from "../bunery.config";

const useAssetServer = config.build?.frontend?.assetServer !== false; // Default: true
console.log(`📦 Building frontend (${useAssetServer ? "asset server" : "embedded"} mode)...`);

if (useAssetServer) {
  // Asset Server mode: Embed file CONTENTS as inline strings
  // This works in both dev and compiled executables
  const glob = new Bun.Glob("**/*");
  const files = await Array.fromAsync(glob.scan({ cwd: "./src/frontend", onlyFiles: true }));
  
  // Read all files and embed their contents as base64 or text
  const assetsCode = [];
  const transpiler = new Bun.Transpiler({ loader: 'tsx' });
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = `./src/frontend/${file}`;
    let fileContent: ArrayBuffer;
    
    // HTML files: Inject Bunery runtime scripts
    if (file.endsWith('.html')) {
      let htmlContent = await Bun.file(filePath).text();
      
      // Inject binding placeholder that main.ts will populate
      const runtimeScript = `<script id="bunery-runtime">/* Bunery runtime injected at build */</script>`;
      htmlContent = htmlContent.replace(/<\/head>/i, `${runtimeScript}\n</head>`);
      
      fileContent = new TextEncoder().encode(htmlContent).buffer;
      console.log(`   🥐 Processed: ${file} (Bunery runtime marker)`);
    }
    // Transpile TypeScript files to JavaScript
    else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const sourceCode = await Bun.file(filePath).text();
      const jsCode = await transpiler.transform(sourceCode);
      fileContent = new TextEncoder().encode(jsCode).buffer;
      console.log(`   📝 Transpiled: ${file} → JavaScript`);
    } else {
      fileContent = await Bun.file(filePath).arrayBuffer();
    }
    
    const base64 = Buffer.from(fileContent).toString('base64');
    
    // Store as base64 and decode at runtime
    assetsCode.push(`  "/${file}": "data:base64,${base64}"`);
  }
  
  const embeddedHtmlTs = `// Auto-generated - Asset Server mode
// Assets embedded as base64 data URLs (TypeScript files pre-transpiled)

export const htmlContent = null;
export const htmlPath = "ASSET_SERVER";

// Embedded assets (bundled in binary as base64)
export const embeddedAssets: Record<string, string> = {
${assetsCode.join(',\n')}
};
`;
  await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);
  
  console.log("✅ Asset server enabled!");
  console.log(`   📦 Embedded ${files.length} assets in binary`);
  console.log("   🌐 Will be served via HTTP at runtime");
  console.log("   ✨ NO SIZE LIMITS!");

} else {
  // Embedded mode: Inline everything (for small apps)
const jsResult = await Bun.build({
  entrypoints: ["./src/frontend/app.ts"],
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
  target: "browser",
    format: "esm",
    splitting: false,
    treeshaking: true,
    define: {
      "import.meta.env.MODE": '"production"',
      "process.env.NODE_ENV": '"production"'
    },
});

if (!jsResult.success) {
  console.error("❌ JS Build failed!");
  process.exit(1);
}

const jsCode = await jsResult.outputs[0].text();

  // Read and minify CSS
let cssCode = await Bun.file("./src/frontend/styles.css").text();
cssCode = cssCode
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
  .trim();

  // Read HTML template
const htmlTemplate = await Bun.file("./src/frontend/index.html").text();

  // Create standalone HTML with inlined CSS and JS
let standaloneHTML = htmlTemplate
    .replace(/<link[^>]*href=["']styles\.css["'][^>]*>/i, `<style>${cssCode}</style>`)
    .replace(/<script[^>]*src=["']app\.ts["'][^>]*><\/script>/i, `<script>${jsCode}</script>`);

// Minify HTML
standaloneHTML = standaloneHTML
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
  .trim();

  // Embed HTML into TypeScript module
  const embeddedHtmlTs = `// Auto-generated - Embedded mode\nexport const htmlContent = ${JSON.stringify(standaloneHTML)};\nexport const htmlPath = null;\n`;
await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);

const htmlSize = (standaloneHTML.length / 1024).toFixed(1);
const jsSize = (jsCode.length / 1024).toFixed(1);
const cssSize = (cssCode.length / 1024).toFixed(1);

console.log("✅ Frontend built successfully!");
console.log(`   📄 HTML: ${htmlSize} KB (inlined)`);
console.log(`   🎨 CSS:  ${cssSize} KB (minified)`);
console.log(`   📦 JS:   ${jsSize} KB (minified + treeshaken)`);
  console.log(`   💾 Total: ${htmlSize} KB`);
}
