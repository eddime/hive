// 🐝 Hive Build Script (Current Platform)
import config from "../hive.config";

console.log(`🐝 Building ${config.app.name} v${config.app.version}...`);
console.log(`🎯 Target: ${process.platform}-${process.arch}\n`);

// Build frontend first
console.log("📦 Building frontend...");
const frontendBuild = Bun.spawnSync(["bun", "run", "build:frontend"], {
  stdout: "inherit",
  stderr: "inherit",
});

if (frontendBuild.exitCode !== 0) {
  console.error("❌ Frontend build failed!");
  process.exit(1);
}

console.log("\n🔨 Compiling binary...");

// Ensure dist directory exists
await Bun.write(`${config.build.outdir}/.gitkeep`, "");

const outfile = `${config.build.outdir}/${config.build.outfile}`;
const buildArgs = [
  "build",
  "--compile",
  config.build.minify ? "--minify" : "",
  config.build.sourcemap ? "--sourcemap=external" : "",
  config.build.bytecode ? "--bytecode" : "",
  "./src/index.ts",
  "--outfile",
  outfile,
].filter(Boolean);

if (config.build.bytecode) {
  console.log("⚡ Bytecode compilation enabled (faster startup)");
}

const startTime = performance.now();
const proc = Bun.spawn(["bun", ...buildArgs], {
  stdout: "inherit",
  stderr: "inherit",
});

const exitCode = await proc.exited;
const buildTime = ((performance.now() - startTime) / 1000).toFixed(1);

if (exitCode === 0) {
  const stats = await Bun.file(outfile).stat();
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
  
  console.log(`\n✅ Build successful in ${buildTime}s!`);
  console.log(`   📦 ${outfile} (${sizeMB} MB)`);
  console.log(`   🎯 Platform: ${process.platform}-${process.arch}`);
  console.log(`\n💡 Tip: Run "bun run build:all" to build for all platforms`);
} else {
  console.error(`\n❌ Build failed with exit code ${exitCode}`);
  process.exit(exitCode);
}

