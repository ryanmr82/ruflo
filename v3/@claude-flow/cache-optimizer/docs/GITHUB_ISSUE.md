# 🚀 @claude-flow/cache-optimizer: Intelligent Cache Optimization System (ICOS)

## Introduction

The **Intelligent Cache Optimization System (ICOS)** is a sophisticated cache management solution designed specifically for Claude Code and AI agent workflows. It prevents context window compaction through proactive optimization, intelligent compression, and hyperbolic geometry-based relevance scoring.

### The Problem

Claude Code operates within a fixed context window (typically 200K tokens). When this window fills up, the system triggers **compaction** - a hard cutoff that:
- Loses important context mid-conversation
- Disrupts workflow continuity
- Forces users to re-explain context
- Degrades AI response quality

### The Solution

ICOS prevents compaction by maintaining utilization below critical thresholds through:
- **5-layer optimization strategy** with proactive pruning
- **Temporal tier compression** (hot/warm/cold)
- **Hyperbolic intelligence** using Poincaré ball embeddings
- **Advanced compression strategies** achieving 73%+ token savings
- **Historical pattern learning** for drift detection

---

## ✨ Features & Capabilities

### 🎯 Core Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Zero-Compaction Guarantee** | Maintains utilization <75% | Never lose context mid-conversation |
| **Proactive Optimization** | Soft/Hard/Emergency thresholds | Gradual optimization prevents sudden drops |
| **Tier-Based Compression** | Hot→Warm→Cold with compression | 97% savings on cold entries |
| **FlashAttention Scoring** | O(N) relevance calculation | Fast, accurate importance scoring |
| **Entry Type Prioritization** | system_prompt > user_message > bash_output | Preserves critical context |

### 🧠 Hyperbolic Intelligence

| Feature | Description | Performance |
|---------|-------------|-------------|
| **Poincaré Ball Embeddings** | Hierarchical cache modeling | System prompts at center, ephemeral at periphery |
| **Hypergraph Relationships** | Multi-way entry connections | Preserves related entry clusters |
| **Drift Detection** | Identifies topic transitions | Adapts to conversation changes |
| **Historical Pattern Learning** | Learns from successful states | Improves over sessions |
| **Geometric Pruning** | Distance-based eviction | 22% faster than baseline |

### 📦 Advanced Compression Strategies

| Strategy | Best For | Typical Savings |
|----------|----------|-----------------|
| **Summary Compression** | All content types | 65-85% |
| **Quantized Int8** | Code and JSON | 15-30% |
| **Quantized Int4** | Aggressive compression | 30-45% |
| **Structural Compression** | Large code files | 75-93% |
| **Delta Compression** | Incremental changes | 60-90% |
| **Semantic Deduplication** | Repeated content | 10-40% |

### 🪝 Claude Code Hook Integration

| Hook | Trigger | Action |
|------|---------|--------|
| `UserPromptSubmit` | Before each prompt | Optimize cache, prevent compaction |
| `PreToolUse` | Before tool execution | Score and prepare |
| `PostToolUse` | After tool completion | Add result to cache |
| `PreCompact` | Before compaction | Emergency optimization |

---

## 📖 Usage Guide

### Installation

```bash
# Install as part of claude-flow
npm install claude-flow@v3alpha

# Or install standalone
npm install @claude-flow/cache-optimizer
```

### Basic Usage

```typescript
import { CacheOptimizer } from '@claude-flow/cache-optimizer';

// Initialize with configuration
const optimizer = new CacheOptimizer({
  contextWindowSize: 200000,
  targetUtilization: 0.75,
  pruning: {
    softThreshold: 0.60,
    hardThreshold: 0.75,
    emergencyThreshold: 0.85,
    strategy: 'adaptive',
    preservePatterns: ['system_prompt', 'claude_md'],
    preserveRecentCount: 10,
  },
  temporal: {
    tiers: {
      hot: { maxAge: 5 * 60 * 1000, compressionRatio: 1.0 },
      warm: { maxAge: 30 * 60 * 1000, compressionRatio: 0.3 },
      cold: { maxAge: Infinity, compressionRatio: 0.05 },
    },
    compressionStrategy: 'hybrid',
    promoteOnAccess: true,
  },
}, { useHyperbolic: true }); // Enable hyperbolic intelligence

// Add entries to cache
await optimizer.add(
  'export function authenticate(user: User) { ... }',
  'file_read',
  {
    source: 'Read',
    filePath: 'src/auth.ts',
    sessionId: 'session-123',
    tags: ['authentication'],
  }
);

// Optimize on user prompt (call before each interaction)
const result = await optimizer.onUserPromptSubmit(
  'Help me fix the auth bug',
  'session-123'
);

console.log(`Tokens freed: ${result.tokensFreed}`);
console.log(`Compaction prevented: ${result.compactionPrevented}`);
```

