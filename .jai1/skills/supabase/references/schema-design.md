# Schema Design Guide

Database schema architecture for Supabase/PostgreSQL with best practices for design, relationships, and optimization.

## Table of Contents
- [Naming Conventions](#naming-conventions)
- [Core Table Structure](#core-table-structure)
- [Data Types](#data-types)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Constraints](#constraints)
- [Advanced Features](#advanced-features)

## Naming Conventions

```sql
-- Tables: plural, snake_case
CREATE TABLE users (...);
CREATE TABLE order_items (...);

-- Columns: snake_case, descriptive
user_id, created_at, is_active, total_amount

-- Indexes: idx_{table}_{columns}
CREATE INDEX idx_users_email ON users(email);

-- Constraints: {table}_{column}_{type}
CONSTRAINT users_email_unique UNIQUE (email)
```

## Core Table Structure

### Standard Table Template

```sql
CREATE TABLE table_name (
  -- Primary key (UUID recommended for public APIs)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business columns
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  -- Foreign keys
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  
  -- Soft delete (optional)
  deleted_at TIMESTAMPTZ
);

-- Auto-update updated_at
CREATE TRIGGER update_table_name_updated_at
  BEFORE UPDATE ON table_name
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);
```

### User Profile Pattern

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Data Types

### Recommended Types

| Use Case | PostgreSQL Type | Notes |
|----------|-----------------|-------|
| Primary keys | `UUID` | `gen_random_uuid()` |
| Text | `TEXT` | No length limit |
| Short text | `VARCHAR(n)` | When limit needed |
| Integers | `INTEGER`, `BIGINT` | Based on range |
| Decimals/Money | `NUMERIC(p,s)` | Exact precision |
| Timestamps | `TIMESTAMPTZ` | Always with timezone |
| Booleans | `BOOLEAN` | `TRUE`/`FALSE` |
| JSON | `JSONB` | Prefer over `JSON` |
| Arrays | `TEXT[]`, `INTEGER[]` | Native arrays |
| Enums | `TEXT` + CHECK | Or custom ENUM |

### JSON/JSONB Best Practices

```sql
-- Store structured data
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Flexible attributes
  metadata JSONB DEFAULT '{}'::JSONB,
  -- Indexed JSON field
  tags JSONB DEFAULT '[]'::JSONB
);

-- GIN index for JSON queries
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);
CREATE INDEX idx_products_tags ON products USING GIN (tags);

-- Query JSON
SELECT * FROM products WHERE metadata->>'category' = 'electronics';
SELECT * FROM products WHERE tags ? 'featured';
```

## Relationships

### One-to-Many

```sql
-- Parent table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

-- Child table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_projects_organization ON projects(organization_id);
```

### Many-to-Many

```sql
-- Junction table pattern
CREATE TABLE project_members (
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX idx_project_members_user ON project_members(user_id);
```

### Self-Referential

```sql
-- Categories with parent-child hierarchy
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  depth INTEGER DEFAULT 0
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
```

## Indexes

### Index Strategy

```sql
-- B-tree (default): equality and range queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- Composite: multiple column queries
CREATE INDEX idx_orders_user_status ON orders(user_id, status);

-- Partial: filtered subset
CREATE INDEX idx_orders_pending ON orders(created_at) 
  WHERE status = 'pending';

-- GIN: full-text search and JSONB
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', name || ' ' || description));

-- Unique: enforce uniqueness
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);
```

### When to Index

✅ Index columns used in:
- WHERE clauses
- JOIN conditions
- ORDER BY (especially with LIMIT)
- Foreign keys

❌ Avoid over-indexing:
- Rarely queried columns
- High-write tables (indexes slow writes)
- Small tables (full scan is faster)

## Constraints

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- NOT NULL
  user_id UUID NOT NULL,
  
  -- UNIQUE
  order_number TEXT UNIQUE NOT NULL,
  
  -- CHECK constraints
  status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) CHECK (total_amount >= 0),
  
  -- FOREIGN KEY with actions
  user_id UUID REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  
  -- DEFAULT values
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Cross-column constraint
ALTER TABLE orders ADD CONSTRAINT valid_dates 
  CHECK (shipped_at IS NULL OR shipped_at >= created_at);
```

## Advanced Features

### Full-Text Search

```sql
-- Add search column
ALTER TABLE products ADD COLUMN search_vector TSVECTOR;

-- Populate and index
UPDATE products SET search_vector = 
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''));

CREATE INDEX idx_products_search ON products USING GIN (search_vector);

-- Auto-update on changes
CREATE FUNCTION products_search_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.name,'') || ' ' || coalesce(NEW.description,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_search
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_trigger();

-- Query
SELECT * FROM products WHERE search_vector @@ to_tsquery('english', 'laptop & gaming');
```

### Soft Delete Pattern

```sql
-- Add soft delete column
ALTER TABLE items ADD COLUMN deleted_at TIMESTAMPTZ;

-- Create view for active items
CREATE VIEW active_items AS
  SELECT * FROM items WHERE deleted_at IS NULL;

-- Soft delete function
CREATE FUNCTION soft_delete() RETURNS TRIGGER AS $$
BEGIN
  UPDATE items SET deleted_at = NOW() WHERE id = OLD.id;
  RETURN NULL; -- Prevent actual delete
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_soft_delete
  BEFORE DELETE ON items
  FOR EACH ROW
  EXECUTE FUNCTION soft_delete();
```

### Audit Trail

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE FUNCTION audit_trigger() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Schema Review Checklist

- [ ] All tables have UUID primary keys
- [ ] Timestamps use `TIMESTAMPTZ`
- [ ] Foreign keys have appropriate ON DELETE actions
- [ ] Indexes exist for common query patterns
- [ ] Naming follows conventions (snake_case)
- [ ] Check constraints validate business rules
- [ ] Soft delete implemented where needed
- [ ] Audit trail for sensitive data
