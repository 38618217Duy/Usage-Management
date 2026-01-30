---
description: Analyze jai1 framework and suggest improvements based on company context (JV-IT TECHS)
---

# Improve Jai1 Framework Workflow

## Objectives
Analyze jai1 framework and suggest improvements based on:
- Company context (JV-IT TECHS: 100 people, offshore Japan)
- Tech stack in use (PHP, Node.js, Frontend, Mobile, Cloud)
- Current state of workflows, skills, rules, templates
- Best practices for Agentic Software Development

---

## Required Input
- `FOCUS_AREAS` (optional): Priority areas for analysis (workflows/skills/rules/all)
- `OUTPUT_DIR`: Directory to save reports (default: `.jai1/improvements/`)

---

## STEP 1: Initialization & Resume Check

### 1.1 Check for resume
Read `{OUTPUT_DIR}/improvement-todo.md` if it exists to continue from incomplete step.

### 1.2 Create report structure
```
{OUTPUT_DIR}/
├── improvement-todo.md
├── 01-current-state-analysis.md
├── 02-gap-analysis.md
├── 03-workflow-suggestions.md
├── 04-skill-suggestions.md
├── 05-rule-suggestions.md
├── 06-template-suggestions.md
├── 07-script-suggestions.md
├── 08-implementation-roadmap.md
└── 09-summary.md
```

### 1.3 Create todo checklist
```markdown
# Improvement Analysis Progress
## Legend: [ ] Pending | [x] Done | [/] In Progress

### Step 1: Init
- [ ] Create folder structure
- [ ] Load company context

### Step 2: Current State
- [ ] Scan workflows
- [ ] Scan skills
- [ ] Scan rules
- [ ] Scan templates
- [ ] Scan scripts/prompts

### Step 3: Gap Analysis
- [ ] Tech stack coverage
- [ ] Workflow completeness
- [ ] Skill availability
- [ ] Documentation quality

### Step 4: Workflow Suggestions
- [ ] Identify missing workflows
- [ ] Identify improvement opportunities

### Step 5: Skill Suggestions
- [ ] Identify missing skills
- [ ] Identify skill enhancements

### Step 6: Rule Suggestions
- [ ] Review existing rules
- [ ] Suggest new rules

### Step 7: Template Suggestions
- [ ] Review existing templates
- [ ] Suggest new templates

### Step 8: Script Suggestions
- [ ] Automation opportunities
- [ ] Integration scripts

### Step 9: Roadmap & Summary
- [ ] Prioritize suggestions
- [ ] Create implementation roadmap
- [ ] Generate summary
```

---

## STEP 2: Current State Analysis

### 2.1 Load Company Context
Read information from `.jai1/rules/jvit-techs.md` to understand:
- Company size and team structure
- Tech stack in use
- Goals and objectives

### 2.2 Scan & Document Current Assets

#### Workflows (`.jai1/workflows/`)
List all existing workflows:
- Workflow name
- Purpose
- Tech stack served
- Quality assessment (1-5)

#### Skills (`.jai1/skills/`)
List all existing skills:
- Skill name
- Purpose
- Accompanying scripts/resources

#### Rules (`.jai1/rules/`)
List rules:
- Application scope
- Completeness level

#### Templates (`.jai1/templates/`)
List templates by category

📄 Output: `{OUTPUT_DIR}/01-current-state-analysis.md`

**→ Update todo: Step 2 completed**

---

## STEP 3: Gap Analysis

### 3.1 Tech Stack Coverage Matrix
Create matrix evaluating jai1 support level for each tech stack:

| Tech Stack | Workflows | Skills | Rules | Templates | Score |
|------------|-----------|--------|-------|-----------|-------|
| Laravel/PHP | ? | ? | ? | ? | ?/10 |
| NestJS/Node | ? | ? | ? | ? | ?/10 |
| React/Vue | ? | ? | ? | ? | ?/10 |
| Flutter/Mobile | ? | ? | ? | ? | ?/10 |
| Database | ? | ? | ? | ? | ?/10 |
| Cloud/DevOps | ? | ? | ? | ? | ?/10 |

### 3.2 SDLC Phase Coverage
Evaluate coverage by development phase:

| Phase | Currently Available | Missing | Priority |
|-------|---------------------|---------|----------|
| Planning | ? | ? | ? |
| Design | ? | ? | ? |
| Development | ? | ? | ? |
| Testing | ? | ? | ? |
| Deployment | ? | ? | ? |
| Maintenance | ? | ? | ? |
| Documentation | ? | ? | ? |

### 3.3 Common Tasks Analysis
Identify common tasks at JV-IT TECHS not yet supported:
- Daily development tasks
- Code review processes
- Deployment pipelines
- Bug fixing workflows
- Client communication

📄 Output: `{OUTPUT_DIR}/02-gap-analysis.md`

**→ Update todo: Step 3 completed**

---

## STEP 4: Workflow Suggestions

### 4.1 Missing Workflows Based on Tech Stack
Suggest new workflows based on:
- Frameworks without workflows (Laravel, CakePHP, NestJS, etc.)
- SDLC tasks not covered
- Offshore Japan needs (QA processes, documentation)

### 4.2 Existing Workflow Improvements
For each existing workflow:
- Improvement points
- Missing steps
- Templates to add

