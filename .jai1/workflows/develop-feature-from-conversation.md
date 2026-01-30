---
description: Extract feature context from conversation and sync docs/tasks after IDE plan mode
argument-hint: "[optional-feature-name]"
---

# /develop-feature-from-conversation Workflow

Use this workflow AFTER an IDE built-in plan mode finishes OR after planning with another Agent. It extracts feature context from the conversation and local changes to create or update FRD/TDD/TEST and sync `tasks.md`.

## When to Use

Use this workflow when you have a conversation containing feature work at any stage:

1. **After planning completed** - Requirements and design decided, not yet implemented
2. **After planning + implementation completed** - Code already written
3. **After planning + implementation + adjustments** - Code modified/refined after initial implementation

Other scenarios:
- You already used IDE plan mode to design/implement a feature
- Some code may already exist before Jai1 documentation
- You want to sync `tasks.md` with actual progress

## When Not to Use

- You need full guided development from scratch (use `/develop-feature`)
- No meaningful conversation context or local changes exist

## Critical Rules

1. Always sync state from actual files before marking tasks done.
2. Never downgrade completed tasks unless conflict is confirmed.
3. Generate docs in Vietnamese (code/terms in English).
4. If tasks remain, ask user before continuing implementation.
5. Always update `tasks.md` checkpoint log when syncing.
6. **No Questions** - Extract information from conversation only, do NOT ask clarifying questions (planning already done).

---

## Workflow Phases

### Phase 1: Context Detection

**Step 1.1: Determine Feature Name**
- Use `$ARGUMENTS` if provided
- Otherwise infer from conversation (kebab-case English)

**Step 1.2: Collect Local Change Context**
- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git log -n 5 --oneline`

**Step 1.3: Find Existing Feature Docs**
- Search `docs/features/*/tasks.md`
- Search `docs/features/*/FRD-*.md`, `docs/features/*/TDD-*.md`, `docs/features/*/TEST-*.md`
- Determine mode:
  - `RESUME`: tasks.md exists with IN_PROGRESS
  - `UPDATE`: FRD/TDD/TEST exist or code exists
  - `NEW`: no docs and no related code

**Step 1.4: Extract Conversation Summary**
- Requirements and scope
- Architecture decisions
- Files already implemented
- Implementation adjustments/refinements (if any)

> **NOTE**: If conversation context is insufficient, output warning and proceed with available information. Do NOT ask for clarification.

---

### Phase 2: Extract Planning Information

> **Purpose**: Extract and save planning decisions from conversation (already completed with another Agent).

#### Step 2.1: Extract Requirements

**EXTRACT** from conversation context:
- Functional requirements (What should the feature do?)
- Non-functional requirements (Performance, security, scalability?)
- Scope boundaries (What is NOT included?)
- User roles/personas affected
- Integration points with existing system
- Edge cases and error scenarios

**OUTPUT** (internal, for tasks.md):
```
### Requirements (Extracted)
- [Requirement 1]
- [Requirement 2]
- ...
```

#### Step 2.2: Extract Design Decisions

**EXTRACT** from conversation context:
- Architecture approach chosen
- Key components and their purposes
- Data flow decisions
- Technology choices made
- Any trade-offs discussed

**OUTPUT** (internal, for tasks.md):
```
### Design Decisions (Extracted)
- [Decision 1]
- [Decision 2]
- ...
```

#### Step 2.3: Summarize Planning

**OUTPUT**:
```
📋 **Planning Extracted from Conversation**

✅ Requirements: [X] points extracted
✅ Design Decisions: [Y] decisions extracted

Proceeding to sync tasks.md...
```

> **NOTE**: Do NOT ask any questions in this phase. If information is missing, mark as "[Not specified in conversation]" and proceed.

---

### Phase 3: Sync tasks.md

**If tasks.md exists**:
1. Read and parse task list
2. Sync each task based on file existence and git status
3. Update status and `Updated` timestamp
4. Add sync entry to checkpoint log
5. **Update Planning Summary section** with extracted info

**If tasks.md does not exist**:
1. Create `docs/features/[feature-name]/tasks.md`
2. Add Planning Summary from Phase 2
3. Populate Phase 1 tasks (FRD/TDD/TEST)
4. Populate Phase 2 tasks from TDD (if exists)
5. Mark tasks already completed based on actual files

**tasks.md Template**:
```markdown
# Development Tasks: [Feature Name]

