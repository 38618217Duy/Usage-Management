---
name: deploy-to-cloudflare-worker
description: Automates deployment to Cloudflare Workers. Handles project initialization and deployment. Use this when the user wants to deploy a serverless script or worker application to Cloudflare.
---

# Deploy To Cloudflare Worker

## Overview

This skill handles the deployment of the current project as a Cloudflare Worker.

## Prerequisites

- Node.js installed.
- User should be logged in to Cloudflare (run `npx wrangler login` if not).

## Usage

Run the bundled deployment script:

```bash
./.jai1/skills/deploy-to-cloudflare-worker/scripts/deploy.sh
```

### Behavior

1.  **Configuration Check**: Checks for `wrangler.toml` or `wrangler.json`.
2.  **Initialization**: 
    - If configuration is missing, it runs `wrangler init`.
    - **Note**: This is interactive. You may need to guide the user to select the appropriate template (e.g., "Hello World" or "scheduled worker") if they don't have code yet.
3.  **Deployment**: 
    - Runs `wrangler deploy`.

## Troubleshooting

- **Login Issues**: Run `npx wrangler login`.
- **Entry Point Errors**: If deploy fails saying "main" is missing, check `wrangler.toml` to ensure the `main` field points to the correct script file (e.g., `src/index.js` or `src/index.ts`).
