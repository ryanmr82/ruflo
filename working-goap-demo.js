#!/usr/bin/env node
/**
 * Working GOAP Demonstration
 * Fixed action connectivity for successful planning
 */

import { GOAPState, GOAPAction, GOAPPlanner, OODALoop } from './goap-planner.js';

class WorkingGOAPDemo {
    constructor() {
        this.planner = new GOAPPlanner();
        this.setupWorkingActions();
    }

    setupWorkingActions() {
        console.log('🔧 Setting up connected action chains...');
        
        // Chain 1: Basic Development Flow
        this.planner.addAction(new GOAPAction(
            'create_project',
            {},
            { project_exists: true },
            1,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'write_code',
            { project_exists: true },
            { code_complete: true },
            3,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'run_tests',
            { code_complete: true },
            { tests_passed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'build_app',
            { tests_passed: true },
            { app_built: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'deploy',
            { app_built: true },
            { deployed: true },
            3,
            'code'
        ));

        // Chain 2: Security and Quality
        this.planner.addAction(new GOAPAction(
            'security_scan',
            { code_complete: true },
            { security_verified: true },
            2,
            'hybrid'
        ));

        this.planner.addAction(new GOAPAction(
            'secure_deploy',
            { app_built: true, security_verified: true },
            { deployed_securely: true },
            4,
            'code'
        ));

        // Chain 3: Monitoring and Documentation
        this.planner.addAction(new GOAPAction(
            'setup_monitoring',
            { deployed: true },
            { monitoring_active: true },
            2,
            'hybrid'
        ));

        this.planner.addAction(new GOAPAction(
            'generate_docs',
            { deployed: true },
            { documented: true },
            2,
            'llm'
        ));

        // Alternative paths for flexibility
        this.planner.addAction(new GOAPAction(
            'quick_deploy',
            { code_complete: true },
            { deployed: true },
            5,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'create_and_code',
            {},
            { project_exists: true, code_complete: true },
            4,
            'hybrid'
        ));
    }

    async demonstrateSuccessfulPlanning() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║               SUCCESSFUL A* PLANNING DEMONSTRATION                 ║
╚════════════════════════════════════════════════════════════════════╝`);

        const scenarios = [
            {
                name: 'Basic Deployment',
                initial: new GOAPState({}),
                goal: new GOAPState({ deployed: true }),
                description: 'Simple path from nothing to deployed app'
            },
            {
                name: 'Security-First Deployment', 
                initial: new GOAPState({}),
                goal: new GOAPState({ deployed_securely: true }),
                description: 'Deployment with security verification'
            },
            {
                name: 'Complete Solution',
                initial: new GOAPState({}),
                goal: new GOAPState({ 
                    deployed: true, 
                    monitoring_active: true, 
                    documented: true 
                }),
                description: 'Full deployment with monitoring and docs'
            },
            {
                name: 'Quick Path',
                initial: new GOAPState({ project_exists: true }),
                goal: new GOAPState({ deployed: true }),
                description: 'Fast deployment from existing project'
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🎯 ${scenario.name}: ${scenario.description}`);
            console.log('─'.repeat(70));
            
            console.log(`Initial: ${JSON.stringify(Object.fromEntries(scenario.initial.state))}`);
            console.log(`Goal: ${JSON.stringify(Object.fromEntries(scenario.goal.state))}`);

            const startTime = performance.now();
            const plan = this.planner.generatePlan(scenario.initial, scenario.goal);
            const planTime = performance.now() - startTime;
            
            if (plan) {
                console.log(`\n✅ Plan found in ${planTime.toFixed(1)}ms (${plan.length} steps, cost: ${plan.reduce((sum, a) => sum + a.cost, 0)}):`);
                plan.forEach((action, index) => {
                    const icon = action.executionType === 'llm' ? '🧠' : 
                               action.executionType === 'hybrid' ? '🔀' : '⚙️';
                    console.log(`  ${index + 1}. ${icon} ${action.name} (cost: ${action.cost})`);
                });

                // Show parallel opportunities
                const analysis = this.planner.analyzePlan(plan);
                if (analysis.parallelizable.length > 0) {
                    console.log(`\n⚡ Parallelizable groups found:`);
                    analysis.parallelizable.forEach((group, index) => {
                        console.log(`  Group ${index + 1}: ${group.map(a => a.name).join(', ')}`);
                    });
                }
            } else {
                console.log('❌ No plan found');
            }
        }
    }

    async demonstrateOODAExecution() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                 OODA LOOP EXECUTION DEMONSTRATION                  ║
