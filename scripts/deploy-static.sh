#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/dist"

echo "[deploy-static] Cleaning and building..."
rm -rf "$DIST_DIR"
cd "$PROJECT_DIR" && npm run build

echo "[deploy-static] Starting SSR server to capture rendered HTML..."
cd "$PROJECT_DIR"
node .output/server/index.mjs &
SERVER_PID=$!
sleep 3

echo "[deploy-static] Fetching rendered HTML..."
mkdir -p "$DIST_DIR/assets"

# Copy built client assets
cp -r "$PROJECT_DIR/.output/public/assets/"* "$DIST_DIR/assets/" 2>/dev/null || true

# Fetch the SSR-rendered HTML for the root page
curl -s http://localhost:3000/ > "$DIST_DIR/index.html" 2>/dev/null
echo "[deploy-static] index.html: $(wc -c < "$DIST_DIR/index.html") bytes"

# CSS link is already in the SSR output (rendered by the router's head handling)

# Copy as SPA fallback
cp "$DIST_DIR/index.html" "$DIST_DIR/404.html"

# Kill SSR server
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null || true

echo "[deploy-static] Ready in dist/"
ls -lh "$DIST_DIR/index.html"
echo "[deploy-static] Deploy with: node scripts/deploy-firebase.mjs"
