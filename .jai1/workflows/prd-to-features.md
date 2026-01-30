---
description: Generate FRD/TDD for all features from PRD with auto-resume
---

# PRD to Features Workflow (Auto-Resume)

> **Goal**: Parse PRD and generate FRD/TDD documentation for each feature.
> **Resumable**: Check `docs/prd-to-features-todo.md`, if exists → resume from incomplete feature.

## ⚠️ CRITICAL RULES

1. ✅ **Auto-execute entirely** - Do not stop to ask user, process all features
2. ✅ **Checkpoint after each feature** - Update `docs/prd-to-features-todo.md` after each feature completed
3. ✅ **Extract from PRD** - Parse Section 3 (Product Scope) and Section 4 (User Stories)
4. ✅ **Vietnamese** - Documentation content in Vietnamese
5. ✅ **Resume first** - Always check `docs/prd-to-features-todo.md` before starting
6. ✅ **Verify with code** - Cross-reference with codebase when available

---

## 🎯 INPUT

**Required**:
- `docs/PRD.md` file exists (created by `/create-prd` workflow)

**Optional**:
- Specific feature to process: `/prd-to-features F-001`
- Range of features: `/prd-to-features F-001 F-003`

**Usage**: 
- `/prd-to-features` - Process all features from PRD
- `/prd-to-features [feature-id]` - Process specific feature only

---

## 🔄 Workflow Logic

### Step 1: Check Resume State

**ACTION**: Search for file `docs/prd-to-features-todo.md`

**IF `docs/prd-to-features-todo.md` EXISTS with status IN_PROGRESS**:
1. Read file content
2. Parse status: find first feature with `- [ ]` or `- [/]`
3. **IF found incomplete feature** → Jump to Step 4, process that feature
4. **IF all `[x]`** → Output "All features already documented" → END

**IF NOT EXISTS** → Continue to Step 2

---

### Step 2: Parse PRD Document

**ACTION**: Read `docs/PRD.md`

**EXTRACT from Section 3 (Product Scope)**:
```markdown
| Feature ID | Feature Name | Description | Priority | User Story Count |
```

**EXTRACT from Section 4 (User Stories)**:
```markdown
| Story ID | User Story | Priority | Est. Hours | Feature |
```

**GENERATE Feature List**:
For each feature in "In Scope (MVP)":
1. Extract: Feature ID, Feature Name, Description, Priority
2. Map related User Stories from Section 4
3. Generate folder name: `[XX]-[feature-name-kebab]`
   - XX = sequential number (01, 02, 03...)
   - feature-name-kebab = Feature Name in kebab-case

**OUTPUT**: List of features with metadata

**Example Mapping**:
```
F-001: Init/Config → 01-init-config
F-002: Check Version → 02-check-version
F-003: Download → 03-download
```

---

### Step 3: Create prd-to-features-todo.md

**CREATE**: `docs/prd-to-features-todo.md`

```markdown
# PRD to Features - Progress Tracker

> **Status**: IN_PROGRESS
> **PRD Source**: docs/PRD.md
> **Created**: [YYYY-MM-DD HH:mm]
> **Updated**: [YYYY-MM-DD HH:mm]

## Features to Document

- [ ] F-001: Init/Config → `docs/features/01-init-config/`
- [ ] F-002: Check Version → `docs/features/02-check-version/`
- [ ] F-003: Download → `docs/features/03-download/`
- [ ] F-004: Sync → `docs/features/04-sync/`
- [ ] F-005: Update → `docs/features/05-update/`
- [ ] F-006: Info/Status → `docs/features/06-info-status/`

## Progress Log

| Time | Feature | Status | Notes |
|------|---------|--------|-------|
```

**CHECKPOINT**: File created → Continue to Step 4

---

### Step 4: Process Each Feature (Loop)

**FOR EACH** feature marked `- [ ]` in todo:

#### 4.1 Analyze Feature

**GATHER INFORMATION**:
1. **From PRD**:
   - Feature description from Section 3
   - Related User Stories from Section 4
   - Priority and constraints
   
2. **From Codebase** (if exists):
   - Search for related routes, controllers, components
   - Extract API endpoints, data models
   - Identify business logic

3. **Determine Complexity**:
   | Level | Criteria | TDD Sections |
   |-------|----------|--------------|
   | Simple | 1-3 user stories, basic CRUD | 1-5 only |
   | Medium | 4-6 user stories, business rules | 1-7 |
   | Complex | 7+ user stories, workflows | 1-8 |

#### 4.2 Create Feature Folder

**CREATE**: `docs/features/[XX-feature-name]/`

#### 4.3 Generate FRD

**USE TEMPLATE**: `.jai1/templates/feature-docs/FRD-backend.template.md`

