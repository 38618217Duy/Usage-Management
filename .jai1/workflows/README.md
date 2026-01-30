# 📚 Workflows Documentation

> Hướng dẫn sử dụng các workflow trong dự án. Mỗi workflow được gọi bằng cách sử dụng prefix `/` trong IDE.

---

## 🎯 Trường hợp sử dụng trong Agentic Software Development

### Khi phát triển Feature MỚI hoặc FIX BUG

| Workflow | Khi nào sử dụng |
|----------|-----------------|
| `/plan` | Khi cần làm nhanh với plan đơn giản (Requirements → Design → Implement) |
| `/plan-from-conversation` | Khi IDE plan mode đã chạy xong, cần tạo/sync plan từ conversation |
| `/develop-feature` | Khi cần phát triển feature mới hoặc mở rộng feature có sẵn (FRD → TDD → Auto-implement) |
| `/develop-feature-from-conversation` | Khi IDE plan mode đã chạy xong, cần tạo/sync FRD/TDD + tasks từ conversation |
| `/fix-bug` | Khi cần fix bug với smart root cause analysis |
| `/gen-feature-doc` | Khi cần tạo docs cho code có sẵn chưa có docs (chỉ dự án có sẵn) |

### Khi làm việc với dự án CÓ SẴN (Existing Codebase)

| Workflow | Khi nào sử dụng |
|----------|-----------------|
| `/gen-project-overview` | Khi tiếp nhận dự án cũ, cần hiểu kiến trúc và tech stack trước khi code |
| `/gen-all-features-doc` | Khi cần document toàn bộ features (auto-detect: Backend/Frontend/Fullstack/Monorepo) |
| `/investigate-codebase-health` | Khi đánh giá technical debt, performance issues, hoặc trước khi refactor lớn |
| `/gen-feature-doc` | Khi cần tạo docs cho code chưa có docs hoặc update docs khi mở rộng feature |

### Khi bắt đầu dự án MỚI (New Project)

| Workflow | Khi nào sử dụng |
|----------|-----------------|
| `/create-prd` | Khi bắt đầu dự án mới, cần tạo Product Requirements Document (PRD) để định nghĩa product vision, market, roadmap |
| `/create-design-system` | Khi khởi đầu dự án mới, cần định nghĩa design system trước khi code UI |
| `/redesign-from-website-url` | Khi cần clone/redesign một website hiện có thành phiên bản mới |
| `/generate-ide-rules` | Khi setup dự án mới với framework cụ thể (React, Next.js, Vue, etc.) |

### Workflow hỗ trợ (Support Workflows)

| Workflow | Khi nào sử dụng |
|----------|-----------------|
| `/analyze-impact` | Sau khi sửa code, phân tích phạm vi ảnh hưởng để xác định cần test gì |
| `/review-local-changes` | Review code quality/security trước khi commit |
| `/review-branch` | Review branch/PR trước khi merge |
| `/sync-rules-to-ides` | Sau khi tạo rules, sync sang Cursor/Windsurf/Antigravity |
| `/gen-fun-doc-gemini` | Alternative cho gen-all-features-doc, chạy từng feature một |

---

## Hướng Dẫn theo Vai Trò

> 📖 **Xem chi tiết đầy đủ**: [Software Development Process Guide](../guides/SOFTWARE-DEVELOPMENT-PROCESS.md)

### Team Leader / Tech Lead

Các workflow chính:
- **`/create-prd`** - Bắt đầu dự án mới
- **`/investigate-codebase-health`** - Đánh giá technical debt định kỳ
- **`/gen-project-overview`** - Tạo tài liệu onboarding
- **`/review-branch`** - Review PR/branch trước khi merge

### Senior Developer

Các workflow chính:
- **`/develop-feature`** - Phát triển feature mới (FRD → TDD → Code)
- **`/gen-feature-doc`** - Tạo docs cho code có sẵn chưa có docs
- **`/fix-bug`** - Fix bug với root cause analysis
- **`/analyze-impact`** - Phân tích phạm vi ảnh hưởng sau khi sửa code
- **`/create-design-system`** - Khởi tạo design system cho dự án
- **`/commit-it`** - Safe commit với security checks

### Junior Developer

