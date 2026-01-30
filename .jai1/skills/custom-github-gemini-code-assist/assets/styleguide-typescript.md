# TypeScript Style Guide - Security & High-Impact Focus

## Review Priority

> ⚠️ **For teams without dedicated reviewers**: This guide focuses on **security vulnerabilities, critical bugs, and high-impact issues** only. Minor style issues should be ignored.

### Critical (Must Fix)
1. **Security vulnerabilities** - Injection attacks, XSS, authentication bypass, SSRF
2. **Data exposure** - Sensitive data in logs, responses, or client-side code
3. **Critical bugs** - Data loss, corruption, or system crashes
4. **Type safety violations** - Using `any` for security-sensitive data

### High (Should Fix)
1. **Authorization issues** - Missing permission checks
2. **Input validation** - Unvalidated user input
3. **Error disclosure** - Stack traces or internal errors exposed
4. **Resource leaks** - Unclosed connections, memory leaks

### Ignore
- Code formatting and style
- Variable naming preferences
- Import ordering
- Minor refactoring suggestions

---

## Security Checklist

### SQL Injection Prevention
```typescript
// ❌ CRITICAL: SQL Injection
const users = await db.query(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ Use parameterized queries
const users = await db.query('SELECT * FROM users WHERE name = $1', [name]);

// ✅ Use ORM with proper escaping (Prisma, TypeORM, Drizzle)
const users = await prisma.user.findMany({
  where: { name },
});
```

### XSS Prevention (Next.js/React)
```typescript
// ❌ CRITICAL: XSS vulnerability
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ React auto-escapes by default
<div>{userInput}</div>

// ✅ If HTML is needed, sanitize first
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
```

### Server-Side Request Forgery (SSRF)
```typescript
// ❌ CRITICAL: SSRF vulnerability
app.get('/fetch', async (c) => {
  const url = c.req.query('url');
  const response = await fetch(url); // User controls URL!
  return c.json(await response.json());
});

// ✅ Validate and whitelist URLs
const ALLOWED_DOMAINS = ['api.trusted.com', 'cdn.trusted.com'];

app.get('/fetch', async (c) => {
  const url = new URL(c.req.query('url') ?? '');
  
  if (!ALLOWED_DOMAINS.includes(url.hostname)) {
    return c.json({ error: 'Invalid URL' }, 400);
  }
  
  const response = await fetch(url.toString());
  return c.json(await response.json());
});
```

### Authentication & Authorization
```typescript
// ❌ CRITICAL: Missing authentication
app.get('/api/users', async (c) => {
  const users = await db.user.findMany();
  return c.json(users);
});

// ✅ Require authentication
app.get('/api/users', authMiddleware, async (c) => {
  const users = await db.user.findMany();
  return c.json(users);
});

// ❌ CRITICAL: Missing authorization (IDOR)
app.delete('/api/users/:id', async (c) => {
  await db.user.delete({ where: { id: c.req.param('id') } });
  return c.json({ success: true });
});

// ✅ Check ownership/permissions
app.delete('/api/users/:id', authMiddleware, async (c) => {
  const userId = c.req.param('id');
  const currentUser = c.get('user');
  
  if (userId !== currentUser.id && currentUser.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  
  await db.user.delete({ where: { id: userId } });
  return c.json({ success: true });
});
```

### Sensitive Data Protection
```typescript
// ❌ CRITICAL: Logging sensitive data
console.log('User login:', { email, password });
logger.info('Payment', { cardNumber, cvv });

// ✅ Never log sensitive data
logger.info('User login', { userId: user.id });
logger.info('Payment processed', { 
  userId: user.id,
  amount,
  last4: cardNumber.slice(-4),
});

// ❌ CRITICAL: Exposing sensitive data
return c.json(user); // May include passwordHash

// ✅ Select only needed fields
return c.json({
  id: user.id,
  name: user.name,
  email: user.email,
});

// ✅ Use DTOs/transforms
return c.json(UserResponse.from(user));
```

