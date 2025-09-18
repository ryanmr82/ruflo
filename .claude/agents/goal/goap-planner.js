#!/usr/bin/env node
/**
 * Goal-Oriented Action Planning (GOAP) Agent
 * Inspired by Embabel's approach, adapted for Claude Flow
 * 
 * This agent implements intelligent planning using GOAP algorithms
 * to dynamically discover novel solutions through goal-oriented planning.
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

/**
 * GOAP Planner - Core planning algorithm
 * Uses heuristic search to find optimal action sequences
 */
class GOAPPlanner {
  constructor() {
    this.actions = [];
    this.worldState = new Map();
    this.goals = new Map();
    this.maxPlanDepth = 10;
  }

  /**
   * A* pathfinding algorithm adapted for action planning
   * Finds optimal sequence of actions to achieve goals
   */
  plan(worldState, goals, actions) {
    const openSet = [];
    const closedSet = new Set();
    
    // Initialize with current world state
    const startNode = {
      state: new Map(worldState),
      actions: [],
      cost: 0,
      heuristic: this.calculateHeuristic(worldState, goals)
    };
    
    openSet.push(startNode);
    
    while (openSet.length > 0) {
      // Sort by f-score (cost + heuristic)
      openSet.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      const current = openSet.shift();
      
      // Check if we've reached the goal
      if (this.goalsSatisfied(current.state, goals)) {
        return current.actions;
      }
      
      // Prevent infinite loops
      if (current.actions.length >= this.maxPlanDepth) {
        continue;
      }
      
      const stateKey = this.serializeState(current.state);
      if (closedSet.has(stateKey)) {
        continue;
      }
      closedSet.add(stateKey);
      
      // Explore available actions
      for (const action of actions) {
        if (this.actionApplicable(action, current.state)) {
          const newState = this.applyAction(action, current.state);
          const newNode = {
            state: newState,
            actions: [...current.actions, action],
            cost: current.cost + (action.cost || 1),
            heuristic: this.calculateHeuristic(newState, goals)
          };
          openSet.push(newNode);
        }
      }
    }
    
    return null; // No plan found
  }

  /**
   * Calculate heuristic distance to goal
   * Used for A* pathfinding
   */
  calculateHeuristic(state, goals) {
    let distance = 0;
    for (const [key, value] of goals) {
      if (!state.has(key) || state.get(key) !== value) {
        distance++;
      }
    }
    return distance;
  }

