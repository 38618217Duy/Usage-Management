# Row Level Security (RLS) Guide

Comprehensive guide for implementing secure, performant RLS policies in Supabase.

## Table of Contents
- [RLS Fundamentals](#rls-fundamentals)
- [Common Policy Patterns](#common-policy-patterns)
- [Advanced Policies](#advanced-policies)
- [Performance Optimization](#performance-optimization)
- [Testing Policies](#testing-policies)
- [Security Best Practices](#security-best-practices)

## RLS Fundamentals

### Enabling RLS

```sql
-- Enable RLS on table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (recommended)
ALTER TABLE posts FORCE ROW LEVEL SECURITY;
```

### Policy Structure

```sql
CREATE POLICY "policy_name" ON table_name
  AS PERMISSIVE  -- or RESTRICTIVE
  FOR ALL  -- or SELECT, INSERT, UPDATE, DELETE
  TO authenticated  -- or anon, public, role_name
  USING (condition)  -- for SELECT, UPDATE, DELETE
  WITH CHECK (condition);  -- for INSERT, UPDATE
```

### Auth Helper Functions

```sql
-- Current user ID
auth.uid()  -- Returns UUID of authenticated user

-- Current user role
auth.role()  -- Returns 'authenticated', 'anon', or 'service_role'

-- JWT claims
auth.jwt() -> 'app_metadata'  -- Access custom claims
(auth.jwt() -> 'app_metadata' ->> 'role')::text  -- Get specific claim
```

## Common Policy Patterns

### User Owns Data

```sql
-- Users can only access their own data
CREATE POLICY "users_own_data" ON profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Public Read, Auth Write

```sql
-- Anyone can read, only authenticated can write
CREATE POLICY "public_read" ON posts
  FOR SELECT
  TO public
  USING (published = true);

CREATE POLICY "auth_insert" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "owner_update" ON posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "owner_delete" ON posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);
```

### Organization/Team Access

```sql
-- Access based on organization membership
CREATE POLICY "org_members_access" ON projects
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );
```

### Role-Based Access

```sql
-- Different access levels by role
CREATE POLICY "viewers_read" ON documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_id = documents.id
        AND user_id = auth.uid()
        AND role IN ('viewer', 'editor', 'admin')
    )
  );

CREATE POLICY "editors_write" ON documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_id = documents.id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_id = documents.id
        AND user_id = auth.uid()
        AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "admins_delete" ON documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM document_permissions
      WHERE document_id = documents.id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );
```

## Advanced Policies

### Hierarchical Access (Parent-Child)

```sql
-- Access comments if user can access parent post
CREATE POLICY "comment_access_via_post" ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
        AND (
          posts.published = true
          OR posts.author_id = auth.uid()
        )
    )
  );
```

### Time-Based Access

```sql
-- Only access during active period
CREATE POLICY "time_restricted" ON promotions
  FOR SELECT
  TO authenticated
  USING (
    starts_at <= NOW() 
    AND (expires_at IS NULL OR expires_at > NOW())
  );
```

### JWT Claims-Based Access

```sql
-- Access based on custom JWT claims
CREATE POLICY "premium_content" ON premium_articles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'subscription')::text = 'premium'
  );

