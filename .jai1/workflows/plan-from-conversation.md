---
description: Create or sync a plan from conversation context after IDE plan mode
argument-hint: "[optional-plan-name]"
---

# /plan-from-conversation Workflow

Use this workflow AFTER an IDE built-in plan mode finishes. It extracts context from the current conversation and local changes to create or update a Jai1 plan file in `docs/plans/`.

## When to Use

- You already used IDE plan mode and want a Jai1 plan file
- The conversation includes requirements and design decisions
- Some implementation may already be done during the conversation

## When Not to Use

- No conversation context is available (use `/plan` instead)
- You need full FRD/TDD documentation (use `/develop-feature`)

## Critical Rules

1. Always analyze conversation context and local changes before writing.
2. Sync task status with actual files; never mark completed tasks as pending.
3. Preserve existing plan content; only append or update when needed.
4. If tasks remain, ask user before continuing implementation.
5. Documentation content must be in Vietnamese (code/terms in English).

---

## Workflow Phases

### Phase 1: Context Detection

**Step 1.1: Determine Plan Name**
- Use `$ARGUMENTS` if provided
- Otherwise infer from conversation (kebab-case English)

**Step 1.2: Collect Local Change Context**
- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git log -n 5 --oneline`

**Step 1.3: Find Existing Plan**
- Look for `docs/plans/[plan-name].md`
- If not found, search `docs/plans/` for similar names
- If multiple candidates exist, ask user to pick one

**Step 1.4: Extract Conversation Summary**
- Requirements (what needs to be done)
- Scope (in/out)
- Design decisions
- Files already created or modified
- If conversation context is missing or unclear, ask user to paste a summary

**Step 1.5: Determine Mode**
- `UPDATE`: existing plan found
- `NEW`: no plan file found

---

### Phase 2: Requirements and Design

**If UPDATE**:
- Read existing plan file
- Keep current requirements and design
- Append new items with `[ADDED]` prefix
- Update the `Updated` timestamp

**If NEW**:
- Create requirements and scope from conversation
- Design section based on actual changes and decisions
- List files to create/modify using evidence from git changes

---

### Phase 3: Task Breakdown and State Sync

**Generate or Update Task Breakdown** using the same template as `/plan`.

**Task State Sync Rules**:
- If file does not exist: `- [ ]`
- If file exists and is modified/untracked: `- [/]`
- If file exists and has no pending changes: `- [x]`

**Additional Sync Rules**:
- If task has no file reference, only mark as done when conversation clearly confirms completion
- If uncertain, keep as `- [ ]`

**Update Plan Status**:
- All tasks `[x]` → `✅ COMPLETED`
- Any task `[/]` → `🟢 IN_PROGRESS`
- Otherwise → `🟡 DRAFT`

---

### Phase 4: Continue or Stop

**If remaining tasks exist**:
1. Show a summary of completed vs remaining tasks
2. Ask user: "Tiếp tục implement phần còn lại không? (yes/no)"
3. If user says **yes**, continue with Phase 4 of `/plan` for remaining tasks

**If no remaining tasks**:
- Output completion summary and stop

---

## Output Templates

### New Plan Created
```
✅ Plan Created from Conversation

📄 Plan: docs/plans/[plan-name].md
📊 Tasks: [X] total, [Y] completed
📦 Files detected: [list]

Next: Continue implementation? (yes/no)
```

### Plan Updated
```
✅ Plan Updated from Conversation

📄 Plan: docs/plans/[plan-name].md
📊 Tasks: [X] total, [Y] completed, [Z] remaining

Next: Continue implementation? (yes/no)
```

### No Context Found
```
⚠️ Không tìm thấy đủ context từ conversation.

Đã kiểm tra:
- Git changes: none
- Existing plans: none

Gợi ý: dùng `/plan [task description]` để bắt đầu mới.
```
