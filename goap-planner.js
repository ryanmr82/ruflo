/**
 * Goal-Oriented Action Planning (GOAP) System
 * Advanced AI planner with A* pathfinding and OODA loop execution monitoring
 */

class GOAPState {
    constructor(state = {}) {
        this.state = new Map(Object.entries(state));
    }

    clone() {
        return new GOAPState(Object.fromEntries(this.state));
    }

    get(key) {
        return this.state.get(key) || false;
    }

    set(key, value) {
        this.state.set(key, value);
    }

    satisfies(conditions) {
        return Object.entries(conditions).every(([key, value]) => 
            this.get(key) === value
        );
    }

    applyEffects(effects) {
        const newState = this.clone();
        Object.entries(effects).forEach(([key, value]) => {
            newState.set(key, value);
        });
        return newState;
    }

    getDistance(goalState) {
        let distance = 0;
        for (const [key, value] of goalState.state) {
            if (this.get(key) !== value) {
                distance++;
            }
        }
        return distance;
    }

    toString() {
        return JSON.stringify(Object.fromEntries(this.state), null, 2);
    }
}

class GOAPAction {
    constructor(name, preconditions = {}, effects = {}, cost = 1, executionType = 'code') {
        this.name = name;
        this.preconditions = preconditions;
        this.effects = effects;
        this.cost = cost;
        this.executionType = executionType; // 'code', 'llm', 'hybrid'
        this.tools = [];
        this.fallback = null;
    }

    isApplicable(state) {
        return state.satisfies(this.preconditions);
    }

    apply(state) {
        if (!this.isApplicable(state)) {
            throw new Error(`Action ${this.name} not applicable in current state`);
        }
        return state.applyEffects(this.effects);
    }

    async execute(context) {
        console.log(`🎯 Executing action: ${this.name} (${this.executionType})`);
        
        switch (this.executionType) {
            case 'code':
                return await this.executeCode(context);
            case 'llm':
                return await this.executeLLM(context);
            case 'hybrid':
                return await this.executeHybrid(context);
            default:
                throw new Error(`Unknown execution type: ${this.executionType}`);
        }
    }

    async executeCode(context) {
        // Deterministic code execution
        console.log(`  ⚙️  Code execution: ${this.name}`);
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
        return { success: true, type: 'code' };
    }

    async executeLLM(context) {
        // LLM-based reasoning
        console.log(`  🧠 LLM reasoning: ${this.name}`);
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate LLM call
        return { success: true, type: 'llm', insights: `Generated insights for ${this.name}` };
    }

    async executeHybrid(context) {
        // Combined LLM + code execution
        console.log(`  🔀 Hybrid execution: ${this.name}`);
        const llmResult = await this.executeLLM(context);
        const codeResult = await this.executeCode(context);
        return { success: true, type: 'hybrid', llm: llmResult, code: codeResult };
    }
}

class GOAPNode {
    constructor(state, action = null, parent = null, cost = 0) {
        this.state = state;
        this.action = action;
        this.parent = parent;
        this.cost = cost;
        this.heuristic = 0;
        this.totalCost = cost;
    }

    getPath() {
        const path = [];
        let current = this;
        while (current.parent) {
            path.unshift(current.action);
            current = current.parent;
        }
        return path;
    }
}

class GOAPPlanner {
    constructor() {
        this.actions = new Map();
        this.maxSearchDepth = 20;
    }

    addAction(action) {
        this.actions.set(action.name, action);
    }

    /**
     * A* pathfinding algorithm for optimal plan generation
     */
    generatePlan(currentState, goalState) {
        console.log('🔍 Starting A* pathfinding for optimal plan...');
        
        const openSet = [];
        const closedSet = new Set();
        
        const startNode = new GOAPNode(currentState);
        startNode.heuristic = currentState.getDistance(goalState);
        startNode.totalCost = startNode.heuristic;
        
        openSet.push(startNode);
        
        let iterations = 0;
        const maxIterations = 1000;
        
        while (openSet.length > 0 && iterations < maxIterations) {
            iterations++;
            
            // Sort by total cost (A* heuristic)
            openSet.sort((a, b) => a.totalCost - b.totalCost);
            const currentNode = openSet.shift();
            
            // Check if we've reached the goal
            if (currentNode.state.satisfies(Object.fromEntries(goalState.state))) {
                const plan = currentNode.getPath();
                console.log(`✅ Plan found in ${iterations} iterations with cost ${currentNode.cost}`);
                return plan;
            }
            
            const stateKey = currentNode.state.toString();
            if (closedSet.has(stateKey)) {
                continue;
            }
            closedSet.add(stateKey);
            
            // Explore applicable actions
            for (const action of this.actions.values()) {
                if (action.isApplicable(currentNode.state)) {
                    const newState = action.apply(currentNode.state);
                    const newCost = currentNode.cost + action.cost;
                    
                    if (newCost > this.maxSearchDepth) continue;
                    
                    const newNode = new GOAPNode(newState, action, currentNode, newCost);
                    newNode.heuristic = newState.getDistance(goalState);
                    newNode.totalCost = newCost + newNode.heuristic;
                    
                    openSet.push(newNode);
                }
            }
        }
        
        console.log('❌ No plan found');
        return null;
    }

