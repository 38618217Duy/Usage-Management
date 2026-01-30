---
description: Generate IDE rules from existing sourcecode or user-provided information
---

# Generate IDE Rules

Create rules for project and save to `.jai1/rules/`. Supports auto-detect from sourcecode or manual input.

## ⚠️ CRITICAL RULES

1. **Research latest** - Always find latest best practices for current framework version
2. **No redundant rules** - Do not add common rules that LLM already knows
3. **Framework-specific only** - Only specific rules, no general web development
4. **TypeScript preferred** - Prefer TypeScript variant when possible
5. **No markdown issues** - Do not use `**bold**` in rule content, no `:` at end of headings
6. **Single file output** - All frameworks combined into 1 file `project-rules.md`

---

## 🎯 INPUT MODES

| Mode | Trigger | Description |
|------|---------|-------------|
| **Auto-detect** | Has sourcecode | Scan project files → detect frameworks → user selects |
| **Manual** | No code | User enters framework list → preview → confirm |
| **Specific** | User specifies | `/generate-ide-rules nextjs,tailwind` → combine detect + input |
| **Regenerate** | Has old rule | Detect changes → update rules |

---

## 🔄 WORKFLOW PHASES

### Phase 0: Source Detection

**Step 0.1: Check Existing Rules**
```
Check: .jai1/rules/project-rules.md exists?
- YES → Ask: "Regenerate" or "Create new"?
- NO → Continue to Step 0.2
```

**Step 0.2: Detect Project Source**

Scan files in order:
```
package.json          → dependencies, devDependencies, scripts
tsconfig.json         → TypeScript config, paths
next.config.*         → Next.js
vite.config.*         → Vite
nuxt.config.*         → Nuxt
angular.json          → Angular
tailwind.config.*     → Tailwind CSS
prisma/schema.prisma  → Prisma
docker-compose.*      → Docker
.eslintrc.*           → ESLint config
pyproject.toml        → Python projects
go.mod                → Go projects
Cargo.toml            → Rust projects
```

**Step 0.3: Route to Mode**
```
HAS sourcecode files?
  → YES: Go to Phase 1A (Auto-detect)
  → NO: Go to Phase 1B (Manual input)

User specified frameworks in command?
  → YES: Merge with detected → Go to Phase 1A
```

---

### Phase 1A: Auto-detect Mode

**Step 1A.1: Parse Dependencies**

From `package.json`:
```javascript
// Extract from dependencies + devDependencies
{
  "frameworks": ["next", "react", "vue", ...],
  "styling": ["tailwindcss", "styled-components", ...],
  "database": ["prisma", "@supabase/supabase-js", ...],
  "testing": ["jest", "vitest", "playwright", ...],
  "tooling": ["typescript", "eslint", "prettier", ...]
}
```

**Step 1A.2: Analyze Code Patterns**

Scan `src/` or `app/` to detect:
```
- Folder structure pattern (feature-based, layer-based, etc.)
- Naming conventions (kebab-case, camelCase, PascalCase)
- Import ordering pattern
- Component patterns (functional, class, hooks usage)
- State management (zustand, redux, context, etc.)
```

**Step 1A.3: Present Detection Results**

Output format:
```
🔍 Detected in project:

FRAMEWORKS
  ✓ Next.js 14.2.0 (app router detected)
  ✓ React 18.3.1

STYLING
  ✓ Tailwind CSS 3.4.0

DATABASE
  ✓ Prisma 5.10.0 (PostgreSQL)

TOOLING
  ✓ TypeScript 5.4.0

PROJECT PATTERNS
  • Structure: Feature-based (src/features/*)
  • Components: Functional + custom hooks
  • Naming: kebab-case files, PascalCase components

──────────────────────────────────
Generate rules for all? [Y/n] or select (1,2,3...):
```

**Step 1A.4: User Selection**
- `Y` or Enter → Generate all
- Numbers → Generate selected only
- `n` → Cancel

**NEXT**: AUTO-CONTINUE to Phase 2

---

### Phase 1B: Manual Input Mode

**Step 1B.1: Collect Information**

