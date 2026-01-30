---
description: Fix bugs or issues in existing features with smart root cause analysis
---

# Bug Fix Workflow (Smart Analysis)

> **Goal**: Fix bug/issue in existing feature with root cause analysis.
> **Smart**: Automatically fix if clear (HIGH confidence), suggest and confirm if uncertain (LOW confidence).

## ⚠️ CRITICAL RULES

1. ✅ **Check project docs first** - Use existing docs for faster analysis
2. ✅ **Analyze first** - Always analyze root cause before fixing
3. ✅ **Smart decision** - Auto-fix if confident, suggest if not
4. ✅ **Update docs** - If docs are wrong → confirm with user before updating
5. ✅ **Report changes** - Always report what has been changed
6. ✅ **Vietnamese** - Output in Vietnamese

---

## 🔄 Workflow Logic

### Step 0: Project Context Check

**ACTIONS**:
1. **Check for existing project docs**:
   - `docs/README.md` - Project overview
   - `docs/ARCHITECTURE.md` - Tech stack & architecture

2. **Decision**:

| Status | Action |
|--------|--------|
| **Files exist** | Read and use for context → Proceed to Step 1 |
| **Files missing** | Suggest: "Chạy `/gen-project-overview` trước để tạo context, sau đó tiếp tục fix bug" |

3. **Extract context** (if docs exist):
   - Project type (Backend/Frontend/Fullstack)
   - Framework (Laravel, Next.js, etc.)
   - Key directories
   - Request flow pattern

**OUTPUT**: Project context summary for faster debugging

---

### Step 1: Understand Issue

**ACTIONS**:
1. **Parse user input**: Extract bug description, symptoms, context
2. **Parse error logs** (if provided):
   - Extract stack trace
   - Identify error type/code
   - Find line numbers and file references
3. **Identify feature**: Identify related feature from description
4. **Search codebase**: Find files related to bug
5. **Check existing docs**: Read FRD/TDD if exists in `docs/features/`

**Error Log Parsing Guide**:
| Log Type | What to Extract |
|----------|-----------------|
| **Stack trace** | File path, line number, function names |
| **HTTP error** | Status code, endpoint, request/response |
| **Database error** | Query, table, constraint |
| **Frontend error** | Component, state, props |

**OUTPUT**:
- Feature name (if identified)
- Bug summary
- Affected files (from stack trace or search)
- Related docs (if any)
- Error details (parsed)

---

### Step 2: Root Cause Analysis

**ACTIONS**:

#### For Backend (Laravel, NestJS, Express, etc.)
1. **Trace flow**: Route → Middleware → Controller → Service → Model → DB
2. **Check points**:
   - Route definition correct?
   - Middleware blocking?
   - Controller logic error?
   - Service business logic?
   - Model/Query issue?
   - Database constraint?

#### For Frontend (Next.js, Nuxt, React, Vue, etc.)
1. **Trace flow**: Page/Component → Hook/Store → API Call → Response Handler
2. **Check points**:
   - Component rendering issue?
   - State management bug?
   - API call/response handling?
   - Props/data flow?
   - Event handler logic?

#### Common Checks
- Logic error?
- Missing validation?
- Wrong data handling?
- Configuration issue?
- Documentation mismatch?
- Race condition?
- Missing error handling?

**CLASSIFY CONFIDENCE**:

| Signals | Confidence |
|---------|------------|
| Clear error message + stack trace | **HIGH** |
| Clear logic bug in code | **HIGH** |
| Clear reproduce steps + single cause | **HIGH** |
| Vague description "not working" | **LOW** |
| Multiple possible causes | **LOW** |
| No error logs/message | **LOW** |
| Intermittent/flaky behavior | **LOW** |
| Involves external dependencies | **LOW** |

---

### Step 3: Decision Branch

#### CASE A: High Confidence (Clear)

**AUTO-FIX FLOW**:
1. **Apply fix**: Modify code directly
2. **Document change**: Record changes
3. **Report to user**:

```markdown
## 🔧 Auto-Fix Applied

**Bug**: [Description]
**Root Cause**: [Explanation of cause]
**Fix Applied**: [Description of applied fix]

### Changes Made
| File | Change |
|------|--------|
| `path/to/file.js` | [Description of change] |

### Verification
[Guide user to verify fix works]
```

