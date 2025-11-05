/**
 * 🥐 Bunery Webview Extensions - Windows
 * Native Win32 extensions for webview
 * Adds: setIcon, setMinSize, frameless, fullscreen, alwaysOnTop
 */

#include <windows.h>

extern "C" {

/**
 * Set window icon
 */
__declspec(dllexport) void webview_set_icon(void* window_ptr, const char* icon_path) {
    HWND hwnd = (HWND)window_ptr;
    if (!hwnd) return;
    
    // Load icon from file
    HICON hIcon = (HICON)LoadImageA(NULL, icon_path, IMAGE_ICON, 0, 0, LR_LOADFROMFILE | LR_DEFAULTSIZE);
    if (hIcon) {
        SendMessage(hwnd, WM_SETICON, ICON_SMALL, (LPARAM)hIcon);
        SendMessage(hwnd, WM_SETICON, ICON_BIG, (LPARAM)hIcon);
    }
}

/**
 * Set minimum window size
 */
__declspec(dllexport) void webview_set_min_size(void* window_ptr, int width, int height) {
    HWND hwnd = (HWND)window_ptr;
    if (!hwnd) return;
    
    // Store min size in window data
    SetWindowLongPtr(hwnd, GWLP_USERDATA, MAKELONG(width, height));
    
    // TODO: Hook WM_GETMINMAXINFO to enforce min size
}

/**
 * Set frameless (borderless) window
 */
__declspec(dllexport) void webview_set_frameless(void* window_ptr, bool frameless) {
    HWND hwnd = (HWND)window_ptr;
    if (!hwnd) return;
    
    LONG style = GetWindowLong(hwnd, GWL_STYLE);
    if (frameless) {
        style &= ~(WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
        SetWindowLong(hwnd, GWL_STYLE, style);
    } else {
        style |= (WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU);
        SetWindowLong(hwnd, GWL_STYLE, style);
    }
    SetWindowPos(hwnd, NULL, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER);
}

/**
 * Toggle fullscreen
 */
__declspec(dllexport) void webview_toggle_fullscreen(void* window_ptr) {
    HWND hwnd = (HWND)window_ptr;
    if (!hwnd) return;
    
    static WINDOWPLACEMENT wp = { sizeof(wp) };
    LONG style = GetWindowLong(hwnd, GWL_STYLE);
    
    if (style & WS_OVERLAPPEDWINDOW) {
        // Enter fullscreen
        MONITORINFO mi = { sizeof(mi) };
        if (GetWindowPlacement(hwnd, &wp) && GetMonitorInfo(MonitorFromWindow(hwnd, MONITOR_DEFAULTTOPRIMARY), &mi)) {
            SetWindowLong(hwnd, GWL_STYLE, style & ~WS_OVERLAPPEDWINDOW);
            SetWindowPos(hwnd, HWND_TOP,
                mi.rcMonitor.left, mi.rcMonitor.top,
                mi.rcMonitor.right - mi.rcMonitor.left,
                mi.rcMonitor.bottom - mi.rcMonitor.top,
                SWP_NOOWNERZORDER | SWP_FRAMECHANGED);
        }
    } else {
        // Exit fullscreen
        SetWindowLong(hwnd, GWL_STYLE, style | WS_OVERLAPPEDWINDOW);
        SetWindowPlacement(hwnd, &wp);
        SetWindowPos(hwnd, NULL, 0, 0, 0, 0,
            SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOOWNERZORDER | SWP_FRAMECHANGED);
    }
}

/**
 * Set always on top
 */
__declspec(dllexport) void webview_set_always_on_top(void* window_ptr, bool always_on_top) {
    HWND hwnd = (HWND)window_ptr;
    if (!hwnd) return;
    
    SetWindowPos(hwnd, always_on_top ? HWND_TOPMOST : HWND_NOTOPMOST,
        0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
}

} // extern "C"

