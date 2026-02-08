filepath = "/home/opc/tbc-website/islands/ArchitectureDocs.tsx"

with open(filepath, "r") as f:
    content = f.read()

# Add a useEffect that syncs hash on mount/navigation
old_hashchange = '''  // Listen for browser back/forward navigation
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1) as Section;
      const validSections: Section[] = ["overview", "changelog", "sitemap", "erd", "components", "api", "automation", "integrations", "dataflows", "future", "reconcile"];
      if (validSections.includes(hash)) {
        setActiveSection(hash);
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);'''

new_hashchange = '''  // Sync hash on mount and listen for back/forward navigation
  useEffect(() => {
    const validSections: Section[] = ["overview", "changelog", "sitemap", "erd", "components", "api", "automation", "integrations", "dataflows", "future", "reconcile"];

    const syncHash = () => {
      const hash = window.location.hash.slice(1) as Section;
      if (validSections.includes(hash)) {
        setActiveSection(hash);
      } else if (window.location.hash && !validSections.includes(hash)) {
        // Invalid hash — reset to overview
        setActiveSection("overview");
      }
    };

    // Sync on mount (handles page navigation within same route)
    syncHash();

    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);'''

content = content.replace(old_hashchange, new_hashchange)

with open(filepath, "w") as f:
    f.write(content)

# Verify
with open(filepath, "r") as f:
    text = f.read()
print("syncHash function:", "syncHash" in text)
print("Invalid hash reset:", "Invalid hash" in text)
print("Sync on mount:", "Sync on mount" in text)
