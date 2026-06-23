#!/usr/bin/env bash
set -euo pipefail

# Wait for device fully booted
adb wait-for-device
while [ -z "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" ]; do
  sleep 2
done
echo "Device booted"

adb shell input keyevent 82

# Install Expo Go (ignore failure — tests may still run if already installed)
adb install -r /tmp/expo-go.apk 2>&1 || echo "Expo Go install failed — continuing"

# Grant runtime permissions
adb shell pm grant host.exp.exponent android.permission.CAMERA 2>/dev/null || true
adb shell pm grant host.exp.exponent android.permission.READ_EXTERNAL_STORAGE 2>/dev/null || true
adb shell pm grant host.exp.exponent android.permission.WRITE_EXTERNAL_STORAGE 2>/dev/null || true

# Run the test suite
SUITE="${SUITE:-all}"
cd e2e
if [ "$SUITE" = "all" ]; then
  npm run test:ci || true
else
  npm run "test:${SUITE}" || true
fi
