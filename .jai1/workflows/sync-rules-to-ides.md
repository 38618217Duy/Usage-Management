---
description: Sync rules from .jai1/rules to IDE directories (Cursor, Windsurf, Antigravity)
---

# Sync Rules to IDEs

Convert existing rules in `.jai1/rules/` to IDE directories with appropriate metadata.

## ⚠️ CRITICAL RULES

1. ✅ **Preserve content** - Keep original rule content, only add/change metadata
2. ✅ **IDE-specific metadata** - Each IDE has its own metadata format
3. ✅ **Auto-detect globs** - Automatically detect file patterns from rule content
4. ✅ **Target IDEs** - Output for selected IDE (default: all 3 IDEs)

---

## 🎯 INPUT

User provides (optional):
- **Rule file**: Specific file name in `.jai1/rules/` or "all" (default: all)
- **IDE targets**: cursor/windsurf/antigravity or "all" (default: all)
- **Override globs**: Custom globs if you want to override auto-detect
- **Always apply**: true/false for global rules (default: false)

---

## 🔄 WORKFLOW PHASES

### Phase 1: Scan Rules

**Step 1.1: List Available Rules**
```bash
ls .jai1/rules/*.md
```

**Step 1.2: Parse User Input**
- **Rule file**: If user specifies file → process that file; If "all" or not specified → process all files
- **IDE targets**: If user specifies → only sync to that IDE; If "all" or not specified → sync to all 3 IDEs

**Step 1.3: Create/Check todo.md**
```markdown
# Sync Rules Progress

## Rules to Process
- [ ] [rule-1.md]
- [ ] [rule-2.md]
...

## Status
- Started: [timestamp]
- Last updated: [timestamp]
```
- Location: `.jai1/rules/sync-todo.md`

**NEXT**: AUTO-CONTINUE to Phase 2

---

### Phase 2: Process Each Rule

**For each rule file in `.jai1/rules/`**:

**Step 2.1: Read Rule Content**
- Read file `.jai1/rules/[name].md`
- Identify framework/library from content

**Step 2.2: Auto-Detect Globs**

Based on keywords in rule content:
| Framework Keyword | Suggested Globs |
|-------------------|-----------------|
| React | `**/*.tsx, **/*.jsx` |
| Vue | `**/*.vue, **/*.ts` |
| Next.js | `**/*.tsx, **/app/**/*.ts, **/pages/**/*.ts` |
| Nuxt | `**/*.vue, **/server/**/*.ts` |
| Svelte | `**/*.svelte, **/*.ts` |
| Angular | `**/*.ts, **/*.component.ts` |
| Node.js/Express | `**/*.ts, **/*.js` |
| Python | `**/*.py` |
| Go | `**/*.go` |
| Rust | `**/*.rs` |

If not detected → use `**/*.*` or ask user

**Step 2.3: Determine Always Apply**
- If rule is general coding style → `alwaysApply: true`
- If rule is framework-specific → `alwaysApply: false` (use globs)

**Step 2.4: Generate IDE Files**

Use templates in Phase 3 to create files for selected IDEs:
- If `IDE targets = all` → create for all 3 IDEs
- If `IDE targets = cursor` → only create `.cursor/rules/[name].mdc`
- If `IDE targets = windsurf` → only create `.windsurf/rules/[name].md`
- If `IDE targets = antigravity` → only create `.agent/rules/[name].md`

**Step 2.5: Update todo.md**
- Mark rule as completed: `- [x] [rule-name.md]`

**NEXT**: Process next rule or Phase 4

---

### Phase 3: IDE Templates

#### 3.1 Cursor Template
**File extension**: `.mdc`
**Location**: `.cursor/rules/[rule-name].mdc`

```markdown
---
description: [Auto-extracted from first line or framework name]
globs: [detected globs, comma-separated]
alwaysApply: [true/false]
---

[Original rule content - keep unchanged, do not modify]
```

**Metadata Rules for Cursor**:
- `description`: Do not use quotes
- `globs`: Do not use quotes, use comma-separated
- `alwaysApply`: boolean without quotes

---

#### 3.2 Windsurf Template
**File extension**: `.md`
**Location**: `.windsurf/rules/[rule-name].md`

```markdown
---
trigger: [glob_patterns OR always]
---

[Original rule content - keep unchanged, do not modify]
```

**Metadata Rules for Windsurf**:
- `trigger`: Can be glob patterns or keyword `always`
- If alwaysApply=true → `trigger: always`
- If globs exist → `trigger: glob_patterns` (list globs in content if needed)

---

#### 3.3 Antigravity Template
**File extension**: `.md`
**Location**: `.agent/rules/[rule-name].md`

```markdown
---
trigger: [glob_patterns OR always]
---

[Original rule content - keep unchanged, do not modify]
```

**Metadata Rules for Antigravity**:
- Format same as Windsurf
- `trigger`: `always` or glob patterns

---

### Phase 4: Output Summary

**Step 4.1: Generate Report**
```markdown
## ✅ Rules Synced Successfully

**Date**: [current date]
**Source**: `.jai1/rules/`
**IDE Targets**: [cursor/windsurf/antigravity/all]

### Synced Rules

| Rule | Cursor | Windsurf | Antigravity | Globs |
|------|--------|----------|-------------|-------|
| [name] | ✅/- | ✅/- | ✅/- | [globs] |

(✅ = synced, - = skipped/not selected)

### Output Paths (for selected IDE)
- Cursor: `.cursor/rules/`
- Windsurf: `.windsurf/rules/`
- Antigravity: `.agent/rules/`

### Notes
[Any warnings or manual actions needed]
```

**Step 4.2: Cleanup**
- Delete `.jai1/rules/sync-todo.md` after completion

---

## 📂 DIRECTORY STRUCTURE

```
project/
├── .jai1/
│   └── rules/           # Source rules (no IDE metadata)
│       ├── react.md
│       └── nextjs.md
├── .cursor/
│   └── rules/           # Cursor format (.mdc)
│       ├── react.mdc
│       └── nextjs.mdc
├── .windsurf/
│   └── rules/           # Windsurf format (.md)
│       ├── react.md
│       └── nextjs.md
└── .agent/
    └── rules/           # Antigravity format (.md)
        ├── react.md
        └── nextjs.md
```

---

## ✅ QUALITY CHECKLIST

- [ ] All rules in `.jai1/rules/` have been processed
- [ ] Each rule has a file in the selected IDE folders
- [ ] Metadata format is correct for each IDE
- [ ] Globs are detected accurately
- [ ] Original content is not modified
- [ ] Folders are created if they don't exist
