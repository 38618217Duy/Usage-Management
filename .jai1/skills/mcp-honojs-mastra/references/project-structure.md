# Project Structure

## Recommended Directory Layout

```
my-mcp-server/
├── src/
│   ├── index.ts              # Entry point
│   ├── mastra/
│   │   └── index.ts          # Mastra instance configuration
│   ├── agents/
│   │   ├── index.ts          # Agent exports
│   │   ├── assistant.ts      # General assistant agent
│   │   └── specialist.ts     # Domain-specific agents
│   ├── tools/
│   │   ├── index.ts          # Tool exports
│   │   ├── api-tools.ts      # External API integrations
│   │   └── utility-tools.ts  # Helper tools
│   ├── mcp/
│   │   ├── server.ts         # MCPServer configuration
│   │   └── client.ts         # MCPClient for external servers
│   ├── workflows/
│   │   └── index.ts          # Complex multi-step workflows
│   └── lib/
│       ├── api-client.ts     # HTTP client utilities
│       └── validators.ts     # Input validation helpers
├── package.json
├── tsconfig.json
└── .env                      # Environment variables
```

---

## Essential Files

### `package.json`

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "mastra dev",
    "build": "mastra build",
    "start": "node .mastra/output/index.mjs"
  },
  "dependencies": {
    "@mastra/core": "latest",
    "@mastra/mcp": "latest",
    "@ai-sdk/openai": "latest",
    "hono": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "@types/node": "latest",
    "tsx": "latest"
  }
}
```

### `src/index.ts`

```typescript
import { mastra } from "./mastra";

// Start the server
const server = mastra.getServer();
server.start();

console.log("MCP Server running on http://localhost:4111");
```

---

## Environment Variables

### `.env`

```bash
# LLM Provider
OPENAI_API_KEY=sk-...

# Optional: Other providers
ANTHROPIC_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...

# Server config
PORT=4111
NODE_ENV=development
```

---

## Agent Organization Patterns

### Single Agent

```
agents/
└── assistant.ts    # One agent handles all tasks
```

### Multiple Specialized Agents

```
agents/
├── index.ts        # Export all agents
├── researcher.ts   # Research and information gathering
├── writer.ts       # Content creation
└── analyst.ts      # Data analysis
```

### Agent with Sub-agents (Networks)

```typescript
// agents/coordinator.ts
import { Agent } from "@mastra/core/agent";
import { researcher } from "./researcher";
import { writer } from "./writer";

export const coordinator = new Agent({
  name: "Coordinator",
  description: "Routes tasks to specialized agents",
  agents: [researcher, writer],
});
```
