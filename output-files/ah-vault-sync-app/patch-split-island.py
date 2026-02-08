import re, os

island_path = "/home/opc/tbc-website/islands/ArchitectureDocs.tsx"
comp_dir = "/home/opc/tbc-website/components/architecture"

os.makedirs(comp_dir, exist_ok=True)

with open(island_path, "r") as f:
    content = f.read()
    lines = content.split("\n")

# Find the line numbers for each section function
section_funcs = [
    ("OverviewSection", "OverviewSection"),
    ("ChangelogSection", "ChangelogSection"),
    ("ERDSection", "ERDSection"),
    ("ComponentsSection", "ComponentsSection"),
    ("APISection", "APISection"),
    ("SiteMapSection", "SiteMapSection"),
    ("IntegrationsSection", "IntegrationsSection"),
    ("DataFlowsSection", "DataFlowsSection"),
    ("AutomationSection", "AutomationSection"),
    ("FutureEnhancementsSection", "FutureEnhancementsSection"),
]

# Find start line for each function
func_starts = []
for name, _ in section_funcs:
    for i, line in enumerate(lines):
        if line.startswith(f"function {name}("):
            func_starts.append((name, i))
            break

# Sort by line number
func_starts.sort(key=lambda x: x[1])

# Extract each function
extracted = {}
for idx, (name, start) in enumerate(func_starts):
    if idx + 1 < len(func_starts):
        end = func_starts[idx + 1][1]
    else:
        end = len(lines)

    # Find the actual end of the function (matching closing brace at column 0)
    # Walk backwards from the next function start to find the closing brace
    actual_end = end
    for i in range(end - 1, start, -1):
        stripped = lines[i].strip()
        if stripped == "}":
            actual_end = i + 1
            break
        elif stripped:
            actual_end = i + 1
            break

    func_lines = lines[start:actual_end]
    func_text = "\n".join(func_lines)
    extracted[name] = func_text

# ChangelogSection uses ChangelogEntry type — include it
changelog_type = """interface ChangelogEntry {
  date: string;
  title: string;
  type: string;
  items: string[];
}"""

# Write each section to its own file
for name, func_text in extracted.items():
    # Change "function X" to "export default function X"
    func_text = func_text.replace(f"function {name}(", f"export default function {name}(", 1)

    # Build the file content
    file_content = ""

    # ChangelogSection needs the ChangelogEntry type
    if name == "ChangelogSection":
        file_content = changelog_type + "\n\n" + func_text + "\n"
    else:
        file_content = func_text + "\n"

    filepath = f"{comp_dir}/{name}.tsx"
    with open(filepath, "w") as f:
        f.write(file_content)
    print(f"  Created {filepath} ({len(file_content)} bytes)")

# Create ErrorBoundary component
error_boundary = '''import { Component } from "preact";

interface Props {
  fallback?: string;
  children: any;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", this.props.fallback || "Component", "crashed:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div class="arch-card">
          <div class="arch-card-body" style="text-align: center; padding: 40px;">
            <div style="font-size: 18px; color: var(--apple-red); margin-bottom: 12px;">
              This tab encountered a rendering error
            </div>
            <div style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">
              {this.state.error}
            </div>
            <div style="font-size: 12px; color: var(--text-tertiary);">
              Try editing the JSON via the Edit JSON button to fix the data structure.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
'''

with open(f"{comp_dir}/ErrorBoundary.tsx", "w") as f:
    f.write(error_boundary)
print(f"  Created {comp_dir}/ErrorBoundary.tsx ({len(error_boundary)} bytes)")

# Now rewrite ArchitectureDocs.tsx:
# 1. Remove all section functions (everything after the main component closing brace)
# 2. Add imports for the extracted components and ErrorBoundary
# 3. Wrap each section render in ErrorBoundary

# Find the end of the main export default function
# The main function ends right before the first section function
main_end = func_starts[0][1]

# Remove trailing blank lines before section functions
while main_end > 0 and lines[main_end - 1].strip() == "":
    main_end -= 1

main_content = "\n".join(lines[:main_end + 1])

# Add the imports at the top
old_import = 'import { useState, useEffect } from "preact/hooks";'
new_import = '''import { useState, useEffect } from "preact/hooks";
import OverviewSection from "../components/architecture/OverviewSection.tsx";
import ChangelogSection from "../components/architecture/ChangelogSection.tsx";
import ERDSection from "../components/architecture/ERDSection.tsx";
import ComponentsSection from "../components/architecture/ComponentsSection.tsx";
import APISection from "../components/architecture/APISection.tsx";
import SiteMapSection from "../components/architecture/SiteMapSection.tsx";
import IntegrationsSection from "../components/architecture/IntegrationsSection.tsx";
import DataFlowsSection from "../components/architecture/DataFlowsSection.tsx";
import AutomationSection from "../components/architecture/AutomationSection.tsx";
import FutureEnhancementsSection from "../components/architecture/FutureEnhancementsSection.tsx";
import ErrorBoundary from "../components/architecture/ErrorBoundary.tsx";'''