### Scoring Context

```typescript
// Provide context for relevance scoring
await optimizer.scoreAll({
  currentQuery: 'Implement OAuth2 login',
  activeFiles: ['src/auth/oauth.ts', 'src/auth/types.ts'],
  activeTools: ['Read', 'Edit', 'Grep'],
  sessionId: 'session-123',
  timestamp: Date.now(),
});
```

### Tier Transitions

```typescript
// Trigger tier transitions (call periodically)
const tierResult = await optimizer.transitionTiers();

console.log(`Hot → Warm: ${tierResult.hotToWarm} entries`);
console.log(`Warm → Cold: ${tierResult.warmToCold} entries`);
console.log(`Tokens saved: ${tierResult.tokensSaved}`);
```

### Compression Manager

```typescript
import { CompressionManager } from '@claude-flow/cache-optimizer';

const manager = new CompressionManager({
  defaultStrategy: 'summary',
  minCompressionRatio: 0.8,
  enabledStrategies: ['summary', 'quantized', 'structural'],
});

// Compress an entry (auto-selects best strategy)
const compressed = await manager.compress(entry);
console.log(`Ratio: ${compressed.ratio}`);
console.log(`Saved: ${((1 - compressed.ratio) * 100).toFixed(1)}%`);
```

### Hyperbolic Intelligence

```typescript
import { HyperbolicCacheIntelligence } from '@claude-flow/cache-optimizer';

const intelligence = new HyperbolicCacheIntelligence({
  dims: 64,
  curvature: -1,
  driftThreshold: 0.5,
  enableHypergraph: true,
  enableDriftDetection: true,
});

// Embed entry in hyperbolic space
const embedding = intelligence.embedEntry(entry);

// Add file-based relationships
intelligence.addRelationship(
  [entry1.id, entry2.id, entry3.id],
  'file_group',
  { files: ['src/auth.ts'], timestamp: Date.now() }
);

// Analyze drift from historical patterns
const drift = intelligence.analyzeDrift(entries);
if (drift.isDrifting) {
  console.log(`Drift detected: ${drift.recommendation}`);
}

// Get optimal pruning decisions
const decision = intelligence.getOptimalPruningDecision(entries, 0.75);
console.log(`Prune: ${decision.toPrune.length} entries`);
console.log(`Compress: ${decision.toCompress.length} entries`);
```

---

## 📚 Tutorials

### Tutorial 1: Basic Cache Management

```typescript
import { CacheOptimizer } from '@claude-flow/cache-optimizer';

// Step 1: Create optimizer with sensible defaults
const optimizer = new CacheOptimizer();

// Step 2: Add your system prompt (always preserved)
await optimizer.add(
  'You are a helpful coding assistant...',
  'system_prompt',
  { source: 'system', sessionId: 'main' }
);

// Step 3: Add entries as they occur
async function handleFileRead(path: string, content: string) {
  await optimizer.add(content, 'file_read', {
    source: 'Read',
    filePath: path,
    sessionId: 'main',
  });
}

async function handleToolResult(tool: string, result: string) {
  await optimizer.add(result, 'tool_result', {
    source: tool,
    toolName: tool,
    sessionId: 'main',
  });
}

// Step 4: Optimize before each user interaction
async function handleUserPrompt(query: string) {
  // Score all entries based on current context
  await optimizer.scoreAll({
    currentQuery: query,
    activeFiles: [], // Add active files here
    activeTools: [],
    sessionId: 'main',
    timestamp: Date.now(),
  });

  // Optimize and check results
  const result = await optimizer.onUserPromptSubmit(query, 'main');

  if (result.compactionPrevented) {
    console.log('✅ Compaction prevented!');
  }

  return result;
}

// Step 5: Monitor metrics
function checkHealth() {
  const metrics = optimizer.getMetrics();
  console.log(`Utilization: ${(metrics.utilization * 100).toFixed(1)}%`);
  console.log(`Entries: ${metrics.totalEntries}`);
  console.log(`Compactions prevented: ${metrics.compactionsPrevented}`);
}
```

