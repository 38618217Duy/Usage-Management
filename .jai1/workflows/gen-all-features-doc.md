# gen-all-features-doc

> Tạo tài liệu chức năng (FRD/TDD) cho TOÀN BỘ features trong dự án có sẵn.

**Goal**: Create comprehensive Functional Requirements (FRD) and Technical Design (TDD) documentation.
**Mechanism**: State-Aware with **Auto Project Type Detection**. Checks `docs/features/todo.md`. If missing, creates it (Planning). Then iterates through tasks until completion (Execution).
**Resumable**: If the process stops, re-running this workflow will pick up exactly where it left off.

## ⚠️ CRITICAL RULES

1. ✅ **Extract from actual code only** - No assumptions or suggestions.
2. ✅ **Include paths** - Routes/endpoints/components with file references.
3. ✅ **Verify completeness** - Check all features documented.
4. ✅ **TDD quality** - Match complexity to feature (Simple/Medium/Complex).
5. ✅ **Language** - Use **Vietnamese** for all content (except code/technical terms).

---

## 🔍 Project Type Detection

### Step 0: Auto-Detect Project Type

**ACTIONS** (Before Step 1):
1. Check project configuration files to determine type
2. Select appropriate templates and scan targets

### Detection Matrix

| Check | Indicators | Type | Template Set |
|-------|------------|------|--------------|
| **Backend-PHP** | `composer.json` + `routes/api.php` or `app/Http/Controllers/` | Laravel/CakePHP | Backend |
| **Backend-Node** | `nest-cli.json` or `src/controllers/` with Express patterns | NestJS/Express | Backend |
| **Frontend-React** | `package.json` with `next` or `react` + `pages/` or `app/` | Next.js/React | Frontend |
| **Frontend-Vue** | `package.json` with `nuxt` or `vue` + `pages/` or `src/views/` | Nuxt/Vue | Frontend |
| **Monorepo** | `pnpm-workspace.yaml` or `lerna.json` or `packages/` folder | Monorepo | Per-package |
| **Fullstack** | Both Backend + Frontend indicators found | Fullstack | Both |
| **Static/jQuery** | `.html` files + `<script>` tags with jQuery | Legacy Frontend | Frontend-simple |

### Template Selection

| Project Type | FRD Template | TDD Template | Scan Targets |
|--------------|--------------|--------------|--------------|
| **Backend-only** | `FRD-backend.template.md` | `TDD-backend.template.md` | routes, controllers, models, services |
| **Frontend-only** | `FRD-frontend.template.md` | `TDD-frontend.template.md` | pages, components, hooks, stores |
| **Fullstack/Mixed** | `FRD-fullstack.template.md` | `TDD-fullstack.template.md` | All targets (backend + frontend) |
| **Monorepo** | Detect per package | Detect per package | Each package separately |

### TDD Complexity Guide

**For Backend:**
| Level | Criteria | Sections |
|-------|----------|----------|
| **Simple** | Basic CRUD (3-5 operations) | 1-5 only |
| **Medium** | Standard operations + business rules | 1-6 |
| **Complex** | Multi-step workflows + complex logic | 1-8 |

**For Frontend:**
| Level | Criteria | Sections |
|-------|----------|----------|
| **Simple** | Basic UI rendering + simple state | 1-4 only |
| **Medium** | Form handling + API integration | 1-6 |
| **Complex** | Complex state management + multi-step flows | 1-8 |

---

## 🔄 Workflow Logic

### Step 1: State Check & Planning

Check if `docs/features/todo.md` exists.

**CASE A: File DOES NOT Exist (First Run - Planning Phase)**

1. **Detect Project Type**: Use Detection Matrix above → Determine type → Set template set.
2. **Check Business Documentation**: Find existing docs → If NOT FOUND → **FALLBACK**: Extract from code.
3. **Analyze Project Structure**: 
   - **Backend**: Scan `routes/`, `controllers/`, `models/`, `services/`
   - **Frontend**: Scan `pages/`, `components/`, `hooks/`, `stores/`, `src/views/`
   - **Monorepo**: Iterate through `packages/*/` and detect each package type
4. **Create State File**: Create `docs/features/todo.md` containing ALL identified features.

**State File Structure**:
```markdown
# Feature Documentation TODO
> Project: [Name] | Type: [Backend/Frontend/Fullstack/Monorepo] | Status: In Progress

## Detected Configuration
- **Project Type**: [Type]
- **Framework**: [Framework Name]
- **Template Set**: [Backend/Frontend/Both]

## Features Checklist

### Feature: [feature-name] (NO numbering)
- [ ] FRD-[feature-name].md
- [ ] TDD-[feature-name].md
- [ ] TEST-[feature-name].md

### Feature: [feature-name]
- [ ] FRD-[feature-name].md
- [ ] TDD-[feature-name].md
- [ ] TEST-[feature-name].md
...
```

5. **Auto-Transition**: Do NOT stop. Immediately proceed to **Step 2**.

