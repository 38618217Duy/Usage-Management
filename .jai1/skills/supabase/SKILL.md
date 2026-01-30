---
name: supabase
description: Comprehensive Supabase development guide covering database schema design, migrations, RLS policies, realtime optimization, TypeScript type generation, and performance tuning. Use PROACTIVELY when working with Supabase projects for (1) database schema design and migration planning, (2) Row Level Security policy architecture, (3) realtime subscription optimization, (4) TypeScript type generation from schema, (5) database performance optimization, or (6) any Supabase-related development tasks.
---

# Supabase Development Guide

Expert guidance for Supabase development covering the complete stack: PostgreSQL database design, migrations, security, realtime, and performance optimization.

## Quick Reference

Load the appropriate reference based on your task:

| Task | Reference File |
|------|----------------|
| Database schema design | [📐 Schema Design](./references/schema-design.md) |
| Migration management | [🔄 Migrations](./references/migrations.md) |
| Row Level Security | [🔐 RLS Policies](./references/rls-policies.md) |
| Realtime subscriptions | [⚡ Realtime](./references/realtime.md) |
| TypeScript types | [📝 Type Generation](./references/type-generation.md) |
| Performance tuning | [🚀 Performance](./references/performance.md) |

## Core Workflow

### 1. Schema Design Phase
- Analyze application data models and relationships
- Design normalized schema (3NF minimum)
- Plan indexes for query patterns
- Define foreign key constraints

### 2. Security Implementation
- Design RLS policies for all sensitive tables
- Implement role-based access control
- Test policies with positive/negative cases
- Document security requirements

### 3. Migration Strategy
- Create reversible migrations
- Plan migration sequences
- Test in staging environment
- Prepare rollback procedures

### 4. Type Generation
- Generate TypeScript types from schema
- Integrate with application codebase
- Set up auto-sync for schema changes

### 5. Performance Optimization
- Analyze query patterns
- Optimize indexes and queries
- Monitor realtime subscriptions
- Implement caching strategies

## Response Format

```
🗄️ SUPABASE DEVELOPMENT

## Task Analysis
- Domain: [schema/migration/rls/realtime/types/performance]
- Current state: [analysis of existing setup]
- Requirements: [specific needs]

## Implementation Plan
1. [Step with specific actions]
2. [Step with SQL/code examples]
3. [Validation and testing]

## Code Implementation
[Specific SQL/TypeScript code with explanations]

## Validation Checklist
- [ ] Schema constraints verified
- [ ] RLS policies tested
- [ ] Performance benchmarked
- [ ] Types generated and validated
```

## MCP Integration

When MCP Supabase server is available:
- Use for direct schema introspection
- Execute migrations through MCP
- Query and validate data
- Monitor realtime connections

## Best Practices Summary

### Database Design
- Use `snake_case` for tables/columns
- Always include `id`, `created_at`, `updated_at`
- Use UUIDs for public-facing IDs
- Prefer `timestamptz` over `timestamp`

### Security
- Enable RLS on all tables with user data
- Use `auth.uid()` for user identification
- Never trust client-side data
- Audit all write operations

### Performance
- Index columns used in WHERE clauses
- Use `EXPLAIN ANALYZE` for query optimization
- Implement connection pooling
- Monitor Supabase dashboard metrics
