# Cache Optimizer Capabilities

## Profile: Multi-Agent Swarm

### Core Features

#### Zero-Compaction Strategy
Prevents Claude Code context compaction by proactively managing cache entries.
Uses intelligent pruning to stay below compaction thresholds.

#### RuVector Temporal Compression
- **Hot tier**: Recently accessed entries (180s)
- **Warm tier**: Moderately recent entries (600s)
- **Cold tier**: Older entries for archival (1800s)

#### Attention-Based Relevance Scoring
Flash Attention algorithm (2.49x-7.47x speedup) scores entries by:
- Recency (time-decay)
- Frequency (access count)
- Type (file_read, tool_result, etc.)
- Tags and metadata

#### Session Isolation
**Enabled** - Each Claude session has isolated storage

### Pruning Configuration

| Setting | Value |
|---------|-------|
| Strategy | adaptive |
| Soft Threshold | 55% |
| Hard Threshold | 70% |
| Emergency Threshold | 90% |

### Security Features

- **SSRF Prevention**: Validates all endpoints against allowlists
- **Command Injection Protection**: Sanitizes all shell arguments
- **Path Traversal Protection**: Validates all file paths
- **Header Injection Protection**: Sanitizes HTTP headers

### Multi-Instance Safety

- **Async Mutex**: Queue-based fair scheduling for concurrent access
- **File Locking**: `.lock` files with stale detection for multi-process safety
- **Session Partitioning**: Isolated storage per agent/session

### Background Handoff

Delegate expensive operations to other LLMs:

```typescript
import { handoff } from '@claude-flow/cache-optimizer';

// Synchronous handoff
const response = await handoff('Analyze this code', {
  provider: 'ollama',
  systemPrompt: 'You are a code analyst',
});

// Background handoff
const handoffId = await handoff('Generate tests', {
  background: true,
  provider: 'anthropic',
});
```

### Hooks Integration

This profile configures the following hooks:

#### UserPromptSubmit
- `npx @claude-flow/cache-optimizer handle-prompt "$PROMPT" --session "$SESSION_ID"`
  Session-isolated context loading

#### PreCompact
- `npx @claude-flow/cache-optimizer prevent-compact --session "$SESSION_ID"`
  Session-aware compaction prevention

#### PostToolUse
- `npx @claude-flow/cache-optimizer post-tool "$TOOL_NAME" "$TOOL_INPUT" --session "$SESSION_ID"`
  Session-isolated tool caching

#### MessageComplete
- `npx @claude-flow/cache-optimizer sync-session "$SESSION_ID"`
  Sync session state across agents

### Programmatic API

```typescript
import { createCacheOptimizer } from '@claude-flow/cache-optimizer';

const optimizer = createCacheOptimizer({
  targetUtilization: 0.7,
  pruning: {
    strategy: 'adaptive',
  },
});

await optimizer.initialize();

// Add entries
await optimizer.add(content, 'file_read', { filePath: '/path/to/file.ts' });

// Get utilization
const utilization = optimizer.getUtilization();

// Trigger pruning
const decision = await optimizer.getPruningDecision(context);
const result = await optimizer.prune(decision);
```

### Performance Metrics

| Metric | Target |
|--------|--------|
| Flash Attention Speedup | 2.49x-7.47x |
| HNSW Search | 150x-12,500x faster |
| Memory Reduction | 50-75% with quantization |
| Hook Response | <5000ms |

### Diagnostics

Run diagnostics with:

```bash
# Basic diagnostics
npx @claude-flow/cache-optimizer doctor

# Security-focused diagnostics
npx @claude-flow/cache-optimizer doctor --security

# Full diagnostics with auto-fix
npx @claude-flow/cache-optimizer doctor --full --fix
```
