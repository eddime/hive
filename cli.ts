#!/usr/bin/env bun
// 🥐 Bunery CLI - Bake your desktop apps

import { existsSync, rmSync } from "fs";
import { resolve } from "path";

const commands = {
  dev: {
    desc: "Start development server with hot reload",
    script: "scripts/dev.ts",
  },
  all: {
    desc: "Bake for all platforms (macOS, Linux, Windows)",
    script: "scripts/build-all.ts",
  },
  mac: {
    desc: "Bake for macOS only",
    script: "scripts/build.ts",
    env: { TARGET_OS: "darwin" },
  },
  win: {
    desc: "Bake for Windows only",
    script: "scripts/build.ts",
    env: { TARGET_OS: "windows", TARGET_ARCH: "x64" },
  },
  windows: { // Alias
    desc: "Bake for Windows only (alias)",
    script: "scripts/build.ts",
    env: { TARGET_OS: "windows", TARGET_ARCH: "x64" },
  },
  linux: {
    desc: "Bake for Linux only",
    script: "scripts/build.ts",
    env: { TARGET_OS: "linux" },
  },
  frontend: {
    desc: "Bake frontend assets",
    script: "scripts/build-frontend.ts",
  },
  clean: {
    desc: "Clean build artifacts",
    action: async () => {
      if (existsSync("dist")) rmSync("dist", { recursive: true, force: true });
      if (existsSync("src/embedded-html.ts")) rmSync("src/embedded-html.ts");
      console.log("✨ Cleaned build artifacts");
    },
  },
};

const args = process.argv.slice(2);
const command = args[0];

// Help command
if (!command || command === "help" || command === "-h" || command === "--help") {
  console.log(`
🥐 Bunery - Bake your desktop apps

Usage: bun bake <command>

Commands:
  dev         ${commands.dev.desc}
  all         ${commands.all.desc}
  mac         ${commands.mac.desc}
  win         ${commands.win.desc}
  linux       ${commands.linux.desc}
  frontend    ${commands.frontend.desc}
  clean       ${commands.clean.desc}
  help        Show this help message

Examples:
  bun bake dev      # Start development
  bun bake all      # Build for all platforms
  bun bake mac      # Build for macOS only
  bun bake win      # Build for Windows only
  bun bake linux    # Build for Linux only
`);
  process.exit(0);
}

// Execute command
const cmd = commands[command as keyof typeof commands];

if (!cmd) {
  console.error(`❌ Unknown command: ${command}`);
  console.log("Run 'bun bake help' for a list of commands.");
  process.exit(1);
}

if (cmd.action) {
  await cmd.action();
} else if (cmd.script) {
  const scriptPath = resolve(process.cwd(), cmd.script);
  const proc = Bun.spawn(["bun", "run", scriptPath], {
    env: { ...process.env, ...cmd.env },
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });
  await proc.exited;
  process.exit(proc.exitCode ?? 0);
}