### Input Validation (Zod)
```typescript
// ❌ CRITICAL: No validation
app.post('/api/users', async (c) => {
  const body = await c.req.json();
  await db.user.create({ data: body }); // Arbitrary data!
});

// ✅ Validate with Zod
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

app.post('/api/users', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json');
  await db.user.create({ data });
  return c.json({ success: true }, 201);
});
```

### JWT Security
```typescript
// ❌ CRITICAL: Weak JWT secret
const token = jwt.sign(payload, 'secret123');
const token = jwt.sign(payload, process.env.JWT_SECRET || 'default');

// ✅ Strong secret from environment, no default
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters');
}
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

// ❌ CRITICAL: Not verifying JWT properly
const payload = jwt.decode(token); // Just decodes, no verification!

// ✅ Always verify
const payload = jwt.verify(token, JWT_SECRET);
```

### Environment Variables
```typescript
// ❌ CRITICAL: Hardcoded secrets
const apiKey = 'sk-live-xxx123';
const dbUrl = 'postgresql://user:password@localhost/db';

// ✅ Use environment variables
const apiKey = process.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;

// ❌ CRITICAL: Exposing secrets to client (Next.js)
const apiKey = process.env.STRIPE_SECRET_KEY; // In client component

// ✅ Use NEXT_PUBLIC_ only for public values
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
// Secret keys only in server components/API routes
```

---

## High-Impact Issues

### N+1 Query Problem
```typescript
// ❌ HIGH IMPACT: N+1 queries
const posts = await db.post.findMany();
for (const post of posts) {
  const author = await db.user.findUnique({ where: { id: post.authorId } });
  console.log(post.title, author.name);
}

// ✅ Include relations
const posts = await db.post.findMany({
  include: { author: true },
});
```

### Memory Leaks
```typescript
// ❌ HIGH IMPACT: Event listener leak
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Missing cleanup!
}, []);

// ✅ Clean up subscriptions
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// ❌ HIGH IMPACT: Interval leak
setInterval(() => fetchData(), 5000); // Never cleared

// ✅ Clear intervals
const intervalId = setInterval(() => fetchData(), 5000);
return () => clearInterval(intervalId);
```

### Error Handling
```typescript
// ❌ HIGH IMPACT: Exposing internal errors
app.get('/api/data', async (c) => {
  try {
    return c.json(await fetchData());
  } catch (error) {
    return c.json({ 
      error: error.message,
      stack: error.stack, // Never expose!
    }, 500);
  }
});

// ✅ Log details, return generic message
app.get('/api/data', async (c) => {
  try {
    return c.json(await fetchData());
  } catch (error) {
    logger.error('Failed to fetch data', { 
      error: error instanceof Error ? error.message : 'Unknown',
      userId: c.get('user')?.id,
    });
    return c.json({ error: 'An error occurred' }, 500);
  }
});
```

### Race Conditions
```typescript
// ❌ HIGH IMPACT: Race condition in balance update
async function transfer(fromId: string, toId: string, amount: number) {
  const from = await db.account.findUnique({ where: { id: fromId } });
  const to = await db.account.findUnique({ where: { id: toId } });
  
  // Another request could modify balances here!
  await db.account.update({
    where: { id: fromId },
    data: { balance: from.balance - amount },
  });
  await db.account.update({
    where: { id: toId },
    data: { balance: to.balance + amount },
  });
}

// ✅ Use transactions with proper locking
async function transfer(fromId: string, toId: string, amount: number) {
  await db.$transaction(async (tx) => {
    const from = await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });
    
    if (from.balance < 0) {
      throw new Error('Insufficient funds');
    }
    
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });
  });
}
```

---

## Quick Reference

### Password Handling
```typescript
// ✅ Use bcrypt for password hashing
import bcrypt from 'bcrypt';

const hash = await bcrypt.hash(password, 12);
const isValid = await bcrypt.compare(password, hash);
```

### CORS Configuration
```typescript
// ❌ Overly permissive CORS
app.use(cors({ origin: '*' }));

// ✅ Restrict to known origins
app.use(cors({
  origin: ['https://app.example.com', 'https://admin.example.com'],
  credentials: true,
}));
```