4. **Check documentation** → Go to Step 4

---

#### CASE B: Low Confidence (Unclear)

**SUGGEST FLOW**:
1. **Present analysis**:

```markdown
## 🔍 Bug Analysis

**Bug**: [Description]
**Status**: Cần xác nhận thêm

### Possible Causes

1. **[Cause A]** - Likelihood: [High/Medium/Low]
   - Evidence: [Evidence]
   - Fix approach: [How to fix]

2. **[Cause B]** - Likelihood: [High/Medium/Low]
   - Evidence: [Evidence]
   - Fix approach: [How to fix]

### Questions for Clarification
1. [Question 1]?
2. [Question 2]?

### Suggested Next Steps
- [ ] Confirm cause [A/B/C]
- [ ] Provide more context about [X]
- [ ] Share error logs/screenshots
```

2. **Wait for user input**
3. **Once clarified** → Re-analyze → Apply fix

---

### Step 4: Documentation Check

**ACTIONS**:
1. **Read feature docs**: FRD, TDD if exists
2. **Compare with fix**: Does fix contradict docs?

**IF docs incorrect/outdated**:
```markdown
## 📝 Documentation Update Required

Applied fix shows current documentation has inaccurate information:

**Current (Wrong)**:
> [Quote from docs]

**Should be (Correct)**:
> [Correct information]

**Affected Files**:
- `docs/features/[feature]/FRD-[feature].md`: [Content to fix]
- `docs/features/[feature]/TDD-[feature].md`: [Content to fix]

Confirm to update documentation? (Y/N)
```

**IF user confirms** → Update docs → Report update

**IF no docs exist OR docs correct** → Skip to Step 5

---

### Step 5: Completion Report

```markdown
## ✅ Fix Complete

**Feature**: [Feature Name]
**Bug**: [Description]
**Root Cause**: [Explanation of cause]

### Changes Applied
| File | Type | Description |
|------|------|-------------|
| `path/file.js` | CODE | [Description of change] |
| `docs/.../FRD.md` | DOCS | [If updated] |

### Verification Steps
1. [Step 1 to verify fix]
2. [Expected result]

### Test Suggestions (High-Level)
> Cho team nhỏ, chỉ cần verify các case quan trọng:

- [ ] **Happy path**: [Main flow hoạt động đúng]
- [ ] **Edge case**: [Case đã gây bug - verify đã fix]
- [ ] **Related feature**: [Feature liên quan không bị ảnh hưởng]

### Prevention
[Recommendations to prevent similar bugs]
```

---

## ⚠️ Rollback Guidance

**For high-risk fixes** (touching core business logic, payment, auth):

```markdown
## 🔙 Rollback Plan

**Risk Level**: [High/Medium]

### If fix causes new issues:
1. **Git revert**: `git revert [commit-hash]`
2. **Files to restore**:
   - `path/to/file.js`
   - `path/to/another.js`
3. **Database changes** (if any):
   - [Rollback SQL or migration command]
```

---

## 📋 Fix Report Template (Optional)

**For major bugs**, create standalone fix report:
**File**: `docs/features/[feature]/fixes/FIX-[YYYY-MM-DD]-[title].md`

```markdown
# Fix Report: [Title]

> **Date**: [YYYY-MM-DD] | **Feature**: [Name] | **Severity**: [High/Medium/Low]

## Bug Description
[Description of bug that occurred]

## Root Cause
[Why the bug occurred]

## Solution
[How it was fixed and why]

## Files Changed
| File | Change |
|------|--------|

## Testing
[How it was verified]

## Related
- FRD: `docs/features/[feature]/FRD-[feature].md`
- TDD: `docs/features/[feature]/TDD-[feature].md`
```

---

## ✅ Quality Checklist

- [ ] Project context checked (or `/gen-project-overview` suggested)
- [ ] Error logs parsed correctly
- [ ] Root cause identified clearly
- [ ] Fix applied correctly (following project patterns)
- [ ] Documentation updated if needed (with user confirmation)
- [ ] User informed of all changes
- [ ] Verification steps provided
- [ ] Test suggestions given (high-level)
- [ ] Rollback plan provided (for high-risk fixes)
- [ ] Prevention recommendations given
