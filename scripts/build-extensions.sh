#!/bin/bash
# 🥐 Build webview extensions for all platforms

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
NATIVE_DIR="$PROJECT_ROOT/lib/native"

echo "🥐 Building webview extensions for all platforms..."
echo ""

# macOS (already compiled)
if [[ -f "$NATIVE_DIR/libwebview_ext.dylib" ]]; then
    echo "✅ macOS: libwebview_ext.dylib exists"
else
    echo "⚙️  macOS: Compiling libwebview_ext.dylib..."
    cd "$NATIVE_DIR"
    clang++ -std=c++17 -fPIC -O3 -shared -framework Cocoa -fobjc-arc \
        -o libwebview_ext.dylib webview_extensions.mm
    echo "✅ macOS: Done"
fi
echo ""

# Windows (cross-compile with mingw)
if command -v x86_64-w64-mingw32-g++ &> /dev/null; then
    echo "⚙️  Windows: Compiling libwebview_ext.dll..."
    cd "$NATIVE_DIR"
    x86_64-w64-mingw32-g++ -std=c++17 -O3 -shared \
        -static-libgcc -static-libstdc++ \
        -o libwebview_ext.dll webview_extensions_windows.cpp \
        -lgdi32 -luser32 -lkernel32 -lcomctl32
    echo "✅ Windows: Done"
else
    echo "⚠️  Windows: mingw-w64 not found, skipping"
    echo "   Install: brew install mingw-w64 (macOS) or apt install mingw-w64 (Linux)"
fi
echo ""

# Linux (requires GTK)
if command -v g++ &> /dev/null && pkg-config --exists gtk+-3.0; then
    echo "⚙️  Linux: Compiling libwebview_ext.so..."
    cd "$NATIVE_DIR"
    g++ -std=c++17 -fPIC -O3 -shared \
        $(pkg-config --cflags gtk+-3.0) \
        -o libwebview_ext.so webview_extensions_linux.cpp \
        $(pkg-config --libs gtk+-3.0)
    echo "✅ Linux: Done"
else
    echo "⚠️  Linux: g++ or GTK+3 not found, skipping"
    echo "   Install: apt install build-essential libgtk-3-dev (Ubuntu/Debian)"
fi
echo ""

echo "🎉 Extension build complete!"
echo ""
echo "📦 Built extensions:"
ls -lh "$NATIVE_DIR"/*.{dylib,dll,so} 2>/dev/null || echo "   (none yet)"

