---
description: Audit UI code for Web Interface Guidelines compliance
---

# UI Audit Workflow

Review UI code for compliance with Web Interface Guidelines from Vercel Labs.

## Trigger

Use this workflow when:
- User asks to "review my UI"
- User asks to "check accessibility"
- User asks to "audit design" or "review UX"
- User wants to "check my site against best practices"

## Workflow

### Step 1: Load Skill

Load the web-design-guidelines skill:

```
skill:web-design-guidelines
```

### Step 2: Fetch Latest Guidelines

Fetch the latest guidelines from the source:

```
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
```

Use WebFetch to retrieve fresh rules before each review.

### Step 3: Identify Target Files

If user specified files, use those. Otherwise, ask:

```
Which files would you like me to audit?

1. All component files (src/**/*.tsx)
2. Specific file or pattern
3. Let me describe the UI to review
```

### Step 4: Apply Guidelines

Read the target files and check against all rules from the fetched guidelines. Categories typically include:

- **Accessibility** - ARIA, keyboard navigation, screen readers
- **Performance** - Loading states, lazy loading, animations
- **Usability** - Touch targets, error states, feedback
- **Consistency** - Spacing, typography, colors
- **Responsiveness** - Mobile-first, breakpoints

### Step 5: Output Findings

Use the terse `file:line` format as specified in the guidelines:

```
## UI Audit Results

### Accessibility Issues

src/components/Button.tsx:12: Missing aria-label on icon-only button
src/components/Modal.tsx:45: No focus trap implementation
src/components/Form.tsx:23: Error message not associated with input

### Usability Issues

src/components/Card.tsx:8: Touch target too small (32px, should be 44px)
src/components/Dropdown.tsx:67: No loading state for async options

### Performance Issues

src/components/Image.tsx:15: Missing loading="lazy" attribute

### Summary

| Category | Issues |
|----------|--------|
| Accessibility | 3 |
| Usability | 2 |
| Performance | 1 |

Total: 6 issues found
```

### Step 6: Offer Fixes

Ask user:

```
Would you like me to:

1. Fix all issues automatically
2. Fix accessibility issues first (recommended)
3. Show me detailed explanations for each issue
4. Skip - I'll fix manually
```

## Quick Mode

If user says `/ui-audit --quick`:
- Audit only the current file
- Show only accessibility issues (highest priority)
- Don't offer auto-fix
