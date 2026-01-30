---
description: Develop new feature or extend existing feature with auto-implement and checkpoint/resume
---

# Feature Development Workflow (Auto-Resume)

> **Goal**: Develop new feature or extend existing feature with Planning → FRD → TDD → TEST → Auto-implement.
> **Resumable**: Check `tasks.md`, if exists → resume from incomplete task.

## ⚠️ CRITICAL RULES

1. ✅ **Auto-execute entirely** - Do not stop to ask user, only stop when need to clarify ambiguity
2. ✅ **Checkpoint after each task** - Update `tasks.md` after each file completed
3. ✅ **Extract from code** - Verify information from actual source code
4. ✅ **Vietnamese** - Documentation content in Vietnamese
5. ✅ **Resume first** - Always check `tasks.md` before starting
6. ✅ **Batch Questions** - When asking, group all related questions together in one batch

---

## 🔄 Workflow Logic

### Step 1: Check Resume State

**ACTION**: Search for file `tasks.md` in `docs/features/*/`

**IF `tasks.md` EXISTS with status IN_PROGRESS**:
1. Read file content
2. Parse status: find first task with `- [ ]` or `- [/]`
3. **IF found incomplete task** → Jump to matching phase/step, RESUME
4. **IF all `[x]`** → Output "Feature already completed" → END

**IF NOT EXISTS** → Continue to Step 2

---

### Step 2: Analyze & Detect Mode

**ACTIONS**:
1. **Parse user input**: Extract feature name, requirements, scope
2. **Generate canonical name**: kebab-case English (e.g., `user-registration`)
3. **Search existing**:
   - Check `docs/features/` for matching folder
   - Search codebase for related files (routes, controllers, services)

**DETERMINE MODE**:
| Condition | Mode |
|-----------|------|
| Feature folder exists with FRD/TDD OR code files exist | UPDATE |
| Neither exists | NEW |

**OUTPUT**: Mode (NEW/UPDATE), Feature Name, Requirements List

---

### Step 3: Planning Phase - Requirements Clarification

> **Purpose**: Ensure requirements are crystal clear before any design or implementation.

#### Step 3.1: Assess Requirements Clarity

**EVALUATE** user's input for:
- Functional requirements (What should the feature do?)
- Non-functional requirements (Performance, security, scalability?)
- Scope boundaries (What is NOT included?)
- User roles/personas affected
- Integration points with existing system
- Edge cases and error scenarios

**CLARITY CHECK**:
| Aspect | Clear? | Notes |
|--------|--------|-------|
| Core functionality | ✓/✗ | |
| User stories/use cases | ✓/✗ | |
| Input/Output expectations | ✓/✗ | |
| Error handling expectations | ✓/✗ | |
| Constraints/limitations | ✓/✗ | |

#### Step 3.2: Batch Questions for Clarification (If Needed)

**IF requirements are NOT clear**:

1. **Compile all unclear points** into a single batch of questions
2. **Group questions by category**:
   - 🎯 **Functional**: What exactly should happen?
   - 👤 **User Context**: Who uses this? How?
   - 🔗 **Integration**: How does this connect to existing features?
   - ⚠️ **Edge Cases**: What happens when X fails?
   - 📊 **Constraints**: Any limits on performance, data size, etc.?

**FORMAT**:
```
📋 Cần làm rõ một số điểm trước khi thiết kế:

🎯 **Chức năng:**
1. [Question 1]
2. [Question 2]

👤 **Ngữ cảnh sử dụng:**
3. [Question 3]

🔗 **Tích hợp:**
4. [Question 4]

Vui lòng trả lời các câu hỏi trên để tiếp tục.
```

3. **WAIT** for user response
4. **IF still unclear after response** → Ask follow-up batch questions (max 2 rounds)
5. **IF clear** → Proceed to Step 4

**IF requirements are ALREADY CLEAR** → Skip to Step 4

---

### Step 4: Planning Phase - Design Overview

> **Purpose**: Present high-level architecture and get alignment before detailed design.

#### Step 4.1: Create Design Overview

**GENERATE** a concise design overview including:

1. **Architecture Approach**: How this feature fits into the system
2. **Key Components**: Main modules/services involved
3. **Data Flow**: How data moves through the feature
4. **Technology Choices**: Libraries, patterns, frameworks to use
5. **Alternative Options**: If multiple valid approaches exist

**FORMAT**:
```
📐 **Design Overview: [Feature Name]**

### 1. Kiến trúc đề xuất
[Brief description of architectural approach]

### 2. Các thành phần chính
- Component A: [purpose]
- Component B: [purpose]
- ...

### 3. Luồng dữ liệu
[Step-by-step data flow]

### 4. Công nghệ sử dụng
- [Technology/Pattern]: [reason]
- ...

### 5. Các phương án thay thế (nếu có)
| Option | Pros | Cons |
|--------|------|------|
| Option A | ... | ... |
| Option B | ... | ... |
```

#### Step 4.2: Batch Questions for Design Decisions (If Needed)

**IF there are multiple valid options OR design decisions needed**:

1. **Present the options** clearly with pros/cons
2. **Compile all design questions** into one batch:

