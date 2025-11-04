// 🥐 Bunery Core - Backend Bindings
// Bun runtime bindings for webview

import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, readFileSync, writeFileSync } from 'fs';
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
function loadStorage(): Record<string, any> {
  try {
    if (existsSync(storagePath)) {
      const data = readFileSync(storagePath, 'utf-8');
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
function saveStorage(data: Record<string, any>) {
  try {
    writeFileSync(storagePath, JSON.stringify(data, null, 2));
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

  webview.bind('__fsReadFile', (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const content = readFileSync(path, 'utf-8');
      return successResponse(content);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsWriteFile', (args: string) => {
    try {
      const [path, data] = JSON.parse(args);
      writeFileSync(path, String(data), 'utf-8');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsReadDir', (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const files = readdirSync(path);
      return successResponse(files);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsExists', (args: string) => {
    try {
      const [path] = JSON.parse(args);
      const exists = existsSync(path);
      return successResponse(exists);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsRemove', (args: string) => {
    try {
      const [path] = JSON.parse(args);
      unlinkSync(path);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsMkdir', (args: string) => {
    try {
      const [path, recursive] = JSON.parse(args);
      mkdirSync(path, { recursive: recursive !== false });
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__fsStat', (args: string) => {
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

  webview.bind('__osPlatform', () => {
    return successResponse(platform());
  });

  webview.bind('__osVersion', () => {
    return successResponse(version());
  });

  webview.bind('__osArch', () => {
    return successResponse(arch());
  });

  webview.bind('__osInfo', () => {
    return successResponse({
      platform: platform(),
      version: version(),
      arch: arch(),
      hostname: hostname(),
      username: process.env.USER || process.env.USERNAME || 'unknown',
    });
  });

  webview.bind('__osEnv', (args: string) => {
    try {
      const [name] = JSON.parse(args);
      return successResponse(process.env[name]);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== WINDOW CONTROL ====================

  webview.bind('__windowSetTitle', (args: string) => {
    try {
      const [title] = JSON.parse(args);
      webview.title = title;
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowMinimize', () => {
    try {
      // Note: webview-bun doesn't have minimize yet, but we prepare for it
      console.warn('[Bunery] window.minimize() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowMaximize', () => {
    try {
      console.warn('[Bunery] window.maximize() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowRestore', () => {
    try {
      console.warn('[Bunery] window.restore() not yet supported by webview-bun');
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowClose', () => {
    try {
      webview.close();
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowSetSize', (args: string) => {
    try {
      const [width, height, hint] = JSON.parse(args);
      webview.setSize(width, height, hint || 0); // 0 = WEBVIEW_HINT_NONE
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowSetMinSize', (args: string) => {
    try {
      const [minWidth, minHeight] = JSON.parse(args);
      webview.setSize(minWidth, minHeight, 1); // 1 = WEBVIEW_HINT_MIN
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__windowSetFullscreen', (args: string) => {
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

  webview.bind('__windowGetState', () => {
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

  webview.bind('__storageGet', (args: string) => {
    try {
      const [key] = JSON.parse(args);
      const data = loadStorage();
      return successResponse(data[key] || null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageSet', (args: string) => {
    try {
      const [key, value] = JSON.parse(args);
      const data = loadStorage();
      data[key] = value;
      saveStorage(data);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageRemove', (args: string) => {
    try {
      const [key] = JSON.parse(args);
      const data = loadStorage();
      delete data[key];
      saveStorage(data);
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageClear', () => {
    try {
      saveStorage({});
      return successResponse(null);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__storageKeys', () => {
    try {
      const data = loadStorage();
      return successResponse(Object.keys(data));
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  // ==================== SHELL ====================

  webview.bind('__shellExecute', (args: string) => {
    try {
      const [command] = JSON.parse(args);
      // Simple shell parsing: split by spaces but respect quotes
      const parts = String(command).match(/[^\s"]+|"([^"]*)"/g) || [];
      const cmdArray = parts.map((p: string) => p.replace(/^"|"$/g, ''));
      
      const proc = Bun.spawnSync(cmdArray, {
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

  webview.bind('__shellOpen', (args: string) => {
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

  webview.bind('__shellOpenPath', (args: string) => {
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

  webview.bind('__clipboardWriteText', (args: string) => {
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

  webview.bind('__clipboardReadText', () => {
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

  webview.bind('__appGetVersion', () => {
    return successResponse(config?.app?.version || '1.0.0');
  });

  webview.bind('__appGetName', () => {
    return successResponse(appName);
  });

  webview.bind('__appQuit', () => {
    try {
      webview.close();
      process.exit(0);
    } catch (error: any) {
      return errorResponse(error.message);
    }
  });

  webview.bind('__appGetPaths', () => {
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