**CREATE**: `docs/features/[XX-feature-name]/FRD-[feature-name].md`

**CONTENT**:
- Map User Stories from PRD Section 4
- Add detailed acceptance criteria
- Reference back to PRD feature ID
- Include data requirements based on code analysis

#### 4.4 Generate TDD

**USE TEMPLATE**: `.jai1/templates/feature-docs/TDD-backend.template.md`

**CREATE**: `docs/features/[XX-feature-name]/TDD-[feature-name].md`

**CONTENT**:
- Design flow based on FRD requirements
- Technical specifications from code analysis
- API contracts if backend feature
- Component structure if frontend feature

#### 4.5 Generate Test Scenarios

**USE TEMPLATE**: `.jai1/templates/feature-docs/test-scenarios.template.md`

**CREATE**: `docs/features/[XX-feature-name]/test-scenarios.md`

**CONTENT**:
- Test cases derived from User Stories
- Edge cases and error scenarios
- Integration test scenarios if applicable

#### 4.6 Checkpoint

**UPDATE** `docs/prd-to-features-todo.md`:
1. Mark current feature `[x]`
2. Add entry to Progress Log
3. Update `Updated` timestamp

**CONTINUE** to next feature OR Step 5 if done

---

### Step 5: Completion Report

**UPDATE `docs/prd-to-features-todo.md`**:
```markdown
> **Status**: ✅ COMPLETED
```

**OUTPUT**:
```
✅ PRD to Features Complete

📁 PRD: docs/PRD.md
📂 Features Location: docs/features/

📄 Features Documented:
- [✓] 01-init-config/ (FRD, TDD, test-scenarios)
- [✓] 02-check-version/ (FRD, TDD, test-scenarios)
- [✓] 03-download/ (FRD, TDD, test-scenarios)
- [✓] 04-sync/ (FRD, TDD, test-scenarios)
- [✓] 05-update/ (FRD, TDD, test-scenarios)
- [✓] 06-info-status/ (FRD, TDD, test-scenarios)

📊 Summary:
- Total Features: [X]
- Files Created: [X * 3] (FRD + TDD + test-scenarios per feature)
- Code Verified: [Yes/Partial/No]

🔗 Next Steps:
- Review generated documentation
- Use /develop-feature to implement each feature
- Update docs as implementation progresses
```

---

## 🔄 Resume Logic Details

### When Resuming

1. **Read `docs/prd-to-features-todo.md`**
2. **Find first `- [ ]` feature**
3. **Check if partial files exist** in that feature folder
4. **If partial** → Complete remaining files
5. **If none** → Start fresh for that feature
6. **Continue** processing remaining features

### Example Resume Scenarios

**Scenario A**: Stopped at F-003 Download
- Resume: Skip F-001, F-002, continue from F-003

**Scenario B**: F-003 folder exists but only has FRD
- Resume: Create TDD and test-scenarios for F-003, then continue

---

## 📋 Usage Examples

### Example 1: Full Run
```
User: /prd-to-features

Workflow will:
1. Read docs/PRD.md
2. Extract all features (F-001 to F-006)
3. Create docs/prd-to-features-todo.md
4. Loop and create all feature docs
5. Report completion
```

### Example 2: Single Feature
```
User: /prd-to-features F-003

Workflow will:
1. Read docs/PRD.md
2. Extract only F-003 info
3. Create/update docs/features/03-download/
4. Generate FRD, TDD, test-scenarios for F-003 only
```

### Example 3: Resume After Interruption
```
User: /prd-to-features

Workflow will:
1. Find docs/prd-to-features-todo.md (exists, IN_PROGRESS)
2. Find first incomplete: F-004 Sync
3. Continue from F-004
4. Complete F-004, F-005, F-006
5. Report completion
```

---

## ✅ Quality Checklist

- [ ] `docs/prd-to-features-todo.md` created and tracks all features
- [ ] All features from PRD Section 3 are processed
- [ ] Each feature folder contains: FRD, TDD, test-scenarios
- [ ] FRD references PRD Feature ID and User Stories
- [ ] TDD complexity matches feature complexity
- [ ] Test scenarios cover all User Story acceptance criteria
- [ ] Code verification notes added where applicable
- [ ] Progress log is complete
- [ ] Final status updated to COMPLETED

---

## 📌 Notes

- **Dependency**: Requires `docs/PRD.md` from `/create-prd` workflow
- **Integration**: Generated docs feed into `/develop-feature` workflow
- **Consistency**: Uses same templates as `/gen-feature-doc`
- **Flexibility**: Can process single feature or all features
- **Traceability**: All FRDs link back to PRD feature IDs
