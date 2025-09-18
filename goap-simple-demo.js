#!/usr/bin/env node
/**
 * Simplified GOAP Demonstration with Connected Actions
 * Focuses on demonstrating core GOAP concepts clearly
 */

import { GOAPState, GOAPAction, GOAPPlanner, OODALoop } from './goap-planner.js';

class SimpleGOAPDemo {
    constructor() {
        this.planner = new GOAPPlanner();
        this.setupConnectedActions();
    }

    setupConnectedActions() {
        // Simple, well-connected action chain for web development
        
        // Foundation actions
        this.planner.addAction(new GOAPAction(
            'setup_project',
            {},
            { project_setup: true },
            1,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'install_dependencies',
            { project_setup: true },
            { dependencies_ready: true },
            2,
            'code'
        ));

        // Development actions
        this.planner.addAction(new GOAPAction(
            'write_backend',
            { dependencies_ready: true },
            { backend_complete: true },
            4,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'write_frontend',
            { dependencies_ready: true },
            { frontend_complete: true },
            4,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'write_tests',
            { backend_complete: true, frontend_complete: true },
            { tests_complete: true },
            3,
            'llm'
        ));

        // Quality assurance
        this.planner.addAction(new GOAPAction(
            'run_tests',
            { tests_complete: true },
            { tests_passed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'security_scan',
            { backend_complete: true, frontend_complete: true },
            { security_verified: true },
            2,
            'hybrid'
        ));

        // Build and deployment preparation  
        this.planner.addAction(new GOAPAction(
            'build_app',
            { tests_passed: true, security_verified: true },
            { app_built: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'setup_infrastructure',
            { app_built: true },
            { infrastructure_ready: true },
            4,
            'code'
        ));

        // Deployment actions
        this.planner.addAction(new GOAPAction(
            'deploy_staging',
            { app_built: true, infrastructure_ready: true },
            { staging_deployed: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'test_staging',
            { staging_deployed: true },
            { staging_validated: true },
            2,
            'hybrid'
        ));

        this.planner.addAction(new GOAPAction(
            'deploy_production',
            { staging_validated: true },
            { production_deployed: true },
            4,
            'code'
        ));

        // Post-deployment
        this.planner.addAction(new GOAPAction(
            'setup_monitoring',
            { production_deployed: true },
            { monitoring_active: true },
            2,
            'hybrid'
        ));

        this.planner.addAction(new GOAPAction(
            'generate_docs',
            { production_deployed: true },
            { documentation_complete: true },
            2,
            'llm'
        ));
    }

    async demonstrateAStarPlanning() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    A* PATHFINDING DEMONSTRATION                    ║
╚════════════════════════════════════════════════════════════════════╝`);

        const scenarios = [
            {
                name: 'Fresh Project',
                initial: new GOAPState({}),
                goal: new GOAPState({ production_deployed: true })
            },
            {
                name: 'Quick Deployment',
                initial: new GOAPState({ 
                    project_setup: true, 
                    dependencies_ready: true,
                    backend_complete: true,
                    frontend_complete: true 
                }),
                goal: new GOAPState({ production_deployed: true })
            },
            {
                name: 'Security-First Deployment',
                initial: new GOAPState({ project_setup: true }),
                goal: new GOAPState({ 
                    production_deployed: true,
                    security_verified: true,
                    monitoring_active: true 
                })
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n🎯 Scenario: ${scenario.name}`);
            console.log('─'.repeat(50));
            
            console.log('\n📋 Initial State:', Object.fromEntries(scenario.initial.state));
            console.log('🎯 Goal State:', Object.fromEntries(scenario.goal.state));

            const plan = this.planner.generatePlan(scenario.initial, scenario.goal);
            
            if (plan) {
                console.log(`\n✅ Optimal Plan (${plan.length} steps):`);
                plan.forEach((action, index) => {
                    console.log(`  ${index + 1}. ${action.name} (${action.executionType}, cost: ${action.cost})`);
                });

                const analysis = this.planner.analyzePlan(plan);
                console.log(`\n📊 Plan Analysis:`);
                console.log(`  Total Cost: ${analysis.totalCost}`);
                console.log(`  Estimated Time: ${analysis.estimatedTime}ms`);
                console.log(`  Execution Types: ${[...new Set(analysis.executionTypes)].join(', ')}`);

                if (analysis.parallelizable.length > 0) {
                    console.log(`\n⚡ Parallelizable Groups:`);
                    analysis.parallelizable.forEach((group, index) => {
                        console.log(`  Group ${index + 1}: ${group.map(a => a.name).join(', ')}`);
                    });
                }
            } else {
                console.log('❌ No viable plan found');
            }
        }
    }

    async demonstrateOODALoop() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                     OODA LOOP DEMONSTRATION                        ║
╚════════════════════════════════════════════════════════════════════╝`);

        const scenario = {
            initial: new GOAPState({ project_setup: true }),
            goal: new GOAPState({ 
                production_deployed: true,
                monitoring_active: true 
            })
        };

        console.log('\n📋 Scenario: Complete deployment with monitoring');
        console.log('Initial State:', Object.fromEntries(scenario.initial.state));
        console.log('Goal State:', Object.fromEntries(scenario.goal.state));

        const plan = this.planner.generatePlan(scenario.initial, scenario.goal);
        
        if (!plan) {
            console.log('❌ No plan found for OODA demonstration');
            return;
        }

        console.log(`\n📋 Generated Plan (${plan.length} actions):`);
        plan.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.name}`);
        });

        console.log('\n🔄 Starting OODA Loop Execution...');
        const oodaLoop = new OODALoop(this.planner);
        oodaLoop.currentPlan = plan;
        oodaLoop.worldState = scenario.initial.clone();
        oodaLoop.goalState = scenario.goal;

        await oodaLoop.runOODALoop();

        console.log('\n📊 OODA Loop Results:');
        console.log(`Actions Executed: ${oodaLoop.executionHistory.length}`);
        console.log('Execution Summary:');
        oodaLoop.executionHistory.forEach(entry => {
            if (entry.action && entry.action !== 'plan_updated') {
                console.log(`  ✅ ${entry.action} - ${entry.result?.success ? 'Success' : 'Failed'}`);
            }
        });
    }

    async demonstrateAdaptiveReplanning() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                 ADAPTIVE REPLANNING DEMONSTRATION                  ║
