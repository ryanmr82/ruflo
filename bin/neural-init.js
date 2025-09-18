#!/usr/bin/env node

/**
 * Neural module initialization script
 * Can be run via: npx claude-flow neural init
 */

import('../dist/cli/commands/neural-init.js')
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
    console.error('Failed to initialize neural module:', error);
    process.exit(1);
  });