**FORMAT**:
```
🤔 **Cần xác nhận một số quyết định thiết kế:**

📊 **Lựa chọn kiến trúc:**
1. [Option A vs Option B] - Bạn prefer option nào?

🔧 **Chi tiết kỹ thuật:**
2. [Technical decision question]
3. [Another technical question]

📁 **Cấu trúc:**
4. [Structure-related question]

Vui lòng cho biết lựa chọn của bạn.
```

3. **WAIT** for user response
4. **Update design overview** based on responses

**IF no design questions needed** → Proceed to Step 5

#### Step 4.3: Finalize Design

**OUTPUT** final design summary:
```
✅ **Design Confirmed**

- Approach: [chosen approach]
- Key decisions: [list of confirmed decisions]
- Ready to proceed with documentation.
```

---

### Step 5: Create tasks.md (Checkpoint File)

**CREATE**: `docs/features/[feature-name]/tasks.md`

```markdown
# Development Tasks: [Feature Name]

> **Status**: IN_PROGRESS | **Mode**: [NEW/UPDATE]
> **Created**: [YYYY-MM-DD HH:mm]
> **Updated**: [YYYY-MM-DD HH:mm]

## Planning Summary
### Requirements (Confirmed)
- [Requirement 1]
- [Requirement 2]
- ...

### Design Decisions
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

**CHECKPOINT**: File created → Continue immediately

---

### Step 6: Phase 1 - Documentation

#### Task 6.1: Create/Update FRD

**Template**: `.jai1/templates/feature-docs/FRD-backend.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/FRD-[feature-name].md`
- Use template with confirmed requirements from Planning Phase

**IF MODE = UPDATE**:
- Read existing FRD
- Append new requirements (preserve existing)
- Mark changes with `[ADDED]` prefix

**CHECKPOINT**: Update `tasks.md` → Mark FRD `[x]` → Add to log

---

#### Task 6.2: Create/Update TDD

**Template**: `.jai1/templates/feature-docs/TDD-backend.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/TDD-[feature-name].md`
- Use design decisions from Planning Phase

**IF MODE = UPDATE**:
- Read existing TDD
- Add new design sections
- Preserve existing designs

**CRITICAL**: Section "6. Implementation Files" must list all files to create/modify

**CHECKPOINT**: Update `tasks.md`:
1. Mark TDD `[x]`
2. **Populate Phase 2** with file list from TDD Section 6
3. Add to checkpoint log

---

#### Task 6.3: Create/Update TEST

**Template**: `.jai1/templates/feature-docs/TEST-feature.template.md`

**IF MODE = NEW**:
- Create `docs/features/[feature-name]/TEST-[feature-name].md`
- Extract test scenarios from FRD (User Stories → Happy Path)
- Extract error cases from TDD (Error Handling section)

**IF MODE = UPDATE**:
- Read existing TEST
- Add new scenarios for new requirements
- Preserve existing scenarios

**CONTENT GUIDE**:
- **Happy Path**: 1 scenario per main User Story (US-XXX)
- **Error Cases**: 1 scenario per error code (ERR-XXX)
- **Edge Cases**: Only if có boundary conditions đặc biệt

**FORMAT**: Gherkin ngắn gọn (Given-When-Then, 3-5 lines per scenario)

**CHECKPOINT**: Update `tasks.md` → Mark TEST `[x]` → Add to log

---

### Step 7: Phase 2 - Auto-Implementation

**LOOP**: For each file in Phase 2 checklist:

1. **Read TDD** to get design for this file
2. **Check existing code** if MODE = UPDATE
3. **Detect project patterns** from existing codebase
4. **Generate/Modify code** according to TDD design
5. **Checkpoint**: Mark file `[x]` in `tasks.md`, add to log
6. **Continue** to next file

**IMPLEMENTATION RULES**:
- Follow project patterns (detect from existing code)
- Import correct dependencies
- Complete error handling
- Comments for complex logic (Vietnamese OK)
- Consistent naming conventions

---

### Step 8: Completion Report

**UPDATE `tasks.md`**:
```markdown
> **Status**: ✅ COMPLETED | **Mode**: [NEW/UPDATE]
```

**OUTPUT**:
```
✅ Feature Development Complete

📁 Feature: [Feature Name]
📂 Location: docs/features/[feature-name]/

📋 Planning:
- Requirements clarified: [X] points
- Design decisions: [Y] decisions

📄 Documentation:
- [✓] FRD-[feature-name].md
- [✓] TDD-[feature-name].md
- [✓] TEST-[feature-name].md

📦 Implementation:
- [✓] [file1.js] (created)
- [✓] [file2.js] (modified)
- ...

📊 Summary:
- Mode: [NEW/UPDATE]
- Files created: [X]
- Files modified: [Y]
- Total tasks: [Z]
```

---

## ✅ Quality Checklist

- [ ] Requirements fully clarified before design
- [ ] Design overview presented and confirmed
- [ ] `tasks.md` created with planning summary
- [ ] FRD has all requirements from user
- [ ] TDD has clear list of implementation files
- [ ] TEST covers Happy Path + Error Cases
- [ ] All files implemented according to TDD design
- [ ] Code follows project patterns
- [ ] Checkpoint log complete