Các workflow chính:
- **`/develop-feature`** - Implement theo FRD/TDD đã có
- **`/fix-bug`** - Fix bug đơn giản
- **`/analyze-impact`** - Kiểm tra phạm vi ảnh hưởng sau khi fix
- **`/review-local-changes`** - Review code trước khi commit
- **`/commit-it`** - ⚠️ **BẮT BUỘC** trước mỗi commit

> [!IMPORTANT]
> Junior Developer nên luôn sử dụng `/analyze-impact` sau khi fix bug và `/commit-it` trước khi push để ensure code quality và tránh regression.

---

## 📋 Danh sách Workflows

| Workflow | Mục đích | Cú pháp |
|----------|----------|---------|
| [plan](#plan) | Quick planning với 3 phases (Requirements → Design → Implement) | `/plan` |
| [plan-from-conversation](#plan-from-conversation) | Tạo/sync plan từ conversation sau IDE plan mode | `/plan-from-conversation` |
| [develop-feature](#develop-feature) | Phát triển feature mới/update với auto-implement | `/develop-feature` |
| [develop-feature-from-conversation](#develop-feature-from-conversation) | Tạo/sync FRD/TDD + tasks từ conversation sau IDE plan mode | `/develop-feature-from-conversation` |
| [fix-bug](#fix-bug) | Fix bug với smart root cause analysis | `/fix-bug` |
| [analyze-impact](#analyze-impact) | Phân tích phạm vi ảnh hưởng sau khi sửa code | `/analyze-impact [scope] [depth]` |
| [review-local-changes](#review-local-changes) | Review code local chưa commit | `/review-local-changes` |
| [review-branch](#review-branch) | Review branch/PR trước khi merge | `/review-branch [target-branch]` |
| [create-prd](#create-prd) | Tạo Product Requirements Document cho dự án mới | `/create-prd` |
| [create-design-system](#create-design-system) | Tạo Design System cho dự án | `/create-design-system` |
| [gen-all-features-doc](#gen-all-features-doc) | Tạo tài liệu chức năng (auto-detect: Backend/Frontend/Fullstack/Monorepo) | `/gen-all-features-doc` |
| [gen-feature-doc](#gen-feature-doc) | Tạo docs cho code có sẵn (chỉ dự án có sẵn) | `/gen-feature-doc` |
| [gen-project-overview](#gen-project-overview) | Tạo tài liệu tổng quan dự án | `/gen-project-overview` |
| [investigate-codebase-health](#investigate-codebase-health) | Phân tích sức khỏe codebase | `/investigate-codebase-health` |
| [redesign-from-website-url](#redesign-from-website-url) | Redesign website từ URL | `/redesign-from-website-url [URL]` |

---

## ⚡ plan

**Mô tả**: Quick planning workflow cho khi cần làm nhanh. 3 phases: Requirements → Design (với user confirmation) → Implementation.

**So với `/develop-feature`**: Nhanh hơn, output 1 file duy nhất (`docs/plans/`) thay vì FRD + TDD riêng biệt.

**Cách sử dụng**:
```
/plan Add logout button to navbar

/plan Implement 2FA for login
```

**Quy trình**:
1. **Phase 1**: Requirements - Thu thập yêu cầu từ user input
2. **Phase 2**: Design - Tạo plan file, **dừng để user confirm**
3. **Phase 3**: Implementation - Sau khi user confirm, thực hiện theo checklist

**Output**:
- `docs/plans/[plan-name].md` - Plan file với checklist

**Khi nào dùng**:
- ✅ Task nhỏ/trung bình cần làm nhanh
- ✅ Khi không cần full FRD/TDD documentation
- ❌ Feature phức tạp → dùng `/develop-feature`

---

## ⚡ plan-from-conversation

**Mô tả**: Tạo/sync plan từ conversation sau khi IDE plan mode đã chạy. Tự động đồng bộ trạng thái tasks theo các file đã tạo/sửa.

**Cách sử dụng**:
```
/plan-from-conversation

/plan-from-conversation add-user-roles
```

**Quy trình**:
1. **Phase 1**: Context Detection - đọc conversation + git changes
2. **Phase 2**: Requirements & Design - tạo hoặc update từ context
3. **Phase 3**: Task Breakdown - sync checkbox theo trạng thái file
4. **Phase 4**: Continue/Stop - hỏi user nếu còn tasks chưa hoàn thành

**Output**:
- `docs/plans/[plan-name].md` - Plan file có checklist đã sync

---

## 🚀 develop-feature

**Mô tả**: Phát triển feature mới hoặc mở rộng feature có sẵn với quy trình FRD → TDD → Auto-implement. Hỗ trợ checkpoint/resume.

**Cách sử dụng**:
```
/develop-feature

Sau đó mô tả feature cần phát triển, ví dụ:
"Tạo feature User Registration với email verification"
```

**Quy trình**:
1. **Step 1**: Check resume state từ `tasks.md`
2. **Step 2**: Analyze & detect mode (NEW/UPDATE)
3. **Step 3**: Create checkpoint file `tasks.md`
4. **Step 4**: Phase 1 - Documentation (FRD → TDD)
5. **Step 5**: Phase 2 - Auto-implementation
6. **Step 6**: Completion report

**Output**:
```
docs/features/[feature-name]/
├── FRD-[feature-name].md
├── TDD-[feature-name].md
└── tasks.md

src/
├── [implementation files...]
```

**Đặc điểm**:
- Auto-execute toàn bộ (không dừng hỏi user)
- Checkpoint sau mỗi task (resumable)
- Verify thông tin từ source code thực tế

---

## 🚀 develop-feature-from-conversation

**Mô tả**: Tạo/sync FRD, TDD và `tasks.md` từ conversation sau khi IDE plan mode đã chạy. Đồng bộ trạng thái tasks theo các file thực tế.

**Cách sử dụng**:
```
/develop-feature-from-conversation

/develop-feature-from-conversation user-registration
```

**Quy trình**:
1. **Phase 1**: Context Detection - đọc conversation + git changes
2. **Phase 2**: Sync tasks.md - đồng bộ task trạng thái
3. **Phase 3**: Documentation - tạo/update FRD/TDD từ context
4. **Phase 4**: Implementation Sync - đối chiếu TDD với files thực tế
5. **Phase 5**: Continue/Stop - hỏi user nếu còn tasks chưa hoàn thành

**Output**:
```
docs/features/[feature-name]/
├── FRD-[feature-name].md
├── TDD-[feature-name].md
└── tasks.md
```

---

## 🔧 fix-bug

**Mô tả**: Fix bug hoặc issue trong feature có sẵn với smart root cause analysis. Tự động fix nếu rõ ràng, suggest và confirm nếu không chắc chắn.

**Cách sử dụng**:
```
/fix-bug

Sau đó mô tả bug cần fix, ví dụ:
"Login không hoạt động khi email có ký tự đặc biệt"
```

**Quy trình**:
1. **Step 1**: Understand Issue - Parse bug description, search codebase
2. **Step 2**: Root Cause Analysis - Trace flow, identify cause
3. **Step 3**: Decision Branch
   - **HIGH confidence** → Auto-fix
   - **LOW confidence** → Suggest & wait for confirmation
4. **Step 4**: Documentation Check - Update docs if needed
5. **Step 5**: Completion Report

**Confidence Classification**:
| Signals | Confidence |
|---------|------------|
| Error message rõ ràng + stack trace | HIGH |
| Clear logic bug in code | HIGH |
| Vague description "không hoạt động" | LOW |
| Multiple possible causes | LOW |

**Output**:
- Fix applied to code
- Documentation updated (nếu cần, với user confirmation)
- Fix report với verification steps

---

## 🎯 analyze-impact

**Mô tả**: Phân tích phạm vi ảnh hưởng sau khi sửa code. Trace forward để tìm tất cả các phần bị ảnh hưởng bởi thay đổi, đề xuất testing scope và ngăn ngừa regression.

**Cách sử dụng**:
```
/analyze-impact

# Hoặc với arguments:
/analyze-impact local deep      # Phân tích changes local, trace sâu
/analyze-impact branch shallow  # Phân tích branch, chỉ direct dependents
```

**Arguments**:
| Argument | Options | Mô tả |
|----------|---------|-------|
| `scope` | `local`, `branch`, `files` | Phạm vi changes cần phân tích |
| `depth` | `shallow`, `deep` | Mức độ trace dependencies |

**Use Cases**:
| Scenario | Khi nào dùng |
|----------|-------------|
| Sau fix bug | Verify fix không break features khác |
| Sau implement feature | Hiểu full impact trước khi commit |
| Trước deployment | Đảm bảo đã test hết các vùng ảnh hưởng |
| Code review | Đánh giá risk level của changes |
| Refactoring | Xác định tất cả areas cần update |

**Quy trình**:
1. **Phase 1**: Identify Changes - Xác định files/functions đã thay đổi
2. **Phase 2**: Trace Forward - Tìm tất cả code phụ thuộc vào phần đã sửa
3. **Phase 3**: Assess Impact - Phân loại severity (Critical/High/Medium/Low)
4. **Phase 4**: Testing Recommendations - Đề xuất tests cần chạy
5. **Phase 5**: Generate Report - Báo cáo chi tiết với action items

**Impact Levels**:
| Level | Criteria | Action |
|-------|----------|--------|
| 🔴 Critical | Core business, payment, auth | Must test before merge |
| 🟠 High | Major features, external APIs | Should test thoroughly |
| 🟡 Medium | Single features, internal APIs | Run related tests |
| 🟢 Low | Isolated, tests only, docs | Minimal testing |

**Output**:
- Impact Analysis Report với dependency map
- Testing checklist (Must Run / Should Run / Optional)
- Potential breaking points
- Verification steps
- Affected features cho QA

---

## 📝 review-local-changes

**Mô tả**: Review toàn diện code local chưa commit, sử dụng các specialized agents để kiểm tra security, bugs, code quality, contracts, test coverage, và historical context.

**Cách sử dụng**:
```
/review-local-changes

# Hoặc chỉ review một số aspects:
/review-local-changes security tests
```

**Output**:
- Quality Assessment với scores
- Required Actions (Must Fix / Better to Fix / Consider)
- Found Issues & Bugs
- Security Vulnerabilities
- Code Improvements & Simplifications

---

## 📝 review-branch

**Mô tả**: Review toàn diện branch/PR trước khi merge. Hỗ trợ cả PR Mode (GitHub PR) và Local Mode (compare branches).

**Cách sử dụng**:
```
/review-branch              # Auto-detect PR
/review-branch master       # Compare current → master
/review-branch main security # Review với focus security
```

**Output**:
- PR Review Report
- Required Actions (Must Fix Before Merge)
- Issues & Bugs with line-specific comments
- Security Vulnerabilities

---

## 📋 create-prd

**Mô tả**: Tạo Product Requirements Document (PRD) hoàn chỉnh cho dự án mới, bao gồm product vision, market analysis, user personas, roadmap, success metrics. Hỗ trợ auto-resume.

**Cách sử dụng**:
```
/create-prd [project-name] [description/requirements]

Ví dụ:
/create-prd e-commerce-platform "Nền tảng thương mại điện tử B2C với thanh toán online, quản lý đơn hàng, và hệ thống đánh giá sản phẩm"
```

**Quy trình**:
1. **Step 1**: Check resume state từ `docs/project/todo.md`
2. **Step 2**: Parse input & initialize (extract project info)
3. **Step 3**: Create checkpoint file `docs/project/todo.md`
4. **Step 4**: Phase 1 - Information Gathering (requirements, stakeholders, market)
5. **Step 5**: Phase 2 - PRD Document Creation (11 sections)
6. **Step 6**: Phase 3 - Review & Finalization
7. **Step 7**: Completion report

**Output**:
```
docs/project/
├── todo.md
└── PRD-[project-name].md
```

**PRD Sections**:
1. Executive Summary (Vision, Goals, Business Objectives)
2. Market & User Analysis (Target Market, Personas, Competitive Analysis)
3. Product Scope (MVP, Out of Scope, Assumptions & Constraints)
4. User Stories (High-Level)
5. Success Metrics & KPIs
6. Product Roadmap
7. Risk Assessment
8. Stakeholders & Team
9. Dependencies & Integrations
10. Compliance & Legal
11. Appendices

**Đặc điểm**:
- Auto-execute toàn bộ (không dừng hỏi user)
- Checkpoint sau mỗi section (resumable)
- Smart inference cho thông tin thiếu
- Placeholders `[TO BE FILLED]` cho thông tin cần client input

**Lưu ý**:
- PRD là high-level product vision, khác với FRD (detailed feature requirements)
- PRD thường được tạo trước FRD khi bắt đầu dự án mới
- PRD có thể được cập nhật khi project evolves

---

## 🎨 create-design-system

**Mô tả**: Tạo Design System hoàn chỉnh dựa trên yêu cầu của người dùng, bao gồm bảng màu, typography, spacing, components và TailwindCSS config.

**Cách sử dụng**:
```
/create-design-system
```

**Quy trình**:
1. **Phase 1**: Thu thập thông tin (loại hình, đối tượng, cảm xúc, màu sắc)
2. **Phase 2**: Đề xuất 2 Design Options với 1 recommendation
3. **Phase 3**: Tạo Design System hoàn chỉnh
4. **Phase 4**: Tạo Implementation Prompt & lưu file deliverables

**Output**:
- Design System document với color palette, typography, spacing
- TailwindCSS configuration
- Implementation prompt để triển khai

**Ví dụ**:
```
/create-design-system

Sau đó trả lời các câu hỏi:
- Loại hình: E-commerce
- Đối tượng: 25-35 tuổi, hiện đại
- Cảm xúc: Chuyên nghiệp, năng động
```

---

## 📝 gen-fun-doc-gemini

**Mô tả**: Tạo tài liệu Functional Requirements (FRD), Technical Design (TDD) và Test Scenarios cho từng feature một cách tuần tự.

**Cách sử dụng**:
```
/gen-fun-doc-gemini
```

**Quy trình**:
1. **Step 0**: Phân tích project và tạo `docs/features/todo.md`
2. **Step 1**: Tạo FRD, TDD, Test Scenarios cho từng feature

**Output**:
- `docs/features/todo.md` - Checklist các feature
- `docs/features/[feature]/FRD-[feature].md`
- `docs/features/[feature]/TDD-[feature].md`
- `docs/features/[feature]/test-scenarios.md`

**Lưu ý**: Workflow hoạt động theo từng feature, cần xác nhận để chuyển sang feature tiếp theo.

---

## 📄 gen-all-features-doc

**Mô tả**: Tạo tài liệu chức năng tự động cho dự án fullstack (Backend/Frontend/Fullstack). Hỗ trợ auto-resume - có thể tiếp tục từ điểm dừng.

**Cách sử dụng**:
```
/gen-all-features-doc
```

**Quy trình**:
1. **Step 1**: Kiểm tra `docs/features/todo.md`, nếu chưa có thì tạo
2. **Step 2**: Thực hiện vòng lặp tạo FRD → TDD → Test Scenarios cho từng feature

**Output**:
- `docs/features/todo.md` - State file để resume
- `docs/features/[feature]/FRD-[feature].md`
- `docs/features/[feature]/TDD-[feature].md`
- `docs/features/[feature]/test-scenarios.md`

**Đặc điểm**:
- Auto-resume: Tiếp tục từ điểm dừng nếu bị gián đoạn
- Sequential: Hoàn thành FRD → TDD → Tests trước khi chuyển feature

---

## ✨ gen-feature-doc

**Mô tả**: Tạo tài liệu cho code có sẵn chưa có docs. **Chỉ dành cho dự án có sẵn**.

> ⚠️ **Dự án MỚI**: Dùng `/develop-feature` (đã bao gồm tạo docs từ đầu)

**Khi nào sử dụng**:

| Tình huống | Mode | Ghi chú |
|------------|------|---------|
| **Dự án CÓ SẴN** - Tạo docs cho code chưa có docs | CREATE | Verify từ source code thực tế |
| **Dự án CÓ SẴN** - Cập nhật feature đã có docs | UPDATE | Merge requirements mới vào docs có sẵn |
| **Dự án MỚI** - Phát triển feature mới | ❌ | Dùng `/develop-feature` |
| Tạo docs cho TOÀN BỘ features | ❌ | Dùng `/gen-all-features-doc` |

**Cách sử dụng**:
```
/gen-feature-doc

Sau đó mô tả feature cần tài liệu, ví dụ:
"Tạo tài liệu cho feature User Login đã có trong /src/auth"
```

**Quy trình**:
1. Phân tích input của user để xác định feature
2. Tìm kiếm code liên quan trong codebase
3. **Verify từ source code thực tế**
4. Tạo/cập nhật FRD, TDD, Test Scenarios

**Output**:
- `docs/features/[XX-feature-name]/FRD-[feature].md`
- `docs/features/[XX-feature-name]/TDD-[feature].md`
- `docs/features/[XX-feature-name]/test-scenarios.md`

**Ví dụ CREATE (tạo docs cho code có sẵn)**:
```
"Tạo tài liệu cho feature thanh toán hiện có trong /src/payments"
→ Verify code thực tế → Tạo docs/features/XX-payment/
```

**Ví dụ UPDATE (cập nhật docs đã có)**:
```
"Update User Login feature: thêm 2FA authentication"
→ Cập nhật docs/features/02-user-login/ với 2FA
```

---

## 🔧 gen-project-overview

**Mô tả**: Tạo tài liệu tổng quan dự án cho team nhỏ. Chỉ 2 files high-level.

**Cách sử dụng**:
```
/gen-project-overview
```

**Quy trình**:
1. Detect framework (Laravel, NestJS, Next.js, Nuxt, etc.)
2. Scan project structure
3. Tạo 2 files documentation

**Output**:
- `docs/README.md` - Quick start & overview
- `docs/ARCHITECTURE.md` - Tech stack & architecture high-level

**Hỗ trợ**: Laravel, CakePHP, NestJS, Express, Next.js, Nuxt, Flutter

---

## 🏥 investigate-codebase-health

**Mô tả**: Phân tích sức khỏe codebase để đánh giá technical debt, maintainability, performance, và đề xuất cải thiện.

**Cách sử dụng**:
```
/investigate-codebase-health
```

**Quy trình**:
1. **Step 1**: Khởi tạo và kiểm tra resume
2. **Step 2**: Phân tích project overview
3. **Step 3**: Phân tích architecture (patterns, code smells)
4. **Step 4**: Scan code quality (duplication, tests)
5. **Step 5**: Phân tích performance (N+1 queries, caching)
6. **Step 6**: Đánh giá technical debt
7. **Step 7**: CCU Simulation (Concurrent Users)
8. **Step 8**: Đề xuất cải thiện
9. **Step 9**: Executive Summary

**Output**:
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

**Scoring**: 9-10 (Excellent) → 1-2 (Critical)

---

## 🎨 redesign-from-website-url

**Mô tả**: Redesign và modernize một website dựa trên URL được cung cấp. Tạo ra file HTML responsive với TailwindCSS.

**Cách sử dụng**:
```
/redesign-from-website-url https://example.com
```

**Quy trình**:
1. **Phase 1**: Extract content từ URL, phân tích business, đánh giá design hiện tại
2. **Phase 2**: Đề xuất Design System (colors, typography, spacing, components)
3. **Phase 3**: Lên kế hoạch layout (wireframe, responsive strategy)
4. **Phase 4**: Implement HTML + TailwindCSS
5. **Phase 5**: Summary & Recommendations

**Output**:
- `redesign-[website-name].html` - File HTML hoàn chỉnh với TailwindCSS
- Design system documentation
- Before vs After comparison
- Next steps recommendations

**Ví dụ**:
```
/redesign-from-website-url https://vnexpress.net
→ Tạo file redesign-vnexpress.html với thiết kế hiện đại
```

**Đặc điểm**:
- Mobile-first responsive design
- TailwindCSS CDN
- Lucide Icons
- Google Fonts
- Semantic HTML5

---

## 📌 Lưu ý chung

1. **Language**: Tất cả tài liệu được tạo bằng **tiếng Việt** (trừ code/technical terms)
2. **Code References**: Luôn bao gồm file paths (`src/file.ts:line`)
3. **Verification**: Thông tin được trích xuất từ code thực, không giả định
4. **Auto-Resume**: Các workflow hỗ trợ tiếp tục từ điểm dừng qua file `todo.md`
5. **Sequential**: Thực hiện tuần tự từng bước, không bỏ qua

---

## 🚀 Quick Start

```bash
# Tạo PRD cho dự án mới
/create-prd [project-name] [description]

# Tạo Design System
/create-design-system

# Tạo tài liệu kỹ thuật
/gen-project-overview

# Tạo tài liệu chức năng
/gen-all-features-doc

# Phân tích codebase
/investigate-codebase-health

# Redesign website
/redesign-from-website-url https://your-website.com
```
