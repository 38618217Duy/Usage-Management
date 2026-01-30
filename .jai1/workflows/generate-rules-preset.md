---
description: Generate AI rule preset from project documentation via MCP
---

# Generate Rules Preset

Create rule preset files for AI coding assistants based on project documentation. Uses MCP tool for intelligent generation following PRESET-STANDARD.

## ⚠️ CRITICAL RULES

1. **Docs required** - Must have `docs/README.md` and `docs/ARCHITECTURE.md`
2. **Output location** - Files go to `.jai1/rule-preset/`
3. **Sync required** - Run `jai1 rules sync` after generation
4. **MCP tool** - Use `generate_rule_preset` tool

---

## 🎯 WORKFLOW OVERVIEW

```
Check docs exist
      ↓
Read docs content
      ↓
Call MCP tool
      ↓
Save rule files
      ↓
Sync to IDEs
```

---

## 📋 PHASES

### Phase 0: Prerequisites Check

**Step 0.1: Check Documentation Files**

Check if these files exist:

| File | Status |
|------|--------|
| `docs/README.md` | Required |
| `docs/ARCHITECTURE.md` | Required |

**Decision Table**:

| Condition | Action |
|-----------|--------|
| Both files exist | Continue to Phase 1 |
| One or both missing | STOP - Ask user to create documentation first |

**If missing, output**:
```
❌ Missing Required Documentation

This workflow requires:
- docs/README.md - Project overview and features
- docs/ARCHITECTURE.md - Technical architecture

Please create these files first, or run workflow:create-docs.
```

---

### Phase 1: Read Documentation

**Step 1.1: Read README.md**

Read content of `docs/README.md`

**Step 1.2: Read ARCHITECTURE.md**

Read content of `docs/ARCHITECTURE.md`

**Step 1.3: Extract Project Name**

From README or project root folder name, extract project name.

---

### Phase 2: Generate via MCP

**Step 2.1: Call MCP Tool**

Call `generate_rule_preset` tool with:

```json
{
  "projectName": "<extracted project name>",
  "readme": "<content of docs/README.md>",
  "architecture": "<content of docs/ARCHITECTURE.md>"
}
```

Optional: If user specifies stack type, include `stackType` parameter.

**Step 2.2: Parse Response**

Response format:
```json
{
  "stackType": "frontend|backend|fullstack|mobile|desktop|cli|docs|bot",
  "files": {
    "01-project.md": "---\ndescription: ...\n---\n...",
    "02-standards.md": "...",
    "03-frontend.md": "...",
    "09-custom.md": "..."
  },
  "summary": {
    "totalLines": 320,
    "filesGenerated": ["01-project.md", "02-standards.md", ...]
  }
}
```

---

### Phase 3: Save Files

**Step 3.1: Ensure Directory**

Create `.jai1/rule-preset/` if not exists.

**Step 3.2: Save Each File**

For each file in response `files` object:
- Save to `.jai1/rule-preset/<filename>`

**Step 3.3: Create preset.json**

Create `.jai1/rule-preset/preset.json` with detected configuration:

```json
{
  "name": "<projectName>",
  "version": "1.0.0",
  "stackType": "<detected stackType>",
  "createdAt": "<ISO date>",
  "files": ["01-project.md", "02-standards.md", ...]
}
```

---

### Phase 4: Sync to IDEs

**Step 4.1: Run Sync Command**

Execute:
```bash
jai1 rules sync
```

**Step 4.2: Verify Sync**

Check sync output for success/errors.

---

### Phase 5: Report

**Step 5.1: Output Summary**

```markdown
## ✅ Rule Preset Generated

**Project**: <projectName>
**Stack Type**: <stackType>
**Date**: <current date>

### Files Generated
| File | Lines | Purpose |
|------|-------|---------|
| 01-project.md | 80 | Project overview and structure |
| 02-standards.md | 60 | Coding standards |
| 03-frontend.md | 100 | Frontend guidelines |
| 09-custom.md | 80 | Project-specific rules |

**Total**: <totalLines> lines

### IDEs Synced
- Cursor (.cursor/rules/)
- Windsurf (.windsurf/rules/)
- Claude (.claude/rules/)

### Next Steps
1. Review generated rules in `.jai1/rule-preset/`
2. Customize `09-custom.md` for project-specific needs
3. Re-run `jai1 rules sync` after any changes
```

---

## 🔄 REGENERATE MODE

When rule-preset already exists:

**Step R.1: Detect Existing**
```
Check: .jai1/rule-preset/preset.json exists?
- YES → Ask: "Regenerate?" (will overwrite)
- NO → Fresh generation
```

**Step R.2: Backup (Optional)**
If regenerating, optionally backup existing files to `.jai1/rule-preset-backup/`

---

## ✅ QUALITY CHECKLIST

- [ ] docs/README.md exists
- [ ] docs/ARCHITECTURE.md exists
- [ ] MCP tool called successfully
- [ ] All files saved to .jai1/rule-preset/
- [ ] preset.json created
- [ ] jai1 rules sync executed
- [ ] Summary displayed
