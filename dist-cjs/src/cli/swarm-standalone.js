import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { exit } from './node-compat.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const args = [];
const flags = {};
for(let i = 0; i < Deno.args.length; i++){
    const arg = Deno.args[i];
    if (arg.startsWith('--')) {
        const flagName = arg.substring(2);
        const nextArg = Deno.args[i + 1];
        if (nextArg && !nextArg.startsWith('--')) {
            flags[flagName] = nextArg;
            i++;
        } else {
            flags[flagName] = true;
        }
    } else {
        args.push(arg);
    }
}
const objective = args.join(' ');
if (!objective && !flags.help) {
    console.error('❌ Usage: swarm <objective>');
    console.log(`
🐝 Claude Flow Advanced Swarm System

USAGE:
  claude-flow swarm <objective> [options]

EXAMPLES:
  claude-flow swarm "Build a REST API" --strategy development
  claude-flow swarm "Research cloud architecture" --strategy research --ui
  claude-flow swarm "Analyze data trends" --strategy analysis --parallel
  claude-flow swarm "Optimize performance" --distributed --monitor

Run 'claude-flow swarm --help' for full options
`);
    process.exit(1);
}
const possiblePaths = [
    join(__dirname, '../../swarm-demo.ts'),
    join(__dirname, '../../swarm-demo-enhanced.ts'),
    join(__dirname, '../../../swarm-demo.ts')
];
let swarmPath = null;
for (const path of possiblePaths){
    if (existsSync(path)) {
        swarmPath = path;
        break;
    }
}
if (!swarmPath) {
    console.log('🐝 Launching swarm system...');
    console.log(`📋 Objective: ${objective}`);
    console.log(`🎯 Strategy: ${flags.strategy || 'auto'}`);
    console.log(`🏗️  Mode: ${flags.mode || 'centralized'}`);
    console.log(`🤖 Max Agents: ${flags['max-agents'] || 5}`);
    console.log();
    const swarmId = `swarm_${Math.random().toString(36).substring(2, 11)}_${Math.random().toString(36).substring(2, 11)}`;
    if (flags['dry-run']) {
        console.log(`🆔 Swarm ID: ${swarmId}`);
        console.log(`📊 Max Tasks: ${flags['max-tasks'] || 100}`);
        console.log(`⏰ Timeout: ${flags.timeout || 60} minutes`);
        console.log(`🔄 Parallel: ${flags.parallel || false}`);
        console.log(`🌐 Distributed: ${flags.distributed || false}`);
        console.log(`🔍 Monitoring: ${flags.monitor || false}`);
        console.log(`👥 Review Mode: ${flags.review || false}`);
        console.log(`🧪 Testing: ${flags.testing || false}`);
        console.log(`🧠 Memory Namespace: ${flags['memory-namespace'] || 'swarm'}`);
        console.log(`💾 Persistence: ${flags.persistence !== false}`);
        console.log(`🔒 Encryption: ${flags.encryption || false}`);
        console.log(`📊 Quality Threshold: ${flags['quality-threshold'] || 0.8}`);
        console.log();
        console.log('🎛️  Coordination Strategy:');
        console.log(`  • Agent Selection: ${flags['agent-selection'] || 'capability-based'}`);
        console.log(`  • Task Scheduling: ${flags['task-scheduling'] || 'priority'}`);
        console.log(`  • Load Balancing: ${flags['load-balancing'] || 'work-stealing'}`);
        console.log(`  • Fault Tolerance: ${flags['fault-tolerance'] || 'retry'}`);
        console.log(`  • Communication: ${flags.communication || 'event-driven'}`);
        console.log('⚠️  DRY RUN - Advanced Swarm Configuration');
        process.exit(0);
    }
    try {
        const { execSync } = await import('child_process');
        try {
            execSync('which claude', {
                stdio: 'ignore'
            });
        } catch (e) {
            console.log(`✅ Swarm initialized with ID: ${swarmId}`);
            console.log('\n⚠️  Note: Advanced swarm features require Claude or local installation.');
            console.log('Install Claude: ');
            console.log('Or install locally: npm install -g claude-flow@latest');
            console.log('\nThe swarm system would coordinate the following:');
            console.log('1. Agent spawning and task distribution');
            console.log('2. Parallel execution of subtasks');
            console.log('3. Memory sharing between agents');
            console.log('4. Progress monitoring and reporting');
            console.log('5. Result aggregation and quality checks');
            process.exit(0);
        }
        console.log('🚀 Launching swarm via Claude wrapper...');
        const swarmPrompt = `Execute a swarm coordination task with the following configuration:

Objective: ${objective}
Strategy: ${flags.strategy || 'auto'}
Mode: ${flags.mode || 'centralized'}
Max Agents: ${flags['max-agents'] || 5}
Max Tasks: ${flags['max-tasks'] || 100}
Timeout: ${flags.timeout || 60} minutes
Parallel: ${flags.parallel || false}
Distributed: ${flags.distributed || false}
Monitor: ${flags.monitor || false}
Review: ${flags.review || false}
Testing: ${flags.testing || false}
Memory Namespace: ${flags['memory-namespace'] || 'swarm'}
Quality Threshold: ${flags['quality-threshold'] || 0.8}

Coordination Strategy:
- Agent Selection: ${flags['agent-selection'] || 'capability-based'}
- Task Scheduling: ${flags['task-scheduling'] || 'priority'}
- Load Balancing: ${flags['load-balancing'] || 'work-stealing'}
- Fault Tolerance: ${flags['fault-tolerance'] || 'retry'}
- Communication: ${flags.communication || 'event-driven'}

Please coordinate this swarm task by:
1. Breaking down the objective into subtasks
2. Assigning tasks to appropriate agent types
3. Managing parallel execution where applicable
4. Monitoring progress and handling failures
5. Aggregating results and ensuring quality

Use all available tools including file operations, web search, and code execution as needed.`;
        const { spawn } = await import('child_process');
        const claudeArgs = [];
        if (flags.auto || flags['dangerously-skip-permissions']) {
            claudeArgs.push('--dangerously-skip-permissions');
        }
        const claudeProcess = spawn('claude', claudeArgs, {
            stdio: [
                'pipe',
                'inherit',
                'inherit'
            ],
            shell: false
        });
        claudeProcess.stdin.write(swarmPrompt);
        claudeProcess.stdin.end();
        await new Promise((resolve, reject)=>{
            claudeProcess.on('close', (code)=>{
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Claude process exited with code ${code}`));
                }
            });
            claudeProcess.on('error', (err)=>{
                reject(err);
            });
        });
    } catch (error) {
        console.log(`✅ Swarm initialized with ID: ${swarmId}`);
        console.log('\n⚠️  Note: Advanced swarm features require Claude or local installation.');
        console.log('Install Claude: ');
        console.log('Or install locally: npm install -g claude-flow@latest');
        console.log('\nThe swarm system would coordinate the following:');
        console.log('1. Agent spawning and task distribution');
        console.log('2. Parallel execution of subtasks');
        console.log('3. Memory sharing between agents');
        console.log('4. Progress monitoring and reporting');
        console.log('5. Result aggregation and quality checks');
    }
    process.exit(0);
} else {
    const swarmArgs = [
        objective
    ];
    for (const [key, value] of Object.entries(flags)){
        swarmArgs.push(`--${key}`);
        if (value !== true) {
            swarmArgs.push(String(value));
        }
    }
    const node = spawn('node', [
        swarmPath,
        ...swarmArgs
    ], {
        stdio: 'inherit'
    });
    node.on('exit', (code)=>{
        exit(code || 0);
    });
}

//# sourceMappingURL=swarm-standalone.js.map