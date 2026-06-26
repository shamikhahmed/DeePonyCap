#!/usr/bin/env bash
# Archive current DeePonyCap build for version-pinned PWA installs.
# Usage: ./scripts/archive-version.sh 2.9.0
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VER="${1:?Usage: archive-version.sh X.Y.Z}"
DEST="$ROOT/releases/v$VER"

mkdir -p "$DEST"
for item in index.html landing.html privacy.html changelog.html manifest.json icon.svg icon-192.png icon-512.png icon-1024.png VERSION.json css js public; do
  if [[ -e "$ROOT/$item" ]]; then
    cp -R "$ROOT/$item" "$DEST/"
  fi
done

# Fix relative paths in archived index if needed (same structure = no change)
echo "Archived v$VER → releases/v$VER/"
echo "Users can install from: /DeePonyCap/releases/v$VER/"
