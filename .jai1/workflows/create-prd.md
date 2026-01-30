---
description: Create Product Requirements Document (PRD) for new project with auto-resume
---

# PRD Creation Workflow (Auto-Resume)

> **Goal**: Create comprehensive Product Requirements Document (PRD) for a new project.
> **Resumable**: Check `docs/prd-todo.md`, if exists → resume from incomplete task.

## ⚠️ CRITICAL RULES

1. ✅ **Auto-execute entirely** - Do not stop to ask user, only stop when need to clarify ambiguity
2. ✅ **Checkpoint after each task** - Update `docs/project/todo.md` after each section completed
3. ✅ **Extract from input** - Use user input and project context to populate PRD
4. ✅ **Vietnamese** - Documentation content in Vietnamese
5. ✅ **Resume first** - Always check `docs/project/todo.md` before starting
6. ✅ **Smart inference** - Use reasonable defaults when information is missing

---

## 🎯 INPUT

**Required**:
- Project/Product name
- Basic project description or requirements

**Optional** (will be inferred if missing):
- Client/Stakeholder information
- Target market/users
- Business objectives
- Timeline constraints
- Technical constraints

**Usage**: `/create-prd [project-name] [description/requirements]`

---

## 🔄 Workflow Logic

### Step 1: Check Resume State

**ACTION**: Search for file `docs/prd-todo.md`

**IF `docs/prd-todo.md` EXISTS with status IN_PROGRESS**:
1. Read file content
2. Parse status: find first task with `- [ ]` or `- [/]`
3. **IF found incomplete task** → Jump to matching phase/step, RESUME
4. **IF all `[x]`** → Output "PRD already completed" → END

**IF NOT EXISTS** → Continue to Step 2

---

### Step 2: Parse Input & Initialize

**ACTIONS**:
1. **Parse user input**: Extract project name, description, requirements
2. **Generate canonical name**: kebab-case English (e.g., `e-commerce-platform`)
3. **Create docs directory**: `docs/` (if not exists)
4. **Detect project context** (if codebase exists):
   - Check for existing documentation
   - Identify project type (web app, mobile, API, etc.)
   - Detect framework/technology stack

**OUTPUT**: Project Name, Description, Context Info

---

### Step 3: Create prd-todo.md (Checkpoint File)

**CREATE**: `docs/prd-todo.md`

```markdown
# PRD Creation TODO

> **Status**: IN_PROGRESS
> **Project**: [Project Name]
> **Created**: [YYYY-MM-DD HH:mm]
> **Updated**: [YYYY-MM-DD HH:mm]

## Phase 1: Information Gathering
- [ ] Collect project requirements from input
- [ ] Identify stakeholders and team structure
- [ ] Analyze market and user needs (if provided)

## Phase 2: PRD Sections
- [ ] 1. Executive Summary
- [ ] 2. Market & User Analysis
- [ ] 3. Product Scope
- [ ] 4. User Stories (High-Level)
- [ ] 5. Success Metrics & KPIs
- [ ] 6. Product Roadmap
- [ ] 7. Risk Assessment
- [ ] 8. Stakeholders & Team
- [ ] 9. Dependencies & Integrations
- [ ] 10. Compliance & Legal
- [ ] 11. Appendices

## Phase 3: Review & Finalization
- [ ] Review PRD completeness
- [ ] Verify all sections filled
- [ ] Add version history

## Checkpoint Log
| Time | Task | Status | Notes |
|------|------|--------|-------|
```

**CHECKPOINT**: `docs/prd-todo.md` created → Continue immediately

---

### Step 4: Phase 1 - Information Gathering

#### Task 4.1: Collect Requirements

**ACTIONS**:
1. Extract all information from user input
2. Identify missing information areas
3. Use smart inference for missing data:
   - If no client mentioned → Use "Client TBD" or infer from project type
   - If no timeline → Suggest typical timeline based on project scope
   - If no market info → Use generic market analysis placeholders

**OUTPUT**: Requirements Summary

**CHECKPOINT**: Update `docs/prd-todo.md` → Mark "Collect project requirements" `[x]`

---

#### Task 4.2: Identify Stakeholders

**ACTIONS**:
1. Extract stakeholder info from input (if provided)
2. If missing, create default structure:
   - Product Owner
   - Client Representative
   - Technical Lead
   - Development Team roles

**OUTPUT**: Stakeholder List

**CHECKPOINT**: Update `docs/prd-todo.md` → Mark "Identify stakeholders" `[x]`

---

#### Task 4.3: Analyze Market & Users

**ACTIONS**:
1. Extract market/user info from input (if provided)
2. If missing, create placeholder sections with guidance for user to fill

**OUTPUT**: Market & User Analysis Draft

**CHECKPOINT**: Update `docs/prd-todo.md` → Mark "Analyze market" `[x]` → Continue to Phase 2

