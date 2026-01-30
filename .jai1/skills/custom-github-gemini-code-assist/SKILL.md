---
name: custom-github-gemini-code-assist
description: Create configuration files for GitHub Gemini Code Assist. Use when users want to generate or customize .gemini/config.yaml and .gemini/styleguide.md files for their GitHub repositories. Helps configure code review settings, pull request behavior, and coding style guidelines for PHP 7/8 (Laravel/CakePHP), TypeScript (NestJS/Next.js/Hono), Vue.js (Nuxt), and Flutter projects. Optimized for teams without dedicated reviewers - focuses on security and high-impact issues.
---

# Custom GitHub Gemini Code Assist

Generate configuration files for GitHub Gemini Code Assist to customize AI-powered code reviews.

## Approach: Security & High-Impact Focus

> ⚠️ **Optimized for teams without dedicated reviewers**: All style guides focus on **security vulnerabilities, critical bugs, and high-impact issues** only. Minor style issues are ignored.

### Review Priority Levels

| Priority | Focus Areas | Action |
|----------|-------------|--------|
| **Critical** | SQL injection, XSS, auth bypass, data exposure, crashes | Must Fix |
| **High** | Missing authorization, unvalidated input, error disclosure, memory leaks | Should Fix |
| **Ignore** | Code formatting, naming, import order, minor refactoring | Skip |

## Quick Start

1. Identify project's primary language(s) and version
2. Create `.gemini/` folder with `config.yaml` and `styleguide.md`
3. Copy appropriate style guide focusing on security issues

## Supported Tech Stack

| Language | Version | Frameworks | Style Guide |
|----------|---------|------------|-------------|
| **PHP** | 7.x | Laravel 5-8, CakePHP 3-4 | `styleguide-php7.md` |
| **PHP** | 8.x | Laravel 9+, CakePHP 5+ | `styleguide-php8.md` |
| **TypeScript** | - | NestJS, Next.js, Hono, ExpressJS | `styleguide-typescript.md` |
| **Vue.js** | 3.x | Nuxt.js 3+ | `styleguide-vue.md` |
| **Flutter/Dart** | 3.x | Flutter | `styleguide-flutter.md` |

## Configuration

### Default config.yaml (Optimized for teams without reviewers)

```yaml
have_fun: false
memory_config:
  disabled: false
code_review:
  disable: false
  comment_severity_threshold: HIGH  # Focus on critical issues only
  max_review_comments: 15           # Limit to avoid overwhelming
  pull_request_opened:
    help: false
    summary: true
    code_review: true
    include_drafts: false           # Save quota
```

### Key Configuration Options

| Setting | Recommended | Description |
|---------|-------------|-------------|
| `comment_severity_threshold` | `HIGH` | Only show critical/security issues |
| `max_review_comments` | `15` | Limit comments to most important |
| `include_drafts` | `false` | Don't review drafts to save quota |

## Security Focus Areas by Language

### PHP (Laravel/CakePHP)
- SQL Injection (parameterized queries)
- XSS (Blade escaping)
- CSRF protection
- Mass assignment vulnerabilities
- Authentication/Authorization checks
- Sensitive data in logs/responses

### TypeScript (NestJS/Next.js/Hono)
- SQL/NoSQL injection
- XSS in React components
- SSRF vulnerabilities
- JWT security
- Environment variable exposure
- Input validation with Zod

### Vue.js (Nuxt)
- XSS via v-html
- Sensitive data in client stores
- API route authentication
- CSRF protection
- Memory leaks in components

### Flutter/Dart
- Secure storage vs SharedPreferences
- Network security (HTTPS, cert pinning)
- Token handling
- Deep link validation
- Debug logging in production

## Recommended Ignore Patterns

```yaml
ignore_patterns:
  # Dependencies
  - "node_modules/**"
  - "vendor/**"
  
  # Build outputs
  - "dist/**"
  - "build/**"
  - ".next/**"
  - ".nuxt/**"
  - "public/build/**"
  
  # Generated files
  - "*.min.js"
  - "*.min.css"
  - "*.g.dart"
  - "*.freezed.dart"
  - "*.generated.*"
  
  # Lock files
  - "*.lock"
  - "pnpm-lock.yaml"
  - "pubspec.lock"
  
  # Cache and storage
  - "storage/**"
  - "coverage/**"
```

## Workflow

### Step 1: Create .gemini folder
```
.gemini/
├── config.yaml     # Feature configuration
└── styleguide.md   # Security-focused coding guidelines
```

### Step 2: Copy config.yaml
Use `assets/config-template.yaml` - already optimized for HIGH severity threshold.

### Step 3: Copy appropriate styleguide
Choose based on project language. Each guide includes:
- Review priority matrix (Critical → High → Ignore)
- Security checklist with code examples
- High-impact issues to watch for
- **🔐 Secrets & Config Safety section**

## Resources

### Templates
- `assets/config-template.yaml` - Default config (HIGH severity, limited comments)

### Style Guides (Security-Focused)

#### PHP
- `assets/styleguide-php7.md` - PHP 7.x (Laravel 5-8)
- `assets/styleguide-php8.md` - PHP 8.x (Laravel 9+)

#### JavaScript/TypeScript
- `assets/styleguide-typescript.md` - NestJS/Next.js/Hono
- `assets/styleguide-vue.md` - Vue.js/Nuxt.js

#### Mobile
- `assets/styleguide-flutter.md` - Flutter/Dart

### Reference Documentation
- `references/config-schema.md` - Full config.yaml schema
- `references/secrets-safety.md` - **Comprehensive secrets detection patterns** (API keys, passwords, private keys, suspicious config files)

## 🔐 Secrets Detection Highlights

All style guides now include detection for:

| Category | Examples |
|----------|----------|
| **API Keys** | AWS (`AKIA...`), Stripe (`sk_live_`), OpenAI (`sk-proj-`), GitHub (`ghp_`) |
| **Database** | Connection strings with passwords |
| **Private Keys** | RSA, SSH, PGP keys |
| **Config Files** | `.env`, `config/*.php`, `nuxt.config.ts`, `wrangler.toml` |
| **Mobile** | `google-services.json`, `GoogleService-Info.plist` |

## Limits for Gemini Code Assist (Free Tier)

Developers can sign up with their personal Google account to access Gemini Code Assist at no cost:
- Code completions: **6,000 per day**
- Chat engagements: **240 per day**  
- Code reviews: Included

> 💡 Use `include_drafts: false` and `max_review_comments: 15` to optimize quota usage.