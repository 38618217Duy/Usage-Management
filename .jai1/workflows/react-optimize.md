---
description: Review and optimize React/Next.js code using Vercel's best practices
---

# React Optimize Workflow

Analyze and optimize React/Next.js code for performance using Vercel's best practices.

## Trigger

Use this workflow when:
- User asks to "optimize my React code"
- User asks to "review React performance"
- User asks to "check Next.js best practices"
- User wants to refactor for better performance

## Workflow

### Step 1: Load Skill

Load the react-best-practices skill:

```
skill:react-best-practices
```

### Step 2: Identify Target Files

If user specified files, use those. Otherwise, ask:

```
Which files would you like me to optimize?

1. All React components (src/**/*.tsx)
2. Specific file or pattern
3. Current file only
```

### Step 3: Analyze Code

Read the target files and check against the 45 rules from the skill:

**Priority order:**
1. Eliminating Waterfalls (CRITICAL) - `async-*` rules
2. Bundle Size Optimization (CRITICAL) - `bundle-*` rules  
3. Server-Side Performance (HIGH) - `server-*` rules
4. Client-Side Data Fetching (MEDIUM-HIGH) - `client-*` rules
5. Re-render Optimization (MEDIUM) - `rerender-*` rules
6. Rendering Performance (MEDIUM) - `rendering-*` rules
7. JavaScript Performance (LOW-MEDIUM) - `js-*` rules
8. Advanced Patterns (LOW) - `advanced-*` rules

### Step 4: Report Findings

Output findings in this format:

```
## 📊 React Performance Analysis

### 🔴 Critical Issues (Must Fix)

**[async-parallel]** `src/components/Dashboard.tsx:42`
Sequential awaits that could be parallel:
- Current: await fetch(a); await fetch(b);
- Suggested: await Promise.all([fetch(a), fetch(b)])

**[bundle-barrel-imports]** `src/utils/index.ts:1`
Barrel file import increasing bundle size:
- Current: import { Button } from '@/components'
- Suggested: import { Button } from '@/components/Button'

### 🟡 Recommended Improvements

**[rerender-memo]** `src/components/List.tsx:15`
Expensive component re-rendering on every update.
Consider wrapping with React.memo()

### ✅ Good Practices Detected

- Using next/dynamic for heavy components
- React.cache() used for deduplication
- Proper Suspense boundaries

## Summary

| Priority | Issues | Fixed |
|----------|--------|-------|
| Critical | 2 | - |
| High | 1 | - |
| Medium | 3 | - |

Total: 6 optimizations available
```

### Step 5: Offer Fixes

Ask user:

```
Would you like me to:

1. Apply all fixes automatically
2. Apply critical fixes only
3. Show me the fixes one by one
4. Skip - I'll fix manually
```

### Step 6: Apply Changes

If user chooses to apply fixes:
1. Make changes file by file
2. Show diff for each change
3. Verify no breaking changes

## Quick Mode

If user says `/react-optimize --quick` or `/react-optimize -q`:
- Skip the file selection (use all .tsx files)
- Show only Critical and High priority issues
- Don't offer auto-fix, just report