  /**
   * Check if all goals are satisfied in current state
   */
  goalsSatisfied(state, goals) {
    for (const [key, value] of goals) {
      if (!state.has(key) || state.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if action's preconditions are met
   */
  actionApplicable(action, state) {
    if (!action.preconditions) return true;
    
    for (const [key, value] of action.preconditions) {
      if (!state.has(key) || state.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Apply action effects to world state
   */
  applyAction(action, state) {
    const newState = new Map(state);
    
    if (action.effects) {
      for (const [key, value] of action.effects) {
        newState.set(key, value);
      }
    }
    
    return newState;
  }

  /**
   * Serialize state for comparison
   */
  serializeState(state) {
    return JSON.stringify([...state].sort());
  }
}

/**
 * Goal-Oriented Agent
 * Manages goals, actions, and execution modes
 */
class GoalOrientedAgent {
  constructor(config = {}) {
    this.name = config.name || 'GOAP Agent';
    this.description = config.description || 'Goal-oriented planning agent';
    this.planner = new GOAPPlanner();
    this.worldState = new Map();
    this.actions = [];
    this.goals = [];
    this.executionMode = config.mode || 'closed';
    this.replanning = config.replanning !== false;
    this.memory = new Map();
  }

  /**
   * Define an action with preconditions and effects
   */
  defineAction(action) {
    const actionDef = {
      name: action.name,
      description: action.description,
      preconditions: new Map(Object.entries(action.preconditions || {})),
      effects: new Map(Object.entries(action.effects || {})),
      cost: action.cost || 1,
      execute: action.execute || (() => Promise.resolve()),
      tools: action.tools || [],
      llmBased: action.llmBased || false
    };
    
    this.actions.push(actionDef);
    return this;
  }

  /**
   * Define a goal with target state
   */
  defineGoal(goal) {
    const goalDef = {
      name: goal.name,
      description: goal.description,
      targetState: new Map(Object.entries(goal.targetState || {})),
      priority: goal.priority || 1,
      validator: goal.validator || (() => true)
    };
    
    this.goals.push(goalDef);
    return this;
  }

  /**
   * Set world state
   */
  setState(state) {
    this.worldState = new Map(Object.entries(state));
    return this;
  }

  /**
   * Update world state
   */
  updateState(updates) {
    for (const [key, value] of Object.entries(updates)) {
      this.worldState.set(key, value);
    }
    return this;
  }

  /**
   * Execute in different modes
   */
  async execute(input, mode = null) {
    const execMode = mode || this.executionMode;
    
    switch (execMode) {
      case 'focused':
        return await this.executeFocused(input);
      case 'closed':
        return await this.executeClosed(input);
      case 'open':
        return await this.executeOpen(input);
      default:
        throw new Error(`Unknown execution mode: ${execMode}`);
    }
  }

  /**
   * Focused Mode: Direct execution of specific action
   */
  async executeFocused(input) {
    const { action, params } = input;
    const actionDef = this.actions.find(a => a.name === action);
    
    if (!actionDef) {
      throw new Error(`Action not found: ${action}`);
    }
    
    // Check preconditions
    if (!this.planner.actionApplicable(actionDef, this.worldState)) {
      throw new Error(`Preconditions not met for action: ${action}`);
    }
    
    // Execute action
    const result = await actionDef.execute(params, this.worldState);
    
    // Apply effects
    this.worldState = this.planner.applyAction(actionDef, this.worldState);
    
    return {
      action: action,
      result: result,
      worldState: Object.fromEntries(this.worldState)
    };
  }

  /**
   * Closed Mode: Plan and execute within single agent
   */
  async executeClosed(input) {
    const { goal: goalName } = input;
    const goal = this.goals.find(g => g.name === goalName);
    
    if (!goal) {
      throw new Error(`Goal not found: ${goalName}`);
    }
    
    // Create plan
    const plan = this.planner.plan(this.worldState, goal.targetState, this.actions);
    
    if (!plan) {
      throw new Error(`No plan found to achieve goal: ${goalName}`);
    }
    
    // Execute plan with replanning
    const results = [];
    for (const action of plan) {
      try {
        const result = await action.execute({}, this.worldState);
        this.worldState = this.planner.applyAction(action, this.worldState);
        results.push({ action: action.name, result });
        
        // Replan if enabled
        if (this.replanning) {
          const remainingGoals = this.getRemainingGoals(goal.targetState);
          if (remainingGoals.size > 0) {
            const newPlan = this.planner.plan(this.worldState, remainingGoals, this.actions);
            if (newPlan && newPlan.length > 0) {
              plan.splice(plan.indexOf(action) + 1, plan.length, ...newPlan);
            }
          }
        }
      } catch (error) {
        console.error(`Action failed: ${action.name}`, error);
        if (this.replanning) {
          // Replan on failure
          const newPlan = this.planner.plan(this.worldState, goal.targetState, this.actions);
          if (newPlan) {
            plan.splice(plan.indexOf(action) + 1, plan.length, ...newPlan);
          }
        } else {
          throw error;
        }
      }
    }
    
    return {
      goal: goalName,
      plan: plan.map(a => a.name),
      results: results,
      worldState: Object.fromEntries(this.worldState)
    };
  }

  /**
   * Open Mode: Discover novel solutions across all available actions
   */
  async executeOpen(input) {
    const { intent } = input;
    
    // Analyze intent to derive goals
    const derivedGoals = await this.deriveGoalsFromIntent(intent);
    
    // Combine all available actions (can be extended to include external agents)
    const allActions = [...this.actions];
    
    // Find novel plan
    const plan = this.planner.plan(this.worldState, derivedGoals, allActions);
    
    if (!plan) {
      // Try breaking down into sub-goals
      const subGoals = this.decomposeGoals(derivedGoals);
      const compositePlan = [];
      
      for (const subGoal of subGoals) {
        const subPlan = this.planner.plan(this.worldState, subGoal, allActions);
        if (subPlan) {
          compositePlan.push(...subPlan);
        }
      }
      
      if (compositePlan.length === 0) {
        throw new Error('No plan found for intent: ' + intent);
      }
      
      return await this.executePlan(compositePlan, derivedGoals);
    }
    
    return await this.executePlan(plan, derivedGoals);
  }

  /**
   * Derive goals from natural language intent
   */
  async deriveGoalsFromIntent(intent) {
    // This would use LLM to analyze intent
    // For now, return a simple goal structure
    return new Map([
      ['intent_processed', true],
      ['task_complete', true]
    ]);
  }

  /**
   * Decompose complex goals into sub-goals
   */
  decomposeGoals(goals) {
    const subGoals = [];
    const entries = [...goals.entries()];
    
    // Create sub-goals for each goal component
    for (let i = 0; i < entries.length; i++) {
      const subGoal = new Map(entries.slice(0, i + 1));
      subGoals.push(subGoal);
    }
    
    return subGoals;
  }

  /**
   * Execute a plan with monitoring and replanning
   */
  async executePlan(plan, targetGoals) {
    const results = [];
    
    for (let i = 0; i < plan.length; i++) {
      const action = plan[i];
      
      // Execute with OODA loop (Observe, Orient, Decide, Act)
      await this.observe(); // Check current state
      await this.orient(action); // Prepare for action
      const decision = await this.decide(action, targetGoals); // Decide if action is still valid
      
      if (!decision.proceed) {
        // Replan from current position
        const remainingGoals = this.getRemainingGoals(targetGoals);
        const newPlan = this.planner.plan(this.worldState, remainingGoals, this.actions);
        if (newPlan) {
          plan.splice(i, plan.length - i, ...newPlan);
          i--; // Retry with new plan
          continue;
        }
      }
      
      const result = await this.act(action); // Execute action
      results.push(result);
      
      // Update world state
      this.worldState = this.planner.applyAction(action, this.worldState);
    }
    
    return {
      plan: plan.map(a => a.name),
      results: results,
      worldState: Object.fromEntries(this.worldState)
    };
  }

  /**
   * OODA Loop components
   */
  async observe() {
    // Observe current environment/state
    // Could integrate with external sensors/APIs
    return this.worldState;
  }

  async orient(action) {
    // Orient to the situation
    // Prepare resources, context, etc.
    if (action.tools && action.tools.length > 0) {
      // Load required tools
      for (const tool of action.tools) {
        await this.loadTool(tool);
      }
    }
  }

  async decide(action, goals) {
    // Decide if action is still relevant
    if (!this.planner.actionApplicable(action, this.worldState)) {
      return { proceed: false, reason: 'Preconditions no longer met' };
    }
    
    // Check if action still contributes to goals
    const futureState = this.planner.applyAction(action, this.worldState);
    const currentDistance = this.planner.calculateHeuristic(this.worldState, goals);
    const futureDistance = this.planner.calculateHeuristic(futureState, goals);
    
    if (futureDistance >= currentDistance) {
      return { proceed: false, reason: 'Action does not improve goal progress' };
    }
    
    return { proceed: true };
  }

  async act(action) {
    // Execute the action
    try {
      const result = await action.execute({}, this.worldState);
      return {
        action: action.name,
        success: true,
        result: result
      };
    } catch (error) {
      return {
        action: action.name,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get remaining goals not yet satisfied
   */
  getRemainingGoals(targetGoals) {
    const remaining = new Map();
    for (const [key, value] of targetGoals) {
      if (!this.worldState.has(key) || this.worldState.get(key) !== value) {
        remaining.set(key, value);
      }
    }
    return remaining;
  }

  /**
   * Load external tool or capability
   */
  async loadTool(toolName) {
    // This would load external tools/agents
    this.memory.set(`tool_${toolName}`, true);
  }

  /**
   * Export agent configuration
   */
  export() {
    return {
      name: this.name,
      description: this.description,
      worldState: Object.fromEntries(this.worldState),
      actions: this.actions.map(a => ({
        name: a.name,
        description: a.description,
        preconditions: Object.fromEntries(a.preconditions),
        effects: Object.fromEntries(a.effects),
        cost: a.cost
      })),
      goals: this.goals.map(g => ({
        name: g.name,
        description: g.description,
        targetState: Object.fromEntries(g.targetState),
        priority: g.priority
      }))
    };
  }
}

/**
 * Claude Flow Integration
 */
class ClaudeFlowGOAPAgent extends GoalOrientedAgent {
  constructor(config) {
    super(config);
    this.claudeFlowPath = config.claudeFlowPath || 'npx claude-flow@alpha';
  }

  /**
   * Create action that uses Claude Flow tools
   */
  createClaudeFlowAction(name, config) {
    return this.defineAction({
      name: name,
      description: config.description,
      preconditions: config.preconditions,
      effects: config.effects,
      cost: config.cost || 1,
      execute: async (params, worldState) => {
        const command = `${this.claudeFlowPath} ${config.command}`;
        return await this.executeCommand(command, params);
      }
    });
  }

  /**
   * Execute Claude Flow command
   */
  async executeCommand(command, params) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, [], { shell: true });
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${command}`));
        }
      });
      
      child.on('error', reject);
    });
  }
}

// Export for use in Claude Flow
export { GOAPPlanner, GoalOrientedAgent, ClaudeFlowGOAPAgent };

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const main = async () => {
    // Example usage
    const agent = new ClaudeFlowGOAPAgent({
      name: 'GOAP Demo',
      description: 'Goal-oriented planning demonstration'
    });
    
    // Define actions
    agent.defineAction({
      name: 'analyze_code',
      description: 'Analyze code for issues',
      preconditions: { has_code: true },
      effects: { code_analyzed: true },
      execute: async () => console.log('Analyzing code...')
    });
    
    agent.defineAction({
      name: 'fix_issues',
      description: 'Fix identified issues',
      preconditions: { code_analyzed: true },
      effects: { issues_fixed: true },
      execute: async () => console.log('Fixing issues...')
    });
    
    agent.defineAction({
      name: 'run_tests',
      description: 'Run test suite',
      preconditions: { issues_fixed: true },
      effects: { tests_passed: true },
      execute: async () => console.log('Running tests...')
    });
    
    // Define goal
    agent.defineGoal({
      name: 'code_ready',
      description: 'Code is ready for deployment',
      targetState: { tests_passed: true }
    });
    
    // Set initial state
    agent.setState({ has_code: true });
    
    // Execute
    const result = await agent.executeClosed({ goal: 'code_ready' });
    console.log('Execution result:', JSON.stringify(result, null, 2));
  };
  
  main().catch(console.error);
}