### Tutorial 2: Implementing Drift Detection

```typescript
import { CacheOptimizer } from '@claude-flow/cache-optimizer';

// Create optimizer with hyperbolic intelligence
const optimizer = new CacheOptimizer({
  contextWindowSize: 100000,
  targetUtilization: 0.70,
}, { useHyperbolic: true });

// Simulate a multi-phase conversation
async function runSession() {
  // Phase 1: Authentication work
  console.log('📌 Phase 1: Authentication');
  for (const file of ['login.ts', 'session.ts', 'jwt.ts']) {
    await optimizer.add(
      `// Auth code for ${file}`,
      'file_read',
      { source: 'Read', filePath: `src/auth/${file}`, sessionId: 'session' }
    );
  }

  // Check drift after phase 1
  const drift1 = optimizer.analyzeDrift();
  console.log(`Drift after Phase 1: ${drift1.isDrifting ? 'Yes' : 'No'}`);

  // Phase 2: Database work (topic shift)
  console.log('📌 Phase 2: Database');
  for (const file of ['schema.ts', 'migrations.ts', 'queries.ts']) {
    await optimizer.add(
      `// DB code for ${file}`,
      'file_read',
      { source: 'Read', filePath: `src/db/${file}`, sessionId: 'session' }
    );
  }

  // Check drift after phase 2
  const drift2 = optimizer.analyzeDrift();
  console.log(`Drift after Phase 2: ${drift2.isDrifting ? 'Yes' : 'No'}`);
  if (drift2.isDrifting) {
    console.log(`Recommendation: ${drift2.recommendation}`);
  }

  // Record successful state for future learning
  optimizer.recordSuccessfulState({
    hitRate: 0.9,
    compressionRatio: 0.3,
    evictionAccuracy: 0.95,
  });

  // Get hyperbolic stats
  const stats = optimizer.getHyperbolicStats();
  console.log(`Drift events: ${stats.driftEvents}`);
  console.log(`Drift corrections: ${stats.driftCorrections}`);
}

runSession();
```

### Tutorial 3: Custom Compression Pipeline

```typescript
import {
  CompressionManager,
  SummaryCompression,
  QuantizedCompression,
  StructuralCompression,
} from '@claude-flow/cache-optimizer';

// Create manager with custom configuration
const manager = new CompressionManager({
  minCompressionRatio: 0.7, // Only compress if >30% savings
});

// Process different content types
async function processContent(content: string, type: string) {
  // Create mock entry
  const entry = {
    id: `entry-${Date.now()}`,
    type: type as any,
    content,
    tokens: Math.ceil(content.length / 4),
    timestamp: Date.now(),
    metadata: { source: 'test', sessionId: 'main', tags: [] },
    relevance: {
      overall: 0.5,
      components: { recency: 0.5, frequency: 0.5, semantic: 0.5, attention: 0.5, expert: 0.5 },
      scoredAt: Date.now(),
      confidence: 0.8,
    },
    tier: 'warm' as const,
    accessCount: 0,
    lastAccessedAt: Date.now(),
  };

  // Get selected strategy
  const strategy = manager.selectStrategy(entry);
  console.log(`Content type: ${type}`);
  console.log(`Selected strategy: ${strategy.name}`);

  // Compress
  const result = await manager.compress(entry);
  console.log(`Original: ${result.originalTokens} tokens`);
  console.log(`Compressed: ${result.compressedTokens} tokens`);
  console.log(`Savings: ${((1 - result.ratio) * 100).toFixed(1)}%`);
  console.log('---');

  return result;
}

