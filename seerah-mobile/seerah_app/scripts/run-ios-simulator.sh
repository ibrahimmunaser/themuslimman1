#!/bin/bash
set -euo pipefail

echo "=== TheMuslimMan — iOS Simulator ==="

if ! command -v flutter >/dev/null 2>&1; then
  echo "Flutter not found. Add it to PATH or install Flutter first."
  exit 1
fi

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

echo "Project: $APP_DIR"
flutter pub get

echo "Opening Simulator..."
open -a Simulator
sleep 8

echo "Building and launching (first run may take several minutes)..."
flutter run
