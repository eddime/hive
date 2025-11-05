# 🧹 Bunery Cleanup Guide

Dateien die aufgeräumt werden können, da wir jetzt `bunery-webview` mit integrierten Extensions nutzen!

## ❌ ZU LÖSCHEN: Alte Native Extensions (bunery/lib/native/)

Diese Dateien sind **überholt**, da die Extensions jetzt direkt in `bunery-webview` integriert sind:

```bash
cd /Users/eddi/Desktop/bunery/lib/native

# Alte separate Extension-Dateien (nicht mehr benötigt!)
rm libwebview_ext.dylib          # macOS Extension (alt)
rm libwebview_ext.dll            # Windows Extension (alt)
rm libwebview_perf.dylib         # Experimentelle Performance-Library (alt)
rm libwebview_v2.dylib           # Alte bunery-webview Version (alt)
rm libwebview.dylib.old          # Backup (alt)

# Extension Source-Dateien (jetzt in bunery-webview integriert)
rm webview_extensions.mm          # macOS Extensions Source
rm webview_extensions_windows.cpp # Windows Extensions Source
rm webview_extensions_linux.cpp   # Linux Extensions Source
```

**Grund:** Alle Extensions (setIcon, setMinSize, frameless, fullscreen, alwaysOnTop) sind jetzt **direkt in die webview-Library integriert**!

## ✅ ZU BEHALTEN: Aktuelle Webview-Libraries

Diese Dateien **MÜSSEN bleiben** (werden von embedded-native.ts eingebettet):

```bash
# Haupt-Webview Libraries (benötigt!)
libwebview.dylib        # macOS (von bunery-webview/build/)
libwebview.dll          # Windows (von bunery-webview/build/)
libwebview-x64.so       # Linux x64 (von bunery-webview/build/)
libwebview-arm64.so     # Linux ARM64 (von bunery-webview/build/)
```

## ❌ ZU LÖSCHEN: Alte Build-Scripts

```bash
cd /Users/eddi/Desktop/bunery/scripts

# Nicht mehr benötigt, da Extensions jetzt in webview-bun integriert
rm build-extensions.sh
```

**Grund:** Extensions werden jetzt mit `bunery-webview` gebaut, nicht separat!

## ❌ ZU LÖSCHEN: Überflüssige Dokumentation (bunery/)

```bash
cd /Users/eddi/Desktop/bunery

# Alte/redundante Dokumentation
rm BUNERY_WEBVIEW_SUCCESS.md       # Alter Test-Report
rm BUNERY_WEBVIEW_TEST.md          # Alter Test-Report
rm SINGLE_FILE_EXECUTABLE_TEST.md  # Veraltet (jetzt in README)
rm WEBVIEW_BUN_MIGRATION_SUCCESS.md # Migration abgeschlossen
rm CLEANUP_FIX.md                   # Alter Fix-Report
rm BYTECODE_CACHING.md              # Jetzt in bunery-webview/PERFORMANCE.md
rm EMBEDDED_NATIVE.md               # Redundant (info in README)
rm NATIVE_LIBRARY_CONFIG.md         # Redundant
rm CODESIGNING.md                   # Kann ins README integriert werden
rm WINDOWS_ICON.md                  # Kann ins README integriert werden
```

**Behalten:**
- `README.md` (Haupt-Dokumentation)
- `API.md` (API-Referenz)
- `BINDINGS.md` (Binding-System)
- `GETTING_STARTED.md` (Tutorial)
- `PROJECT_OVERVIEW.md` (Architektur)
- `LICENSE`

## ❌ ZU LÖSCHEN: Test-Dateien im Root

```bash
cd /Users/eddi/Desktop/bunery

# Alte Test-Dateien (nicht mehr benötigt)
rm test-bytecode                    # Test-Binary (alt)
rm test-direct-webview.ts           # Test-Script (alt)
rm test-webview.ts                  # Test-Script (alt)
```

## ❌ ZU LÖSCHEN: Ungenutzte Packages

```bash
cd /Users/eddi/Desktop/bunery

# Ungenutzte Monorepo-Struktur
rm -rf packages/
```

**Grund:** Bunery ist jetzt ein einzelnes Package, kein Monorepo mehr.

## ❌ ZU LÖSCHEN: Build-Artefakte (bunery-webview/)

```bash
cd /Users/eddi/Desktop/bunery-webview/webview

# Alle CMake Build-Artefakte können gelöscht werden
rm -rf build/
```

**Grund:** Diese werden bei jedem Build neu generiert. Nur das Endergebnis in `bunery-webview/build/` ist wichtig!

## 🧹 Komplette Cleanup-Commands

### Option 1: Automatisches Cleanup (Sicher)

```bash
#!/bin/bash
cd /Users/eddi/Desktop/bunery

echo "🧹 Cleaning up Bunery project..."

# Alte Extensions
rm -f lib/native/libwebview_ext.dylib
rm -f lib/native/libwebview_ext.dll
rm -f lib/native/libwebview_perf.dylib
rm -f lib/native/libwebview_v2.dylib
rm -f lib/native/libwebview.dylib.old
rm -f lib/native/webview_extensions*.{mm,cpp}

# Alte Scripts
rm -f scripts/build-extensions.sh

# Alte Docs
rm -f BUNERY_WEBVIEW_SUCCESS.md
rm -f BUNERY_WEBVIEW_TEST.md
rm -f SINGLE_FILE_EXECUTABLE_TEST.md
rm -f WEBVIEW_BUN_MIGRATION_SUCCESS.md
rm -f CLEANUP_FIX.md
rm -f BYTECODE_CACHING.md
rm -f EMBEDDED_NATIVE.md
rm -f NATIVE_LIBRARY_CONFIG.md
rm -f CODESIGNING.md
rm -f WINDOWS_ICON.md

# Test-Dateien
rm -f test-bytecode
rm -f test-direct-webview.ts
rm -f test-webview.ts

# Ungenutzte Packages
rm -rf packages/

echo "✅ Cleanup complete!"
echo ""
echo "📊 Saved space:"
du -sh lib/native/ 2>/dev/null || echo "  lib/native/: cleaned"
```