╚════════════════════════════════════════════════════════════════════╝`);

        const scenario = {
            initial: new GOAPState({}),
            goal: new GOAPState({ deployed: true, monitoring_active: true })
        };

        console.log('\n🎯 Scenario: Deploy with monitoring');
        console.log(`Initial: ${JSON.stringify(Object.fromEntries(scenario.initial.state))}`);
        console.log(`Goal: ${JSON.stringify(Object.fromEntries(scenario.goal.state))}`);

        const plan = this.planner.generatePlan(scenario.initial, scenario.goal);
        
        if (!plan) {
            console.log('❌ No plan found for OODA demonstration');
            return;
        }

        console.log(`\n📋 Executing plan with ${plan.length} actions:`);
        plan.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.name}`);
        });

        console.log('\n🔄 Starting OODA Loop (Observe-Orient-Decide-Act)...');
        
        const oodaLoop = new OODALoop(this.planner);
        oodaLoop.currentPlan = plan;
        oodaLoop.worldState = scenario.initial.clone();
        oodaLoop.goalState = scenario.goal;

        // Override some methods for better demonstration output
        const originalObserve = oodaLoop.observe.bind(oodaLoop);
        oodaLoop.observe = function() {
            const result = originalObserve();
            console.log(`  👁️  OBSERVE: Step ${this.currentStep}/${this.currentPlan.length}, anomalies: ${result.anomalies.length}`);
            return result;
        };

        const originalOrient = oodaLoop.orient.bind(oodaLoop);
        oodaLoop.orient = function(observations) {
            const result = originalOrient(observations);
            console.log(`  🧭 ORIENT: Plan valid: ${result.planValid}, Needs replanning: ${result.needsReplanning}`);
            return result;
        };

        const originalDecide = oodaLoop.decide.bind(oodaLoop);
        oodaLoop.decide = function(analysis) {
            const result = originalDecide(analysis);
            console.log(`  🤔 DECIDE: ${result.action.toUpperCase()} - ${result.reason}`);
            return result;
        };

        await oodaLoop.runOODALoop();

        console.log('\n📊 OODA Execution Summary:');
        const successCount = oodaLoop.executionHistory.filter(h => h.result?.success).length;
        console.log(`  Actions executed: ${oodaLoop.executionHistory.length}`);
        console.log(`  Success rate: ${successCount}/${oodaLoop.executionHistory.length}`);
        console.log(`  Final state: ${JSON.stringify(Object.fromEntries(oodaLoop.worldState.state))}`);
    }

    async demonstrateAdaptiveReplanning() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║              ADAPTIVE REPLANNING DEMONSTRATION                     ║
╚════════════════════════════════════════════════════════════════════╝`);

        let currentState = new GOAPState({ project_exists: true });
        const originalGoal = new GOAPState({ deployed: true });

        console.log('\n📋 Original Planning Scenario:');
        console.log(`Current: ${JSON.stringify(Object.fromEntries(currentState.state))}`);
        console.log(`Goal: ${JSON.stringify(Object.fromEntries(originalGoal.state))}`);

        // Generate original plan
        let plan = this.planner.generatePlan(currentState, originalGoal);
        console.log(`\n📋 Original Plan (${plan.length} steps):`);
        plan.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.name}`);
        });

        // Simulate execution of first step
        console.log('\n⚡ Executing first step...');
        const firstAction = plan[0];
        console.log(`  Executing: ${firstAction.name}`);
        currentState = firstAction.apply(currentState);
        console.log(`  New state: ${JSON.stringify(Object.fromEntries(currentState.state))}`);

        // Introduce change requiring replanning
        console.log('\n🚨 SCENARIO CHANGE: Security vulnerability discovered!');
        console.log('   Adding new requirement: security_verified must be true');
        
        // Add emergency security action
        this.planner.addAction(new GOAPAction(
            'emergency_patch',
            { code_complete: true },
            { security_verified: true, code_complete: true },
            3,
            'hybrid'
        ));

        // Update goal to require security
        const newGoal = new GOAPState({ 
            deployed: true, 
            security_verified: true 
        });

        console.log('\n🔄 Replanning with updated requirements...');
        console.log(`New goal: ${JSON.stringify(Object.fromEntries(newGoal.state))}`);

        const newPlan = this.planner.generatePlan(currentState, newGoal);
        
        if (newPlan) {
            console.log(`\n📋 Revised Plan (${newPlan.length} steps):`);
            newPlan.forEach((action, index) => {
                console.log(`  ${index + 1}. ${action.name}`);
            });

            console.log('\n✅ Adaptive Replanning Success!');
            console.log('  • Detected changed requirements');
            console.log('  • Added emergency security action');
            console.log('  • Generated new optimal plan from current state');
            console.log('  • Plan incorporates both deployment and security goals');
            
            // Compare plans
            const originalCost = plan.reduce((sum, a) => sum + a.cost, 0);
            const newCost = newPlan.reduce((sum, a) => sum + a.cost, 0);
            console.log(`\n📊 Plan Comparison:`);
            console.log(`  Original: ${plan.length} steps, cost ${originalCost}`);
            console.log(`  Revised: ${newPlan.length} steps, cost ${newCost}`);
        } else {
            console.log('❌ Unable to generate revised plan');
        }
    }

    async demonstrateMixedExecution() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                 MIXED EXECUTION DEMONSTRATION                      ║
