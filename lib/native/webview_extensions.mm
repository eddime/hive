/**
 * 🥐 Bunery Webview Extensions
 * Native Objective-C extensions for webview-bun
 * Adds: setIcon, setMinSize, frameless, fullscreen, alwaysOnTop
 */

#import <Cocoa/Cocoa.h>
#import <Foundation/Foundation.h>

extern "C" {

/**
 * Set window icon
 */
void webview_set_icon(void* window_ptr, const char* icon_path) {
  @autoreleasepool {
    NSWindow* window = (__bridge NSWindow*)window_ptr;
    if (!window) return;
    
    NSString* path = [NSString stringWithUTF8String:icon_path];
    NSImage* icon = [[NSImage alloc] initWithContentsOfFile:path];
    
    if (icon) {
      // Set dock icon
      [[NSApplication sharedApplication] setApplicationIconImage:icon];
      
      // Also set window represented file icon (optional)
      [window setRepresentedURL:[NSURL fileURLWithPath:path]];
    }
  }
}

/**
 * Set minimum window size
 */
void webview_set_min_size(void* window_ptr, int width, int height) {
  @autoreleasepool {
    NSWindow* window = (__bridge NSWindow*)window_ptr;
    if (!window) return;
    
    NSSize minSize = NSMakeSize(width, height);
    [window setContentMinSize:minSize];
  }
}

/**
 * Set frameless (borderless) window
 */
void webview_set_frameless(void* window_ptr, bool frameless) {
  @autoreleasepool {
    NSWindow* window = (__bridge NSWindow*)window_ptr;
    if (!window) return;
    
    if (frameless) {
      [window setStyleMask:NSWindowStyleMaskBorderless];
    } else {
      [window setStyleMask:NSWindowStyleMaskTitled | 
                           NSWindowStyleMaskClosable | 
                           NSWindowStyleMaskMiniaturizable | 
                           NSWindowStyleMaskResizable];
    }
  }
}

/**
 * Toggle fullscreen
 */
void webview_toggle_fullscreen(void* window_ptr) {
  @autoreleasepool {
    NSWindow* window = (__bridge NSWindow*)window_ptr;
    if (!window) return;
    
    [window toggleFullScreen:nil];
  }
}

/**
 * Set always on top
 */
void webview_set_always_on_top(void* window_ptr, bool always_on_top) {
  @autoreleasepool {
    NSWindow* window = (__bridge NSWindow*)window_ptr;
    if (!window) return;
    
    if (always_on_top) {
      [window setLevel:NSFloatingWindowLevel];
    } else {
      [window setLevel:NSNormalWindowLevel];
    }
  }
}

} // extern "C"

