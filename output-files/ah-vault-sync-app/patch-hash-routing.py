import re

filepath = "/home/opc/tbc-website/islands/ArchitectureDocs.tsx"

with open(filepath, "r") as f:
    content = f.read()

# 1. Add useEffect import alongside useState
old_import = 'import { useState } from "preact/hooks";'
new_import = 'import { useState, useEffect } from "preact/hooks";'
content = content.replace(old_import, new_import)

# 2. Replace the useState line to read from hash on init
old_state = '  const [activeSection, setActiveSection] = useState<Section>("overview");'
new_state = '''  // Read initial tab from URL hash (e.g. #future, #api, #erd)
  const getInitialSection = (): Section => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hash = window.location.hash.slice(1) as Section;
      const validSections: Section[] = ["overview", "changelog", "sitemap", "erd", "components", "api", "automation", "integrations", "dataflows", "future", "reconcile"];
      if (validSections.includes(hash)) return hash;
    }
    return "overview";
  };
  const [activeSection, setActiveSection] = useState<Section>(getInitialSection);'''
content = content.replace(old_state, new_state)

# 3. Replace handleClick to also set hash
old_handle = '''  const handleClick = (section: Section) => {
    console.log("Switching to:", section);
    setActiveSection(section);
  };'''
new_handle = '''  const handleClick = (section: Section) => {
    console.log("Switching to:", section);
    setActiveSection(section);
    if (typeof window !== "undefined") {
      window.location.hash = section;
    }
  };

  // Listen for browser back/forward navigation
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
content = content.replace(old_handle, new_handle)

with open(filepath, "w") as f:
    f.write(content)

# Verify
with open(filepath, "r") as f:
    text = f.read()

checks = [
    ("useEffect import", "useEffect" in text),
    ("getInitialSection", "getInitialSection" in text),
    ("window.location.hash = section", "window.location.hash = section" in text),
    ("hashchange listener", "hashchange" in text),
    ("addEventListener", "addEventListener" in text),
    ("removeEventListener", "removeEventListener" in text),
]
for label, ok in checks:
    print("%s: %s" % (label, "OK" if ok else "MISSING"))