**CASE B: File EXISTS (Resume - Execution Phase)**
1. **Read State**: Read the content of `docs/features/todo.md`.
2. **Extract Project Type**: Get type from "Detected Configuration" section.
3. **Proceed**: Jump to **Step 2**.

---

### Step 2: Execution Loop (The Engine)

**INSTRUCTION**: Perform the following loop until no unchecked items remain.

1. **Identify Next Task**:
   - Parse `docs/features/todo.md`.
   - Find the **first** line starting with `- [ ]`.
   - **IF NO UNCHECKED ITEMS**: Stop. Output "All features documented."
   - **IF FOUND**: Identify the task type (FRD, TDD, or TEST) and the Feature Name.

2. **Analyze Feature Complexity**:
   - Simple: Basic CRUD, single entity, no complex logic
   - Medium: Multiple entities, business logic, permissions
   - Complex: Workflows, integrations, security requirements

3. **Generate Documentation (with Conditional Sections)**:
   
   **For each section in template:**
   - Read the `[CONDITIONAL]` markers
   - Check INCLUDE IF / SKIP IF conditions
   - **IF SKIP IF matches** → Omit section entirely (don't create empty section)
   - **IF INCLUDE IF matches** → Generate content from code
   
   **Section Skip Rules:**
   | Section | Skip If |
   |---------|---------|
   | ERD / Data Model | Feature không tạo/modify database |
   | Roles & Permissions | Không có auth/permission logic |
   | Business Rules | Simple CRUD, không có rules đặc biệt |
   | NFR | Standard requirements, không có metrics đặc biệt |
   | Process Flow | Single-step action |
   | Security & Performance | Simple/Medium complexity |
   | Edge Cases (Test) | Không có boundary conditions |
   | Integration Tests | Standalone feature |

4. **Checkpoint (CRITICAL)**:
   - **Update `docs/features/todo.md`**: Change the specific line from `- [ ]` to `- [x]`.
   - *Why?* This saves progress. If the agent crashes now, the next run skips this task.

5. **Repeat**:
   - Go back to sub-step 1 of Step 2.
   - Continue until all items are `[x]`.

---

## 📝 Documentation Templates & Guidelines

### Templates Location

All templates are located in `.jai1/templates/feature-docs/`:

| Document | Backend Template | Frontend Template |
|----------|------------------|-------------------|
| FRD | `FRD-backend.template.md` | `FRD-frontend.template.md` |
| TDD | `TDD-backend.template.md` | `TDD-frontend.template.md` |
| TEST | `TEST-feature.template.md` | `TEST-feature.template.md` |

### Template Usage

1. **Read template file** before generating each document
2. **Replace placeholders** `[placeholder]` with actual values
3. **Remove sections** not applicable (especially for TDD by complexity)
4. **Verify with source code** - all information must be extracted from code

---

## 🏗️ Monorepo Handling

For monorepo projects:

1. **Scan Packages**: List all packages in `packages/` or workspace config
2. **Per-Package Detection**: Detect type of each package independently
3. **Feature Grouping**: Group features by package with prefix
   ```markdown
   ### Package: @app/api (Backend)
   - [ ] FRD-auth.md
   - [ ] TDD-auth.md
   ...
   
   ### Package: @app/web (Frontend)
   - [ ] FRD-dashboard.md
   - [ ] TDD-dashboard.md
   ...
   ```
4. **Output Structure**: 
   ```
   docs/features/
   ├── api/
   │   ├── auth/
   │   └── users/
   └── web/
       ├── dashboard/
       └── settings/
   ```

---

## ✅ Final Notes

- **Language**: Use Vietnamese, include file paths.
- **Verification**: Verify all from code, no assumptions.
- **Complexity**: Conditional sections based on complexity.
- **Scope**: Auto-detect and support Backend/Frontend/Fullstack/Monorepo.
- **Flow**: Sequential: FRD → TDD → Tests per feature → Next feature.
- **Naming**: Folder names must be `[feature-name]` (snake_case or kebab-case), NO numbering.

---

## ✅ Requirements

- ✅ Use Vietnamese, include real code examples with file paths
- ✅ All information MUST be verified from source code
- ✅ [CONDITIONAL] sections only added when information exists
- ✅ Auto-detect project type (Backend/Frontend/Fullstack/Monorepo)
- ✅ Output MUST be complete but concise - NO suggestions, NO recommendations, NO future improvements
- ✅ If information not found in code → Skip section or mark "Not applicable", DO NOT add placeholder content

## 🔄 Continuous Execution Guidelines

**CRITICAL**: 
1. Never stop for input → Use fallbacks
2. Detect project type → Select appropriate templates
3. Create `docs/features/todo.md` with ALL features
4. For EACH feature (in order):
   - Create FRD → Update checkbox ✓
   - Create TDD → Update checkbox ✓
   - Create TEST → Update checkbox ✓
5. Verify ALL → Generate completion report

**Sequential Workflow**: Complete all 3 documents for Feature 1 → Move to Feature 2 → Continue until ALL features done
