// Build frontend - Asset Server or Embedded
import config from "../hive.config";

const useAssetServer = config.build?.frontend?.assetServer !== false; // Default: true
console.log(`📦 Building frontend (${useAssetServer ? "asset server" : "embedded"} mode)...`);

if (useAssetServer) {
  // Asset Server mode: No bundling, serve all files via HTTP
  const embeddedHtmlTs = `// Auto-generated - Asset Server mode
export const htmlContent = null;
export const htmlPath = "ASSET_SERVER"; // Signals to use asset server
`;
  await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);
  
  console.log("✅ Asset server enabled!");
  console.log("   🌐 All files served via HTTP (no size limits)");
  console.log("   📂 Place your frontend in src/frontend/");
  console.log("   ✨ Supports: HTML, JS, CSS, images, audio, fonts, etc.");

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