### 4.3 Suggested New Workflows (Detailed)
Each suggestion includes:
```markdown
### Workflow: [Name]
- **Purpose**: 
- **Tech stack**: 
- **Priority**: High/Medium/Low
- **Effort**: Small/Medium/Large
- **Outline steps**:
  1. ...
  2. ...
```

📄 Output: `{OUTPUT_DIR}/03-workflow-suggestions.md`

**→ Update todo: Step 4 completed**

---

## STEP 5: Skill Suggestions

### 5.1 Missing Skills
Identify required skills based on:
- Tech stack (Laravel artisan, NestJS CLI, Flutter commands)
- DevOps (SSH deploy, Docker commands, CI/CD)
- Utilities (Code formatting, Linting, Testing)

### 5.2 Skill Enhancement
For each existing skill:
- Scripts to add
- References to add
- Error handling improvements

### 5.3 Suggested New Skills
```markdown
### Skill: [Name]
- **Purpose**: 
- **Required scripts**: 
- **Required references**: 
- **Priority**: High/Medium/Low
- **Complexity**: Simple/Medium/Complex
```

📄 Output: `{OUTPUT_DIR}/04-skill-suggestions.md`

**→ Update todo: Step 5 completed**

---

## STEP 6: Rule Suggestions

### 6.1 Framework-Specific Rules
Suggest rules for each framework:
- Laravel coding conventions
- NestJS best practices
- React/Vue patterns
- Flutter guidelines

### 6.2 Process Rules
- Code review standards
- Git workflow (branching, commit messages)
- Documentation requirements
- Japan offshore communication guidelines

### 6.3 Security & Quality Rules
- Security best practices
- Performance guidelines
- Testing requirements

📄 Output: `{OUTPUT_DIR}/05-rule-suggestions.md`

**→ Update todo: Step 6 completed**

---

## STEP 7: Template Suggestions

### 7.1 Missing Templates
Identify required templates:
- Framework-specific boilerplates
- Documentation templates
- Project structure templates
- Config templates

### 7.2 Template Categories
- **feature-docs/**: Feature documentation
- **codebase-health/**: Health check reports
- **project-setup/**: Project initialization
- **deployment/**: Deployment configs
- **testing/**: Test templates

📄 Output: `{OUTPUT_DIR}/06-template-suggestions.md`

**→ Update todo: Step 7 completed**

---

## STEP 8: Script Suggestions

### 8.1 Automation Scripts
Automation scripts:
- Dependency checks
- Environment setup
- Deployment scripts
- Database migrations

### 8.2 Integration Scripts
- CI/CD pipelines
- External service integration
- Notification systems

### 8.3 Utility Scripts
- Code generators
- File processing
- Report generation

📄 Output: `{OUTPUT_DIR}/07-script-suggestions.md`

**→ Update todo: Step 8 completed**

---

## STEP 9: Implementation Roadmap & Summary

### 9.1 Prioritization Matrix

| Category | Item | Impact | Effort | Priority | Timeline |
|----------|------|--------|--------|----------|----------|
| Workflow | ? | High/Med/Low | S/M/L | P1/P2/P3 | ? |
| Skill | ? | High/Med/Low | S/M/L | P1/P2/P3 | ? |
| Rule | ? | High/Med/Low | S/M/L | P1/P2/P3 | ? |

### 9.2 Phased Roadmap
- **Phase 1 (Immediate - 1 week)**: Quick wins
- **Phase 2 (Short-term - 1 month)**: Medium effort
- **Phase 3 (Long-term - 3 months)**: Major additions

### 9.3 Score Summary
- Current maturity score: ?/10
- Target maturity score: ?/10
- Key metrics improvement areas

📄 Output: `{OUTPUT_DIR}/08-implementation-roadmap.md`

### 9.4 Executive Summary
Summary:
- Number of suggestions by category
- Top 5 improvements to do immediately
- Resource estimate
- Expected outcomes

📄 Output: `{OUTPUT_DIR}/09-summary.md`

**→ Update todo: All steps completed**

---

## Notes for AI Agent

### ⚠️ MANDATORY PRINCIPLES
1. **Context-Based**: All suggestions must be based on JV-IT TECHS context
2. **Actionable**: Each suggestion must have specific steps to implement
3. **Realistic**: Suitable for team size and capacity
4. **Incremental**: Prioritize gradual improvements, not complete overhaul

### Analysis Guidelines
1. **Tech Stack Priority**: Prioritize Laravel, NestJS, React as most common
2. **Offshore Context**: Pay attention to documentation and communication (Japan)
3. **Team Size**: Suggestions suitable for teams of 2-15 people
4. **Existing Patterns**: Leverage patterns already in the framework

### Output Quality
1. Use Vietnamese for content
2. Keep technical terms in English
3. Each suggestion has evidence/rationale
4. Include examples when needed

### Priority Levels
| Priority | Meaning | Timeline |
|----------|---------|----------|
| P1 | Critical, must do immediately | < 1 week |
| P2 | Important, should do soon | 1-4 weeks |
| P3 | Nice to have | > 1 month |

### Effort Levels
| Effort | Meaning | Time Estimate |
|--------|---------|---------------|
| S (Small) | Simple task | < 2 hours |
| M (Medium) | Moderate complexity | 2-8 hours |
| L (Large) | Complex, multi-step | > 1 day |
