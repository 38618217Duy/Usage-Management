#!/bin/bash

# Define the Netlify command
# Prefer global install, fall back to npx
if command -v netlify &> /dev/null; then
    NETLIFY_CMD="netlify"
else
    NETLIFY_CMD="npx netlify-cli"
fi

echo "Using Netlify command: $NETLIFY_CMD"

# Check for existing configuration
# netlify.toml is common, but .netlify folder contains the state (siteId)
if [ -f "netlify.toml" ] || [ -d ".netlify" ]; then
    echo "✅ Netlify configuration found."
    echo "🚀 specific site ID or configuration detected."
else
    echo "⚠️ No Netlify configuration found."
    echo "🛠️ Starting Netlify initialization..."
    
    # Run init. This is interactive.
    $NETLIFY_CMD init
    
    # Check if init was successful
    if [ $? -ne 0 ]; then
        echo "❌ Netlify initialization failed or was cancelled."
        exit 1
    fi
fi

echo "🚀 Deploying to production..."
$NETLIFY_CMD deploy --prod
