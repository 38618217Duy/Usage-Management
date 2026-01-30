---
description: Deploy project to Vercel with claimable link (no auth required)
---

# Vercel Deploy Workflow

Deploy your project to Vercel instantly without authentication. Returns a live preview URL and a claimable link to transfer to your Vercel account.

## Trigger

Use this workflow when:
- User asks to "deploy to Vercel"
- User asks to "deploy this project"
- User wants a "preview URL" or "live link"
- User says "push this live" or "deploy and give me the link"

## Workflow

### Step 1: Trigger Skill

Use the `skill:vercel-deploy-claimable` to deploy
The skill will handle packaging, framework detection, and deployment automatically.

### Step 2: Present Results

After successful deployment, display:

```
✅ Deployment successful!

🌐 Preview URL: https://skill-deploy-abc123.vercel.app
🔗 Claim URL: https://vercel.com/claim-deployment?code=...

View your site at the Preview URL.
To transfer this deployment to your Vercel account, visit the Claim URL.
```

### Troubleshooting

If deployment fails due to network restrictions:

```
❌ Deployment failed due to network restrictions.

To fix this:
1. Go to https://claude.ai/admin-settings/capabilities
2. Add *.vercel.com to the allowed domains
3. Try deploying again
```

## Quick Commands

| Command | Action |
|---------|--------|
| `/vercel-deploy` | Deploy current directory |
| `/vercel-deploy ./my-app` | Deploy specific folder |
| `/vercel-deploy ./dist.tgz` | Deploy existing tarball |

## Supported Frameworks

Auto-detected from `package.json`:
- **React**: Next.js, Gatsby, CRA, Remix
- **Vue**: Nuxt, Vitepress, Vuepress
- **Svelte**: SvelteKit, Svelte
- **Other**: Astro, Angular, Vite, and 20+ more

Static HTML projects (no `package.json`) are also supported.
