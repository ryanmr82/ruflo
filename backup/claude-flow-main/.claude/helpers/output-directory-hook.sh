#!/bin/bash
# Claude Flow Output Directory Hook
# This hook ensures files are created in the correct output directory

# Configuration
OUTPUT_DIR="C:/Claude-Flow/output-files"
BACKUP_DIR="C:/Claude-Flow/output-files/backups"

# Function to determine if path is external
is_external_path() {
    local path="$1"
    # Check if path is absolute and outside Claude-Flow
    if [[ "$path" = /* ]] || [[ "$path" = C:* ]] || [[ "$path" = D:* ]]; then
        if [[ ! "$path" =~ "Claude-Flow" ]]; then
            return 0  # Is external
        fi
    fi
    return 1  # Is internal or relative
}

# Function to create backup
create_backup() {
    local file="$1"
    if [ -f "$file" ]; then
        local filename=$(basename "$file")
        local timestamp=$(date +%Y%m%d-%H%M%S)
        local backup_path="$BACKUP_DIR/${filename}.${timestamp}.bak"
        cp "$file" "$backup_path" 2>/dev/null
        echo "✓ Backup created: $backup_path"
    fi
}

# Main hook logic
if [ "$1" = "pre-write" ] || [ "$1" = "pre-edit" ]; then
    FILE_PATH="$2"
    
    # If no explicit path provided, use default output directory
    if [ -z "$FILE_PATH" ] || [[ "$FILE_PATH" != /* && "$FILE_PATH" != C:* && "$FILE_PATH" != D:* ]]; then
        # Determine subdirectory based on file extension
        extension="${FILE_PATH##*.}"
        case "$extension" in
            js|ts|py|java|cpp|c|h|go|rs)
                subdir="generated-code"
                ;;
            md|txt|pdf|doc|docx)
                subdir="reports"
                ;;
            json|xml|csv|xlsx|xls)
                subdir="data"
                ;;
            *)
                subdir="temp"
                ;;
        esac
        
        # Set the full output path
        export CLAUDE_FLOW_OUTPUT_PATH="$OUTPUT_DIR/$subdir/$FILE_PATH"
        echo "📁 Output will be saved to: $CLAUDE_FLOW_OUTPUT_PATH"
    else
        # External path specified
        if is_external_path "$FILE_PATH"; then
            echo "⚠️ External path detected: $FILE_PATH"
            create_backup "$FILE_PATH"
        fi
        export CLAUDE_FLOW_OUTPUT_PATH="$FILE_PATH"
    fi
fi

# Post-write hook - log the output
if [ "$1" = "post-write" ] || [ "$1" = "post-edit" ]; then
    FILE_PATH="$2"
    echo "✅ File operation completed: $FILE_PATH"
    
    # Log to output manifest
    echo "$(date +%Y-%m-%d\ %H:%M:%S) - $FILE_PATH" >> "$OUTPUT_DIR/manifest.log"
fi
