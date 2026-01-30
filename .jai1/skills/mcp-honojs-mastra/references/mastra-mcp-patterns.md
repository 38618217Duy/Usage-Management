# Mastra MCP Patterns

## Table of Contents

1. [Agent Patterns](#agent-patterns)
2. [Tool Patterns](#tool-patterns)
3. [MCPServer Configuration](#mcpserver-configuration)
4. [MCPClient Usage](#mcpclient-usage)
5. [Server Adapters](#server-adapters)
6. [Memory and Context](#memory-and-context)
7. [Workflow Integration](#workflow-integration)

---

## Agent Patterns

### Basic Agent

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const basicAgent = new Agent({
  name: "Basic Agent",
  description: "A simple AI assistant",
  instructions: "You are a helpful assistant.",
  model: openai("gpt-4o-mini"),
});
```

### Agent with Tools

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { searchTool, calculatorTool } from "../tools";

export const toolAgent = new Agent({
  name: "Tool Agent",
  description: "Agent with tool capabilities",
  instructions: `You can search the web and perform calculations.
    Use tools when appropriate.`,
  model: openai("gpt-4o"),
  tools: { searchTool, calculatorTool },
});
```

### Agent with Memory

```typescript
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";

const memory = new Memory({
  storage: new LibSQLStore({
    url: "file:./memory.db",
  }),
});

export const memoryAgent = new Agent({
  name: "Memory Agent",
  description: "Remembers conversation history",
  memory,
  model: openai("gpt-4o-mini"),
});
```

### Agent Network

```typescript
import { Agent } from "@mastra/core/agent";

const researcher = new Agent({
  name: "Researcher",
  description: "Finds information",
});

const writer = new Agent({
  name: "Writer", 
  description: "Creates content",
});

export const coordinator = new Agent({
  name: "Coordinator",
  description: "Routes tasks to specialized agents",
  agents: [researcher, writer],
});

// Use network
const response = await coordinator.network({
  messages: [{ role: "user", content: "Research and write about AI" }],
});
```

---

## Tool Patterns

### Basic Tool

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const greetTool = createTool({
  id: "greet",
  description: "Greets a person by name",
  inputSchema: z.object({
    name: z.string().describe("Person's name"),
  }),
  execute: async ({ context }) => {
    return `Hello, ${context.name}!`;
  },
});
```

### Tool with Output Schema

```typescript
export const fetchDataTool = createTool({
  id: "fetch-data",
  description: "Fetches data from API",
  inputSchema: z.object({
    endpoint: z.string(),
  }),
  outputSchema: z.object({
    data: z.any(),
    status: z.number(),
  }),
  execute: async ({ context }) => {
    const response = await fetch(context.endpoint);
    return {
      data: await response.json(),
      status: response.status,
    };
  },
});
```

### Tool with Annotations

```typescript
export const deleteTool = createTool({
  id: "delete-item",
  description: "Deletes an item",
  inputSchema: z.object({
    id: z.string(),
  }),
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
  execute: async ({ context }) => {
    // Delete logic
  },
});
```

---

## MCPServer Configuration

### Basic MCPServer

```typescript
import { MCPServer } from "@mastra/mcp";
import { myAgent } from "../agents";
import { myTools } from "../tools";

export const mcpServer = new MCPServer({
  id: "my-server",
  name: "My MCP Server",
  version: "1.0.0",
  agents: { myAgent },
  tools: myTools,
});
```

### MCPServer with Workflows

```typescript
import { MCPServer } from "@mastra/mcp";
import { dataProcessingWorkflow } from "../workflows";

export const mcpServer = new MCPServer({
  id: "workflow-server",
  name: "Workflow MCP Server",
  version: "1.0.0",
  workflows: { dataProcessingWorkflow },
});
```

### Register MCPServer in Mastra

```typescript
import { Mastra } from "@mastra/core/mastra";
import { mcpServer } from "./mcp/server";

export const mastra = new Mastra({
  mcpServers: { mcpServer },
});
```

---

## MCPClient Usage

### Connect to External Servers

```typescript
import { MCPClient } from "@mastra/mcp";

export const mcpClient = new MCPClient({
  id: "external-client",
  servers: {
    // Local package
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem"],
    },
    // Remote server
    api: {
      url: new URL("https://mcp.example.com"),
    },
  },
});
```

### Use MCPClient Tools with Agent

```typescript
import { Agent } from "@mastra/core/agent";
import { mcpClient } from "../mcp/client";

export const externalToolAgent = new Agent({
  name: "External Tool Agent",
  tools: await mcpClient.getTools(),
});
```

### Dynamic Tool Loading

```typescript
// For use with .generate() or .stream()
const toolsets = await mcpClient.getToolsets();

const response = await agent.generate({
  messages: [{ role: "user", content: "Query" }],
  toolsets,
});
```

---

## Server Adapters

### @mastra/hono Adapter

```typescript
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { HonoBindings, HonoVariables, MastraServer } from "@mastra/hono";
import { mastra } from "./mastra";

const app = new Hono<{ Bindings: HonoBindings; Variables: HonoVariables }>();

const server = new MastraServer({ app, mastra });
await server.init();

serve({ fetch: app.fetch, port: 4111 }, () => {
  console.log("Server running on port 4111");
});
```

### @mastra/express Adapter

```typescript
import express from "express";
import { MastraServer } from "@mastra/express";
import { mastra } from "./mastra";

const app = express();
app.use(express.json());

const server = new MastraServer({ app, mastra });
await server.init();

app.listen(4111, () => {
  console.log("Server running on port 4111");
});
```

### MastraServer Options

```typescript
const server = new MastraServer({
  app,
  mastra,
  prefix: "/api/v1",            // Route prefix
  openapiPath: "/openapi.json", // OpenAPI spec
  streamOptions: { redact: true },
});
```

### Manual Initialization Flow

```typescript
const server = new MastraServer({ app, mastra });

// Step 1: Context middleware (attaches Mastra to requests)
server.registerContextMiddleware();

// Step 2: Auth middleware (if configured)
server.registerAuthMiddleware();

// Step 3: Register routes (agents, workflows, MCP)
await server.registerRoutes();
```

---

## Memory and Context

### Conversation History

```typescript
import { Memory } from "@mastra/memory";

const memory = new Memory({
  options: {
    lastMessages: 10,  // Keep last 10 messages
  },
});
```

### Semantic Recall (RAG)

```typescript
import { Memory } from "@mastra/memory";
import { embed } from "@mastra/rag";

const memory = new Memory({
  options: {
    semanticRecall: {
      enabled: true,
      topK: 5,
    },
  },
});
```

### Working Memory

```typescript
const agent = new Agent({
  name: "Stateful Agent",
  memory,
  workingMemory: {
    enabled: true,
    template: `
      User preferences: {{preferences}}
      Current task: {{currentTask}}
    `,
  },
});
```

---

## Workflow Integration

### Basic Workflow

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const fetchStep = createStep({
  id: "fetch",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ data: z.any() }),
  execute: async ({ context }) => {
    const response = await fetch(context.url);
    return { data: await response.json() };
  },
});

const processStep = createStep({
  id: "process",
  inputSchema: z.object({ data: z.any() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ context }) => {
    return { result: JSON.stringify(context.data) };
  },
});

export const dataWorkflow = createWorkflow({
  id: "data-workflow",
  inputSchema: z.object({ url: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(fetchStep)
  .then(processStep);
```

### Workflow with Agent Step

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { myAgent } from "../agents";

const analyzeStep = createStep({
  id: "analyze",
  execute: async ({ context }) => {
    const response = await myAgent.generate({
      messages: [{ 
        role: "user", 
        content: `Analyze: ${context.data}` 
      }],
    });
    return { analysis: response.text };
  },
});
```