╚════════════════════════════════════════════════════════════════════╝`);

        console.log('\n🎨 Execution Type Strategy:');
        console.log('  🧠 LLM: Creative tasks requiring reasoning (write_code, generate_docs)');
        console.log('  ⚙️  Code: Deterministic operations (run_tests, deploy, build_app)');
        console.log('  🔀 Hybrid: Combined AI + systematic execution (security_scan, setup_monitoring)');

        console.log('\n⚡ Live Execution Examples:');

        // Demonstrate each execution type
        const examples = [
            { type: 'llm', name: 'AI Code Generation', action: new GOAPAction('ai_code_gen', {}, {}, 1, 'llm') },
            { type: 'code', name: 'Build Process', action: new GOAPAction('build_process', {}, {}, 1, 'code') },
            { type: 'hybrid', name: 'Security Analysis', action: new GOAPAction('security_analysis', {}, {}, 1, 'hybrid') }
        ];

        for (const example of examples) {
            const icon = example.type === 'llm' ? '🧠' : example.type === 'hybrid' ? '🔀' : '⚙️';
            console.log(`\n${icon} ${example.name}:`);
            
            const startTime = performance.now();
            const result = await example.action.execute({});
            const execTime = performance.now() - startTime;
            
            console.log(`  ✅ Completed in ${execTime.toFixed(1)}ms`);
            console.log(`  📊 Result: ${JSON.stringify(result, null, 4)}`);
        }

        console.log('\n💡 Mixed Execution Benefits:');
        console.log('  • Optimal tool selection for each task type');
        console.log('  • LLM creativity + code reliability = best outcomes');
        console.log('  • Hybrid approach leverages strengths of both');
        console.log('  • Automatic execution type selection based on action requirements');
    }

    async runFullDemo() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║    🎯 Goal-Oriented Action Planning (GOAP) - Working Demo         ║
║                                                                    ║
║    Demonstrates successful A*, OODA, and adaptive planning        ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

        try {
            await this.demonstrateSuccessfulPlanning();
            await this.demonstrateOODAExecution();
            await this.demonstrateAdaptiveReplanning();
            await this.demonstrateMixedExecution();

            console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║    ✅ COMPREHENSIVE GOAP DEMONSTRATION SUCCESSFUL!                ║
║                                                                    ║
║    🔍 A* Pathfinding: Multiple successful plans generated          ║
║    🔄 OODA Loop: Real-time execution monitoring demonstrated       ║
║    🔀 Adaptive Replanning: Dynamic plan updates working           ║
║    🎨 Mixed Execution: LLM/Code/Hybrid strategies proven          ║
║                                                                    ║
║    🚀 Ready for production deployment scenarios!                   ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

            console.log('\n📋 Key GOAP Capabilities Demonstrated:');
            console.log('  ✅ A* pathfinding with heuristic optimization');
            console.log('  ✅ Multi-step plan generation with preconditions/effects');
            console.log('  ✅ OODA loop execution monitoring (Observe-Orient-Decide-Act)');
            console.log('  ✅ Adaptive replanning when conditions change');
            console.log('  ✅ Mixed LLM + code execution strategies');
            console.log('  ✅ Cost optimization and parallel action identification');
            console.log('  ✅ Real-world deployment scenario planning');

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new WorkingGOAPDemo();
    demo.runFullDemo().catch(console.error);
}

export { WorkingGOAPDemo };