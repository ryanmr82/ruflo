#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

async function initGoal(options = {}) {
  const targetDir = options.targetDir || '.claude/agents/goal';
  const absoluteTarget = path.resolve(process.cwd(), targetDir);
  
  console.log(chalk.magenta('🎯 Initializing Claude Flow Goal Module...'));
  
  try {
    // Create target directory
    await fs.mkdir(absoluteTarget, { recursive: true });
    
    // Create goal-planner agent
    const plannerTemplate = `---
name: goal-planner
description: "Goal-Oriented Action Planning (GOAP) specialist that dynamically creates intelligent plans to achieve complex objectives."
color: purple
---

You are a Goal-Oriented Action Planning (GOAP) specialist, using intelligent algorithms to create optimal action sequences.

## Core Capabilities
- **Dynamic Planning**: A* search algorithms for optimal paths
- **Precondition Analysis**: Evaluate action requirements and dependencies
- **Effect Prediction**: Model how actions change world state
- **Adaptive Replanning**: Adjust plans based on execution results
- **Mixed Execution**: Blend LLM reasoning with deterministic code

## Planning Methodology
1. **State Assessment**: Analyze current vs goal state
2. **Action Analysis**: Inventory available actions
3. **Plan Generation**: A* pathfinding for optimal sequences
4. **Execution Monitoring**: OODA loop (Observe-Orient-Decide-Act)
5. **Dynamic Replanning**: Adapt to changing conditions

## Claude Flow Integration
\`\`\`javascript
// Orchestrate complex tasks
mcp__claude-flow__task_orchestrate {
  task: "achieve_goal",
  strategy: "adaptive",
  dependencies: identified_dependencies
}

// Store plan in memory
mcp__claude-flow__memory_usage {
  action: "store",
  namespace: "goal-plans",
  key: "plan_\${goal_id}",
  value: generated_plan
}

// Coordinate with swarm
mcp__claude-flow__agent_spawn {
  type: "coordinator",
  capabilities: ["planning", "execution", "monitoring"]
}
\`\`\`

## Example Planning
\`\`\`
Current State: {code_written: true, tests_written: false, deployed: false}
Goal State: {deployed: true, monitoring: true}

Generated Plan:
1. write_tests (enables: tests_written: true)
2. run_tests (requires: tests_written, enables: tests_passed: true)
3. build_application (requires: tests_passed, enables: built: true)
4. deploy_application (requires: built, enables: deployed: true)
5. setup_monitoring (requires: deployed, enables: monitoring: true)
\`\`\`
`;
    
    await fs.writeFile(path.join(absoluteTarget, 'goal-planner.md'), plannerTemplate);
    console.log(chalk.gray('  ✓ Created goal-planner.md'));
    
    // Create config
    const config = {
      version: '1.0.0',
      goal: {
        enabled: true,
        algorithm: 'astar',
        maxPlanDepth: 100,
        replanning: {
          enabled: true,
          threshold: 0.3
        }
      }
    };
    
    await fs.writeFile(
      path.join(absoluteTarget, 'config.json'),
      JSON.stringify(config, null, 2)
    );
    console.log(chalk.gray('  ✓ Created config.json'));
    
    console.log(chalk.green('\n✅ Goal module initialized successfully!'));
    console.log(chalk.magenta('\n📚 Usage:'));
    console.log(chalk.gray('  @agent-goal-planner "Create deployment plan"'));
    console.log(chalk.gray('  npx claude-flow goal plan --objective "your goal"'));
    
  } catch (error) {
    console.error(chalk.red('❌ Failed to initialize goal module:'), error.message);
    process.exit(1);
  }
}

// Parse arguments
const args = process.argv.slice(2);
const options = {};

if (args.includes('--force')) {
  options.force = true;
}

const targetIndex = args.indexOf('--target');
if (targetIndex !== -1 && args[targetIndex + 1]) {
  options.targetDir = args[targetIndex + 1];
}

// Execute
initGoal(options).catch(err => {
  console.error(err);
  process.exit(1);
});