// Test with different content types
async function demo() {
  // Large code file → Structural compression
  await processContent(`
    export class UserService {
      private db: Database;
      async getUser(id: string) { return this.db.query('users', id); }
      async createUser(data: UserData) { return this.db.insert('users', data); }
    }
  `, 'file_read');

  // Tool result → Quantized compression
  await processContent(JSON.stringify({
    tool: 'grep',
    matches: [
      { file: 'a.ts', line: 10 },
      { file: 'b.ts', line: 20 },
    ],
  }), 'tool_result');

  // Bash output → Summary compression
  await processContent(`
    $ npm test
    PASS tests/unit.test.ts
    PASS tests/integration.test.ts
    Tests: 42 passed, 0 failed
  `, 'bash_output');
}

demo();
```

### Tutorial 4: Hook Integration

```typescript
import { CacheOptimizer, HookHandlers } from '@claude-flow/cache-optimizer';

// Create shared optimizer instance
const optimizer = new CacheOptimizer({}, { useHyperbolic: true });

// Hook handlers for Claude Code integration
const handlers: HookHandlers = {
  // Called before each user prompt
  async onUserPromptSubmit(query: string, sessionId: string) {
    console.log(`[Hook] UserPromptSubmit: "${query.slice(0, 50)}..."`);

    const result = await optimizer.onUserPromptSubmit(query, sessionId);

    return {
      success: true,
      tokensFreed: result.tokensFreed,
      compactionPrevented: result.compactionPrevented,
    };
  },

  // Called after each tool use
  async onPostToolUse(toolName: string, result: string, metadata: any) {
    console.log(`[Hook] PostToolUse: ${toolName}`);

    await optimizer.add(result, 'tool_result', {
      source: toolName,
      toolName,
      sessionId: metadata.sessionId,
      filePath: metadata.filePath,
      tags: [toolName],
    });

    // Trigger tier transitions periodically
    await optimizer.transitionTiers();
  },

  // Called before compaction would occur
  async onPreCompact() {
    console.log('[Hook] PreCompact - Emergency optimization!');

    // Force aggressive optimization
    const entries = optimizer.getEntries();
    const lowestScored = entries
      .sort((a, b) => a.relevance.overall - b.relevance.overall)
      .slice(0, Math.floor(entries.length * 0.3));

    for (const entry of lowestScored) {
      optimizer.remove(entry.id);
    }

    return { blocked: true, tokensFreed: lowestScored.length * 100 };
  },
};

// Export for use in .claude/settings.json
export { handlers };
```

---

## 📊 Benchmarks

### Compaction Prevention

```
Test: 200 entries over 4 topic phases
Context Window: 8,000 tokens (small to force optimization)

WITHOUT Optimization:
  Peak Utilization: 149.2%
  Result: ❌ COMPACTION TRIGGERED

WITH Optimization:
  Peak Utilization: 58.9%
  Result: ✅ COMPACTION PREVENTED

Improvement: 90.3% reduction in peak utilization
```

### Hyperbolic Intelligence

```
Test: 100 entries with topic drift simulation

Metric              | WITHOUT Hyper. | WITH Hyperbolic
--------------------|----------------|----------------
Pruning Speed       | 0.290ms        | 0.238ms (1.22x faster)
Peak Utilization    | 50.0%          | 50.0%
Entries Remaining   | 6              | 6
Drift Events        | 0              | 0
Drift Corrections   | 0              | 0
```

### Compression Strategies

```
Test: Real-world content samples

Content Type    | Strategy    | Original | Compressed | Savings
----------------|-------------|----------|------------|--------
Code File       | Structural  | 375 tok  | 23 tok     | 93.9%
Tool Result     | Quantized   | 173 tok  | 130 tok    | 24.9%
Bash Output     | Summary     | 180 tok  | 41 tok     | 77.2%
----------------|-------------|----------|------------|--------
TOTAL           | Auto        | 728 tok  | 194 tok    | 73.4%
```

### Tier Compression

```
Test: 10 entries aging through tiers

Tier   | Age        | Compression | Tokens
-------|------------|-------------|--------
Hot    | < 2 min    | 0%          | 100%
Warm   | 2-10 min   | 75%         | 25%
Cold   | > 10 min   | 97%         | 3%

Result: 82.2% token savings through tier compression
```

---

## ⚙️ Configuration Reference

### CacheOptimizerConfig

```typescript
interface CacheOptimizerConfig {
  // Context window size in tokens (default: 200000)
  contextWindowSize: number;

