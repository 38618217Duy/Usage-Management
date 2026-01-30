# Deployment Guides

## Table of Contents

1. [Cloudflare Workers](#cloudflare-workers)
2. [Vercel Edge Functions](#vercel-edge-functions)
3. [AWS Lambda](#aws-lambda)
4. [Docker](#docker)
5. [Serverless Considerations](#serverless-considerations)

---

## Cloudflare Workers

### Using CloudflareDeployer

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import { CloudflareDeployer } from "@mastra/deployer-cloudflare";

export const mastra = new Mastra({
  agents: { myAgent },
  deployer: new CloudflareDeployer({
    scope: "my-app",
    projectName: "mcp-server",
  }),
});
```

### `wrangler.toml`

```toml
name = "mcp-server"
main = ".mastra/output/index.mjs"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
OPENAI_API_KEY = ""
```

### Deploy

```bash
npx mastra build
npx wrangler deploy
```

---

## Vercel Edge Functions

### Using VercelDeployer

```typescript
import { Mastra } from "@mastra/core/mastra";
import { VercelDeployer } from "@mastra/deployer-vercel";

export const mastra = new Mastra({
  agents: { myAgent },
  deployer: new VercelDeployer({
    teamSlug: "my-team",
    projectName: "mcp-server",
  }),
});
```

### `vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": ".mastra/output/index.mjs",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": ".mastra/output/index.mjs"
    }
  ]
}
```

### Deploy

```bash
npx mastra build
vercel --prod
```

---

## AWS Lambda

### Using Docker Container

```dockerfile
# Dockerfile
FROM public.ecr.aws/lambda/nodejs:20

COPY .mastra/output/ ${LAMBDA_TASK_ROOT}/
COPY package*.json ${LAMBDA_TASK_ROOT}/

RUN npm ci --omit=dev

CMD ["index.handler"]
```

### Lambda Handler

```typescript
// src/lambda.ts
import { mastra } from "./mastra";

export const handler = async (event: any) => {
  const server = mastra.getServer();
  return server.handleRequest(event);
};
```

### SAM Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  MCPServerFunction:
    Type: AWS::Serverless::Function
    Properties:
      PackageType: Image
      Timeout: 30
      MemorySize: 512
      Environment:
        Variables:
          OPENAI_API_KEY: !Ref OpenAIApiKey
    Metadata:
      DockerTag: latest
      DockerContext: .
      Dockerfile: Dockerfile
```

---

## Docker

### Standard Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 4111

CMD ["node", ".mastra/output/index.mjs"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mcp-server:
    build: .
    ports:
      - "4111:4111"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
```

### Build and Run

```bash
docker compose up -d
```

---

## Serverless Considerations

### Enable Serverless Mode

```typescript
// For stateless HTTP handling
mcpServer.startHTTP({ serverless: true });
```

### Limitations in Serverless

| Feature | Supported |
|---------|-----------|
| Tool calls | ✅ |
| Agent generation | ✅ |
| Streaming responses | ✅ |
| Elicitation requests | ❌ |
| Resource subscriptions | ❌ |
| Update notifications | ❌ |
| Persistent sessions | ❌ |

### Best Practices

1. **Cold Start Optimization**
   - Keep dependencies minimal
   - Use lightweight models when possible
   - Pre-warm functions for critical paths

2. **Timeout Configuration**
   - Set appropriate timeout (30-60s for LLM calls)
   - Use streaming for long responses

3. **Memory Configuration**
   - Minimum 512MB for basic agents
   - 1GB+ for complex workflows

4. **Environment Variables**
   - Store API keys in platform secrets
   - Never commit `.env` files

### Platform Comparison

| Platform | Cold Start | Max Timeout | Streaming |
|----------|------------|-------------|-----------|
| Cloudflare Workers | ~50ms | 30s (CPU time) | ✅ |
| Vercel Edge | ~50ms | 30s | ✅ |
| AWS Lambda | ~500ms | 15min | ✅ |
| Docker/VPS | None | Unlimited | ✅ |
