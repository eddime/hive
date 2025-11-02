# 🔐 Code Signing Guide for macOS

Code signing removes Gatekeeper warnings when users download your app.

## Prerequisites

1. **Apple Developer Account** ($99/year)
2. **Developer ID Application Certificate** from Apple

## Getting Your Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Create a **Developer ID Application** certificate
4. Download and install it in Keychain Access
5. Find your signing identity:

```bash
security find-identity -v -p codesigning
```

Output example:
```
1) XXXXXXXXXX "Developer ID Application: Your Name (TEAMID123)"
```

Copy the **full identity string** in quotes.

## Configuration

### 1. Enable Code Signing

Edit `hive.config.ts`:

```typescript
macos: {
  icon: "assets/icon.icns",
  createAppBundle: true,
  codesign: {
    enabled: true,  // ← Enable it!
    identity: "Developer ID Application: Your Name (TEAMID123)",  // ← Your identity
    entitlements: "entitlements.plist",
  },
},
```

### 2. Entitlements (Already Configured)

The `entitlements.plist` file is already created with JIT permissions for Bun:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- JIT permissions for Bun runtime -->
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
    <!-- Allow dylib loading -->
    <key>com.apple.security.cs.allow-dyld-environment-variables</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>
```

## Building with Code Signing

```bash
# Single platform build
bun run build

# All platforms (macOS apps will be signed)
bun run build:all
```

Build output:
```
🔨 Compiling binary...
   🔐 Code signing .app bundle...
   📜 Using entitlements: entitlements.plist
   ✅ Code signing successful
   ✅ Signature verified
   ✅ hive.app bundle created with icon
```

## Verify Signature

```bash
# Verify the signature
codesign -vvv --verify dist/hive.app

# Check entitlements
codesign -d --entitlements - dist/hive.app

# Check certificate info
codesign -dvv dist/hive.app
```

Expected output:
```
dist/hive.app: valid on disk
dist/hive.app: satisfies its Designated Requirement
```

## Notarization (Optional, Recommended)

For distribution outside the App Store, you should also **notarize** your app:

```bash
# 1. Create a ZIP of your app
ditto -c -k --keepParent dist/hive.app hive.zip

# 2. Upload for notarization
xcrun notarytool submit hive.zip \
  --apple-id "your-email@example.com" \
  --team-id "TEAMID123" \
  --password "app-specific-password" \
  --wait

# 3. Staple the ticket to your app
xcrun stapler staple dist/hive.app

# 4. Verify notarization
xcrun stapler validate dist/hive.app
```

### App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign In > App-Specific Passwords
3. Generate a new password
4. Use it in the notarization command

## Troubleshooting

### "No identity found"

```bash
# List all certificates
security find-identity -v

# If empty, install your certificate from Keychain Access
```

### "Resource fork, Finder information, or similar detritus not allowed"

```bash
# Clean extended attributes
xattr -cr dist/hive.app
```

### "Code signing failed"

Check certificate validity:
```bash
security find-certificate -c "Developer ID Application" -p | openssl x509 -text
```

### Testing Without Certificate

To test the build process without signing (for development):

```typescript
// hive.config.ts
codesign: {
  enabled: false,  // ← Disable signing
}
```

## CI/CD Integration

For automated builds, store your signing identity and certificate:

```bash
# Export certificate (requires password)
security export -k ~/Library/Keychains/login.keychain-db \
  -t identities -f pkcs12 -o certificate.p12

# Import in CI (GitHub Actions example)
security import certificate.p12 -P $CERT_PASSWORD
```

## References

- [Bun Code Signing Docs](https://bun.sh/docs/bundler/executables#code-signing-on-macos)
- [Apple Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

## Summary

✅ **With Code Signing:**
- No Gatekeeper warnings
- Users trust your app
- Professional distribution

❌ **Without Code Signing:**
- "App from unidentified developer" warning
- Users must right-click > Open
- Not recommended for public distribution

