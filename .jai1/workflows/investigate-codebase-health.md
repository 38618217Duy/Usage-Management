---
description: Investigate Codebase Health - Analyze technical debt, maintainability, CCU simulation, and propose improvements
---

# Investigate Codebase Health Workflow

## Objectives
Analyze source code to evaluate:
- Maintainability
- Technical Debt and Security
- Performance issues
- Scalability (CCU Simulation)
- Propose improvements suitable for the current context

## Required Input
- `PROJECT_PATH`: Path to the source code to analyze
- `FOCUS_AREAS` (optional): Modules/features to prioritize
- `OUTPUT_DIR`: Directory to save reports (default: `./codebase-health-report/`)

## Templates Location
Report templates: `.jai1/templates/codebase-health/*.template.md`

---

## STEP 1: Initialization and Resume Check

### 1.1 Check for resume
Read `{OUTPUT_DIR}/investigation-todo.md` if it exists to continue from the incomplete step.

### 1.2 Create report structure
```
{OUTPUT_DIR}/
├── investigation-todo.md
├── 01-project-overview.md
├── 02-architecture-analysis.md
├── 03-code-quality-report.md
├── 04-performance-issues.md
├── 05-technical-debt.md
├── 06-ccu-simulation.md
├── 07-improvement-proposals.md
└── 08-executive-summary.md
```

### 1.3 Create investigation-todo.md with checklist
```markdown
# Investigation Progress
## Legend: [ ] Pending | [x] Done | [~] In Progress

### Step 1: Init - [ ] structure, [ ] tech stack
### Step 2: Overview - [ ] dependencies, [ ] entry points
### Step 3: Architecture - [ ] patterns, [ ] code smells, [ ] coupling
### Step 4: Quality - [ ] duplication, [ ] errors, [ ] tests
### Step 5: Performance - [ ] queries, [ ] caching, [ ] scalability indicators
### Step 6: Debt - [ ] deprecated, [ ] vulnerabilities, [ ] docs
### Step 7: CCU - [ ] flows, [ ] bottlenecks, [ ] capacity, [ ] risks
### Step 8: Proposals - [ ] quick wins, [ ] medium, [ ] major, [ ] replacements
### Step 9: Summary - [ ] scores, [ ] roadmap, [ ] resources
```

---

## STEP 2: Project Overview Analysis

### 2.1 Find and analyze
- Package managers: `package.json`, `composer.json`, `requirements.txt`, `pom.xml`
- Container: `Dockerfile`, `docker-compose.yml`
- Config: `.env.example`, `config/*`
- Documentation: `README.md`

### 2.2 Document
- Tech stack with versions
- Project structure
- Entry points (web, API, CLI, jobs)
- Dependencies count and outdated

📄 Template: `.jai1/templates/codebase-health/01-project-overview.template.md`

**→ Update todo: Step 2 completed**

---

## STEP 3: Architecture Analysis

### 3.1 Analyze patterns
- Design patterns: MVC, Repository, Service Layer, Clean Architecture
- Dependency injection
- Module separation and boundaries
- API versioning

### 3.2 Find code smells
- God classes: files > 500 lines
- Circular dependencies
- Tight coupling between modules
- Missing abstraction layers
- Layer violations (controller directly calling DB)

📄 Template: `.jai1/templates/codebase-health/02-architecture-analysis.template.md`

**→ Update todo: Step 3 completed**

---

## STEP 4: Code Quality Scan

### 4.1 Check
- **Duplication**: Copy-paste blocks, similar logic patterns
- **Error handling**: Empty catch, generic messages, unhandled promises
- **Naming**: Consistency, meaningful names
- **Tests**: Coverage %, critical paths without tests
- **Complexity**: Cyclomatic > 10, deeply nested code

📄 Template: `.jai1/templates/codebase-health/03-code-quality-report.template.md`

**→ Update todo: Step 4 completed**

---

## STEP 5: Performance Analysis

### 5.1 Database
- N+1 query patterns
- Missing indexes (WHERE, JOIN columns)
- Full table scans
- Large data without pagination

### 5.2 API and Resources
- Over-fetching data
- Missing caching opportunities
- Sync blocking operations
- Memory leak patterns
- Connection pooling config

