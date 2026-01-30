# Vue.js / Nuxt.js Style Guide - Security & High-Impact Focus

## Review Priority

> ⚠️ **For teams without dedicated reviewers**: This guide focuses on **security vulnerabilities, critical bugs, and high-impact issues** only. Minor style issues should be ignored.

### Critical (Must Fix)
1. **Security vulnerabilities** - XSS, CSRF, data exposure
2. **Data leaks** - Sensitive data in client-side code or stores
3. **Critical bugs** - Memory leaks, infinite loops, data loss
4. **API security** - Missing authentication/authorization

### High (Should Fix)
1. **Performance issues** - Unnecessary re-renders, large bundles
2. **State management bugs** - Race conditions, stale data
3. **Error handling** - Unhandled errors, exposed stack traces
4. **Memory leaks** - Uncleared subscriptions, listeners

### Ignore
- Code formatting and style
- Component naming preferences
- CSS/Tailwind class ordering
- Minor refactoring suggestions

---

## Security Checklist

### XSS Prevention
```vue
<!-- ❌ CRITICAL: XSS vulnerability -->
<div v-html="userInput"></div>
<div v-html="comment.body"></div>

<!-- ✅ Vue auto-escapes by default -->
<div>{{ userInput }}</div>
<p>{{ comment.body }}</p>

<!-- ✅ If HTML is needed, sanitize first -->
<script setup lang="ts">
import DOMPurify from 'dompurify';

const sanitizedHtml = computed(() => DOMPurify.sanitize(userInput.value));
</script>

<template>
  <div v-html="sanitizedHtml"></div>
</template>
```

### Sensitive Data Protection
```typescript
// ❌ CRITICAL: API keys in client code
const apiKey = 'sk-live-xxx123';
const stripe = new Stripe(apiKey);

// ✅ Use server-side API routes (Nuxt)
// server/api/payment.post.ts
export default defineEventHandler(async (event) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // Process payment server-side
});

// ❌ CRITICAL: Sensitive data in Pinia store (persisted)
const userStore = defineStore('user', {
  state: () => ({
    token: '', // Persisted to localStorage!
    creditCard: {}, // Never store this!
  }),
  persist: true,
});

// ✅ Don't persist sensitive data
const authStore = defineStore('auth', () => {
  const token = ref<string | null>(null); // Memory only
  
  return { token };
});
```

### Authentication & Authorization
```typescript
// ❌ CRITICAL: No auth check in API route
// server/api/users/[id].delete.ts
export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  await db.user.delete({ where: { id } });
});

// ✅ Check authentication and authorization
export default defineEventHandler(async (event) => {
  const session = await requireAuth(event); // Throws if not authenticated
  const id = event.context.params?.id;
  
  if (session.user.id !== id && session.user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Forbidden' });
  }
  
  await db.user.delete({ where: { id } });
});

// ❌ CRITICAL: No middleware protection
// pages/admin/dashboard.vue
<script setup lang="ts">
// Anyone can access!
const { data } = await useFetch('/api/admin/stats');
</script>

// ✅ Use middleware for protected pages
// middleware/admin.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { user } = useAuth();
  
  if (!user.value || user.value.role !== 'admin') {
    return navigateTo('/login');
  }
});

// pages/admin/dashboard.vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'admin'],
});
</script>
```

### Input Validation
```typescript
// ❌ CRITICAL: No server-side validation
// server/api/users.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  await db.user.create({ data: body }); // Arbitrary data!
});

// ✅ Validate with Zod
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const validated = createUserSchema.parse(body);
  
  await db.user.create({ data: validated });
  return { success: true };
});
```

### CSRF Protection
```typescript
// ✅ Nuxt handles CSRF for API routes with useFetch
// Make sure to use useFetch for mutations
const createUser = async (data: CreateUserInput) => {
  await useFetch('/api/users', {
    method: 'POST',
    body: data,
  });
};

// ❌ Using raw fetch bypasses CSRF protection
const createUser = async (data: CreateUserInput) => {
  await fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
```

---

## High-Impact Issues

### Memory Leaks
```vue
<script setup lang="ts">
// ❌ HIGH IMPACT: Event listener leak
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  // Missing cleanup!
});

// ✅ Clean up in onUnmounted
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

// ❌ HIGH IMPACT: Interval leak
onMounted(() => {
  setInterval(fetchData, 5000); // Never cleared!
});

// ✅ Clear intervals
let intervalId: NodeJS.Timeout;

onMounted(() => {
  intervalId = setInterval(fetchData, 5000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});

// ❌ HIGH IMPACT: Subscription leak
onMounted(() => {
  websocket.subscribe('updates', handleUpdate);
  // Missing unsubscribe!
});

// ✅ Clean up subscriptions
onMounted(() => {
  websocket.subscribe('updates', handleUpdate);
});

onUnmounted(() => {
  websocket.unsubscribe('updates', handleUpdate);
});
</script>
```

### Performance Issues
```vue
<script setup lang="ts">
// ❌ HIGH IMPACT: Fetching on every render
const users = await useFetch('/api/users'); // No caching

// ✅ Use proper caching keys
const { data: users } = await useFetch('/api/users', {
  key: 'users-list',
});

// ❌ HIGH IMPACT: Computed without dependency tracking
const filteredList = computed(() => {
  console.log('Filtering...'); // Runs on every reactive change!
  return hugeList.value.filter(expensiveFilter);
});

// ✅ Only depend on what's needed
const searchTerm = ref('');
const filteredList = computed(() => {
  return hugeList.value.filter(item => 
    item.name.includes(searchTerm.value)
  );
});
</script>

<template>
  <!-- ❌ HIGH IMPACT: Missing key in v-for -->
  <div v-for="item in items">{{ item.name }}</div>
  
  <!-- ✅ Always use unique key -->
  <div v-for="item in items" :key="item.id">{{ item.name }}</div>
</template>
```