```
📝 No sourcecode detected. Please provide:

1. Frameworks (comma-separated):
   Examples: nextjs, react, vue, angular, express, fastapi
   >

2. Styling (optional):
   Examples: tailwind, styled-components, sass
   >

3. Database/ORM (optional):
   Examples: prisma, drizzle, mongoose, sqlalchemy
   >

4. Project type:
   [1] Web App  [2] API  [3] Fullstack  [4] Mobile  [5] CLI
   >
```

**Step 1B.2: Preview & Confirm**

```
📋 Configuration Preview:

Frameworks: Next.js (latest), React 18
Styling: Tailwind CSS
Database: Prisma
Type: Fullstack SaaS

Proceed with generation? [Y/n/edit]:
```

- `Y` → Continue
- `n` → Cancel
- `edit` → Go back to Step 1B.1

**NEXT**: AUTO-CONTINUE to Phase 2

---

### Phase 2: Research & Generate

**Step 2.1: Research Each Framework**

For each selected framework:
- Find latest stable version
- Find recent breaking changes
- Best practices for that version
- Common anti-patterns to avoid

**Step 2.2: Generate Combined Rule Content**

Template for file `project-rules.md`:

```markdown
You are an expert in [list all frameworks], TypeScript, and modern web development.
You focus on producing clear, readable, and maintainable code.

You always use the latest stable versions:
- [Framework 1] [version]
- [Framework 2] [version]
- ...

# Project Structure

[Combined best practice structure for all frameworks]
[Folder organization]
[File naming conventions]

# Code Style

[Common coding conventions]
[Component/Module patterns]
[Import organization]

# [Framework 1] Guidelines

[Specific rules for framework 1]
[Critical patterns]
[Anti-patterns to avoid]

# [Framework 2] Guidelines

[Specific rules for framework 2]
...

# Project-Specific Conventions

[This section ONLY exists when detected from sourcecode]

Based on analysis of this codebase:

## Detected Patterns
- Structure: [detected pattern]
- Naming: [detected conventions]
- Components: [detected component style]

## Existing Conventions to Follow
[List conventions currently used in project]
```

**Content Rules**:
- Each bullet point is a complete sentence
- Do not use `**bold**` markdown in content
- Do not use `:` at end of headings
- Only important rules, not obvious ones
- Group by framework/concern

**Step 2.3: Write Rule File**

```
Output: .jai1/rules/project-rules.md
```

**NEXT**: AUTO-CONTINUE to Phase 3

---

### Phase 3: Output Summary

**Step 3.1: Generate Summary**

```markdown
## ✅ Rules Generated

**Date**: [current date]
**Mode**: [Auto-detect / Manual / Regenerate]
**Output**: `.jai1/rules/project-rules.md`

### Included Frameworks
- [Framework 1] [version]
- [Framework 2] [version]
- ...

### Sections Generated
- Project Structure
- Code Style
- [Framework] Guidelines (×N)
- Project-Specific Conventions (if from sourcecode)

### Next Steps
1. Review generated rules in `.jai1/rules/project-rules.md`
2. Run `/sync-rules-to-ides` to sync to Cursor/Windsurf/Antigravity
```

---

## 🔄 REGENERATE MODE

When `project-rules.md` already exists and user wants to update:

**Step R.1: Detect Changes**
```
Compare current project with generated rules:
- New dependencies added?
- Dependencies removed?
- Version upgrades?
- New patterns detected in code?
```

**Step R.2: Show Diff**
```
📊 Changes Detected:

ADDED
  + Prisma 5.10.0 (new)
  + Zod 3.22.0 (new)

UPDATED
  ↑ Next.js 14.1.0 → 14.2.0
  ↑ React 18.2.0 → 18.3.1

REMOVED
  - Axios (no longer in dependencies)

PATTERNS
  ~ New: API route handlers detected
  ~ New: Server Actions usage

──────────────────────────────────
Update rules with changes? [Y/n]:
```

**Step R.3: Merge & Regenerate**
- Keep custom rules user added (if has marker)
- Update version-specific rules
- Add new framework sections
- Remove obsolete sections

---

## ✅ QUALITY CHECKLIST

- [ ] All frameworks included in 1 file
- [ ] No redundant/obvious rules
- [ ] No markdown formatting issues
- [ ] TypeScript variant used
- [ ] Version-specific rules included
- [ ] Project-Specific section exists (if from sourcecode)
- [ ] File saved correctly: `.jai1/rules/project-rules.md`