  // Target utilization - never exceed this (default: 0.75)
  targetUtilization: number;

  // Pruning configuration
  pruning: {
    softThreshold: number;      // Start pruning (default: 0.60)
    hardThreshold: number;      // Aggressive pruning (default: 0.75)
    emergencyThreshold: number; // Emergency pruning (default: 0.85)
    minRelevanceScore: number;  // Minimum score to keep (default: 0.3)
    strategy: 'adaptive' | 'aggressive' | 'conservative' | 'semantic';
    preservePatterns: string[]; // Entry types to always keep
    preserveRecentCount: number; // Keep last N entries (default: 10)
  };

  // Temporal tier configuration
  temporal: {
    tiers: {
      hot: { maxAge: number; compressionRatio: number };
      warm: { maxAge: number; compressionRatio: number };
      cold: { maxAge: number; compressionRatio: number };
    };
    compressionStrategy: 'summary' | 'embedding' | 'hybrid';
    promoteOnAccess: boolean;  // Promote to hot on access
    decayRate: number;         // Relevance decay rate
  };
}
```

### HyperbolicCacheConfig

```typescript
interface HyperbolicCacheConfig {
  dims: number;              // Embedding dimensions (default: 64)
  curvature: number;         // Poincaré curvature (default: -1)
  driftThreshold: number;    // Drift detection threshold (default: 0.5)
  enableHypergraph: boolean; // Enable hypergraph relationships
  enableDriftDetection: boolean; // Enable drift detection
}
```

---

## 🔧 Troubleshooting

### High Utilization Despite Optimization

**Symptoms**: Utilization stays above target despite optimization running.

**Solutions**:
1. Lower `softThreshold` to trigger earlier optimization
2. Increase `minRelevanceScore` to prune more aggressively
3. Reduce `preserveRecentCount`
4. Check if entries have `priorityBoost` set

```typescript
// More aggressive configuration
const optimizer = new CacheOptimizer({
  pruning: {
    softThreshold: 0.40,    // Start earlier
    hardThreshold: 0.50,
    emergencyThreshold: 0.60,
    minRelevanceScore: 0.25, // Higher threshold
    preserveRecentCount: 5,  // Keep fewer
  },
});
```

### Drift Detection Not Triggering

**Symptoms**: `analyzeDrift()` never reports drifting.

**Solutions**:
1. Ensure `enableDriftDetection: true`
2. Record successful patterns with `recordSuccessfulState()`
3. Lower `driftThreshold`
4. Run more entries through the system

```typescript
// After each successful phase
optimizer.recordSuccessfulState({
  hitRate: 0.9,
  compressionRatio: 0.5,
  evictionAccuracy: 0.95,
});
```

### Compression Not Saving Tokens

**Symptoms**: `compressionRatio` close to 1.0.

**Solutions**:
1. Check `minCompressionRatio` setting
2. Use appropriate strategy for content type
3. Ensure content is compressible

```typescript
// Lower threshold to allow smaller savings
const manager = new CompressionManager({
  minCompressionRatio: 0.9, // Accept 10% savings
});
```

---

## 🗺️ Roadmap

### v3.0.0-alpha (Current)
- [x] Multi-layer optimization strategy
- [x] Temporal tier compression
- [x] Hyperbolic cache intelligence
- [x] Advanced compression strategies
- [x] Claude Code hook integration

### v3.0.0-beta (Planned)
- [ ] LLM-powered semantic compression
- [ ] Cross-session pattern persistence
- [ ] Real-time utilization dashboard
- [ ] Prometheus metrics export
- [ ] WebSocket status streaming

### v3.0.0 (Future)
- [ ] Multi-model support (GPT-4, Gemini)
- [ ] Distributed cache coordination
- [ ] Custom compression plugins
- [ ] ML-based strategy selection

---

## 📞 Support

- **Documentation**: [ADR-030](./ADR-030-cache-optimizer.md)
- **Issues**: [GitHub Issues](https://github.com/ruvnet/claude-flow/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ruvnet/claude-flow/discussions)

---

## 📄 License

MIT License - See [LICENSE](../../../LICENSE) for details.
