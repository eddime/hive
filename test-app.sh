#!/bin/bash
cd /Users/eddi/Desktop/gemshellbun
echo "=== Testing .app bundle ==="
echo "Running from: $(pwd)"
echo ""

# Run the app and capture output
dist/hive.app/Contents/MacOS/hive 2>&1 | tee /tmp/hive-test.log

echo ""
echo "=== Output saved to /tmp/hive-test.log ==="

