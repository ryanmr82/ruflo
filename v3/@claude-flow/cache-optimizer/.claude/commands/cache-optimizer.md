# cache-optimizer

Intelligent cache management for Claude Code context optimization.

## Usage
```bash
npx @claude-flow/cache-optimizer <command> [options]
```

## Commands

### init
Initialize cache-optimizer in a project
```bash
npx @claude-flow/cache-optimizer init --profile <profile-id>
```

### status
Check cache status and utilization
```bash
npx @claude-flow/cache-optimizer status
```

### validate
Validate cache configuration
```bash
npx @claude-flow/cache-optimizer validate
```

### doctor
Run diagnostics and security checks
```bash
npx @claude-flow/cache-optimizer doctor [--security] [--fix]
```

### prune
Trigger cache pruning
```bash
npx @claude-flow/cache-optimizer prune [--level soft|hard|emergency]
```

## Hook Commands

### handle-prompt
Handle user prompt submission (hook)
```bash
npx @claude-flow/cache-optimizer handle-prompt "$PROMPT" --session "$SESSION_ID"
```

### post-tool
Cache tool results (hook)
```bash
npx @claude-flow/cache-optimizer post-tool "$TOOL_NAME" "$TOOL_INPUT" --session "$SESSION_ID"
```

### prevent-compact
Prevent context compaction (hook)
```bash
npx @claude-flow/cache-optimizer prevent-compact --session "$SESSION_ID"
```

### sync-session
Synchronize session state across agents
```bash
npx @claude-flow/cache-optimizer sync-session "$SESSION_ID"
```

## Profiles

| Profile | Use Case | Target Utilization |
|---------|----------|-------------------|
| `single-agent` | Single Claude instance | 80% |
| `multi-agent` | Swarm orchestration | 70% |
| `aggressive` | Maximum retention | 85% |
| `conservative` | Minimal footprint | 60% |
| `memory-constrained` | CI/CD, Docker | 50% |
| `performance` | Speed-optimized | 75% |
| `development` | Debug logging | 75% |
| `production` | Stability | 72% |

## Examples

```bash
# Initialize with multi-agent profile
npx @claude-flow/cache-optimizer init --profile multi-agent

# Check current status
npx @claude-flow/cache-optimizer status

# Run security diagnostics
npx @claude-flow/cache-optimizer doctor --security

# Reset configuration
npx @claude-flow/cache-optimizer reset
```
