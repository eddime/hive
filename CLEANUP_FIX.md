# 🔧 Window Close & Cleanup Fix

## Problem:
Wenn die App geschlossen wird, crasht der Webview und bleibt in der Taskleiste.

## Root Cause:
1. Event Loop läuft weiter nach Window Close
2. `bunery_destroy` macht kein richtiges Cleanup
3. `NSApp` wird nicht sauber beendet

## Fix (in macos.mm):

### 1. Window Delegate erweitert:
```objc
- (void)windowWillClose:(NSNotification *)notification {
  // Force exit when window closes
  self.webview_instance->should_exit = true;
  
  // Also terminate the app
  dispatch_async(dispatch_get_main_queue(), ^{
    [NSApp terminate:nil];
  });
}
```

### 2. Event Loop Cleanup:
```objc
void bunery_run(bunery_webview_t* webview) {
  while (!webview->should_exit) {
    // ... event processing ...
    
    // Check if app should terminate
    if (webview->should_exit) {
      break;
    }
  }
  
  // Cleanup when loop exits
  [NSApp stop:nil];
}
```

### 3. Proper Destroy:
```objc
void bunery_destroy(bunery_webview_t* webview) {
  // Set exit flag first
  webview->should_exit = true;
  
  // Close window
  if (webview->window) {
    [webview->window close];
    webview->window = nil;
  }
  
  // Release webview
  if (webview->webview) {
    webview->webview = nil;
  }
  
  // Delete instance
  delete webview;
}
```

## Test:
1. Start Bunery: `bun dev`
2. Close window (Cmd+W or click X)
3. ✅ App sollte sauber beenden
4. ✅ Kein Prozess in Taskleiste
5. ✅ Kein Crash

## Status: ✅ FIXED

