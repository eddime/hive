# 🔧 Windows Cache Problem - Lösung

## Problem

Die alte DLL (107KB, ohne Extensions) ist im Windows Temp-Ordner gecached:
```
C:\Users\edgar\AppData\Local\Temp\bunery-native\libwebview.dll
```

Die neue EXE extrahiert die DLL nur wenn sie **nicht existiert**!

## ✅ Lösung

### Option 1: Temp-Ordner leeren (Einfach!)

```cmd
# Cache löschen
rmdir /S /Q C:\Users\edgar\AppData\Local\Temp\bunery-native

# Dann neu starten
bunery-windows-x64.exe
```

### Option 2: Mit PowerShell

```powershell
Remove-Item -Path "$env:LOCALAPPDATA\Temp\bunery-native" -Recurse -Force
.\bunery-windows-x64.exe
```

### Option 3: Windows neu starten (Leert Temp automatisch)

```cmd
shutdown /r /t 0
```

## Warum passiert das?

Das `embedded-native.ts` Script prüft ob die DLL existiert:
```typescript
if (existsSync(outputPath)) {
  console.log(`✅ Native library already extracted: ${outputPath}`);
  process.env.WEBVIEW_PATH = outputPath;
  return outputPath;
}
```

Die alte DLL (107KB) existiert noch → wird nicht überschrieben!

## ✅ Nach dem Cache leeren

**Erwartetes Ergebnis:**
```
🔧 [DEBUG] About to extract native library...
🔧 [DEBUG] Platform: win32
✅ Native library extracted: C:\Users\edgar\AppData\Local\Temp\bunery-native\libwebview.dll
✅ WEBVIEW_PATH is now: C:\Users\...\libwebview.dll
🚀 Performance mode enabled          ← KEIN WARNING!
🎨 Icon set: assets/icon.ico         ← KEIN WARNING!
📏 Min size set: 800x600             ← KEIN WARNING!
```

Die neue DLL ist **319KB** und hat alle Extensions!

---

Made with 🥐 for Windows compatibility!

