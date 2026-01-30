---
name: deploy-to-cloudflare-pages
description: Automates deployment to Cloudflare Pages. Detects configuration, initializes if missing, and handles directory selection for deployment. Use this when the user wants to deploy a static site or frontend to Cloudflare Pages.
---

# Deploy To Cloudflare Pages

## Overview

This skill handles the deployment of the current project to Cloudflare Pages using Direct Uploads via `wrangler`.

## Prerequisites

- Node.js installed.
- User should be logged in to Cloudflare (run `npx wrangler login` if not).

## Usage

Run the bundled deployment script:

```bash
./.jai1/skills/deploy-to-cloudflare-pages/scripts/deploy.sh
```

### Script Logic

1.  **Configuration Check**: Checks for `wrangler.toml`.
2.  **Initialization**: If config is missing, runs `wrangler init` (interactive) to guide the user in setting up the project configuration locally.
3.  **Directory Detection**: Attempts to auto-detect the build output directory (`dist`, `build`, `out`, `public`). If unsuccessful, it asks the user.
4.  **Deployment**: Runs `wrangler pages deploy <directory>`.

## Troubleshooting

- **Auth Errors**: Run `npx wrangler login`.
- **Project Name Mismatch**: Ensure the project name in `wrangler.toml` matches the one in Cloudflare dashboard if it was created manually.
- **Build Failures**: This script deploys the *output* directory. Ensure the project is built (e.g., `npm run build`) before deploying.
