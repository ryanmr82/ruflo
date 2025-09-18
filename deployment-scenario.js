/**
 * Practical GOAP Demonstration: Web Application Deployment
 * Shows real-world planning for complex deployment pipeline
 */

const { GOAPState, GOAPAction, GOAPPlanner, OODALoop } = require('./goap-planner');

class DeploymentScenario {
    constructor() {
        this.planner = new GOAPPlanner();
        this.setupActions();
    }

    setupActions() {
        // Code Analysis Actions
        this.planner.addAction(new GOAPAction(
            'analyze_codebase',
            { repository_cloned: true },
            { code_analyzed: true, complexity_known: true },
            2,
            'hybrid'
        ));

        this.planner.addAction(new GOAPAction(
            'clone_repository',
            { repository_url: true },
            { repository_cloned: true },
            1,
            'code'
        ));

        // Testing Actions
        this.planner.addAction(new GOAPAction(
            'write_unit_tests',
            { code_analyzed: true },
            { unit_tests_written: true },
            3,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'run_tests',
            { unit_tests_written: true, dependencies_installed: true },
            { tests_passed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'run_integration_tests',
            { tests_passed: true, database_ready: true },
            { integration_tests_passed: true },
            3,
            'code'
        ));

        // Dependency Management
        this.planner.addAction(new GOAPAction(
            'install_dependencies',
            { repository_cloned: true },
            { dependencies_installed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'security_audit',
            { dependencies_installed: true },
            { security_verified: true },
            2,
            'hybrid'
        ));

        // Database Actions
        this.planner.addAction(new GOAPAction(
            'setup_database',
            { database_config: true },
            { database_ready: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'run_migrations',
            { database_ready: true, tests_passed: true },
            { database_migrated: true },
            2,
            'code'
        ));

        // Build Actions
        this.planner.addAction(new GOAPAction(
            'build_application',
            { tests_passed: true, security_verified: true },
            { application_built: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'optimize_build',
            { application_built: true },
            { build_optimized: true },
            2,
            'hybrid'
        ));

        // Infrastructure Actions
        this.planner.addAction(new GOAPAction(
            'provision_infrastructure',
            { infrastructure_config: true },
            { infrastructure_ready: true },
            4,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'configure_load_balancer',
            { infrastructure_ready: true },
            { load_balancer_configured: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'setup_monitoring',
            { infrastructure_ready: true },
            { monitoring_configured: true },
            2,
            'hybrid'
        ));

        // Deployment Actions
        this.planner.addAction(new GOAPAction(
            'deploy_staging',
            { 
                application_built: true, 
                database_migrated: true,
                infrastructure_ready: true 
            },
            { staging_deployed: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'run_smoke_tests',
            { staging_deployed: true },
            { smoke_tests_passed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'deploy_production',
            { 
                smoke_tests_passed: true, 
                load_balancer_configured: true,
                monitoring_configured: true 
            },
            { production_deployed: true },
            4,
            'code'
        ));

        // Documentation and Validation
        this.planner.addAction(new GOAPAction(
            'generate_documentation',
            { code_analyzed: true, production_deployed: true },
            { documentation_complete: true },
            2,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'validate_deployment',
            { production_deployed: true },
            { deployment_validated: true },
            1,
            'hybrid'
        ));

        // Backup and Recovery
        this.planner.addAction(new GOAPAction(
            'setup_backups',
            { database_migrated: true, production_deployed: true },
            { backups_configured: true },
            2,
            'code'
        ));
    }

    createScenarios() {
        return {
            // Scenario 1: Fresh deployment from scratch
            fresh_deployment: {
                initial: new GOAPState({
                    repository_url: true,
                    database_config: true,
                    infrastructure_config: true
                }),
                goal: new GOAPState({
                    production_deployed: true,
                    deployment_validated: true,
                    documentation_complete: true,
                    backups_configured: true
                })
            },

            // Scenario 2: Quick fix deployment (some infrastructure exists)
            quick_fix: {
                initial: new GOAPState({
                    repository_cloned: true,
                    dependencies_installed: true,
                    infrastructure_ready: true,
                    database_ready: true,
                    database_migrated: true
                }),
                goal: new GOAPState({
                    production_deployed: true,
                    deployment_validated: true
                })
            },

            // Scenario 3: Security-focused deployment
            security_focused: {
                initial: new GOAPState({
                    repository_url: true,
                    database_config: true,
                    infrastructure_config: true
                }),
                goal: new GOAPState({
                    production_deployed: true,
                    security_verified: true,
                    deployment_validated: true,
                    monitoring_configured: true
                })
            }
        };
    }

    async demonstrateScenario(scenarioName, scenario) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🎯 GOAP Demonstration: ${scenarioName.toUpperCase()}`);
        console.log(`${'='.repeat(60)}`);

        console.log('\n📋 Initial State:');
        console.log(scenario.initial.toString());

        console.log('\n🎯 Goal State:');
        console.log(scenario.goal.toString());

        // Generate initial plan
        console.log('\n🔍 Generating optimal plan with A* pathfinding...');
        const plan = this.planner.generatePlan(scenario.initial, scenario.goal);

        if (!plan) {
            console.log('❌ No viable plan found!');
            return;
        }

        console.log('\n📋 Generated Plan:');
        plan.forEach((action, index) => {
            console.log(`${index + 1}. ${action.name} (${action.executionType}, cost: ${action.cost})`);
        });

        // Analyze plan
        const analysis = this.planner.analyzePlan(plan);
        console.log('\n📊 Plan Analysis:');
        console.log(`Total Cost: ${analysis.totalCost}`);
        console.log(`Action Count: ${analysis.actionCount}`);
        console.log(`Estimated Time: ${analysis.estimatedTime}ms`);
        console.log(`Execution Types: ${analysis.executionTypes.join(', ')}`);
        
        if (analysis.parallelizable.length > 0) {
            console.log('\n⚡ Parallelizable Action Groups:');
            analysis.parallelizable.forEach((group, index) => {
                console.log(`Group ${index + 1}: ${group.map(a => a.name).join(', ')}`);
            });
        }

        // Execute with OODA loop monitoring
        console.log('\n🔄 Starting OODA Loop Execution...');
        const oodaLoop = new OODALoop(this.planner);
        oodaLoop.currentPlan = plan;
        oodaLoop.worldState = scenario.initial.clone();
        oodaLoop.goalState = scenario.goal;

        await oodaLoop.runOODALoop();

        return {
            scenario: scenarioName,
            plan,
            analysis,
            executionHistory: oodaLoop.executionHistory
        };
    }

    async demonstrateAdaptiveReplanning() {
        console.log(`\n${'='.repeat(60)}`);
        console.log('🔄 ADAPTIVE REPLANNING DEMONSTRATION');
        console.log(`${'='.repeat(60)}`);

        const scenario = {
            initial: new GOAPState({
                repository_cloned: true,
                dependencies_installed: true
            }),
            goal: new GOAPState({
                production_deployed: true,
                deployment_validated: true
            })
        };

        console.log('\n📋 Starting with partial state...');
        let currentState = scenario.initial.clone();
        
        // Generate initial plan
        let plan = this.planner.generatePlan(currentState, scenario.goal);
        console.log('\n📋 Initial Plan:');
        plan.forEach((action, index) => {
            console.log(`${index + 1}. ${action.name}`);
        });

        // Simulate execution with mid-course changes
        console.log('\n🎭 Simulating execution with unexpected changes...');
        
        for (let step = 0; step < 3 && step < plan.length; step++) {
            const action = plan[step];
            console.log(`\n⚡ Executing: ${action.name}`);
            
            // Apply action effects
            currentState = action.apply(currentState);
            
            // Simulate unexpected state change
            if (step === 1) {
                console.log('🚨 UNEXPECTED CHANGE: Security vulnerability detected!');
                currentState.set('security_vulnerability_found', true);
                
                // Add new security action
                this.planner.addAction(new GOAPAction(
                    'patch_security_vulnerability',
                    { security_vulnerability_found: true },
                    { security_patched: true },
                    3,
                    'hybrid'
                ));
                
                // Update goal to include security patching
                scenario.goal.set('security_patched', true);
                
                console.log('🔄 Replanning to address security issue...');
                plan = this.planner.generatePlan(currentState, scenario.goal);
                
                console.log('\n📋 Updated Plan:');
                plan.forEach((action, index) => {
                    console.log(`${index + 1}. ${action.name}`);
                });
                
                break; // Exit simulation to show replanning
            }
        }

        console.log('\n✅ Adaptive replanning demonstration complete');
        console.log('Key insights:');
        console.log('- GOAP detected changed conditions');
        console.log('- Planner automatically incorporated new actions');
        console.log('- Goal state was updated to include security requirements');
        console.log('- New optimal plan was generated in real-time');
    }

    async demonstrateMixedExecution() {
        console.log(`\n${'='.repeat(60)}`);
        console.log('🔀 MIXED EXECUTION DEMONSTRATION');
        console.log(`${'='.repeat(60)}`);

        console.log('\n🧠 LLM Actions (Creative/Reasoning):');
        console.log('- write_unit_tests: Generate test cases based on code analysis');
        console.log('- generate_documentation: Create human-readable docs');

        console.log('\n⚙️  Code Actions (Deterministic):');
        console.log('- run_tests: Execute test suite and parse results');
        console.log('- deploy_production: Execute deployment scripts');

        console.log('\n🔀 Hybrid Actions (LLM + Code):');
        console.log('- analyze_codebase: LLM insights + static analysis');
        console.log('- security_audit: AI threat detection + tool scanning');
        console.log('- optimize_build: AI optimization + performance measurement');

        // Demonstrate execution type selection
        const testAction = new GOAPAction('demo_hybrid', {}, {}, 1, 'hybrid');
        const result = await testAction.execute({});
        
        console.log('\n📊 Hybrid Execution Result:');
        console.log(JSON.stringify(result, null, 2));

        console.log('\n💡 Mixed Execution Benefits:');
        console.log('- LLM actions provide creativity and reasoning');
        console.log('- Code actions ensure reliability and speed');
        console.log('- Hybrid actions combine best of both approaches');
        console.log('- System automatically selects optimal execution type');
    }

    async runFullDemonstration() {
        console.log('🚀 Starting Comprehensive GOAP Demonstration');
        console.log('=' .repeat(80));

        const scenarios = this.createScenarios();
        const results = [];

        // Run each scenario
        for (const [name, scenario] of Object.entries(scenarios)) {
            const result = await this.demonstrateScenario(name, scenario);
            results.push(result);
            
            // Small delay between scenarios
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Demonstrate advanced features
        await this.demonstrateAdaptiveReplanning();
        await this.demonstrateMixedExecution();

        console.log('\n📊 COMPREHENSIVE RESULTS SUMMARY');
        console.log('=' .repeat(50));
        
        results.forEach(result => {
            if (result) {
                console.log(`\n${result.scenario.toUpperCase()}:`);
                console.log(`- Plan steps: ${result.plan.length}`);
                console.log(`- Total cost: ${result.analysis.totalCost}`);
                console.log(`- Execution time: ${result.analysis.estimatedTime}ms`);
                console.log(`- Actions executed: ${result.executionHistory.length}`);
            }
        });

        console.log('\n🎯 GOAP System Capabilities Demonstrated:');
        console.log('✅ A* pathfinding for optimal plan generation');
        console.log('✅ OODA loop execution monitoring');
        console.log('✅ Multi-step plans with preconditions and effects');
        console.log('✅ Adaptive replanning when conditions change');
        console.log('✅ Mixed LLM + code execution capabilities');
        console.log('✅ Real-world deployment scenario planning');
        console.log('✅ Parallel action identification');
        console.log('✅ Cost optimization and plan analysis');

        return results;
    }
}

module.exports = { DeploymentScenario };