# Goal-Oriented Action Planning (GOAP) Agent

A sophisticated planning agent for Claude Flow that uses Goal-Oriented Action Planning algorithms to dynamically discover novel solutions through intelligent planning.

## 🎯 Overview

This agent implements GOAP (Goal-Oriented Action Planning), a gaming AI technique that enables:
- **Dynamic Planning**: Creates action sequences on-the-fly based on current state and goals
- **Novel Solution Discovery**: Combines known actions in new ways to solve problems
- **Adaptive Replanning**: Adjusts plans based on action outcomes and changing conditions
- **Multiple Execution Modes**: Focused, Closed, and Open modes for different scenarios

## 🏗️ Architecture

### Core Components

1. **GOAP Planner**: A* pathfinding algorithm adapted for action planning
2. **World State Management**: Tracks current environment state
3. **Action System**: Defines actions with preconditions and effects
4. **Goal System**: Defines target states to achieve
5. **OODA Loop**: Observe, Orient, Decide, Act cycle for execution

### Key Classes

- `GOAPPlanner`: Core planning algorithm using A* search
- `GoalOrientedAgent`: Main agent class with execution modes
- `ClaudeFlowGOAPAgent`: Integration with Claude Flow tools

## 📖 Usage

### Basic Example

```javascript
import { ClaudeFlowGOAPAgent } from './goap-planner.js';

// Create agent
const agent = new ClaudeFlowGOAPAgent({
  name: 'Project Builder',
  description: 'Builds projects using goal-oriented planning',
  mode: 'closed' // or 'focused', 'open'
});

// Define actions with preconditions and effects
agent.defineAction({
  name: 'setup_environment',
  description: 'Set up development environment',
  preconditions: { project_initialized: true },
  effects: { environment_ready: true },
  execute: async () => {
    // Implementation
    return 'Environment configured';
  }
});

agent.defineAction({
  name: 'install_dependencies',
  description: 'Install project dependencies',
  preconditions: { environment_ready: true },
  effects: { dependencies_installed: true },
  cost: 2, // Higher cost = lower priority
  execute: async () => {
    // Implementation
    return 'Dependencies installed';
  }
});

// Define goals
agent.defineGoal({
  name: 'project_ready',
  description: 'Project is ready for development',
  targetState: {
    environment_ready: true,
    dependencies_installed: true,
    tests_passing: true
  }
});

// Set initial world state
agent.setState({
  project_initialized: true,
  environment_ready: false,
  dependencies_installed: false
});

// Execute in closed mode (plan within agent)
const result = await agent.executeClosed({ goal: 'project_ready' });
console.log(result);
```

## 🎮 Execution Modes

### 1. Focused Mode
Direct execution of specific actions. Best for deterministic workflows.

```javascript
await agent.executeFocused({
  action: 'run_tests',
  params: { verbose: true }
});
```

### 2. Closed Mode
Plans and executes within single agent. Ideal for well-defined domains.

```javascript
await agent.executeClosed({
  goal: 'deploy_application'
});
```

### 3. Open Mode
Discovers novel solutions across all available actions. Most flexible but least predictable.

```javascript
await agent.executeOpen({
  intent: 'Make the application faster and more reliable'
});
```

## 🔄 Dynamic Replanning

The agent supports dynamic replanning after each action:

```javascript
const agent = new ClaudeFlowGOAPAgent({
  replanning: true // Enable replanning
});

// Agent will automatically replan if:
// - An action fails
// - World state changes unexpectedly
// - Better path becomes available
```

## 🛠️ Claude Flow Integration

### Using Claude Flow Tools

```javascript
agent.createClaudeFlowAction('analyze_repo', {
  description: 'Analyze repository structure',
  preconditions: { repo_cloned: true },
  effects: { repo_analyzed: true },
  command: 'sparc analyze',
  cost: 1
});
```

### Swarm Integration

```javascript
// Define action that spawns Claude Flow agents
agent.defineAction({
  name: 'spawn_code_reviewer',
  description: 'Spawn code review agent',
  preconditions: { code_complete: true },
  effects: { code_reviewed: true },
  execute: async () => {
    const { execSync } = await import('child_process');
    return execSync('npx claude-flow@alpha agent spawn reviewer', {
      encoding: 'utf8'
    });
  }
});
```

## 📊 Planning Algorithm

The planner uses A* search with:
- **Cost Function**: Action costs (default 1)
- **Heuristic**: Number of unsatisfied goals
- **State Space**: World state key-value pairs
- **Operators**: Actions with preconditions/effects

