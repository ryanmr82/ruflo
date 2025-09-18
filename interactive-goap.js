/**
 * Interactive GOAP Simulator
 * Allows real-time experimentation with GOAP planning
 */

import readline from 'readline';
import { GOAPState, GOAPAction, GOAPPlanner, OODALoop } from './goap-planner.js';

class InteractiveGOAP {
    constructor() {
        this.planner = new GOAPPlanner();
        this.currentState = new GOAPState();
        this.goalState = new GOAPState();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.setupDefaultActions();
    }

    setupDefaultActions() {
        // Basic development actions
        this.planner.addAction(new GOAPAction(
            'write_code',
            { requirements_defined: true },
            { code_written: true },
            3,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'write_tests',
            { code_written: true },
            { tests_written: true },
            2,
            'llm'
        ));

        this.planner.addAction(new GOAPAction(
            'run_tests',
            { tests_written: true },
            { tests_passed: true },
            1,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'deploy',
            { tests_passed: true },
            { deployed: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'define_requirements',
            {},
            { requirements_defined: true },
            1,
            'llm'
        ));
    }

    async showMenu() {
        console.log(`
╔════════════════════════════════════════════════════════════════════╗
║                    Interactive GOAP Simulator                     ║
╚════════════════════════════════════════════════════════════════════╝

Current State: ${JSON.stringify(Object.fromEntries(this.currentState.state))}
Goal State: ${JSON.stringify(Object.fromEntries(this.goalState.state))}

Available Commands:
1. set_state <key> <value>    - Set current state property
2. set_goal <key> <value>     - Set goal state property  
3. add_action                 - Add custom action
4. plan                       - Generate plan with A*
5. execute                    - Execute plan with OODA loop
6. reset                      - Reset to default state
7. show_actions              - List all available actions
8. load_scenario             - Load predefined scenario
9. help                      - Show this menu
10. exit                     - Exit simulator

Choose an option:`);
    }

    async askQuestion(question) {
        return new Promise((resolve) => {
            this.rl.question(question, resolve);
        });
    }

    async handleCommand(command) {
        const parts = command.trim().split(' ');
        const cmd = parts[0].toLowerCase();

        switch (cmd) {
            case '1':
            case 'set_state':
                await this.handleSetState(parts);
                break;
            case '2':
            case 'set_goal':
                await this.handleSetGoal(parts);
                break;
            case '3':
            case 'add_action':
                await this.handleAddAction();
                break;
            case '4':
            case 'plan':
                await this.handlePlan();
                break;
            case '5':
            case 'execute':
                await this.handleExecute();
                break;
            case '6':
            case 'reset':
                await this.handleReset();
                break;
            case '7':
            case 'show_actions':
                await this.handleShowActions();
                break;
            case '8':
            case 'load_scenario':
                await this.handleLoadScenario();
                break;
            case '9':
            case 'help':
                await this.showMenu();
                break;
            case '10':
            case 'exit':
                return false;
            default:
                console.log('Unknown command. Type "help" for options.');
        }
        return true;
    }

    async handleSetState(parts) {
        if (parts.length < 3) {
            console.log('Usage: set_state <key> <value>');
            return;
        }
        const key = parts[1];
        const value = parts[2] === 'true' ? true : parts[2] === 'false' ? false : parts[2];
        this.currentState.set(key, value);
        console.log(`✅ Set current state: ${key} = ${value}`);
    }

    async handleSetGoal(parts) {
        if (parts.length < 3) {
            console.log('Usage: set_goal <key> <value>');
            return;
        }
        const key = parts[1];
        const value = parts[2] === 'true' ? true : parts[2] === 'false' ? false : parts[2];
        this.goalState.set(key, value);
        console.log(`🎯 Set goal state: ${key} = ${value}`);
    }

    async handleAddAction() {
        console.log('\n🔧 Adding Custom Action');
        console.log('='.repeat(30));

        const name = await this.askQuestion('Action name: ');
        
        console.log('\nPreconditions (format: key=value, separated by commas):');
        const preCondInput = await this.askQuestion('Preconditions: ');
        const preconditions = this.parseConditions(preCondInput);

        console.log('\nEffects (format: key=value, separated by commas):');
        const effectsInput = await this.askQuestion('Effects: ');
        const effects = this.parseConditions(effectsInput);

        const cost = parseInt(await this.askQuestion('Cost (default 1): ')) || 1;
        
        console.log('\nExecution type:');
        console.log('1. code - Deterministic execution');
        console.log('2. llm - AI-powered reasoning');
        console.log('3. hybrid - Combined approach');
        const execChoice = await this.askQuestion('Choose (1-3): ');
        const execTypes = { '1': 'code', '2': 'llm', '3': 'hybrid' };
        const executionType = execTypes[execChoice] || 'code';

        const action = new GOAPAction(name, preconditions, effects, cost, executionType);
        this.planner.addAction(action);

        console.log(`✅ Added action: ${name} (${executionType}, cost: ${cost})`);
    }

    parseConditions(input) {
        const conditions = {};
        if (input.trim()) {
            input.split(',').forEach(pair => {
                const [key, value] = pair.trim().split('=');
                if (key && value !== undefined) {
                    conditions[key.trim()] = value.trim() === 'true' ? true : 
                                           value.trim() === 'false' ? false : value.trim();
                }
            });
        }
        return conditions;
    }

    async handlePlan() {
        console.log('\n🔍 Generating Plan with A* Pathfinding...');
        console.log('='.repeat(50));

        const plan = this.planner.generatePlan(this.currentState, this.goalState);

        if (!plan) {
            console.log('❌ No viable plan found!');
            console.log('Tips:');
            console.log('- Check if goal state is reachable from current state');
            console.log('- Ensure required preconditions are satisfied');
            console.log('- Add more actions to bridge the gap');
            return;
        }

        console.log(`✅ Plan generated with ${plan.length} actions:`);
        plan.forEach((action, index) => {
            console.log(`${index + 1}. ${action.name}`);
            console.log(`   Preconditions: ${JSON.stringify(action.preconditions)}`);
            console.log(`   Effects: ${JSON.stringify(action.effects)}`);
            console.log(`   Cost: ${action.cost}, Type: ${action.executionType}`);
        });

        const analysis = this.planner.analyzePlan(plan);
        console.log('\n📊 Plan Analysis:');
        console.log(`Total Cost: ${analysis.totalCost}`);
        console.log(`Estimated Time: ${analysis.estimatedTime}ms`);
        console.log(`Execution Types: ${analysis.executionTypes.join(', ')}`);

        this.lastPlan = plan;
    }

    async handleExecute() {
        if (!this.lastPlan) {
            console.log('❌ No plan available. Generate a plan first.');
            return;
        }

        console.log('\n⚡ Executing Plan with OODA Loop...');
        console.log('='.repeat(40));

        const oodaLoop = new OODALoop(this.planner);
        oodaLoop.currentPlan = this.lastPlan;
        oodaLoop.worldState = this.currentState.clone();
        oodaLoop.goalState = this.goalState;

        await oodaLoop.runOODALoop();

        // Update current state to final state
        this.currentState = oodaLoop.worldState;
        console.log(`\n📊 Execution completed. Final state:`);
        console.log(JSON.stringify(Object.fromEntries(this.currentState.state), null, 2));
    }

    async handleReset() {
        this.currentState = new GOAPState();
        this.goalState = new GOAPState();
        this.lastPlan = null;
        console.log('🔄 Reset to default state');
    }

    async handleShowActions() {
        console.log('\n🔧 Available Actions:');
        console.log('='.repeat(30));

        for (const [name, action] of this.planner.actions) {
            console.log(`\n${name} (${action.executionType}, cost: ${action.cost})`);
            console.log(`  Preconditions: ${JSON.stringify(action.preconditions)}`);
            console.log(`  Effects: ${JSON.stringify(action.effects)}`);
        }
    }

    async handleLoadScenario() {
        console.log('\n📋 Available Scenarios:');
        console.log('1. Simple Development - Basic code → test → deploy');
        console.log('2. Web Development - Full stack development');
        console.log('3. DevOps Pipeline - CI/CD deployment');
        console.log('4. Custom - Define your own');

        const choice = await this.askQuestion('Choose scenario (1-4): ');

        switch (choice) {
            case '1':
                this.loadSimpleDev();
                break;
            case '2':
                this.loadWebDev();
                break;
            case '3':
                this.loadDevOps();
                break;
            case '4':
                await this.loadCustom();
                break;
            default:
                console.log('Invalid choice');
        }
    }

    loadSimpleDev() {
        this.currentState = new GOAPState({ project_created: true });
        this.goalState = new GOAPState({ deployed: true });
        console.log('✅ Loaded Simple Development scenario');
    }

    loadWebDev() {
        this.currentState = new GOAPState({ 
            requirements_defined: true,
            database_designed: true 
        });
        this.goalState = new GOAPState({ 
            frontend_deployed: true,
            backend_deployed: true,
            database_migrated: true 
        });

        // Add web-specific actions
        this.planner.addAction(new GOAPAction(
            'build_frontend',
            { frontend_code_written: true },
            { frontend_built: true },
            2,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'build_backend',
            { backend_code_written: true },
            { backend_built: true },
            2,
            'code'
        ));

        console.log('✅ Loaded Web Development scenario');
    }

    loadDevOps() {
        this.currentState = new GOAPState({ 
            code_written: true,
            tests_written: true 
        });
        this.goalState = new GOAPState({ 
            production_deployed: true,
            monitoring_enabled: true,
            alerts_configured: true 
        });

        // Add DevOps actions
        this.planner.addAction(new GOAPAction(
            'setup_ci_cd',
            { code_written: true },
            { ci_cd_configured: true },
            3,
            'code'
        ));

        this.planner.addAction(new GOAPAction(
            'configure_monitoring',
            { deployed: true },
            { monitoring_enabled: true },
            2,
            'hybrid'
        ));

        console.log('✅ Loaded DevOps Pipeline scenario');
    }

    async loadCustom() {
        console.log('\n🛠️  Custom Scenario Setup');
        console.log('Define your initial and goal states...');

        const initialInput = await this.askQuestion('Initial state (key=value pairs, comma-separated): ');
        const goalInput = await this.askQuestion('Goal state (key=value pairs, comma-separated): ');

        this.currentState = new GOAPState(this.parseConditions(initialInput));
        this.goalState = new GOAPState(this.parseConditions(goalInput));

        console.log('✅ Loaded custom scenario');
    }

    async run() {
        console.log('🚀 Welcome to the Interactive GOAP Simulator!');
        
        let running = true;
        while (running) {
            await this.showMenu();
            const input = await this.askQuestion('\n> ');
            running = await this.handleCommand(input);
        }

        console.log('\n👋 Thanks for using the GOAP Simulator!');
        this.rl.close();
    }
}

// Export for use as module
export { InteractiveGOAP };

// Run if called directly
if (require.main === module) {
    const simulator = new InteractiveGOAP();
    simulator.run().catch(console.error);
}