### Rate Limiting
```typescript
// ✅ Apply rate limiting
import { rateLimit } from 'hono/rate-limit';

app.use('/api/*', rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
}));

// Stricter for auth routes
app.use('/api/auth/*', rateLimit({
  windowMs: 60 * 1000,
  max: 5,
}));
```

### Secure Headers (Next.js)
```typescript
// next.config.js
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
];
```

---

## 🔐 Secrets & Config Safety

> See `references/secrets-safety.md` for comprehensive patterns.

### Accidental Secret Commits

```typescript
// ❌ CRITICAL: Hardcoded secrets in code
const apiKey = 'sk-live-xxx123';
const stripeSecret = 'sk_live_abcdef123456';
const awsKey = 'AKIAIOSFODNN7EXAMPLE';
const openaiKey = 'sk-proj-abc123xyz';
const dbUrl = 'postgresql://admin:password123@db.example.com/prod';

// ❌ CRITICAL: Hardcoded in config files
// config/production.ts
export default {
  stripe: {
    secret: 'sk_live_xxx', // RED FLAG!
  },
  database: {
    url: 'postgresql://admin:secret@prod-db/main', // RED FLAG!
  },
};

// ✅ Always use environment variables
const apiKey = process.env.API_KEY;

export default {
  stripe: {
    secret: process.env.STRIPE_SECRET,
  },
  database: {
    url: process.env.DATABASE_URL,
  },
};
```

### Config Files to Watch

```typescript
// ❌ CRITICAL: Secrets in config files
// next.config.js or nuxt.config.ts
export default {
  env: {
    API_SECRET: 'actual-secret-here', // RED FLAG!
  },
};

// ❌ CRITICAL: Hardcoded in wrangler.toml (Cloudflare)
[vars]
API_KEY = "sk-live-xxx"

// ✅ Use secrets or environment
[vars]
API_KEY = "" # Set via wrangler secret put
```

### .env File Safety

```bash
# ❌ CRITICAL: .env committed to repository
# Check: Is .env in .gitignore?

# ❌ CRITICAL: .env.example with real values
DATABASE_URL=postgresql://admin:realpassword@prod/db
STRIPE_SECRET=sk_live_xxx

# ✅ .env.example should have placeholders
DATABASE_URL=postgresql://user:password@localhost/dbname
STRIPE_SECRET=sk_test_xxx
```

### Next.js Specific

```typescript
// ❌ CRITICAL: Server secrets exposed to client
// In a client component:
const secret = process.env.API_SECRET; // Will be undefined, but intent is wrong

// ❌ CRITICAL: Exposing in next.config.js
module.exports = {
  env: {
    STRIPE_SECRET: process.env.STRIPE_SECRET, // Exposes to client!
  },
};

// ✅ Only NEXT_PUBLIC_ for client values
const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// ✅ Server secrets only in API routes/server components
// app/api/payment/route.ts
const stripe = new Stripe(process.env.STRIPE_SECRET!);
```

### Suspicious Patterns to Flag

| Pattern | Risk | Action |
|---------|------|--------|
| `password = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `secret = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `AKIA[A-Z0-9]{16}` (AWS key) | 🔴 CRITICAL | Block PR |
| `sk_live_` or `pk_live_` | 🔴 CRITICAL | Block PR |
| `sk-proj-` or `sk-ant-` (AI keys) | 🔴 CRITICAL | Block PR |
| `ghp_` or `gho_` (GitHub tokens) | 🔴 CRITICAL | Block PR |
| `.env` file in diff | 🔴 CRITICAL | Block PR |
| `-----BEGIN.*PRIVATE KEY-----` | 🔴 CRITICAL | Block PR |
| Connection strings with passwords | 🔴 CRITICAL | Block PR |
| `next.config.js` env changes | 🟡 HIGH | Review |
| `wrangler.toml` vars changes | 🟡 HIGH | Review |
| Base64 strings in config | 🟡 HIGH | Review |
