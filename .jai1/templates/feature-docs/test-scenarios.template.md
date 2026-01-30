# Test Scenarios: [Feature Name]

> **Feature**: [Name] | **FRD**: [link] | **TDD**: [link]

---

## Quick Summary

| Category | Count | Priority |
|----------|-------|----------|
| Happy Path | [X] | Critical |
| Error Handling | [X] | High |
| Edge Cases | [X] | Medium (optional) |

---

## 1. Happy Path Tests [REQUIRED]

> Core functionality tests - what MUST work

### TC-001: [Main Success Scenario]

| Attribute | Value |
|-----------|-------|
| **Priority** | Critical |
| **Type** | Positive |
| **Related** | US-001 |

**Pre-conditions**:
- [Required setup]

**Test Steps**:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [User action] | [System response] |
| 2 | [User action] | [System response] |

**Expected Result**: [Success criteria]

---

### TC-002: [Secondary Success Scenario]

| Attribute | Value |
|-----------|-------|
| **Priority** | High |
| **Type** | Positive |
| **Related** | US-002 |

**Test Steps**:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Action] | [Result] |

**Expected Result**: [Success criteria]

---

## 2. Error Handling Tests [REQUIRED]

> What happens when things go wrong

### TC-003: [Validation Error Scenario]

| Attribute | Value |
|-----------|-------|
| **Priority** | High |
| **Type** | Negative |
| **Related** | BR-001 |

**Test Steps**:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Invalid action] | [Error message displayed] |

**Expected Error**:
- Message: [Expected error message]
- Recovery: [How user can fix]

---

### TC-004: [Authorization Error Scenario]

| Attribute | Value |
|-----------|-------|
| **Priority** | High |
| **Type** | Negative |
| **Related** | Roles & Permissions |

**Test Steps**:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Unauthorized action] | [Access denied message] |

---

## 3. Edge Cases [OPTIONAL]

> **INCLUDE IF**: Feature có boundary conditions cần test (min/max values, empty states)
> **SKIP IF**: Simple feature without special boundary handling

### TC-005: [Boundary Condition]

| Attribute | Value |
|-----------|-------|
| **Priority** | Medium |
| **Type** | Edge |

**Test Data**: [Boundary value - max/min/empty]

**Expected Result**: [How system handles edge case]

---

## 4. Integration Tests [OPTIONAL]

> **INCLUDE IF**: Feature phụ thuộc vào features khác hoặc external services
> **SKIP IF**: Standalone feature

### TC-006: [Cross-Feature Scenario]

| Attribute | Value |
|-----------|-------|
| **Priority** | Medium |
| **Type** | Integration |
| **Related** | [Other Feature] |

**Test Steps**:
| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | [Action in Feature A] | [Triggers Feature B] |
| 2 | [Verify in Feature B] | [Data correct] |

---

## Test Execution Log

| Date | Tester | Pass | Fail | Notes |
|------|--------|------|------|-------|
| [YYYY-MM-DD] | [Name] | [X] | [Y] | [Notes] |
