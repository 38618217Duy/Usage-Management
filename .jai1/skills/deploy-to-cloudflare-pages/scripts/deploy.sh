#!/bin/bash

# Define the Wrangler command
if command -v wrangler &> /dev/null; then
    WRANGLER_CMD="wrangler"
else
    WRANGLER_CMD="npx wrangler"
fi

echo "Using Wrangler command: $WRANGLER_CMD"

# 1. Setup / Configuration Check
# Cloudflare Pages doesn't strictly require a local config file for Direct Uploads if just using CLI,
# but having one is best practice. We check for a project name mapping or config.
# `wrangler pages project list` could check existence, but it depends on auth.
# Simpler approach: Check for wrangler.toml. If not, ask to create a project config.

if [ -f "wrangler.toml" ]; then
    echo "✅ Configuration found (wrangler.toml)."
else
    echo "⚠️ No wrangler.toml found."
    echo "🛠️ You may need to initialize a project or specify a project name during deployment."
    echo "Running 'wrangler init' to help setup (select 'Pages' if prompted)..."
    # wrangler init is generic now and can setup pages
    $WRANGLER_CMD init
fi

# 2. Determine Build Directory
# Common build directories
if [ -d "dist" ]; then
    BUILD_DIR="dist"
elif [ -d "build" ]; then
    BUILD_DIR="build"
elif [ -d "out" ]; then
    BUILD_DIR="out"
elif [ -d "public" ]; then
    BUILD_DIR="public"
else
    echo "⚠️ Could not auto-detect build directory (dist, build, out, public)."
    read -p "Please enter the directory to deploy (e.g., '.' for current): " BUILD_DIR
    if [ -z "$BUILD_DIR" ]; then 
        BUILD_DIR="." 
    fi
fi

echo "📂 Deploying directory: $BUILD_DIR"

# 3. Deploy
echo "🚀 Deploying to Cloudflare Pages..."
# logic: if project name is known from config, it uses it. If not, it might prompt.
$WRANGLER_CMD pages deploy "$BUILD_DIR"

