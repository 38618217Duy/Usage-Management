# Cursor Rule Template

> **Mục đích**: Template cho Cursor IDE rules (.mdc files)
> **Sử dụng trong**: /generate-ide-rules, /sync-rules-to-ides

## Format

```markdown
---
description: [DESCRIPTION]
globs: [GLOBS]
alwaysApply: [ALWAYS_APPLY]
---

[RULE_CONTENT]
```

## Placeholders

- `[DESCRIPTION]` - Mô tả ngắn về rule (không dùng quotes)
- `[GLOBS]` - File patterns, comma-separated (ví dụ: **/*.tsx, **/*.jsx)
- `[ALWAYS_APPLY]` - true hoặc false (boolean, không quotes)
- `[RULE_CONTENT]` - Nội dung rule gốc

## Rules

1. File extension phải là `.mdc`
2. Không wrap values trong quotes trong frontmatter
3. Globs ngăn cách bằng dấu phẩy và space
4. Description là một câu ngắn gọn

## Example

```markdown
---
description: React 19 development with TypeScript
globs: **/*.tsx, **/*.jsx, **/*.ts
alwaysApply: false
---

You are an expert in React, TypeScript, and modern web development.
...
```