main_content = main_content.replace(old_import, new_import, 1)

# Remove the ChangelogEntry interface from main file (it's now in ChangelogSection.tsx)
main_content = main_content.replace("""interface ChangelogEntry {
  date: string;
  title: string;
  type: string;
  items: string[];
}

""", "")

# Wrap each section render with ErrorBoundary
section_wraps = [
    ('activeSection === "overview" && tabData.overview && <OverviewSection data={tabData.overview} />',
     'activeSection === "overview" && tabData.overview && <ErrorBoundary fallback="Overview"><OverviewSection data={tabData.overview} /></ErrorBoundary>'),
    ('activeSection === "changelog" && tabData.changelog && <ChangelogSection data={tabData.changelog} />',
     'activeSection === "changelog" && tabData.changelog && <ErrorBoundary fallback="Changelog"><ChangelogSection data={tabData.changelog} /></ErrorBoundary>'),
    ('activeSection === "sitemap" && tabData.sitemap && <SiteMapSection data={tabData.sitemap} />',
     'activeSection === "sitemap" && tabData.sitemap && <ErrorBoundary fallback="Site Map"><SiteMapSection data={tabData.sitemap} /></ErrorBoundary>'),
    ('activeSection === "erd" && tabData.erd && <ERDSection data={tabData.erd} />',
     'activeSection === "erd" && tabData.erd && <ErrorBoundary fallback="Database"><ERDSection data={tabData.erd} /></ErrorBoundary>'),
    ('activeSection === "components" && tabData.components && <ComponentsSection data={tabData.components} />',
     'activeSection === "components" && tabData.components && <ErrorBoundary fallback="Components"><ComponentsSection data={tabData.components} /></ErrorBoundary>'),
    ('activeSection === "api" && tabData.api && <APISection data={tabData.api} />',
     'activeSection === "api" && tabData.api && <ErrorBoundary fallback="API Routes"><APISection data={tabData.api} /></ErrorBoundary>'),
    ('activeSection === "integrations" && tabData.integrations && <IntegrationsSection data={tabData.integrations} />',
     'activeSection === "integrations" && tabData.integrations && <ErrorBoundary fallback="Integrations"><IntegrationsSection data={tabData.integrations} /></ErrorBoundary>'),
    ('activeSection === "dataflows" && tabData.dataflows && <DataFlowsSection data={tabData.dataflows} />',
     'activeSection === "dataflows" && tabData.dataflows && <ErrorBoundary fallback="Data Flows"><DataFlowsSection data={tabData.dataflows} /></ErrorBoundary>'),
    ('activeSection === "automation" && tabData.automation && <AutomationSection data={tabData.automation} />',
     'activeSection === "automation" && tabData.automation && <ErrorBoundary fallback="Automation"><AutomationSection data={tabData.automation} /></ErrorBoundary>'),
    ('activeSection === "future" && tabData.future && <FutureEnhancementsSection data={tabData.future} />',
     'activeSection === "future" && tabData.future && <ErrorBoundary fallback="Future Enhancements"><FutureEnhancementsSection data={tabData.future} /></ErrorBoundary>'),
]

for old, new in section_wraps:
    if old in main_content:
        main_content = main_content.replace(old, new)
        print(f"  Wrapped: {old[:50]}...")
    else:
        print(f"  WARNING: Could not find: {old[:50]}...")

with open(island_path, "w") as f:
    f.write(main_content)
print(f"\nIsland rewritten: {len(main_content)} bytes ({island_path})")

# Verify
with open(island_path, "r") as f:
    text = f.read()

checks = [
    ("Import OverviewSection", 'import OverviewSection from' in text),
    ("Import ErrorBoundary", 'import ErrorBoundary from' in text),
    ("ErrorBoundary wraps Overview", 'ErrorBoundary fallback="Overview"' in text),
    ("ErrorBoundary wraps Future", 'ErrorBoundary fallback="Future Enhancements"' in text),
    ("No inline OverviewSection func", "function OverviewSection" not in text),
    ("No inline FutureEnhancementsSection func", "function FutureEnhancementsSection" not in text),
    ("tabData.overview still used", "tabData.overview" in text),
    ("LogReconciliation import kept", "LogReconciliation" in text),
]
print("\nVerification:")
for label, ok in checks:
    print(f"  {label}: {'OK' if ok else 'MISSING'}")

# Count lines
line_count = text.count("\n") + 1
print(f"\nIsland line count: {line_count} (was 1696)")

# List created files
print(f"\nCreated files in {comp_dir}/:")
for f in sorted(os.listdir(comp_dir)):
    size = os.path.getsize(f"{comp_dir}/{f}")
    print(f"  {f}: {size} bytes")