---

### Step 5: Phase 2 - PRD Document Creation

**TEMPLATE**: `.jai1/templates/project-docs/PRD.template.md`

**CREATE**: `docs/PRD.md`

**LOOP**: For each section in Phase 2 checklist:

1. **Read template** to understand section structure
2. **Populate section** with gathered information:
   - Use extracted data from input
   - Use inferred/default values where needed
   - Mark placeholders with `[TO BE FILLED]` if critical info missing
3. **Checkpoint**: Mark section `[x]` in `docs/prd-todo.md`, add to log
4. **Continue** to next section

**SECTION-SPECIFIC RULES**:

- **Section 1 (Executive Summary)**: Must have at least product vision and primary goals
- **Section 2 (Market & User Analysis)**: Can use placeholders if no market research available
- **Section 3 (Product Scope)**: Must identify at least MVP features from input
- **Section 4 (User Stories)**: Create high-level stories, detailed ones go in FRD
- **Section 5 (Success Metrics)**: Include at least 3-5 key metrics
- **Section 6 (Roadmap)**: Create at least Phase 1 (MVP) timeline
- **Section 7 (Risk Assessment)**: Identify at least 3-5 common risks
- **Section 8 (Stakeholders)**: Use gathered stakeholder info
- **Section 9 (Dependencies)**: List known dependencies, mark unknown as TBD
- **Section 10 (Compliance)**: Include basic data privacy if applicable
- **Section 11 (Appendices)**: Add glossary and references

**CHECKPOINT**: After each section → Update `docs/prd-todo.md`

---

### Step 6: Phase 3 - Review & Finalization

#### Task 6.1: Review Completeness

**ACTIONS**:
1. Read complete PRD document
2. Check for empty sections or `[TO BE FILLED]` placeholders
3. Verify all required sections present
4. Check consistency (dates, names, references)

**OUTPUT**: Completeness Report

**CHECKPOINT**: Update `docs/prd-todo.md` → Mark "Review PRD completeness" `[x]`

---

#### Task 6.2: Finalize Document

**ACTIONS**:
1. Add version history entry
2. Update document status
3. Ensure all placeholders are either filled or clearly marked
4. Add any missing cross-references

**CHECKPOINT**: Update `docs/prd-todo.md` → Mark all remaining tasks `[x]` → Update status to COMPLETED

---

### Step 7: Completion Report

**UPDATE `docs/prd-todo.md`**:
```markdown
> **Status**: ✅ COMPLETED
```

**OUTPUT**:
```
✅ PRD Creation Complete

📁 Project: [Project Name]
📂 Location: docs/

📄 Documentation:
- [✓] PRD.md

📊 Summary:
- Sections completed: [X/11]
- Placeholders remaining: [Y] (if any)
- Next steps: [Suggestions for user]
```

---

## 📝 Template Usage

### Template Location
- **PRD Template**: `.jai1/templates/project-docs/PRD.template.md`

### Template Guidelines
1. **Read template** before starting document creation
2. **Replace placeholders** `[placeholder]` with actual values
3. **Remove optional sections** if not applicable
4. **Mark critical missing info** with `[TO BE FILLED]` for user attention
5. **Use Vietnamese** for all descriptive content
6. **Keep technical terms** in English

---

## ✅ Quality Checklist

- [ ] `docs/prd-todo.md` created and updated completely
- [ ] PRD document created with all 11 sections
- [ ] Executive Summary has clear vision and goals
- [ ] Product Scope identifies MVP features
- [ ] User Stories are high-level (detailed ones for FRD)
- [ ] Success Metrics are measurable and realistic
- [ ] Roadmap has at least Phase 1 timeline
- [ ] Risk Assessment identifies key risks
- [ ] All placeholders either filled or clearly marked
- [ ] Version history added
- [ ] Checkpoint log complete

---

## 🔄 Resume Logic Details

### When Resuming

1. **Read `docs/prd-todo.md`**
2. **Find first `- [ ]` task**
3. **Identify which section/task it corresponds to**
4. **Jump to that step** in workflow
5. **Continue from there**

### Example Resume Scenarios

**Scenario A**: Stopped at "2. Market & User Analysis"
- Resume: Read existing PRD, continue from Section 2

**Scenario B**: Stopped at "6. Product Roadmap"
- Resume: Read existing PRD, continue from Section 6

**Scenario C**: All sections done, need review
- Resume: Jump to Phase 3 (Review & Finalization)

---

## 📌 Notes

- **PRD vs FRD**: PRD is high-level product vision, FRD is detailed feature requirements
- **Placeholders**: It's OK to have `[TO BE FILLED]` for sections requiring client input
- **Iterative**: PRD can be updated as project evolves
- **Integration**: PRD feeds into `/prd-to-features` workflow for individual feature docs

