// Build frontend and inline everything into one HTML file
console.log("📦 Building frontend...");

// 1. Bundle JavaScript with aggressive optimization
const jsResult = await Bun.build({
  entrypoints: ["./src/frontend/app.ts"],
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
  target: "browser",
  splitting: false,  // No code splitting for single file
  treeshaking: true, // Remove unused code
});

if (!jsResult.success) {
  console.error("❌ JS Build failed!");
  for (const log of jsResult.logs) {
    console.error(log);
  }
  process.exit(1);
}

const jsCode = await jsResult.outputs[0].text();

// 2. Read and minify CSS
let cssCode = await Bun.file("./src/frontend/styles.css").text();
// Simple CSS minification
cssCode = cssCode
  .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
  .replace(/\s+/g, " ")              // Collapse whitespace
  .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around delimiters
  .trim();

// 3. Read HTML template
const htmlTemplate = await Bun.file("./src/frontend/index.html").text();

// 4. Create standalone HTML with inlined CSS and JS (minified)
let standaloneHTML = htmlTemplate
  .replace('<link rel="stylesheet" href="./styles.css" />', `<style>${cssCode}</style>`)
  .replace('<script src="./app.ts"></script>', `<script>${jsCode}</script>`);

// Minify HTML
standaloneHTML = standaloneHTML
  .replace(/<!--[\s\S]*?-->/g, "")   // Remove comments
  .replace(/\s+/g, " ")               // Collapse whitespace
  .replace(/>\s+</g, "><")            // Remove space between tags
  .trim();

// 5. Write standalone HTML
await Bun.write("./dist/index.html", standaloneHTML);

// 6. Embed HTML into TypeScript module for compilation (compressed)
const embeddedHtmlTs = `// Auto-generated - do not edit manually\nexport const htmlContent = ${JSON.stringify(standaloneHTML)};\n`;
await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);

// Calculate sizes
const htmlSize = (standaloneHTML.length / 1024).toFixed(1);
const jsSize = (jsCode.length / 1024).toFixed(1);
const cssSize = (cssCode.length / 1024).toFixed(1);

console.log("✅ Frontend built successfully!");
console.log(`   📄 HTML: ${htmlSize} KB (inlined)`);
console.log(`   🎨 CSS:  ${cssSize} KB (minified)`);
console.log(`   📦 JS:   ${jsSize} KB (minified + treeshaken)`);
console.log(`   💾 Total: ${(parseFloat(htmlSize)).toFixed(1)} KB`);
