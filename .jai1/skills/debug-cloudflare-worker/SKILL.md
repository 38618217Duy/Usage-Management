---
name: debug-cloudflare-worker
description: Guide for debugging Cloudflare Workers with effective logging strategies. Use this when you need to troubleshoot issues in Cloudflare Workers, trace API calls, or understand request/response flows.
---

# Debug Cloudflare Worker

## Overview

This skill provides patterns and best practices for debugging Cloudflare Workers using console logging. Since Cloudflare Workers run in a serverless environment without traditional debuggers, strategic logging is essential for troubleshooting.

## Viewing Logs

### Real-time Logs (Development)

```bash
# Stream live logs from your worker
wrangler tail

# Filter by status code
wrangler tail --status error

# Filter by search string
wrangler tail --search "ERROR"
```

### Dashboard Logs

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Click "Logs" tab
4. Enable "Real-time Logs" or view historical logs

## Logging Patterns

### 1. Flow Tracking Pattern

Use prefixes to track execution flow through your code:

```typescript
console.log('[ModuleName] Starting operation', { param1, param2 });
// ... operation code ...
console.log('[ModuleName] Operation completed', { result });
```

**Example:**
```typescript
console.log('[FeedbackReply] Starting DM notification flow', {
  feedbackId: feedback.feedback_id,
  accessKeyId: feedback.access_key_id,
  hasBotToken: !!env.DISCORD_BOT_TOKEN
});
```

### 2. Step-by-Step Pattern

For multi-step operations, log each step with clear markers:

```typescript
console.log('[Module] Step 1: Fetching data');
const data = await fetchData();
console.log('[Module] Step 1 complete:', { dataFound: !!data });

console.log('[Module] Step 2: Processing data');
const result = await processData(data);
console.log('[Module] Step 2 complete:', { success: result.success });
```

### 3. API Call Debugging Pattern

When debugging external API calls, log request and response details:

```typescript
// Log request
console.log('[APIClient] Request:', {
  method: 'POST',
  url: url,
  hasAuth: !!authToken,
  bodyPreview: JSON.stringify(body).substring(0, 200)
});

const response = await fetch(url, options);

// Log response - read body as text first to allow logging
const responseText = await response.text();
console.log('[APIClient] Response status:', response.status);
console.log('[APIClient] Response body:', responseText);

// Parse if needed
const data = JSON.parse(responseText);
```

**Important:** When logging response bodies, read as text first since you can only read the body once.

### 4. Conditional/Branch Logging Pattern

Log which code path is being taken:

```typescript
if (env.DISCORD_BOT_TOKEN) {
  console.log('[Notifier] Bot token configured, sending DM');
  // ... send DM
} else {
  console.log('[Notifier] Bot token NOT configured, skipping DM');
}
```

### 5. Error Context Pattern

When catching errors, log full context:

```typescript
try {
  await riskyOperation();
} catch (error) {
  console.error('[Module] Operation failed:', {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    context: { userId, operationType }
  });
}
```

## Best Practices

### DO ✅

- **Use consistent prefixes:** `[ModuleName]` helps filter logs
- **Log entry and exit points:** Track when functions start and complete
- **Include relevant IDs:** User IDs, request IDs, entity IDs for correlation
- **Log configuration state:** `hasBotToken: !!env.BOT_TOKEN` shows config without exposing secrets
- **Preview sensitive data:** `token.substring(0, 20) + '...'` for debugging without full exposure

### DON'T ❌

- **Don't log full secrets:** Never log API keys, tokens, or passwords
- **Don't log large objects as-is:** Cloudflare may truncate; stringify and substring if needed
- **Don't leave debug logs in production:** Remove or reduce after debugging
- **Don't use generic messages:** "Error occurred" is useless; include context

## Logging Levels

Use appropriate console methods:

| Method | Use Case |
|--------|----------|
| `console.log()` | General flow tracking, success states |
| `console.warn()` | Non-critical issues, fallback behavior |
| `console.error()` | Failures, exceptions, critical issues |

## Removing Debug Logs

After debugging, clean up logs to reduce noise:

1. **Remove detailed step logs** - Keep only error logging
2. **Simplify success paths** - Remove verbose success messages
3. **Keep error context** - Always log errors with context

**Before (Debug mode):**
```typescript
console.log('[Module] Step 1: Creating channel');
console.log('[Module] Step 1 response:', response);
console.log('[Module] Step 2: Sending message');
console.log('[Module] Step 2 response:', messageResponse);
console.log('[Module] All steps complete!');
```

**After (Production):**
```typescript
// Only log on failure
if (!response.ok) {
  console.error('[Module] Failed to create channel:', await response.text());
}
```

## Cloudflare-Specific Tips

### Object Logging Caveat

Cloudflare logs may truncate complex objects. To see full content:

```typescript
// Instead of this (may truncate):
console.log('[API] Response:', { status, body, headers });

// Do this (log separately as strings):
console.log('[API] Response status:', status);
console.log('[API] Response body:', JSON.stringify(body));
```

### Async Context

Remember that Workers use `waitUntil()` for background tasks. Logs from background tasks may appear after the response:

```typescript
ctx.waitUntil((async () => {
  console.log('[Background] Starting cleanup'); // This logs after response
  await cleanup();
  console.log('[Background] Cleanup complete');
})());
```

## Quick Debug Checklist

When debugging an issue:

1. [ ] Add `[ModuleName]` prefix to all logs
2. [ ] Log entry point with input parameters
3. [ ] Log each conditional branch taken
4. [ ] Log external API request/response details
5. [ ] Log exit point with result/error
6. [ ] Run `wrangler tail` to stream logs
7. [ ] Test the failing scenario
8. [ ] Analyze log output
9. [ ] Remove debug logs after fixing
