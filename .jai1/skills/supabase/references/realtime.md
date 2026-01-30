# Realtime Optimization Guide

Optimize Supabase realtime subscriptions for performance, reliability, and scalability.

## Table of Contents
- [Realtime Fundamentals](#realtime-fundamentals)
- [Subscription Patterns](#subscription-patterns)
- [Performance Optimization](#performance-optimization)
- [Connection Management](#connection-management)
- [Debugging](#debugging)
- [Scaling Strategies](#scaling-strategies)

## Realtime Fundamentals

### How Supabase Realtime Works

```
Client → WebSocket → Realtime Server → PostgreSQL (NOTIFY/LISTEN)
                                     ↓
                          pg_publication → WAL → Change capture
```

### Channel Types

1. **Postgres Changes**: Database row changes
2. **Broadcast**: Client-to-client messages
3. **Presence**: Online/offline status tracking

### Basic Subscription

```typescript
// Subscribe to database changes
const subscription = supabase
  .channel('posts-channel')
  .on(
    'postgres_changes',
    { 
      event: '*',  // INSERT, UPDATE, DELETE, or *
      schema: 'public',
      table: 'posts'
    },
    (payload) => {
      console.log('Change:', payload);
    }
  )
  .subscribe();

// Cleanup
subscription.unsubscribe();
```

## Subscription Patterns

### Filtered Subscriptions (Recommended)

```typescript
// ✅ Filter at subscription level (efficient)
const subscription = supabase
  .channel('user-messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: 'room_id=eq.123'  // Server-side filter
    },
    handleNewMessage
  )
  .subscribe();

// ❌ Filtering all messages on client (inefficient)
const subscription = supabase
  .channel('all-messages')
  .on('postgres_changes', { table: 'messages' }, (payload) => {
    if (payload.new.room_id === 123) {  // Client-side filter
      handleNewMessage(payload);
    }
  })
  .subscribe();
```

### Multiple Event Types

```typescript
const subscription = supabase
  .channel('posts-all-events')
  .on(
    'postgres_changes',
    { event: 'INSERT', table: 'posts' },
    handleInsert
  )
  .on(
    'postgres_changes',
    { event: 'UPDATE', table: 'posts' },
    handleUpdate
  )
  .on(
    'postgres_changes',
    { event: 'DELETE', table: 'posts' },
    handleDelete
  )
  .subscribe();
```

### Presence (Online Status)

```typescript
const channel = supabase.channel('room-1', {
  config: {
    presence: { key: userId }
  }
});

// Track presence
channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    console.log('Online users:', Object.keys(state));
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('User joined:', key);
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('User left:', key);
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ online_at: new Date().toISOString() });
    }
  });
```

### Broadcast (Client-to-Client)

```typescript
const channel = supabase.channel('typing-status');

// Send broadcast
await channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { user_id: userId, is_typing: true }
});

// Receive broadcast
channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
  updateTypingIndicator(payload.user_id, payload.is_typing);
});
```

## Performance Optimization

### Reduce Payload Size

```sql
-- Create publication with specific columns only
CREATE PUBLICATION posts_realtime FOR TABLE posts (id, title, updated_at);

-- Or use views for limited data
CREATE VIEW posts_lite AS 
  SELECT id, title, updated_at FROM posts;
```

```typescript
// Request only needed fields
const subscription = supabase
  .channel('posts')
  .on(
    'postgres_changes',
    { 
      table: 'posts',
      // Note: Column filtering in subscription is limited
      // Use publications for true column filtering
    },
    (payload) => {
      // Process minimal payload
      const { id, title } = payload.new;
    }
  )
  .subscribe();
```

### Batch State Updates

```typescript
// ❌ Immediate state update for each message
channel.on('postgres_changes', { table: 'messages' }, (payload) => {
  setMessages(prev => [...prev, payload.new]);  // Triggers re-render each time
});

// ✅ Batch updates
const pendingMessages = [];
let updateScheduled = false;

channel.on('postgres_changes', { table: 'messages' }, (payload) => {
  pendingMessages.push(payload.new);
  
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(() => {
      setMessages(prev => [...prev, ...pendingMessages]);
      pendingMessages.length = 0;
      updateScheduled = false;
    });
  }
});
```

### Subscribe to Single Channel per Table

```typescript
// ❌ Multiple channels for same table
const channel1 = supabase.channel('posts-1').on('postgres_changes', { table: 'posts' }, handler1);
const channel2 = supabase.channel('posts-2').on('postgres_changes', { table: 'posts' }, handler2);

// ✅ Single channel with multiple handlers
const channel = supabase
  .channel('posts')
  .on('postgres_changes', { table: 'posts' }, (payload) => {
    handler1(payload);
    handler2(payload);
  })
  .subscribe();
```

## Connection Management

### Retry Strategy

```typescript
const channel = supabase.channel('important-data', {
  config: {
    broadcast: { self: true }
  }
});

channel.subscribe((status, err) => {
  switch (status) {
    case 'SUBSCRIBED':
      console.log('Connected');
      break;
    case 'CHANNEL_ERROR':
      console.error('Channel error:', err);
      // Automatic retry built-in
      break;
    case 'TIMED_OUT':
      console.error('Connection timed out');
      break;
    case 'CLOSED':
      console.log('Channel closed');
      break;
  }
});
```

### Connection State Management

```typescript
// Track connection state
let isConnected = false;

const channel = supabase
  .channel('app-channel')
  .subscribe((status) => {
    isConnected = status === 'SUBSCRIBED';
    updateConnectionIndicator(isConnected);
  });

// Fallback to polling when disconnected
function fetchData() {
  if (!isConnected) {
    // Fallback to REST API
    return supabase.from('posts').select('*');
  }
  // Otherwise, data comes via realtime
}
```

### Cleanup on Unmount

```typescript
// React example
useEffect(() => {
  const channel = supabase
    .channel('posts')
    .on('postgres_changes', { table: 'posts' }, handleChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

## Debugging

### Enable Debug Logging

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  realtime: {
    logger: (type, msg, data) => {
      console.log(`[Realtime ${type}]`, msg, data);
    }
  }
});
```

### Common Issues and Solutions

| Issue | Symptom | Solution |
|-------|---------|----------|
| No messages received | Silent subscription | Check RLS policies, enable logging |
| Delayed messages | High latency | Check server location, reduce payload |
| Connection drops | Frequent reconnects | Check network, implement heartbeat |
| Memory leak | Growing memory usage | Always cleanup subscriptions |
| RLS blocking | Changes not received | Verify RLS allows SELECT |

### Check RLS for Realtime

```sql
-- Realtime checks SELECT policy
-- Ensure user can SELECT the rows they should receive

CREATE POLICY "realtime_access" ON messages
  FOR SELECT
  TO authenticated
  USING (
    room_id IN (
      SELECT room_id FROM room_members WHERE user_id = auth.uid()
    )
  );
```

### Verify Publication

```sql
-- Check existing publications
SELECT * FROM pg_publication;

-- Check which tables are published
SELECT * FROM pg_publication_tables;

-- Create publication if needed
CREATE PUBLICATION supabase_realtime FOR TABLE posts, messages;
```

## Scaling Strategies

### Horizontal Scaling

```typescript
// Shard channels by entity
const roomId = 'room-123';
const shardId = hashToShard(roomId, 10);  // 10 shards

const channel = supabase.channel(`room-shard-${shardId}`);
```

### Reduce Connection Count

```typescript
// Use single channel for multiple tables
const channel = supabase
  .channel('app-updates')
  .on('postgres_changes', { table: 'posts' }, handlePosts)
  .on('postgres_changes', { table: 'comments' }, handleComments)
  .on('postgres_changes', { table: 'likes' }, handleLikes)
  .subscribe();
```

### Implement Backpressure

```typescript
let messageQueue = [];
let processing = false;

channel.on('postgres_changes', { table: 'high_volume' }, (payload) => {
  messageQueue.push(payload);
  processQueue();
});

async function processQueue() {
  if (processing) return;
  processing = true;
  
  while (messageQueue.length > 0) {
    const batch = messageQueue.splice(0, 50);  // Process in batches
    await processBatch(batch);
    await new Promise(r => setTimeout(r, 100));  // Rate limit
  }
  
  processing = false;
}
```

## Performance Metrics

### Target Metrics

| Metric | Target | Warning |
|--------|--------|---------|
| Connection latency | < 100ms | > 500ms |
| Message latency | < 50ms | > 200ms |
| Reconnection time | < 2s | > 5s |
| Memory per subscription | < 10MB | > 50MB |
| Message throughput | 1000+/sec | < 100/sec |

### Monitor Performance

```typescript
// Measure message latency
const startTime = performance.now();

channel.on('postgres_changes', { table: 'tests' }, (payload) => {
  const latency = performance.now() - startTime;
  console.log(`Message latency: ${latency}ms`);
  
  if (latency > 200) {
    console.warn('High latency detected');
  }
});
```

## Quick Reference

```typescript
// Standard subscription pattern
const channel = supabase
  .channel('channel-name')
  .on('postgres_changes', {
    event: 'INSERT',      // INSERT, UPDATE, DELETE, *
    schema: 'public',     // Usually 'public'
    table: 'table_name',  // Target table
    filter: 'col=eq.val'  // Optional server-side filter
  }, callback)
  .subscribe((status) => {
    console.log('Status:', status);  // SUBSCRIBED, CHANNEL_ERROR, etc.
  });

// Cleanup
await supabase.removeChannel(channel);
// Or
await channel.unsubscribe();
```
