# Windsurf Rule Template

> **Mục đích**: Template cho Windsurf IDE rules (.md files)
> **Sử dụng trong**: /generate-ide-rules, /sync-rules-to-ides

## Format

```markdown
---
trigger: [TRIGGER]
---

[RULE_CONTENT]
```

## Placeholders

- `[TRIGGER]` - Một trong các giá trị:
  - `always` - Rule áp dụng cho mọi file
  - `glob_patterns` - Áp dụng khi file match patterns (cần specify patterns riêng)
- `[RULE_CONTENT]` - Nội dung rule gốc

## Trigger Options

| Trigger Value | Khi nào sử dụng |
|---------------|-----------------|
| always | Global rules, coding style chung |
| glob_patterns | Framework-specific rules |

## Example - Always Apply

```markdown
---
trigger: always
---

You are an expert in React, TypeScript, and modern web development.
...
```

## Example - Glob Patterns

```markdown
---
trigger: glob_patterns
---

Applies to: **/*.tsx, **/*.jsx

You are an expert in React, TypeScript, and modern web development.
...
```

## Notes

- Windsurf sử dụng `trigger` thay vì `globs` và `alwaysApply`
- File extension là `.md` (không phải .mdc như Cursor)
- Đặt trong thư mục `.windsurf/rules/`
