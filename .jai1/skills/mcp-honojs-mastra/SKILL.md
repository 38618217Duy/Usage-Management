---
name: mcp-honojs-mastra
description: Guide for building MCP (Model Context Protocol) servers using HonoJS and Mastra AI. Use when creating AI-powered APIs, deploying agents as serverless functions, or building MCP servers that expose tools and workflows. Covers @mastra/hono adapter, MastraServer configuration, agent creation, and deployment to Cloudflare Workers, Vercel Edge, or AWS Lambda.
---

# MCP Server with HonoJS and Mastra AI

Build production-ready MCP servers using the official **@mastra/hono** adapter for seamless HonoJS integration.

## Quick Start

### 1. Create Project

```bash
mkdir my-mcp-server && cd my-mcp-server
npm init -y
npm install @mastra/core@beta @mastra/mcp@beta @mastra/hono@beta hono @hono/node-server @ai-sdk/openai zod
npm install -D typescript @types/node tsx
```

### 2. Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

### 3. Create Basic Structure

```
src/
├── index.ts          # Main entry point
├── mastra/
│   └── index.ts      # Mastra instance
├── agents/
│   └── assistant.ts  # AI agents
├── tools/
│   └── index.ts      # Custom tools
└── mcp/
    └── server.ts     # MCP server config
```

---

## Core Components

### Mastra Instance (`src/mastra/index.ts`)

```typescript
import { Mastra } from "@mastra/core/mastra";
import { assistantAgent } from "../agents/assistant";
import { mcpServer } from "../mcp/server";

export const mastra = new Mastra({
  agents: { assistantAgent },
  mcpServers: { mcpServer },
  server: {
    port: 4111,
    timeout: 30000,
  },
});
```

### Agent Definition (`src/agents/assistant.ts`)

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { myTools } from "../tools";

export const assistantAgent = new Agent({
  name: "Assistant",
  description: "A helpful AI assistant",
  instructions: `You are a helpful assistant that can answer questions
    and use tools to complete tasks.`,
  model: openai("gpt-4o-mini"),
  tools: myTools,
});
```

### MCPServer (`src/mcp/server.ts`)

```typescript
import { MCPServer } from "@mastra/mcp";
import { assistantAgent } from "../agents/assistant";
import { myTools } from "../tools";

export const mcpServer = new MCPServer({
  id: "my-mcp-server",
  name: "My MCP Server",
  version: "1.0.0",
  agents: { assistantAgent },
  tools: myTools,
});
```

### Custom Tools (`src/tools/index.ts`)

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    condition: z.string(),
  }),
  execute: async ({ context }) => {
    // Implementation
    return {
      temperature: 22,
      condition: "Sunny",
    };
  },
});

export const myTools = { weatherTool };
```

---

## Running the Server

### Development

```bash
npx tsx src/index.ts
```

### Using Mastra CLI

```bash
npx mastra dev
```

### Build for Production

---

## @mastra/hono Adapter

Use the official Hono adapter for full control over your server setup, custom middleware, and authentication.

### Basic Setup (`src/index.ts`)

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { HonoBindings, HonoVariables, MastraServer } from "@mastra/hono";
import { mastra } from "./mastra";

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>();

const server = new MastraServer({ app, mastra });
await server.init();

serve({ fetch: app.fetch, port: 4111 }, () => {
  console.log("MCP Server running on http://localhost:4111");
});
```

### Manual Initialization

For custom middleware ordering, call each method separately:

```typescript
const server = new MastraServer({ app, mastra });

// Your middleware first
app.use(loggingMiddleware);

// 1. Register context middleware (attaches Mastra to requests)
server.registerContextMiddleware();

// Middleware that needs Mastra context
app.use(customMiddleware);

// 2. Register auth middleware (if configured)
server.registerAuthMiddleware();

// 3. Register all Mastra routes (agents, workflows, MCP)
await server.registerRoutes();

// Your routes after Mastra
app.get("/health", (c) => c.json({ status: "ok" }));
```

### Configuration Options

```typescript
const server = new MastraServer({
  app,
  mastra,
  prefix: "/api/v1",           // Route prefix (default: /api)
  openapiPath: "/openapi.json", // OpenAPI spec endpoint
  streamOptions: {
    redact: true,              // Redact sensitive data in streams
  },
});
```

### Adding Custom Routes

```typescript
// Routes added AFTER init() have access to Mastra context
await server.init();

app.get("/custom", (c) => {
  const mastraCtx = c.get("mastra"); // Access Mastra instance
  return c.json({ agents: Object.keys(mastraCtx.agents) });
});
```

---

## Advanced Topics

For detailed patterns and examples, see:

- **[Project Structure](./references/project-structure.md)**: Complete file organization
- **[Mastra MCP Patterns](./references/mastra-mcp-patterns.md)**: Agent, tool, and MCPServer patterns
- **[Deployment Guides](./references/deployment-guides.md)**: Deploy to Cloudflare, Vercel, AWS Lambda

---

## MCPClient Usage

Connect to external MCP servers:

```typescript
import { MCPClient } from "@mastra/mcp";

const mcpClient = new MCPClient({
  id: "external-mcp",
  servers: {
    // Local package via npx
    wikipedia: {
      command: "npx",
      args: ["-y", "wikipedia-mcp"],
    },
    // Remote HTTP server
    weather: {
      url: new URL("https://api.example.com/mcp"),
    },
  },
});

// Use with agent
const agent = new Agent({
  name: "Multi-Tool Agent",
  tools: await mcpClient.getTools(),
});
```

---

## Serverless Deployment

Enable stateless mode for serverless:

```typescript
mcpServer.startHTTP({ serverless: true });
```

**Limitations in serverless mode:**
- No elicitation requests
- No resource subscriptions
- No update notifications

See [Deployment Guides](./references/deployment-guides.md) for platform-specific configs.
