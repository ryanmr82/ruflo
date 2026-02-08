import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Claude Flow Output Directory Configuration
 * This script configures Claude Flow to use the specified output directory
 */

// Configuration
const CONFIG = {
  outputDir: 'C:\\Claude-Flow\\output-files',
  subdirs: {
    'generated-code': ['.js', '.ts', '.py', '.java', '.cpp', '.c', '.h', '.go', '.rs', '.jsx', '.tsx'],
    'reports': ['.md', '.txt', '.pdf', '.doc', '.docx'],
    'data': ['.json', '.xml', '.csv', '.xlsx', '.xls', '.yaml', '.yml'],
    'temp': ['*'],  // Default for unmatched extensions
    'backups': [],
    'swarm-outputs': [],
    'hive-outputs': []
  }
};

// Ensure output directory exists
function ensureDirectories() {
  // Create main output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`✓ Created output directory: ${CONFIG.outputDir}`);
  }

  // Create subdirectories
  Object.keys(CONFIG.subdirs).forEach(subdir => {
    const dirPath = path.join(CONFIG.outputDir, subdir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`  ✓ Created: ${subdir}/`);
    }
  });
}

// Create README in output directory
function createReadme() {
  const readmePath = path.join(CONFIG.outputDir, 'README.md');
  const readmeContent = `# Claude Flow Output Directory

This directory contains all output files  Flow operations.

## Directory Structure

- **generated-code/** - Generated source code files
- **reports/** - Documentation and reports
- **data/** - Data files (JSON, CSV, XML, etc.)
- **temp/** - Temporary files and scratch work
- **backups/** - Automatic backups of modified files
- **swarm-outputs/** - Outputs from swarm operations
- **hive-outputs/** - Outputs from hive mind operations

## Configuration

Claude Flow is configured to:
1. **Default Output**: All generated files go here by default
2. **External Writes**: Can still write to other locations when explicitly specified
3. **Automatic Backups**: Creates backups before modifying existing files

## Usage

When Claude Flow creates files without an explicit path, they will automatically be saved here in the appropriate subdirectory based on file type.

To work on files in a specific location, simply provide the full path when instructing Claude Flow.

## Manifest

Check \`manifest.log\` for a history of all file operations.
`;

  fs.writeFileSync(readmePath, readmeContent);
  console.log(`✓ Created README.md in output directory`);
}

// Update Claude Flow configuration
function updateConfig() {
  const configPath = path.join(__dirname, '..', '.claude', 'config.json');
  let config = {};

  // Read existing config if it exists
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  // Add output directory configuration
  config.output = {
    defaultDirectory: CONFIG.outputDir,
    enforceDefault: true,
    allowExternalWrites: true,
    createBackups: true,
    subdirectories: CONFIG.subdirs
  };

  // Write updated config
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`✓ Updated Claude Flow configuration`);
}

// Main execution
console.log('🔧 Configuring Claude Flow Output Directory');
console.log('============================================\n');

ensureDirectories();
createReadme();
updateConfig();

console.log('\n✅ Configuration Complete!');
console.log(`Output directory: ${CONFIG.outputDir}`);
console.log('\nClaude Flow will now:');
console.log('• Save generated files to the output-files directory by default');
console.log('• Organize files by type into subdirectories');
console.log('• Create backups before modifying existing files');
console.log('• Still allow writing to other locations when explicitly specified');
