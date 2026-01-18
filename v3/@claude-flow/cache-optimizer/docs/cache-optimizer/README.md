# Cache Optimizer Configuration

This project uses [@claude-flow/cache-optimizer](https://github.com/ruvnet/claude-flow) for intelligent context caching.

## Current Profile: Multi-Agent Swarm

Session-isolated caching for concurrent Claude instances

**Best for:** Swarm orchestration, Parallel task execution, Multi-agent workflows

## Quick Commands

```bash
# Check status
npx @claude-flow/cache-optimizer status

# Validate configuration
npx @claude-flow/cache-optimizer validate

# Run diagnostics
npx @claude-flow/cache-optimizer doctor

# Change profile
npx @claude-flow/cache-optimizer init --profile <profile-id>

# Reset configuration
npx @claude-flow/cache-optimizer reset
```

## Available Profiles

| Profile | Description | Target Utilization |
|---------|-------------|-------------------|
| `single-agent` | Single Claude instance | 80% |
| `multi-agent` | Swarm orchestration | 70% |
| `aggressive` | Maximum retention | 85% |
| `conservative` | Minimal footprint | 60% |
| `memory-constrained` | CI/CD, Docker | 50% |
| `performance` | Speed-optimized | 75% |
| `development` | Debug logging | 75% |
| `production` | Stability | 72% |

## Configuration

Configuration is stored in `.cache-optimizer.json`.

## Hooks

Cache optimizer hooks are configured in `.claude/settings.json`:

- **UserPromptSubmit**: Pre-loads relevant context
- **PostToolUse**: Caches tool results
- **PreCompact**: Prevents context compaction

## Learn More

- [Documentation](https://github.com/ruvnet/claude-flow)
- [ADR-030: Cache Optimizer Architecture](https://github.com/ruvnet/claude-flow/blob/main/docs/ADR-030-cache-optimizer.md)