    /**
     * Analyze plan quality and alternatives
     */
    analyzePlan(plan) {
        const totalCost = plan.reduce((sum, action) => sum + action.cost, 0);
        const executionTypes = plan.map(action => action.executionType);
        const parallelizable = this.findParallelizableActions(plan);
        
        return {
            totalCost,
            actionCount: plan.length,
            executionTypes,
            parallelizable,
            estimatedTime: this.estimateExecutionTime(plan)
        };
    }

    findParallelizableActions(plan) {
        const parallelGroups = [];
        let currentGroup = [];
        
        for (let i = 0; i < plan.length; i++) {
            const action = plan[i];
            const canParallelize = currentGroup.every(groupAction => 
                this.canRunInParallel(action, groupAction)
            );
            
            if (canParallelize && currentGroup.length < 3) {
                currentGroup.push(action);
            } else {
                if (currentGroup.length > 1) {
                    parallelGroups.push([...currentGroup]);
                }
                currentGroup = [action];
            }
        }
        
        if (currentGroup.length > 1) {
            parallelGroups.push(currentGroup);
        }
        
        return parallelGroups;
    }

    canRunInParallel(action1, action2) {
        // Check if actions have conflicting effects or dependencies
        const effects1 = Object.keys(action1.effects);
        const effects2 = Object.keys(action2.effects);
        const preconditions1 = Object.keys(action1.preconditions);
        const preconditions2 = Object.keys(action2.preconditions);
        
        // Can't run in parallel if one's effects conflict with other's preconditions
        return !effects1.some(key => preconditions2.includes(key)) &&
               !effects2.some(key => preconditions1.includes(key)) &&
               !effects1.some(key => effects2.includes(key));
    }

    estimateExecutionTime(plan) {
        const baseTime = {
            'code': 100,
            'llm': 200,
            'hybrid': 250
        };
        
        return plan.reduce((total, action) => 
            total + (baseTime[action.executionType] || 100), 0
        );
    }
}

class OODALoop {
    constructor(planner) {
        this.planner = planner;
        this.currentPlan = null;
        this.currentStep = 0;
        this.worldState = null;
        this.goalState = null;
        this.executionHistory = [];
        this.monitoring = false;
    }

    /**
     * OBSERVE: Monitor current state and execution progress
     */
    observe() {
        console.log('👁️  OBSERVE: Monitoring current state...');
        
        const observations = {
            currentState: this.worldState.clone(),
            planProgress: this.currentStep,
            totalSteps: this.currentPlan ? this.currentPlan.length : 0,
            lastAction: this.executionHistory[this.executionHistory.length - 1] || null,
            anomalies: this.detectAnomalies()
        };
        
        console.log(`  📊 Progress: ${this.currentStep}/${observations.totalSteps}`);
        return observations;
    }

    /**
     * ORIENT: Analyze changes and deviations from expected state
     */
    orient(observations) {
        console.log('🧭 ORIENT: Analyzing situation...');
        
        const analysis = {
            stateChanged: this.hasStateChangedUnexpectedly(observations),
            planValid: this.isPlanStillValid(),
            goalReachable: this.isGoalStillReachable(),
            needsReplanning: false
        };

        // Determine if replanning is needed
        analysis.needsReplanning = analysis.stateChanged || 
                                  !analysis.planValid || 
                                  !analysis.goalReachable ||
                                  observations.anomalies.length > 0;

        console.log(`  🔍 Analysis: ${JSON.stringify(analysis, null, 2)}`);
        return analysis;
    }

