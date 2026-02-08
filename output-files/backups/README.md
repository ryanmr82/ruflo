# Claude Flow Output Directory


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

Check `manifest.log` for a history of all file operations.