### Option 2: CMake Build-Artefakte (bunery-webview)

```bash
#!/bin/bash
cd /Users/eddi/Desktop/bunery-webview

echo "🧹 Cleaning CMake build artifacts..."
rm -rf webview/build/

echo "✅ CMake cleanup complete!"
echo "💡 Run 'bun run scripts/build.ts' to rebuild"
```

## 📦 Nach dem Cleanup

**Verbleibende Struktur (bunery/):**
```
bunery/
├── README.md                    # ✅ Haupt-Dokumentation
├── API.md                       # ✅ API-Referenz
├── BINDINGS.md                  # ✅ Binding-System
├── GETTING_STARTED.md           # ✅ Tutorial
├── PROJECT_OVERVIEW.md          # ✅ Architektur
├── bunery.config.ts             # ✅ Konfiguration
├── cli.ts                       # ✅ CLI
├── package.json                 # ✅ Dependencies
├── assets/                      # ✅ Icons
├── lib/
│   ├── native/
│   │   ├── libwebview.dylib    # ✅ Haupt-Library (macOS)
│   │   ├── libwebview.dll      # ✅ Haupt-Library (Windows)
│   │   ├── libwebview-x64.so   # ✅ Haupt-Library (Linux x64)
│   │   └── libwebview-arm64.so # ✅ Haupt-Library (Linux ARM64)
│   ├── embedded-libs-data.ts   # ✅ Embedded Base64 Data
│   ├── embedded-native.ts      # ✅ Native Library Loader
│   ├── webview-wrapper.ts      # ✅ Webview API Wrapper
│   ├── bindings.ts             # ✅ Binding System
│   └── asset-server.ts         # ✅ Asset Server
├── scripts/
│   ├── build.ts                # ✅ Single-platform Build
│   ├── build-all.ts            # ✅ Cross-platform Build
│   ├── build-frontend.ts       # ✅ Frontend Builder
│   ├── dev.ts                  # ✅ Dev Server
│   ├── embed-native-libs.ts    # ✅ Native Embedder
│   └── patch-webview-bun.ts    # ✅ Bytecode Patcher
└── src/
    ├── main.ts                 # ✅ Entry Point
    ├── backend/                # ✅ Backend Logic
    └── frontend/               # ✅ Frontend Assets
```

**Verbleibende Struktur (bunery-webview/):**
```
bunery-webview/
├── README.md                   # ✅ Original webview-bun README
├── BUNERY_BUILD.md             # ✅ Bunery Build Guide
├── PERFORMANCE.md              # ✅ Performance Optimizations
├── package.json                # ✅ Dependencies
├── build/
│   ├── libwebview.dylib       # ✅ Compiled Libraries
│   ├── libwebview.dll
│   ├── libwebview-x64.so
│   └── libwebview-arm64.so
├── src/
│   ├── ffi.ts                 # ✅ FFI Bindings (optimiert)
│   ├── webview.ts             # ✅ Webview Class (mit Extensions)
│   └── index.ts               # ✅ Exports
├── scripts/
│   └── build.ts               # ✅ Build Script
└── webview/                   # ✅ Upstream webview (Git Submodule)
    └── core/include/webview/
        └── c_api_impl.hh      # ✅ Mit Bunery Extensions!
```

## 💾 Geschätzter Speicherplatz

**Vor Cleanup:**
- `lib/native/`: ~2.5 MB
- Alte Docs: ~150 KB
- Test-Dateien: ~1 MB
- `packages/`: ~50 KB
- CMake Artefakte: ~50 MB
- **Total: ~53.7 MB**

**Nach Cleanup:**
- `lib/native/`: ~850 KB (nur Haupt-Libraries)
- Docs: ~50 KB (nur relevante)
- **Total: ~900 KB**

**Gespart: ~52.8 MB** 🎉

## ⚠️ NICHT LÖSCHEN!

Diese Dateien **NIE** löschen:

- `lib/native/libwebview.{dylib,dll,so}` - Haupt-Libraries
- `lib/embedded-libs-data.ts` - Embedded Native Data
- `lib/embedded-native.ts` - Native Loader
- `scripts/embed-native-libs.ts` - Embedder
- `scripts/patch-webview-bun.ts` - Bytecode Patcher
- Alle Dateien in `src/` - Source Code!

## 📝 Nach dem Cleanup

1. **Libraries aktualisieren:**
   ```bash
   cd /Users/eddi/Desktop/bunery-webview
   bun run scripts/build.ts  # Rebuild Libraries
   
   cd /Users/eddi/Desktop/bunery
   cp ../bunery-webview/build/*.{dylib,dll,so} lib/native/
   bun scripts/embed-native-libs.ts  # Re-embed
   ```

2. **Testen:**
   ```bash
   bun run dev              # Dev mode testen
   bun run bake all         # Production builds testen
   ```

3. **Git Commit:**
   ```bash
   git add -A
   git commit -m "🧹 Clean up obsolete files after bunery-webview integration"
   git push
   ```

---

Made with 🥐🧹 for a cleaner Bunery!