### Error Handling
```vue
<script setup lang="ts">
// ❌ HIGH IMPACT: Unhandled errors
const { data } = await useFetch('/api/data');
// If error, data is undefined and app may crash

// ✅ Handle errors properly
const { data, error } = await useFetch('/api/data');

if (error.value) {
  // Handle error - show message, redirect, etc.
}
</script>

<template>
  <!-- ✅ Show error state to user -->
  <div v-if="error" class="text-red-500">
    Failed to load data. 
    <button @click="refresh">Retry</button>
  </div>
  <div v-else-if="data">
    <!-- Display data -->
  </div>
</template>
```

### State Management Race Conditions
```typescript
// ❌ HIGH IMPACT: Race condition
const store = defineStore('user', () => {
  const user = ref<User | null>(null);
  
  async function fetchUser() {
    const response = await api.getUser();
    user.value = response; // What if called twice?
  }
  
  return { user, fetchUser };
});

// ✅ Handle in-flight requests
const store = defineStore('user', () => {
  const user = ref<User | null>(null);
  const isLoading = ref(false);
  let fetchPromise: Promise<void> | null = null;
  
  async function fetchUser() {
    if (fetchPromise) return fetchPromise;
    
    isLoading.value = true;
    fetchPromise = api.getUser()
      .then(response => { user.value = response; })
      .finally(() => {
        isLoading.value = false;
        fetchPromise = null;
      });
    
    return fetchPromise;
  }
  
  return { user, isLoading, fetchUser };
});
```

---

## Quick Reference

### Environment Variables
```typescript
// ❌ CRITICAL: Using server env in client
const secret = process.env.API_SECRET; // undefined in browser

// ✅ Use NUXT_PUBLIC_ for client-side values
const config = useRuntimeConfig();
const publicKey = config.public.stripePublishableKey;

// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: '', // Server only
    public: {
      stripePublishableKey: '', // Available in client
    },
  },
});
```

### Secure Headers (nuxt.config.ts)
```typescript
export default defineNuxtConfig({
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    },
  },
});
```

### Error Boundaries
```vue
<!-- ✅ Use error boundaries for graceful degradation -->
<template>
  <NuxtErrorBoundary>
    <DangerousComponent />
    <template #error="{ error }">
      <div class="error-fallback">
        Something went wrong. 
        <button @click="error.value = null">Try again</button>
      </div>
    </template>
  </NuxtErrorBoundary>
</template>
```

---

## 🔐 Secrets & Config Safety

> See `references/secrets-safety.md` for comprehensive patterns.

### Accidental Secret Commits

```typescript
// ❌ CRITICAL: Hardcoded secrets in code
const apiKey = 'sk-live-xxx123';
const stripeSecret = 'sk_live_abcdef123456';

// ❌ CRITICAL: Hardcoded in nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecret: 'sk_live_xxx', // RED FLAG!
  },
});

// ✅ Always use environment variables
export default defineNuxtConfig({
  runtimeConfig: {
    stripeSecret: '', // Will use NUXT_STRIPE_SECRET env var
    public: {
      stripePublishableKey: '', // Will use NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    },
  },
});
```

### Nuxt Runtime Config

```typescript
// ❌ CRITICAL: Server secrets in public config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiSecret: 'xxx', // Never put secrets in public!
    },
  },
});

// ✅ Server secrets in runtimeConfig root
export default defineNuxtConfig({
  runtimeConfig: {
    apiSecret: '', // Server only (NUXT_API_SECRET)
    public: {
      apiBase: '/api', // Safe for client
    },
  },
});
```

### .env File Safety

```bash
# ❌ CRITICAL: .env committed to repository
# ❌ CRITICAL: .env.example with real values
NUXT_STRIPE_SECRET=sk_live_xxx
NUXT_DATABASE_URL=postgresql://admin:password@prod/db

# ✅ .env.example should have placeholders
NUXT_STRIPE_SECRET=sk_test_xxx
NUXT_DATABASE_URL=postgresql://user:password@localhost/dbname
```

### Pinia Store Safety

```typescript
// ❌ CRITICAL: Persisting sensitive data
const authStore = defineStore('auth', {
  state: () => ({
    accessToken: '',
    refreshToken: '',
    userSecrets: {},
  }),
  persist: true, // Tokens saved to localStorage!
});

// ✅ Don't persist tokens, use httpOnly cookies instead
const authStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  // Tokens handled via httpOnly cookies, not client-side storage
  
  return { user };
});
```

### Suspicious Patterns to Flag

| Pattern | Risk | Action |
|---------|------|--------|
| `password = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `secret = "..."` with actual value | 🔴 CRITICAL | Block PR |
| `sk_live_` or `pk_live_` | 🔴 CRITICAL | Block PR |
| `sk-proj-` or `sk-ant-` (AI keys) | 🔴 CRITICAL | Block PR |
| `.env` file in diff | 🔴 CRITICAL | Block PR |
| `nuxt.config.ts` runtimeConfig with values | 🟡 HIGH | Review |
| `public:` config with secret-looking values | 🟡 HIGH | Review |
| Pinia store with `persist: true` + tokens | 🟡 HIGH | Review |
