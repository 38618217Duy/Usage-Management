# Code Quality Report

## Summary Scores
| Metric | Score | Status | Notes |
|--------|-------|--------|-------|
| Code Duplication | X/10 | 🔴/🟡/🟢 | |
| Error Handling | X/10 | 🔴/🟡/🟢 | |
| Naming Conventions | X/10 | 🔴/🟡/🟢 | |
| Test Coverage | X% | 🔴/🟡/🟢 | |
| **Overall** | X/10 | 🔴/🟡/🟢 | |

---

## 1. Code Duplication Analysis

### Duplicated Code Blocks
| ID | Pattern | Occurrences | Files | Lines | Effort to Fix |
|----|---------|-------------|-------|-------|---------------|
| DUP-1 | [Mô tả pattern] | X | [files] | ~XX | X hours |

### DUP-1: [Pattern Name]
**Files affected:**
- `path/to/file1.ts:10-25`
- `path/to/file2.ts:50-65`

**Duplicated code:**
```typescript
// The duplicated code block
```

**Recommended solution:**
```typescript
// Extracted utility/shared function
```

---

## 2. Error Handling Issues

### Error Handling Patterns Found
| Pattern | Count | Risk | Location Examples |
|---------|-------|------|-------------------|
| Empty catch blocks | X | 🔴 High | `file.ts:XX` |
| Generic error messages | X | 🟡 Medium | `file.ts:XX` |
| Unhandled promises | X | 🔴 High | `file.ts:XX` |
| Missing error boundaries | X | 🟡 Medium | `file.ts:XX` |

### ERR-1: [Error Handling Issue]
- **Location**: `path/to/file.ts:line`
- **Issue**: [Mô tả]
- **Current code**:
  ```typescript
  // problematic code
  ```
- **Risk**: [Potential impact]
- **Fix**:
  ```typescript
  // improved code
  ```

---

## 3. Naming Convention Issues

### Consistency Analysis
| Convention | Expected | Found Violations | Files |
|------------|----------|------------------|-------|
| Variables | camelCase | X | [list] |
| Functions | camelCase | X | [list] |
| Classes | PascalCase | X | [list] |
| Constants | UPPER_SNAKE | X | [list] |
| Files | kebab-case | X | [list] |

### Naming Issues List
| File | Line | Current | Suggested | Type |
|------|------|---------|-----------|------|
| `file.ts` | 10 | `user_name` | `userName` | Variable |
| `file.ts` | 20 | `GetUser` | `getUser` | Function |

---

## 4. Test Coverage Analysis

### Coverage Summary
| Type | Coverage | Files | Missing |
|------|----------|-------|---------|
| Unit Tests | X% | X/Y | [list] |
| Integration Tests | X% | X/Y | [list] |
| E2E Tests | X% | X/Y | [list] |

### Critical Paths Without Tests
| Path | Risk | Priority | Effort |
|------|------|----------|--------|
| `auth/login` | 🔴 High | P0 | 4h |
| `payment/process` | 🔴 High | P0 | 8h |
| `user/profile` | 🟡 Medium | P1 | 2h |

### Test Quality Issues
| Issue | Count | Examples |
|-------|-------|----------|
| No assertions | X | `test.ts:XX` |
| Weak assertions | X | `test.ts:XX` |
| Missing edge cases | X | `test.ts:XX` |
| Flaky tests | X | `test.ts:XX` |

---

## 5. Code Complexity

### High Complexity Files (Cyclomatic > 10)
| File | Function | Complexity | Lines | Risk |
|------|----------|------------|-------|------|
| `file.ts` | `processOrder` | 25 | 150 | 🔴 High |
| `file.ts` | `validateInput` | 15 | 80 | 🟡 Medium |

### God Files (> 500 lines)
| File | Lines | Functions | Recommendation |
|------|-------|-----------|----------------|
| `utils.ts` | 1200 | 45 | Split by domain |
| `api.ts` | 800 | 30 | Split by resource |
