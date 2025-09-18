# Claude Flow Neural and Goal Modules

## Overview

Claude Flow now includes optional Neural and Goal modules that can be initialized in any project to add advanced AI capabilities.

### Neural Module (SAFLA)
Self-Aware Feedback Loop Algorithm for persistent memory and self-learning AI systems.

### Goal Module (GOAP)
Goal-Oriented Action Planning for intelligent task planning and execution.

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/ruvnet/claude-flow
cd claude-flow

# Initialize neural module
npm run init:neural
# or with custom directory
node scripts/init-neural.js --target path/to/neural

# Initialize goal module  
npm run init:goal
# or with custom directory
node scripts/init-goal.js --target path/to/goal
```

### Remote Installation via NPX

```bash
# Install neural module
npx claude-flow@alpha neural init

# Install goal module
npx claude-flow@alpha goal init

# Force overwrite existing modules
npx claude-flow@alpha neural init --force
npx claude-flow@alpha goal init --force

# Install to custom directory
npx claude-flow@alpha neural init --target ./my-agents/neural
npx claude-flow@alpha goal init --target ./my-agents/goal
```

## Neural Module Features

### SAFLA Neural Agent
- **4-tier Memory System**: Vector, Episodic, Semantic, Working
- **Feedback Loops**: Self-improving learning cycles
- **Performance**: 172,000+ operations per second
- **Compression**: 60% memory compression
- **Persistence**: Cross-session learning

### Usage
```javascript
// Use with Claude Code
@agent-safla-neural "Create self-improving code review system"

// MCP Integration
mcp__claude-flow__neural_train {
  pattern_type: "coordination",
  training_data: safla_config
}

mcp__claude-flow__memory_usage {
  action: "store",
  namespace: "safla-learning",
  key: "pattern_001",
  value: learned_pattern
}
```

## Goal Module Features

### Goal-Planner Agent
- **A* Search**: Optimal pathfinding through action space
- **OODA Loop**: Observe-Orient-Decide-Act execution
- **Mixed Execution**: LLM + deterministic code
- **Adaptive Replanning**: Dynamic response to changes

### Usage
```javascript
// Use with Claude Code
@agent-goal-planner "Create deployment plan for production"

// MCP Integration
mcp__claude-flow__task_orchestrate {
  task: "achieve_goal",
  strategy: "adaptive"
}
```

## Configuration

### Neural Config (config.json)
```json
{
  "version": "1.0.0",
  "neural": {
    "enabled": true,
    "defaultModel": "safla",
    "wasmOptimization": true,
    "memoryCompression": 0.6,
    "operationsPerSecond": 172000
  }
}
```

### Goal Config (config.json)
```json
{
  "version": "1.0.0",
  "goal": {
    "enabled": true,
    "algorithm": "astar",
    "maxPlanDepth": 100,
    "replanning": {
      "enabled": true,
      "threshold": 0.3
    }
  }
}
```

## Integration Examples

### Combined Usage
```javascript
// 1. Plan with GOAP
const plan = await goal_planner.createPlan({
  current: { code_written: true, tested: false },
  goal: { deployed: true, monitored: true }
});

// 2. Execute with SAFLA learning
for (const action of plan.actions) {
  const result = await safla_neural.execute(action);
  await safla_neural.learn(result.feedback);
}

// 3. Store experience
await mcp__claude_flow__memory_usage({
  action: "store",
  namespace: "deployment-patterns",
  key: `plan_${Date.now()}`,
  value: { plan, results, learnings }
});
```

### Swarm Integration
```javascript
// Initialize swarm with neural and goal agents
mcp__claude-flow__swarm_init { topology: "hierarchical" }

mcp__claude-flow__agent_spawn { 
  type: "coordinator",
  name: "goal-planner" 
}

mcp__claude-flow__agent_spawn {
  type: "specialist",
  name: "safla-neural"
}

// Orchestrate complex task
mcp__claude-flow__task_orchestrate {
  task: "Build self-improving deployment pipeline",
  strategy: "adaptive"
}
```

## Directory Structure

```
.claude/
└── agents/
    ├── neural/
    │   ├── safla-neural.md
    │   └── config.json
    └── goal/
        ├── goal-planner.md
        └── config.json
```

## Troubleshooting

### Module Already Exists
Use `--force` flag to overwrite:
```bash
npx claude-flow@alpha neural init --force
```

### Custom Directory
Specify target directory:
```bash
npx claude-flow@alpha neural init --target ./custom/path
```

### Verification
Check installation:
```bash
ls -la .claude/agents/neural/
ls -la .claude/agents/goal/
```

## Resources

- **SAFLA Documentation**: https://github.com/ruvnet/SAFLA
- **Claude Flow**: https://github.com/ruvnet/claude-flow
- **MCP Tools**: See CLAUDE.md for full list

## License

MIT - See LICENSE file for details