#!/usr/bin/env bash
set -euo pipefail

# inject-template-scripts.sh
# Injects shared JavaScript files into NNW theme templates
# This allows maintaining a single source of truth for scripts while
# distributing them inline to each theme (as NNW doesn't support external JS)

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEMPLATE_SCRIPTS_DIR="$SCRIPT_DIR/template-scripts"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to read and format a script for injection
read_script() {
    local script_name="$1"
    local script_path="$TEMPLATE_SCRIPTS_DIR/$script_name"
    
    if [[ ! -f "$script_path" ]]; then
        log_error "Script not found: $script_path"
        return 1
    fi
    
    # Read the script and wrap it in script tags
    echo "    <script>"
    cat "$script_path"
    echo "    </script>"
}

# Function to inject scripts into a template file
inject_into_template() {
    local template_file="$1"
    local temp_file="${template_file}.tmp"
    
    log_info "Processing: $template_file"
    
    # Check if markers exist
    if ! grep -q "<!-- INJECT_SCRIPTS_BEGIN -->" "$template_file"; then
        log_warn "No INJECT_SCRIPTS_BEGIN marker found in $template_file - skipping"
        return 0
    fi
    
    # Extract the script references from between markers to determine which scripts to inject
    local script_refs
    script_refs=$(sed -n '/<!-- INJECT_SCRIPTS_BEGIN -->/,/<!-- INJECT_SCRIPTS_END -->/p' "$template_file" | \
                  grep -o 'src="[^"]*\.js"' | \
                  sed 's/src="//;s/"//' || echo "")
    
    # If no script references found, use default order
    if [[ -z "$script_refs" ]]; then
        log_warn "No script references found between markers, using default order"
        script_refs="youtube-link-rewrite.js
linker.js"
    fi
    
    # Build the injected content
    local injected_content="    <!-- INJECT_SCRIPTS_BEGIN -->
    <!-- This section is auto-generated from scripts/template-scripts/ -->
    <!-- To update: modify source files and run scripts/inject-template-scripts.sh -->
"
    
    # Read and append each script
    while IFS= read -r script_ref; do
        # Extract just the filename from paths like "../scripts/template-scripts/linker.js"
        local script_name
        script_name=$(basename "$script_ref")
        
        if [[ -f "$TEMPLATE_SCRIPTS_DIR/$script_name" ]]; then
            injected_content+=$(read_script "$script_name")
            injected_content+=$'\n'
        else
            log_warn "Script not found: $script_name (referenced in $template_file)"
        fi
    done <<< "$script_refs"
    
    injected_content+="    <!-- INJECT_SCRIPTS_END -->"
    
    # Create new file with injected content
    # Extract content before and after markers
    local begin_line
    local end_line
    begin_line=$(grep -n "<!-- INJECT_SCRIPTS_BEGIN -->" "$template_file" | cut -d: -f1)
    end_line=$(grep -n "<!-- INJECT_SCRIPTS_END -->" "$template_file" | cut -d: -f1)
    
    if [[ -z "$begin_line" ]] || [[ -z "$end_line" ]]; then
        log_error "Could not find markers in $template_file"
        return 1
    fi
    
    # Write before marker (excluding marker line)
    sed -n "1,$((begin_line - 1))p" "$template_file" > "$temp_file"
    
    # Write injected content
    echo "$injected_content" >> "$temp_file"
    
    # Write after marker (excluding marker line)
    sed -n "$((end_line + 1)),\$p" "$template_file" >> "$temp_file"
    
    # Replace original with updated file
    mv "$temp_file" "$template_file"
    log_info "✓ Updated: $template_file"
}

# Main execution
main() {
    log_info "Starting template script injection..."
    log_info "Project root: $PROJECT_ROOT"
    log_info "Template scripts: $TEMPLATE_SCRIPTS_DIR"
    
    # Verify template scripts directory exists
    if [[ ! -d "$TEMPLATE_SCRIPTS_DIR" ]]; then
        log_error "Template scripts directory not found: $TEMPLATE_SCRIPTS_DIR"
        exit 1
    fi
    
    # Find all template.html files in .nnwtheme directories
    local template_count=0
    while IFS= read -r template_file; do
        inject_into_template "$template_file"
        template_count=$((template_count + 1))
    done < <(find "$PROJECT_ROOT" -type f -path "*.nnwtheme/template.html")
    
    if [[ $template_count -eq 0 ]]; then
        log_warn "No template files found"
        exit 1
    fi
    
    log_info "✓ Complete! Injected scripts into $template_count template(s)"
}

main "$@"
