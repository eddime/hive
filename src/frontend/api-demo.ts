// 🥐 Bunery API Demo
// Import from local runtime (absolute path for asset server)
import { bunery } from '/bunery-runtime.ts';

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
    // Debug: Check if binding exists
    console.log('Checking __fsWriteFile:', typeof (window as any).__fsWriteFile);
    console.log('All window bindings:', Object.keys(window).filter(k => k.startsWith('__')));
    
    // Test writing and reading
    const testFile = '/tmp/bunery-test.txt';
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

