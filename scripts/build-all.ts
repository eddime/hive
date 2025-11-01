// 🐝 Hive Cross-Platform Build Script
import config from "../hive.config";

const targets = [
  { platform: "darwin", arch: "x64", ext: "", name: "macOS-Intel" },
  { platform: "darwin", arch: "arm64", ext: "", name: "macOS-ARM" },
  { platform: "linux", arch: "x64", ext: "", name: "Linux-x64" },
  { platform: "linux", arch: "arm64", ext: "", name: "Linux-ARM64" },
  { platform: "windows", arch: "x64", ext: ".exe", name: "Windows-x64" },
];

console.log(`🐝 Building ${config.app.name} v${config.app.version} for all platforms...\n`);

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

console.log("\n🔨 Compiling binaries...\n");

// Ensure dist directory exists
await Bun.write(`${config.build.outdir}/.gitkeep`, "");

const buildResults = [];

for (const target of targets) {
  const outfile = `${config.build.outdir}/${config.build.outfile}-${target.platform}-${target.arch}${target.ext}`;
  const targetStr = `bun-${target.platform}-${target.arch}`;
  
  console.log(`⚙️  Building ${target.name}...`);
  
  const buildArgs = [
    "build",
    "--compile",
    "--target",
    targetStr,
    "--minify",
    "--sourcemap=external",
    config.build.bytecode ? "--bytecode" : "",
    "./src/index.ts",
    "--outfile",
    outfile,
  ].filter(Boolean);

  const startTime = performance.now();
  const proc = Bun.spawnSync(["bun", ...buildArgs], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const buildTime = ((performance.now() - startTime) / 1000).toFixed(1);

  if (proc.exitCode === 0) {
    const stats = await Bun.file(outfile).stat();
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    
    buildResults.push({
      name: target.name,
      file: outfile,
      size: sizeMB,
      time: buildTime,
      success: true,
    });
    
    console.log(`   ✅ ${outfile} (${sizeMB} MB) in ${buildTime}s`);
  } else {
    buildResults.push({
      name: target.name,
      file: outfile,
      success: false,
      error: proc.stderr.toString(),
    });
    console.error(`   ❌ Failed: ${proc.stderr.toString().slice(0, 100)}...`);
  }
  console.log();
}

// Summary
console.log("━".repeat(60));
console.log("📊 Build Summary\n");

const successful = buildResults.filter((r) => r.success);
const failed = buildResults.filter((r) => !r.success);

if (successful.length > 0) {
  console.log(`✅ Successful Builds (${successful.length}):`);
  for (const build of successful) {
    console.log(`   ${build.name.padEnd(15)} → ${build.file} (${build.size} MB)`);
  }
}

if (failed.length > 0) {
  console.log(`\n❌ Failed Builds (${failed.length}):`);
  for (const build of failed) {
    console.log(`   ${build.name}`);
  }
}

const totalSize = successful.reduce((sum, b) => sum + parseFloat(b.size), 0).toFixed(1);
console.log(`\n💾 Total Size: ${totalSize} MB`);
console.log("━".repeat(60));

if (failed.length > 0) {
  process.exit(1);
}