-- Multi-tenant by JWT claim
CREATE POLICY "tenant_isolation" ON tenant_data
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  )
  WITH CHECK (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

### Security Definer Functions

```sql
-- Bypass RLS for specific operations
CREATE FUNCTION get_team_stats(team_uuid UUID)
RETURNS TABLE (member_count INT, project_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify user has access first
  IF NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = team_uuid AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  -- Return aggregated data (bypasses RLS)
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM team_members WHERE team_id = team_uuid),
    (SELECT COUNT(*)::INT FROM projects WHERE team_id = team_uuid);
END;
$$;
```

## Performance Optimization

### Use Indexed Columns

```sql
-- Ensure RLS columns are indexed
CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);

-- Composite index for complex policies
CREATE INDEX idx_doc_perms_user_doc ON document_permissions(user_id, document_id);
```

### Optimize Subqueries

```sql
-- ❌ Slow: Correlated subquery executed for each row
CREATE POLICY "slow_policy" ON items
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ✅ Fast: Single lookup with EXISTS
CREATE POLICY "fast_policy" ON items
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

### Cache Expensive Lookups

```sql
-- Create security definer function for complex checks
CREATE FUNCTION user_organizations()
RETURNS UUID[]
LANGUAGE sql
STABLE  -- Can be cached within transaction
SECURITY DEFINER
AS $$
  SELECT ARRAY_AGG(organization_id)
  FROM organization_members
  WHERE user_id = auth.uid()
$$;

-- Use in policy
CREATE POLICY "org_access" ON resources
  FOR SELECT
  USING (organization_id = ANY(user_organizations()));
```

### Measure Policy Performance

```sql
-- Analyze query with RLS
EXPLAIN ANALYZE SELECT * FROM posts WHERE id = 'uuid';

-- Check for sequential scans (indicates missing index)
-- Look for "Filter" operations (RLS overhead)
```

## Testing Policies

### Test Framework

```sql
-- Create test users
INSERT INTO auth.users (id, email) VALUES 
  ('user-1-uuid', 'user1@test.com'),
  ('user-2-uuid', 'user2@test.com'),
  ('admin-uuid', 'admin@test.com');

-- Test as specific user
SET request.jwt.claim.sub = 'user-1-uuid';
SET request.jwt.claim.role = 'authenticated';

-- Now queries will run with user-1's permissions
SELECT * FROM posts;  -- Should only see user-1's posts

-- Reset
RESET request.jwt.claim.sub;
RESET request.jwt.claim.role;
```

### Policy Test Cases

```sql
-- Positive test: Owner can access
SELECT assert_true(
  EXISTS (
    SELECT 1 FROM posts 
    WHERE author_id = 'user-1-uuid'
  ),
  'Owner should see their posts'
);

-- Negative test: Non-owner cannot access
SELECT assert_false(
  EXISTS (
    SELECT 1 FROM posts 
    WHERE author_id = 'user-2-uuid' AND published = false
  ),
  'User should not see others unpublished posts'
);
```

### Testing with Supabase Client

```typescript
// Test as authenticated user
const { data, error } = await supabase
  .from('posts')
  .select('*')
  .eq('author_id', userId);

// Verify only allowed records returned
expect(data.every(post => post.author_id === userId)).toBe(true);

// Test denied access
const { data: denied, error: denyError } = await supabase
  .from('admin_only_table')
  .select('*');

expect(denied).toHaveLength(0);  // RLS blocks access
```

## Security Best Practices

### Policy Checklist

- [ ] RLS enabled on ALL tables with user data
- [ ] Every table has explicit policies (no default allow)
- [ ] Policies tested with positive AND negative cases
- [ ] Performance tested with production-like data
- [ ] Service role usage minimized and audited
- [ ] Sensitive operations logged for audit

### Common Mistakes to Avoid

```sql
-- ❌ Missing WITH CHECK (allows any insert)
CREATE POLICY "bad_insert" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);  -- Anyone can insert any data!

-- ✅ Proper WITH CHECK
CREATE POLICY "good_insert" ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- ❌ RLS bypass with service role in client app
-- NEVER expose service role key to client!

-- ✅ Use anon/authenticated keys only
-- Service role only for server-side operations
```

### Security Layers

```sql
-- Layer 1: RLS policies (row-level)
ALTER TABLE sensitive_data ENABLE ROW LEVEL SECURITY;

-- Layer 2: Column-level security (hide columns)
REVOKE SELECT (secret_column) ON sensitive_data FROM authenticated;

-- Layer 3: View for limited data exposure
CREATE VIEW public_profiles AS
  SELECT id, username, avatar_url 
  FROM profiles;
-- RLS on underlying table still applies

-- Layer 4: Functions for controlled operations
CREATE FUNCTION safe_update_profile(new_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET name = new_name WHERE id = auth.uid();
END;
$$;
```

## Quick Reference

| Pattern | Use Case | Key Function |
|---------|----------|--------------|
| `auth.uid() = user_id` | User owns record | Ownership |
| `EXISTS (SELECT ... WHERE user_id = auth.uid())` | Membership check | Team/Org access |
| `auth.jwt() -> 'metadata'` | Custom claims | Role-based |
| `SECURITY DEFINER` | Bypass RLS safely | Aggregations |
| `published = true` | Public content | Visibility flags |