╚════════════════════════════════════════════════════════════════════╝`);

        let currentState = new GOAPState({ 
            project_setup: true, 
            dependencies_ready: true 
        });
        const goalState = new GOAPState({ production_deployed: true });

        console.log('\n📋 Initial Scenario:');
        console.log('Current State:', Object.fromEntries(currentState.state));
        console.log('Goal State:', Object.fromEntries(goalState.state));

        // Generate initial plan
        let plan = this.planner.generatePlan(currentState, goalState);
        console.log(`\n📋 Original Plan (${plan.length} steps):`);
        plan.forEach((action, index) => {
            console.log(`  ${index + 1}. ${action.name}`);
        });

        // Simulate some execution
        console.log('\n⚡ Executing first few steps...');
        for (let i = 0; i < 2 && i < plan.length; i++) {
            const action = plan[i];
            console.log(`  Executing: ${action.name}`);
            currentState = action.apply(currentState);
        }

        // Introduce unexpected change
        console.log('\n🚨 UNEXPECTED EVENT: Security vulnerability discovered!');
        currentState.set('security_breach_detected', true);

        // Add emergency security action
        this.planner.addAction(new GOAPAction(
            'emergency_security_patch',
            { security_breach_detected: true },
            { security_patched: true, security_verified: true },
            5,
            'hybrid'
        ));

        // Update goal to include security patching
        goalState.set('security_patched', true);

        console.log('\n🔄 Replanning with new constraints...');
        const newPlan = this.planner.generatePlan(currentState, goalState);
        
        if (newPlan) {
            console.log(`\n📋 Revised Plan (${newPlan.length} steps):`);
            newPlan.forEach((action, index) => {
                console.log(`  ${index + 1}. ${action.name}`);
            });

            console.log('\n✅ Adaptive Replanning Success!');
            console.log('Key Achievements:');
            console.log('  • Detected changed conditions');
            console.log('  • Added emergency security action');
            console.log('  • Updated goal requirements');
            console.log('  • Generated new optimal plan');
        } else {
            console.log('❌ Unable to replan');
        }
    }

    async demonstrateMixedExecution() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                  MIXED EXECUTION DEMONSTRATION                     ║
╚════════════════════════════════════════════════════════════════════╝`);

        console.log('\n🎨 Execution Type Examples:');
        
        // LLM execution example
        console.log('\n🧠 LLM Execution (Creative/Reasoning):');
        const llmAction = new GOAPAction('design_api', {}, {}, 1, 'llm');
        const llmResult = await llmAction.execute({});
        console.log(`  Result: ${JSON.stringify(llmResult, null, 2)}`);

        // Code execution example  
        console.log('\n⚙️ Code Execution (Deterministic):');
        const codeAction = new GOAPAction('run_build', {}, {}, 1, 'code');
        const codeResult = await codeAction.execute({});
        console.log(`  Result: ${JSON.stringify(codeResult, null, 2)}`);

        // Hybrid execution example
        console.log('\n🔀 Hybrid Execution (LLM + Code):');
        const hybridAction = new GOAPAction('optimize_performance', {}, {}, 1, 'hybrid');
        const hybridResult = await hybridAction.execute({});
        console.log(`  Result: ${JSON.stringify(hybridResult, null, 2)}`);

        console.log('\n💡 Mixed Execution Benefits:');
        console.log('  • LLM actions provide creativity and complex reasoning');
        console.log('  • Code actions ensure reliability and deterministic results');
        console.log('  • Hybrid actions combine AI insights with systematic execution');
        console.log('  • Optimal execution type selected based on action requirements');
    }

    async runFullDemo() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║    🎯 Goal-Oriented Action Planning (GOAP) System Demo            ║
║                                                                    ║
║    Advanced AI Planner with A* Pathfinding & OODA Loop            ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

        try {
            await this.demonstrateAStarPlanning();
            await this.demonstrateOODALoop();
            await this.demonstrateAdaptiveReplanning();
            await this.demonstrateMixedExecution();

            console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║    ✅ GOAP DEMONSTRATION COMPLETE!                                 ║
║                                                                    ║
║    🎯 A* Pathfinding: Optimal plan generation demonstrated         ║
║    🔄 OODA Loop: Real-time execution monitoring shown              ║
║    🔀 Adaptive Replanning: Dynamic plan updates proven            ║
║    🎨 Mixed Execution: LLM/Code/Hybrid strategies showcased       ║
║                                                                    ║
║    Ready for real-world deployment scenarios!                     ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
`);

        } catch (error) {
            console.error('❌ Demo failed:', error.message);
            throw error;
        }
    }
}

// Run demo
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new SimpleGOAPDemo();
    demo.runFullDemo().catch(console.error);
}

export { SimpleGOAPDemo };