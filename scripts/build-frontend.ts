// Build frontend - Two modes: embedded (small apps) or external (large apps)
import config from "../hive.config";

const mode = config.build?.frontend?.mode || "embedded"; // "embedded" or "external"
console.log(`📦 Building frontend (${mode} mode)...`);

if (mode === "external") {
  // External mode: Bundle to separate files BUT EMBED them in binary
  const result = await Bun.build({
    entrypoints: ["./src/frontend/app.ts"],
    outdir: "./dist/frontend",
    minify: true,
    target: "browser",
    format: "esm",
    splitting: false, // No splitting for embedded mode
    treeshaking: true,
    naming: {
      entry: "app.js",
      chunk: "[name].js",
      asset: "[name].[ext]",
    },
  });

  if (!result.success) {
    console.error("❌ Frontend build failed!");
    process.exit(1);
  }

  // Read bundled JS
  const jsFile = result.outputs.find(o => o.kind === "entry-point");
  const jsCode = jsFile ? await jsFile.text() : "";

  // Read CSS
  const cssCode = await Bun.file("./src/frontend/styles.css").text();
  
  // Read HTML template
  const htmlTemplate = await Bun.file("./src/frontend/index.html").text();

  // Create HTML with external references (will be embedded as data)
  let html = htmlTemplate
    .replace(/<link[^>]*href=["']styles\.css["'][^>]*>/i, `<style>${cssCode}</style>`)
    .replace(/<script[^>]*src=["']app\.ts["'][^>]*><\/script>/i, `<script type="module">${jsCode}</script>`);

  // Minify HTML
  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim();

  // Embed HTML (served via HTTP server to bypass size limits)
  const embeddedHtmlTs = `// Auto-generated - External mode (served via embedded HTTP server)
export const htmlContent = ${JSON.stringify(html)};
export const htmlPath = "EMBEDDED_SERVER"; // Signals to use embedded HTTP server
`;
  await Bun.write("./src/embedded-html.ts", embeddedHtmlTs);

  const htmlSize = (html.length / 1024).toFixed(1);
  const jsSize = (jsCode.length / 1024).toFixed(1);
  console.log("✅ Frontend built successfully!");
  console.log(`   📄 HTML: ${htmlSize} KB`);
  console.log(`   📦 JS:   ${jsSize} KB (minified + treeshaken)`);
  console.log(`   💾 Total: ${htmlSize} KB`);
  console.log(`   🎯 Mode: Data URL (NO 2MB LIMIT!)`);

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