    /**
     * DECIDE: Determine if replanning is needed
     */
    decide(analysis) {
        console.log('🤔 DECIDE: Making execution decision...');
        
        const decision = {
            action: 'continue',
            reason: 'Plan execution proceeding normally'
        };

        if (analysis.needsReplanning) {
            decision.action = 'replan';
            decision.reason = 'Conditions changed, replanning required';
            console.log('  🔄 Decision: REPLAN NEEDED');
        } else if (this.currentStep >= this.currentPlan.length) {
            decision.action = 'complete';
            decision.reason = 'All actions completed';
            console.log('  ✅ Decision: PLAN COMPLETE');
        } else {
            console.log('  ➡️  Decision: CONTINUE EXECUTION');
        }

        return decision;
    }

    /**
     * ACT: Execute next action or trigger replanning
     */
    async act(decision) {
        console.log('⚡ ACT: Executing decision...');

        switch (decision.action) {
            case 'replan':
                await this.replan();
                break;
            case 'continue':
                await this.executeNextAction();
                break;
            case 'complete':
                console.log('🎉 Plan execution completed successfully!');
                this.monitoring = false;
                break;
        }
    }

    async executeNextAction() {
        if (this.currentStep >= this.currentPlan.length) {
            console.log('✅ All actions completed');
            return;
        }

        const action = this.currentPlan[this.currentStep];
        console.log(`\n🚀 Executing step ${this.currentStep + 1}/${this.currentPlan.length}: ${action.name}`);

        try {
            const result = await action.execute({ worldState: this.worldState });
            
            // Apply action effects to world state
            this.worldState = action.apply(this.worldState);
            
            this.executionHistory.push({
                step: this.currentStep,
                action: action.name,
                result,
                timestamp: new Date().toISOString()
            });

            this.currentStep++;
            console.log(`✅ Action completed: ${action.name}`);
            
        } catch (error) {
            console.log(`❌ Action failed: ${action.name} - ${error.message}`);
            this.executionHistory.push({
                step: this.currentStep,
                action: action.name,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async replan() {
        console.log('🔄 REPLANNING: Generating new plan from current state...');
        
        const newPlan = this.planner.generatePlan(this.worldState, this.goalState);
        
        if (newPlan) {
            this.currentPlan = newPlan;
            this.currentStep = 0;
            console.log(`📋 New plan generated with ${newPlan.length} actions`);
            
            // Log the plan change
            this.executionHistory.push({
                step: 'replan',
                action: 'plan_updated',
                newPlan: newPlan.map(a => a.name),
                timestamp: new Date().toISOString()
            });
        } else {
            console.log('❌ Unable to generate new plan');
            this.monitoring = false;
        }
    }

    detectAnomalies() {
        // Simple anomaly detection
        const anomalies = [];
        
        if (this.executionHistory.length > 0) {
            const lastExecution = this.executionHistory[this.executionHistory.length - 1];
            if (lastExecution.error) {
                anomalies.push(`Action failure: ${lastExecution.action}`);
            }
        }
        
        return anomalies;
    }

    hasStateChangedUnexpectedly(observations) {
        // Check if state has changed in ways not predicted by our plan
        if (this.currentStep === 0) return false;
        
        // For this demo, we'll simulate occasional unexpected changes
        return Math.random() < 0.1; // 10% chance of unexpected change
    }

    isPlanStillValid() {
        if (!this.currentPlan || this.currentStep >= this.currentPlan.length) {
            return false;
        }
        
        // Check if remaining actions are still applicable
        for (let i = this.currentStep; i < this.currentPlan.length; i++) {
            const action = this.currentPlan[i];
            if (!action.isApplicable(this.worldState)) {
                return false;
            }
        }
        
        return true;
    }

    isGoalStillReachable() {
        // Simple check - can we still reach the goal from current state
        const testPlan = this.planner.generatePlan(this.worldState, this.goalState);
        return testPlan !== null;
    }

    /**
     * Main OODA loop execution
     */
    async runOODALoop() {
        console.log('\n🔄 Starting OODA Loop execution monitoring...');
        this.monitoring = true;

        while (this.monitoring) {
            // OBSERVE
            const observations = this.observe();
            
            // ORIENT
            const analysis = this.orient(observations);
            
            // DECIDE
            const decision = this.decide(analysis);
            
            // ACT
            await this.act(decision);
            
            // Small delay between cycles
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n📊 Final Execution Summary:');
        console.log(`Total actions executed: ${this.executionHistory.length}`);
        console.log('Execution history:', this.executionHistory.map(h => ({
            step: h.step,
            action: h.action,
            success: !h.error
        })));
    }
}

export {
    GOAPState,
    GOAPAction,
    GOAPPlanner,
    OODALoop
};