> **Status**: IN_PROGRESS | **Mode**: [NEW/UPDATE]
> **Created**: [YYYY-MM-DD HH:mm]
> **Updated**: [YYYY-MM-DD HH:mm]

## Planning Summary
### Requirements (Extracted)
- [Requirement 1]
- [Requirement 2]
- ...

### Design Decisions (Extracted)
- [Decision 1]
- [Decision 2]
- ...

## Phase 1: Documentation
- [ ] FRD-[feature-name].md
- [ ] TDD-[feature-name].md
- [ ] TEST-[feature-name].md

## Phase 2: Implementation
[Will be populated after TDD completion - list of files to create/modify]

## Modified Files
| File | Action | Notes |
|------|--------|-------|

## Checkpoint Log
| Time | Task | Status | Notes |
|------|------|--------|-------|
```

**Task Sync Rules**:
- File missing → `- [ ]`
- File exists + modified/untracked → `- [/]`
- File exists + clean → `- [x]`
- No file reference → only mark as done if conversation confirms

---

### Phase 4: Documentation Generation

**FRD**:
- If missing: create from `.jai1/templates/feature-docs/FRD-backend.template.md`
- If exists: append new requirements with `[ADDED]`
- Use extracted requirements from Planning Phase
- Mark FRD as completed in tasks.md

**TDD**:
- If missing: create from `.jai1/templates/feature-docs/TDD-backend.template.md`
- If exists: update with implementation details
- Use extracted design decisions from Planning Phase
- Ensure Section 6 lists all implementation files
- Mark TDD as completed in tasks.md

**TEST** (`TEST-[feature-name].md`):
- If missing: create from `.jai1/templates/feature-docs/TEST-feature.template.md`
- If exists: append new scenarios with existing preserved
- Extract test scenarios:
  - **Happy Path**: từ FRD User Stories (US-XXX)
  - **Error Cases**: từ TDD Error Handling (ERR-XXX)
  - **Edge Cases**: chỉ khi có boundary conditions đặc biệt
- Format: Gherkin ngắn gọn (Given-When-Then, 3-5 lines per scenario)
- Mark TEST as completed in tasks.md

---

### Phase 5: Implementation Sync

1. Read TDD Section 6 (Implementation Files)
2. Compare with actual files
3. Update Phase 2 checklist in tasks.md
4. Update Modified Files table

**Status Rules**:
- All tasks done → `✅ COMPLETED`
- Any task in progress → `IN_PROGRESS`
- Otherwise → `IN_PROGRESS`

---

### Phase 6: Continue or Stop

**If remaining tasks exist**:
1. Show summary of completed vs remaining tasks
2. Ask user: "Tiếp tục implement phần còn lại không? (yes/no)"
3. If yes, resume from first incomplete task (same as `/develop-feature` Step 7)

**If all tasks complete**:
- Update status to `✅ COMPLETED`
- Output completion report

---

## Output Templates

### Sync Completed
```
✅ Feature Sync Completed

📁 Feature: [feature-name]
📂 Location: docs/features/[feature-name]/

📋 Planning (Extracted):
- Requirements: [X] points
- Design decisions: [Y] decisions

📄 Documentation:
- [✓/✗] FRD-[feature-name].md
- [✓/✗] TDD-[feature-name].md
- [✓/✗] TEST-[feature-name].md

📊 Tasks: [X] total, [Y] completed, [Z] remaining

Next: Continue implementation? (yes/no)
```

### No Context Found
```
⚠️ Không đủ context từ conversation.

Đã kiểm tra:
- Git changes: none
- Existing feature docs: none

Gợi ý: dùng `/develop-feature` để bắt đầu mới.
```

---

## ✅ Quality Checklist

- [ ] Planning information extracted from conversation
- [ ] `tasks.md` created with planning summary
- [ ] FRD has all extracted requirements
- [ ] TDD reflects design decisions from conversation
- [ ] TEST covers Happy Path + Error Cases
- [ ] All files synced with actual git status
- [ ] Checkpoint log updated
