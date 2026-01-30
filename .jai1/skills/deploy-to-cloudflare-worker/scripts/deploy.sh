#!/bin/bash

# Define the Wrangler command
if command -v wrangler &> /dev/null; then
    WRANGLER_CMD="wrangler"
else
    WRANGLER_CMD="npx wrangler"
fi

echo "Using Wrangler command: $WRANGLER_CMD"

# 1. Setup / Configuration Check
# Cloudflare Workers require a wrangler.toml (or json) to define the entry point and compatibility date.

if [ -f "wrangler.toml" ] || [ -f "wrangler.json" ]; then
    echo "✅ Configuration found (wrangler.toml/json)."
else
    echo "⚠️ No wrangler configuration found."
    echo "🛠️ Starting Worker initialization..."
    
    # Run init. This is interactive.
    # It will ask for project name, type (Hello World, etc.), and if to use TypeScript.
    $WRANGLER_CMD init
    
    # Check if init created the config
    if [ ! -f "wrangler.toml" ] && [ ! -f "wrangler.json" ]; then
        echo "❌ Initialization did not produce a config file or was cancelled."
        exit 1
    fi
fi

# 2. Deploy
echo "🚀 Deploying to Cloudflare Workers..."
$WRANGLER_CMD deploy