### 5.3 Scalability Indicators (for CCU)
Document:
- DB connection pool size
- Redis/Cache limits
- Session storage (memory/redis/db)
- File upload: sync/async
- WebSocket connections
- Rate limiting
- Queue workers count
- Stateless vs Stateful

📄 Template: `.jai1/templates/codebase-health/04-performance-issues.template.md`

**→ Update todo: Step 5 completed**

---

## STEP 6: Technical Debt Assessment

### 6.1 Deprecated patterns
- Deprecated API/library usage
- Legacy code patterns
- TODO/FIXME/HACK comments (grep codebase)

### 6.2 Dependencies
- Security vulnerabilities: `npm audit`, `composer audit`
- Major versions behind
- Abandoned packages

### 6.3 Documentation debt
- Missing API docs
- Outdated README
- No onboarding guide

📄 Template: `.jai1/templates/codebase-health/05-technical-debt.template.md`

**→ Update todo: Step 6 completed**

---

## STEP 7: CCU Simulation (Concurrent Users)

### 7.1 Identify Critical User Flows
- Authentication (login/logout/session)
- Core business CRUD
- Search/Filter
- File upload/download
- Real-time features

### 7.2 Analyze Bottlenecks
Based on Step 4-6:
- Database: N+1, missing index, lock contention
- Memory: large objects, no pagination
- I/O: sync files, external API calls
- Connections: pool exhaustion

### 7.3 Calculate CCU Capacity
```
Max CCU = Min(
  DB_Pool / Queries_per_request,
  Memory / Memory_per_request,
  CPU / CPU_per_request
)
```

### 7.4 Identify High-Risk Features
Features requiring replacement/refactor:
- CCU limit < 50: Critical
- CCU limit 50-200: Warning
- CCU limit > 200: Safe

📄 Template: `.jai1/templates/codebase-health/06-ccu-simulation.template.md`

**→ Update todo: Step 7 completed**

---

## STEP 8: Improvement Proposals

### 8.1 Classification
- **Quick Wins** (< 1 day): High impact, low risk
- **Medium Effort** (1-5 days): Needs planning
- **Major Refactoring** (> 5 days): Phased approach
- **Partial Replacement**: Module too degraded, needs replacement

### 8.2 Principles
- Incremental, no full rewrite
- Backward compatible
- High-impact first
- Evidence-based from analysis

📄 Template: `.jai1/templates/codebase-health/07-improvement-proposals.template.md`

**→ Update todo: Step 8 completed**

---

## STEP 9: Executive Summary

### 9.1 Consolidate
- Scores: Maintainability/Performance/Scalability/Security/Debt
- Top 5 critical issues
- Recommended roadmap: Immediate → Short-term → Long-term
- Resource estimation

### 9.2 Finalize
- Review all files
- Ensure consistency
- Mark todo completed

📄 Template: `.jai1/templates/codebase-health/08-executive-summary.template.md`

---

## Notes for AI Agent

### ⚠️ MANDATORY PRINCIPLES
**Source-Based Only**: All information, assessments, and conclusions MUST be extracted directly from the source code. NO speculation, NO assumptions, NO fabricated information. If no evidence is found in the code → clearly state "Not found" or "Insufficient information to evaluate".

### Other Principles
1. **Resume**: Always check `investigation-todo.md` first
2. **Templates**: Copy from `.jai1/templates/codebase-health/` and fill data
3. **Evidence**: Every issue MUST have `file:line` reference - exact citations from code
4. **Actionable**: Every proposal has clear next steps
5. **Context-aware**: Suitable for current tech stack (determined from code, no assumptions)
6. **Non-destructive**: Incremental improvement, no rewrite
7. **CCU Focus**: Pay attention to high-risk features needing partial replacement
8. **Verification**: When uncertain → re-read the code to confirm, do not guess

## Scoring Guide
| Score | Status | Meaning |
|-------|--------|---------|
| 9-10 | 🟢 | Excellent |
| 7-8 | 🟢 | Good |
| 5-6 | 🟡 | Moderate |
| 3-4 | 🟡 | Significant issues |
| 1-2 | 🔴 | Critical |
