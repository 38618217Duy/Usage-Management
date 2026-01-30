# Migration Management Guide

Safe, reversible database migrations for Supabase with testing and rollback strategies.

## Table of Contents
- [Migration Basics](#migration-basics)
- [Creating Migrations](#creating-migrations)
- [Migration Patterns](#migration-patterns)
- [Rollback Strategies](#rollback-strategies)
- [Testing Migrations](#testing-migrations)
- [Production Deployment](#production-deployment)

## Migration Basics

### Supabase CLI Commands

```bash
# Create new migration
supabase migration new migration_name

# Apply migrations locally
supabase db reset  # Reset and apply all
supabase db push   # Apply pending migrations

# Generate migration from diff
supabase db diff -f migration_name

# Check migration status
supabase migration list
```

### Migration File Structure

```
supabase/
├── migrations/
│   ├── 20240101000000_create_users.sql
│   ├── 20240101000001_create_profiles.sql
│   └── 20240102000000_add_user_settings.sql
└── seed.sql (optional)
```

## Creating Migrations

### Standard Migration Template

```sql
-- Migration: description_of_change
-- Created: YYYY-MM-DD
-- Author: developer_name

-- ============================================
-- UP MIGRATION
-- ============================================

-- Create table
CREATE TABLE IF NOT EXISTS table_name (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_table_name_column ON table_name(column);

-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- DOWN MIGRATION (as comments for reference)
-- ============================================
-- DROP POLICY IF EXISTS "policy_name" ON table_name;
-- DROP INDEX IF EXISTS idx_table_name_column;
-- DROP TABLE IF EXISTS table_name;
```

### Safe Column Operations

```sql
-- Add column (safe, non-blocking)
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  phone TEXT;

-- Add column with default (PostgreSQL 11+ is fast)
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  status TEXT DEFAULT 'active' NOT NULL;

-- Rename column (use with caution)
ALTER TABLE users RENAME COLUMN old_name TO new_name;

-- Change column type (may lock table)
ALTER TABLE users ALTER COLUMN status TYPE VARCHAR(50);

-- Drop column (irreversible!)
ALTER TABLE users DROP COLUMN IF EXISTS deprecated_column;
```

## Migration Patterns

### Adding Foreign Key

```sql
-- Step 1: Add column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS 
  customer_id UUID;

-- Step 2: Backfill data (if needed)
UPDATE orders SET customer_id = (
  SELECT id FROM customers WHERE customers.email = orders.customer_email
);

-- Step 3: Add constraint
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer 
  FOREIGN KEY (customer_id) REFERENCES customers(id);

-- Step 4: Make NOT NULL (after backfill)
ALTER TABLE orders ALTER COLUMN customer_id SET NOT NULL;
```

### Creating Enum-like Column

```sql
-- Option 1: Check constraint (recommended)
ALTER TABLE orders ADD COLUMN status TEXT;
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Option 2: PostgreSQL ENUM (harder to modify)
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
ALTER TABLE orders ADD COLUMN status order_status DEFAULT 'pending';
```

### Splitting a Table

```sql
-- Original: users table with address fields
-- Goal: Create separate addresses table

-- Step 1: Create new table
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  street TEXT,
  city TEXT,
  country TEXT,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Migrate data
INSERT INTO addresses (user_id, street, city, country)
SELECT id, street, city, country FROM users 
WHERE street IS NOT NULL;

-- Step 3: Update application code (deploy)

-- Step 4: Remove old columns (separate migration, after verification)
ALTER TABLE users DROP COLUMN street;
ALTER TABLE users DROP COLUMN city;
ALTER TABLE users DROP COLUMN country;
```

### Zero-Downtime Index Creation

```sql
-- Create index concurrently (non-blocking)
CREATE INDEX CONCURRENTLY idx_orders_created_at 
  ON orders(created_at);

-- Note: CONCURRENTLY cannot be used in a transaction
-- Run this migration separately
```

## Rollback Strategies

### Rollback Script Pattern

```sql
-- File: migrations/20240101000000_add_feature.sql

-- ============ UP ============
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT false
);

-- ============ DOWN ============
-- Keep commented for rollback reference:
-- DROP TABLE IF EXISTS features;
```

### Rollback Script File

```sql
-- File: rollbacks/20240101000000_add_feature_rollback.sql

-- Rollback for: 20240101000000_add_feature.sql
-- WARNING: This will delete all feature data!

BEGIN;

-- Backup data first (optional)
CREATE TABLE features_backup AS SELECT * FROM features;

-- Drop dependent objects
DROP POLICY IF EXISTS "policy_name" ON features;

-- Drop table
DROP TABLE IF EXISTS features;

COMMIT;
```

### Safe Rollback Checklist

1. ✅ Backup affected data before rollback
2. ✅ Check for dependent objects (views, functions, policies)
3. ✅ Verify application can handle missing schema
4. ✅ Test rollback in staging first
5. ✅ Have data restoration plan ready

## Testing Migrations

### Local Testing Workflow

```bash
# 1. Start fresh
supabase db reset

# 2. Apply migrations
supabase db push

# 3. Run application tests
npm test

# 4. Test seed data
supabase db seed

# 5. Verify with SQL queries
supabase db query "SELECT * FROM users LIMIT 5"
```

### Migration Test Script

```sql
-- Test migration: verify expected state

DO $$
DECLARE
  table_exists BOOLEAN;
  column_exists BOOLEAN;
  index_exists BOOLEAN;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'expected_table'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION 'Table expected_table does not exist';
  END IF;
  
  -- Check column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'expected_table' AND column_name = 'expected_column'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE EXCEPTION 'Column expected_column does not exist';
  END IF;
  
  -- Check index exists
  SELECT EXISTS (
    SELECT FROM pg_indexes 
    WHERE indexname = 'idx_expected'
  ) INTO index_exists;
  
  IF NOT index_exists THEN
    RAISE EXCEPTION 'Index idx_expected does not exist';
  END IF;
  
  RAISE NOTICE 'All migration tests passed!';
END $$;
```

## Production Deployment

### Pre-Deployment Checklist

- [ ] Migration tested locally
- [ ] Migration tested in staging
- [ ] Rollback script prepared and tested
- [ ] Database backup created
- [ ] Application updated to handle new schema
- [ ] Team notified of deployment window
- [ ] Monitoring alerts configured

### Deployment Steps

```bash
# 1. Create production backup
supabase db dump --project-ref <ref> > backup_$(date +%Y%m%d).sql

# 2. Link to production
supabase link --project-ref <production-ref>

# 3. Push migrations
supabase db push

# 4. Verify migration applied
supabase migration list

# 5. Run verification queries
supabase db query "SELECT current_schema_version();"
```

### Post-Deployment Verification

```sql
-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'new_table';

-- Verify indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'new_table';

-- Verify RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'new_table';

-- Verify data integrity
SELECT COUNT(*) FROM new_table;
```

## Migration Best Practices

### DO ✅
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Create small, focused migrations
- Include both UP and DOWN logic (commented)
- Test migrations on production-like data
- Use transactions for related changes

### DON'T ❌
- Modify existing migration files
- Run untested migrations in production
- Drop columns without data backup
- Ignore migration failures
- Skip staging environment testing
