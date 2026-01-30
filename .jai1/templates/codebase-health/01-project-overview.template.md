# Project Overview

## Tech Stack
| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| Language | [e.g., TypeScript, PHP, Python] | X.X | |
| Framework | [e.g., Next.js, Laravel, Django] | X.X | |
| Database | [e.g., PostgreSQL, MySQL, MongoDB] | X.X | |
| Cache | [e.g., Redis, Memcached] | X.X | |
| Queue | [e.g., RabbitMQ, SQS, Redis] | X.X | |
| Search | [e.g., Elasticsearch, Algolia] | X.X | |
| Storage | [e.g., S3, Local, GCS] | | |

## Project Structure
```
project-root/
├── src/                 # [Mô tả]
├── config/              # [Mô tả]
├── database/            # [Mô tả]
├── tests/               # [Mô tả]
└── ...
```

## Entry Points
| Type | Path | Description |
|------|------|-------------|
| Web App | `src/index.ts` | Main application entry |
| API Routes | `src/routes/` | REST/GraphQL endpoints |
| CLI | `src/cli/` | Command line tools |
| Background Jobs | `src/jobs/` | Async workers |
| Scheduled Tasks | `src/cron/` | Cron jobs |

## Dependencies Analysis
| Category | Count | Outdated | Vulnerable |
|----------|-------|----------|------------|
| Production | X | X | X |
| Development | X | X | X |
| **Total** | X | X | X |

### Critical Dependencies
| Package | Current | Latest | Risk |
|---------|---------|--------|------|
| [package-name] | X.X.X | Y.Y.Y | [High/Medium/Low] |

## Environment Configuration
| Config | Location | Sensitive | Documented |
|--------|----------|-----------|------------|
| Database | .env | ✅ | ❌ |
| API Keys | .env | ✅ | ❌ |
| Feature Flags | config/features.ts | ❌ | ✅ |
