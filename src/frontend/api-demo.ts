// 🥐 Bunery API Demo
// INLINE runtime to avoid caching issues
function invoke<T = any>(name: string, ...args: any[]): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      const fn = (window as any)[`__${name}`];
      if (!fn) {
        reject(new Error(`[Bunery] Binding "${name}" not found`));
        return;
      }
      const result = await fn(JSON.stringify(args));
      const parsed = typeof result === 'string' ? JSON.parse(result) : result;
      if (parsed && parsed.__bunery_error) {
        reject(new Error(parsed.message || 'Unknown error'));
        return;
      }
      resolve(parsed);
    } catch (error) {
      reject(error);
    }
  });
}

const bunery = {
  fs: {
    readFile: (path: string) => invoke('fsReadFile', path),
    writeFile: (path: string, data: string) => invoke('fsWriteFile', path, data),
    readDir: (path: string) => invoke('fsReadDir', path),
    exists: (path: string) => invoke('fsExists', path),
    remove: (path: string) => invoke('fsRemove', path),
    mkdir: (path: string, recursive?: boolean) => invoke('fsMkdir', path, recursive),
    stat: (path: string) => invoke('fsStat', path),
  },
  os: {
    platform: () => invoke('osPlatform'),
    version: () => invoke('osVersion'),
    arch: () => invoke('osArch'),
    info: () => invoke('osInfo'),
    env: (name: string) => invoke('osEnv', name),
  },
  window: {
    setTitle: (title: string) => invoke('windowSetTitle', title),
    minimize: () => invoke('windowMinimize'),
    maximize: () => invoke('windowMaximize'),
    restore: () => invoke('windowRestore'),
    close: () => invoke('windowClose'),
    setSize: (width: number, height: number, hint?: number) => invoke('windowSetSize', width, height, hint),
    setMinSize: (minWidth: number, minHeight: number) => invoke('windowSetMinSize', minWidth, minHeight),
    setPosition: (x: number, y: number) => invoke('windowSetPosition', x, y),
    setFullscreen: (enabled: boolean) => invoke('windowSetFullscreen', enabled),
    getState: () => invoke('windowGetState'),
  },
  dialog: {
    open: (options?: any) => invoke('dialogOpen', options),
    save: (options?: any) => invoke('dialogSave', options),
    message: (options?: any) => invoke('dialogMessage', options),
    confirm: (message: string) => invoke('dialogConfirm', message),
  },
  storage: {
    get: (key: string) => invoke('storageGet', key),
    set: (key: string, value: any) => invoke('storageSet', key, value),
    remove: (key: string) => invoke('storageRemove', key),
    clear: () => invoke('storageClear'),
    keys: () => invoke('storageKeys'),
  },
  shell: {
    execute: (command: string) => invoke('shellExecute', command),
    open: (url: string) => invoke('shellOpen', url),
    openPath: (path: string) => invoke('shellOpenPath', path),
  },
  clipboard: {
    writeText: (text: string) => invoke('clipboardWriteText', text),
    readText: () => invoke('clipboardReadText'),
  },
  app: {
    getVersion: () => invoke('appGetVersion'),
    getName: () => invoke('appGetName'),
    quit: () => invoke('appQuit'),
    getPaths: () => invoke('appGetPaths'),
  },
};

function showResult(id: string, data: any, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  
  el.style.display = 'block';
  el.className = `result ${isError ? 'error' : 'success'}`;
  el.textContent = isError ? `❌ ${data}` : `✅ ${JSON.stringify(data, null, 2)}`;
}

// Test File System API
(window as any).testFS = async () => {
  try {
    // Use cross-platform temp directory from backend
    const paths = await bunery.app.getPaths();
    const testFile = `${paths.temp}/bunery-test.txt`;
    await bunery.fs.writeFile(testFile, 'Hello from Bunery! 🥐');
    const content = await bunery.fs.readFile(testFile);
    
    const exists = await bunery.fs.exists(testFile);
    const stats = await bunery.fs.stat(testFile);
    
    showResult('fs-result', {
      written: 'Hello from Bunery! 🥐',
      read: content,
      exists,
      size: stats.size,
    });
  } catch (error: any) {
    showResult('fs-result', error.message, true);
  }
};

// Test OS API
(window as any).testOS = async () => {
  try {
    const info = await bunery.os.info();
    showResult('os-result', info);
  } catch (error: any) {
    showResult('os-result', error.message, true);
  }
};

// Test Window API
(window as any).testWindow = async () => {
  try {
    await bunery.window.setTitle('Bunery API Demo - Window Test');
    setTimeout(async () => {
      await bunery.window.setTitle('Bunery API Demo');
    }, 2000);
    
    const state = await bunery.window.getState();
    showResult('window-result', {
      titleChanged: true,
      state,
    });
  } catch (error: any) {
    showResult('window-result', error.message, true);
  }
};

// Test Storage API
(window as any).testStorage = async () => {
  try {
    const testData = {
      name: 'Bunery User',
      timestamp: Date.now(),
      emoji: '🥐'
    };
    
    await bunery.storage.set('test-data', testData);
    const retrieved = await bunery.storage.get('test-data');
    const keys = await bunery.storage.keys();
    
    showResult('storage-result', {
      saved: testData,
      retrieved,
      allKeys: keys,
    });
  } catch (error: any) {
    showResult('storage-result', error.message, true);
  }
};

// Test Shell API
(window as any).testShell = async () => {
  try {
    const result = await bunery.shell.execute('echo "Hello from Bunery Shell! 🥐"');
    showResult('shell-result', {
      command: 'echo',
      stdout: result.stdout.trim(),
      exitCode: result.exitCode,
    });
  } catch (error: any) {
    showResult('shell-result', error.message, true);
  }
};

// Test Clipboard API
(window as any).testClipboard = async () => {
  try {
    const testText = 'Bunery Clipboard Test 🥐';
    await bunery.clipboard.writeText(testText);
    const read = await bunery.clipboard.readText();
    
    showResult('clipboard-result', {
      written: testText,
      read: read.trim(),
      match: read.trim() === testText,
    });
  } catch (error: any) {
    showResult('clipboard-result', error.message, true);
  }
};

// Test App API
(window as any).testApp = async () => {
  try {
    const name = await bunery.app.getName();
    const version = await bunery.app.getVersion();
    const paths = await bunery.app.getPaths();
    
    showResult('app-result', {
      name,
      version,
      paths,
    });
  } catch (error: any) {
    showResult('app-result', error.message, true);
  }
};

console.log('🥐 Bunery API Demo ready!');
console.log('Available APIs:', Object.keys(bunery));

