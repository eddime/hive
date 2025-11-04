// 🥐 Bunery Core - Backend Bindings
// Bun runtime bindings for webview

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import { homedir, platform, arch, version, hostname } from 'os';
import { join, dirname } from 'path';
import type { Webview } from 'webview-bun';

/**
 * Error response wrapper
 */
function errorResponse(message: string) {
  return JSON.stringify({
    __bunery_error: true,
    message,
  });
}

/**
 * Success response wrapper
 */
function successResponse(data: any) {
  return JSON.stringify(data);
}

/**
 * Storage file path (per-app persistent storage)
 */
let storagePath: string;

/**
 * Initialize storage
 */
function initStorage(appName: string) {
  const userDataDir = join(homedir(), '.bunery', appName);
  if (!existsSync(userDataDir)) {
    mkdirSync(userDataDir, { recursive: true });
  }
  storagePath = join(userDataDir, 'storage.json');
}

/**
 * Load storage data
 */
async function loadStorage(): Promise<Record<string, any>> {
  try {
    if (existsSync(storagePath)) {
      const data = await Bun.file(storagePath).text();
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('[Bunery] Failed to load storage:', error);
  }
  return {};
}

/**
 * Save storage data
 */
async function saveStorage(data: Record<string, any>) {
  try {
    await writeFile(storagePath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[Bunery] Failed to save storage:', error);
    throw error;
  }
}

/**
 * Register all Bunery core bindings
 * @param webview - Webview instance
 * @param config - App configuration
 */
export function registerBindings(webview: Webview, config: any) {
  const appName = config?.app?.name || 'bunery-app';
  initStorage(appName);

  // ==================== FILE SYSTEM ====================

  webview.bind('____fsReadFile', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const content = await readFile(path, 'utf-8');
      return successResponse(content);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsWriteFile', async (args: string) => {
    try {
      const [path, data] = JSON.parse(args);
      await writeFile(path, data, 'utf-8');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsReadDir', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const files = readdirSync(path);
      return successResponse(files);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsExists', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const exists = existsSync(path);
      return successResponse(exists);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsRemove', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      unlinkSync(path);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsMkdir', async (args: string) => {
    try {
      const [path, recursive] = JSON.parse(args);
      mkdirSync(path, { recursive: recursive !== false });
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsStat', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const stats = statSync(path);
      return successResponse({
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtimeMs,
        created: stats.birthtimeMs,
      });
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== OPERATING SYSTEM ====================

  webview.bind('__osPlatform', async () => {
    return successResponse(platform());
  });

  webview.bind('__osVersion', async () => {
    return successResponse(version());
  });

  webview.bind('__osArch', async () => {
    return successResponse(arch());
  });

  webview.bind('__osInfo', async () => {
    return successResponse({
      platform: platform(),
      version: version(),
      arch: arch(),
      hostname: hostname(),
      username: process.env.USER || process.env.USERNAME || 'unknown',
    });
  });

  webview.bind('__osEnv', async (args: string) => {
    try {
      const [name] = JSON.parse(args);
      return successResponse(process.env[name]);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== WINDOW CONTROL ====================

  webview.bind('__windowSetTitle', async (args: string) => {
    try {
      const [title] = JSON.parse(args);
      webview.setTitle(title);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowMinimize', async () => {
    try {
      // Note: webview-bun doesn't have minimize yet, but we prepare for it
      console.warn('[Bunery] window.minimize() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowMaximize', async () => {
    try {
      console.warn('[Bunery] window.maximize() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowRestore', async () => {
    try {
      console.warn('[Bunery] window.restore() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowClose', async () => {
    try {
      webview.close();
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowSetSize', async (args: string) => {
    try {
      const [width, height] = JSON.parse(args);
      webview.setSize(width, height, 0); // 0 = WEBVIEW_HINT_NONE
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowSetFullscreen', async (args: string) => {
    try {
      const [enabled] = JSON.parse(args);
      // Use JavaScript to toggle fullscreen (best cross-platform support)
      webview.eval(`
        if (${enabled}) {
          document.documentElement.requestFullscreen();
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          }
        }
      `);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowGetState', async () => {
    try {
      // Note: Getting window state requires platform-specific APIs
      console.warn('[Bunery] window.getState() not yet fully supported');
      return successResponse({
        width: config?.window?.width || 1280,
        height: config?.window?.height || 720,
        x: 0,
        y: 0,
        isMaximized: false,
        isMinimized: false,
        isFullscreen: false,
      });
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== STORAGE ====================

  webview.bind('__storageGet', async (args: string) => {
    try {
      const [key] = JSON.parse(args);
      const data = await loadStorage();
      return successResponse(data[key] || null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageSet', async (args: string) => {
    try {
      const [key, value] = JSON.parse(args);
      const data = await loadStorage();
      data[key] = value;
      await saveStorage(data);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageRemove', async (args: string) => {
    try {
      const [key] = JSON.parse(args);
      const data = await loadStorage();
      delete data[key];
      await saveStorage(data);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageClear', async () => {
    try {
      await saveStorage({});
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageKeys', async () => {
    try {
      const data = await loadStorage();
      return successResponse(Object.keys(data));
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== SHELL ====================

  webview.bind('__shellExecute', async (args: string) => {
    try {
      const [command] = JSON.parse(args);
      const proc = Bun.spawnSync(command.split(' '), {
        stdout: 'pipe',
        stderr: 'pipe',
      });
      return successResponse({
        stdout: proc.stdout.toString(),
        stderr: proc.stderr.toString(),
        exitCode: proc.exitCode,
      });
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__shellOpen', async (args: string) => {
    try {
      const [url] = JSON.parse(args);
      const openCmd = platform() === 'darwin' ? 'open' : 
                      platform() === 'win32' ? 'start' : 'xdg-open';
      Bun.spawn([openCmd, url]);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__shellOpenPath', async (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const openCmd = platform() === 'darwin' ? 'open' : 
                      platform() === 'win32' ? 'explorer' : 'xdg-open';
      Bun.spawn([openCmd, path]);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== CLIPBOARD ====================

  webview.bind('__clipboardWriteText', async (args: string) => {
    try {
      const [text] = JSON.parse(args);
      // Platform-specific clipboard commands
      const clipCmd = platform() === 'darwin' ? ['pbcopy'] :
                      platform() === 'win32' ? ['clip'] :
                      ['xclip', '-selection', 'clipboard'];
      const proc = Bun.spawn(clipCmd, { stdin: 'pipe' });
      proc.stdin?.write(text);
      proc.stdin?.end();
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__clipboardReadText', async () => {
    try {
      const clipCmd = platform() === 'darwin' ? ['pbpaste'] :
                      platform() === 'win32' ? ['powershell', '-command', 'Get-Clipboard'] :
                      ['xclip', '-selection', 'clipboard', '-o'];
      const proc = Bun.spawnSync(clipCmd, { stdout: 'pipe' });
      return successResponse(proc.stdout.toString());
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== APP ====================

  webview.bind('__appGetVersion', async () => {
    return successResponse(config?.app?.version || '1.0.0');
  });

  webview.bind('__appGetName', async () => {
    return successResponse(appName);
  });

  webview.bind('__appQuit', async () => {
    try {
      webview.close();
      process.exit(0);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__appGetPaths', async () => {
    const home = homedir();
    return successResponse({
      app: process.cwd(),
      userData: join(home, '.bunery', appName),
      temp: process.env.TMPDIR || process.env.TEMP || '/tmp',
      home,
      documents: join(home, 'Documents'),
      downloads: join(home, 'Downloads'),
    });
  });

  console.log('✅ [Bunery Core] All bindings registered');
}

export default { registerBindings };

