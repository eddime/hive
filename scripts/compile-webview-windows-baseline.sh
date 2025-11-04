#!/bin/bash
# 🥐 Compile libwebview.dll without AVX for maximum CPU compatibility

set -e

echo "🔨 Compiling libwebview.dll (Windows baseline - no AVX)"

# Clone webview if not exists
if [ ! -d "webview-src" ]; then
  echo "📦 Cloning webview..."
  git clone --depth=1 https://github.com/webview/webview.git webview-src
fi

cd webview-src

# Compile with MinGW (cross-compile from macOS)
echo "⚙️  Compiling with baseline flags (no AVX)..."

# Install MinGW if not exists
if ! command -v x86_64-w64-mingw32-g++ &> /dev/null; then
  echo "📦 Installing MinGW..."
  brew install mingw-w64
fi

# Compile
x86_64-w64-mingw32-g++ \
  -shared \
  -o ../lib/native/libwebview-baseline.dll \
  -DWEBVIEW_EDGE=1 \
  -DWEBVIEW_API=__declspec\(dllexport\) \
  -std=c++17 \
  -O2 \
  -march=x86-64 \
  -mtune=generic \
  -mno-avx \
  -mno-avx2 \
  -mno-sse4 \
  -msse2 \
  webview.cc \
  -lole32 -lcomctl32 -loleaut32 -luuid -lgdi32 -static-libgcc -static-libstdc++

echo "✅ Compiled: lib/native/libwebview-baseline.dll"
echo "📦 Size: $(du -h ../lib/native/libwebview-baseline.dll | cut -f1)"
echo ""
echo "💡 Now copy this to lib/native/libwebview.dll and rebuild"

