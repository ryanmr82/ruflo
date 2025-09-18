#!/usr/bin/env node

/**
 * Goal module initialization script
 * Can be run via: npx claude-flow goal init
 */

import('../dist/cli/commands/goal-init.js')
  .then(module => {
    const command = new module.default();
    const options = {};
    
    // Parse command line arguments
    if (process.argv.includes('--force')) {
      options.force = true;
    }
    
    const targetIndex = process.argv.indexOf('--target');
    if (targetIndex !== -1 && process.argv[targetIndex + 1]) {
      options.targetDir = process.argv[targetIndex + 1];
    }
    
    return command.execute(options);
  })
  .catch(error => {
    console.error('Failed to initialize goal module:', error);
    process.exit(1);
  });