### Planning Process

1. Start with current world state
2. Find actions whose preconditions are satisfied
3. Apply action effects to create new states
4. Use A* to find optimal path to goal state
5. Return ordered list of actions

## 🔮 Advanced Features

### Custom Validators

```javascript
agent.defineGoal({
  name: 'quality_assured',
  targetState: { tests_passing: true },
  validator: (worldState) => {
    // Custom validation logic
    return worldState.get('coverage') > 80;
  }
});
```

### Action Groups

```javascript
// Define related actions
const testingActions = [
  { name: 'unit_tests', /* ... */ },
  { name: 'integration_tests', /* ... */ },
  { name: 'e2e_tests', /* ... */ }
];

testingActions.forEach(action => agent.defineAction(action));
```

### State Persistence

```javascript
// Save agent state
const config = agent.export();
await fs.writeFile('agent-state.json', JSON.stringify(config));

// Restore agent state
const saved = JSON.parse(await fs.readFile('agent-state.json'));
const restoredAgent = new ClaudeFlowGOAPAgent(saved);
```

## 🎯 Best Practices

1. **Keep Actions Atomic**: Each action should do one thing well
2. **Clear Preconditions**: Be explicit about what state is required
3. **Measurable Effects**: Effects should be verifiable
4. **Appropriate Costs**: Use costs to guide planning preferences
5. **State Validation**: Validate world state after actions
6. **Error Handling**: Implement robust error handling in execute functions

## 🚀 Running the Agent

### Standalone
```bash
node .claude/agents/goal/goap-planner.js
```

### Via Claude Flow
```bash
npx claude-flow@alpha agent spawn goal-planner
```

### In Code
```javascript
import { ClaudeFlowGOAPAgent } from '.claude/agents/goal/goap-planner.js';
// Use as shown in examples
```

## 📈 Performance Considerations

- **Plan Depth**: Limited to 10 actions by default (configurable)
- **State Size**: Keep world state focused on relevant attributes
- **Action Count**: More actions = larger search space
- **Replanning**: Adds overhead but improves adaptability

## 🔗 Integration Examples

### With SPARC Methodology
```javascript
agent.defineAction({
  name: 'sparc_specification',
  preconditions: { requirements_gathered: true },
  effects: { specification_complete: true },
  execute: async () => {
    // Run SPARC specification phase
  }
});
```

### With Swarm Coordination
```javascript
agent.defineAction({
  name: 'coordinate_swarm',
  preconditions: { swarm_initialized: true },
  effects: { task_distributed: true },
  execute: async () => {
    // Coordinate with swarm agents
  }
});
```

## 📝 Comparison with Traditional Approaches

| Aspect | GOAP Agent | Traditional FSM |
|--------|------------|-----------------|
| Planning | Dynamic | Static |
| Flexibility | High | Low |
| Novel Solutions | Yes | No |
| Replanning | Automatic | Manual |
| Complexity | O(b^d) | O(n) |

## 🎓 Inspired By

This implementation is inspired by:
- **Embabel Agent Framework**: GOAP-based planning for JVM
- **Gaming AI**: GOAP algorithms from game development
- **STRIPS Planning**: Classic AI planning techniques
- **A* Pathfinding**: Optimal path search algorithms

## 🔧 Configuration Options

```javascript
{
  name: 'Agent Name',
  description: 'Agent Description',
  mode: 'closed', // 'focused' | 'closed' | 'open'
  replanning: true, // Enable dynamic replanning
  maxPlanDepth: 10, // Maximum planning depth
  claudeFlowPath: 'npx claude-flow@alpha' // Claude Flow command
}
```

## 🐛 Debugging

Enable detailed logging:
```javascript
agent.debug = true; // Verbose planning output
```

View current state:
```javascript
console.log(agent.worldState); // Current world state
console.log(agent.export()); // Full agent configuration
```

## 🚦 Status

- ✅ Core GOAP algorithm
- ✅ Three execution modes
- ✅ Dynamic replanning
- ✅ Claude Flow integration
- 🔄 Swarm coordination (in progress)
- 📅 Distributed planning (planned)

## 📚 Further Reading

- [Goal-Oriented Action Planning](https://en.wikipedia.org/wiki/Goal-oriented_action_planning)
- [A* Search Algorithm](https://en.wikipedia.org/wiki/A*_search_algorithm)
- [STRIPS Planning](https://en.wikipedia.org/wiki/STRIPS)
- [OODA Loop](https://en.wikipedia.org/wiki/OODA_loop)