---
name: deploy-to-netlify
description: Automates deployment to Netlify. Handles initialization if configuration is missing, otherwise proceeds with production deployment. Use this when the user wants to deploy the project to Netlify.
---

# Deploy To Netlify

## Overview

This skill handles the deployment of the current project to Netlify. It checks for existing configuration and initializes the project if necessary before deploying to production.

## Prerequisites

- Node.js installed (for `npx`).
- User should be logged in to Netlify (run `npx netlify-cli login` if not).

## Usage

To use this skill, run the bundled deployment script from the project root:

```bash
./.jai1/skills/deploy-to-netlify/scripts/deploy.sh
```

### Behavior

1.  **Configuration Check**: The script checks for `netlify.toml` or a `.netlify` directory.
2.  **Initialization**: 
    - If configuration is missing, it runs `netlify init`. 
    - **Note**: This is an **interactive process**. You (the agent) may need to help the user answer prompts (e.g., "Create & configure a new site" vs "Connect to an existing site").
3.  **Deployment**: 
    - Once configured, or if configuration already exists, it runs `netlify deploy --prod`.

## Troubleshooting

- **Login Issues**: If the script fails due to authentication, ask the user to run `npx netlify-cli login` manually or via a separate command.
- **Interactive Hangs**: If `netlify init` hangs waiting for input, ensure you are using `send_command_input` to interact with it, or ask the user to complete the initialization manually.
