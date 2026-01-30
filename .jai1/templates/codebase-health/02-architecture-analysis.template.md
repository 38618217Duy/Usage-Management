# Architecture Analysis

## Current Architecture Pattern
**Pattern**: [MVC / Clean Architecture / Hexagonal / Monolith / Microservices / etc.]

### Description
[Mô tả tổng quan về kiến trúc hiện tại]

### Architecture Diagram
```
┌─────────────────────────────────────────────────┐
│                   Client Layer                   │
├─────────────────────────────────────────────────┤
│                   API Gateway                    │
├─────────────────────────────────────────────────┤
│  Service A  │  Service B  │  Service C          │
├─────────────────────────────────────────────────┤
│                   Data Layer                     │
└─────────────────────────────────────────────────┘
```

## Architecture Strengths
| Aspect | Description | Evidence |
|--------|-------------|----------|
| Separation of Concerns | [Mô tả] | `path/to/example` |
| Testability | [Mô tả] | `path/to/example` |
| Scalability | [Mô tả] | `path/to/example` |

## Architecture Weaknesses

### Issue Template
For each weakness, document:

### ARCH-1: [Issue Title]
- **Type**: [God Class / Tight Coupling / Missing Layer / Circular Dependency]
- **Severity**: 🔴 High / 🟡 Medium / 🟢 Low
- **Location**: `path/to/file.ts:line`
- **Description**: [Mô tả vấn đề]
- **Impact**: 
  - Maintainability: [Ảnh hưởng]
  - Testability: [Ảnh hưởng]
  - Performance: [Ảnh hưởng]
- **Evidence**:
  ```typescript
  // Code snippet showing the issue
  ```
- **Recommended Fix**: [Hướng khắc phục]

---

## Dependency Analysis

### Module Dependency Graph
```
ModuleA ──depends──> ModuleB
   │                    │
   └──────> ModuleC <───┘
```

### Problematic Dependencies
| From | To | Issue | Risk |
|------|----|-------|------|
| `module/a` | `module/b` | Circular | 🔴 High |
| `controller` | `database` | Skip service layer | 🟡 Medium |

## Layer Violations
| Violation | From Layer | To Layer | Files Affected |
|-----------|------------|----------|----------------|
| Direct DB access | Controller | Database | 5 files |
| Business logic in view | View | Domain | 3 files |

## Recommendations
1. **Short-term**: [Cải thiện ngay được]
2. **Medium-term**: [Cần planning]
3. **Long-term**: [Cần refactor lớn]
