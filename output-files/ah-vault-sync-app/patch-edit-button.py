filepath = "/home/opc/tbc-website/islands/ArchitectureDocs.tsx"

with open(filepath, "r") as f:
    content = f.read()

# 1. Add editing state variables after the fetchError state
old_states = '''  const [loading, setLoading] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);'''

new_states = '''  const [loading, setLoading] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editJson, setEditJson] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);'''

content = content.replace(old_states, new_states)

# 2. Map section IDs to API slugs (add after SECTION_FILES)
old_section_files_end = '''interface ArchitectureDocsProps {'''

# Add the API slug mapping
new_section_files_end = '''// Map section IDs to API slugs for the edit endpoint
const SECTION_API_SLUGS: Record<string, string> = {
  overview: "overview",
  changelog: "changelog",
  sitemap: "sitemap",
  erd: "database",
  components: "components",
  api: "api-routes",
  integrations: "integrations",
  dataflows: "dataflows",
  automation: "automation",
  future: "future-enhancements",
};

interface ArchitectureDocsProps {'''

content = content.replace(old_section_files_end, new_section_files_end)

# 3. Add edit functions after the lazy-load useEffect (before getLastUpdated)
old_get_last = '''  // Get timestamp for active section (now from lazy-loaded cache)'''

new_get_last = '''  // Open edit modal with current tab's JSON
  const handleEditOpen = () => {
    const currentData = tabData[activeSection];
    if (currentData) {
      setEditJson(JSON.stringify(currentData, null, 2));
      setEditMode(true);
      setEditError(null);
      setEditSuccess(null);
    }
  };

  // Save edited JSON via API
  const handleEditSave = async () => {
    const slug = SECTION_API_SLUGS[activeSection];
    if (!slug) return;

    setEditSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      // Validate JSON locally first
      let parsed;
      try {
        parsed = JSON.parse(editJson);
      } catch (e) {
        setEditError("Invalid JSON: " + (e as Error).message);
        setEditSaving(false);
        return;
      }

      const res = await fetch(`/api/architecture/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: editJson,
      });

      if (!res.ok) {
        const err = await res.json();
        setEditError(err.error || "Save failed");
        setEditSaving(false);
        return;
      }

      // Update the cache with the new data
      setTabData(prev => ({ ...prev, [activeSection]: parsed }));
      setEditSuccess("Saved successfully! A backup of the previous version was created.");
      setEditSaving(false);
    } catch (e) {
      setEditError("Network error: " + (e as Error).message);
      setEditSaving(false);
    }
  };

  // Get timestamp for active section (now from lazy-loaded cache)'''

content = content.replace(old_get_last, new_get_last)

# 4. Add the edit button next to the Last Updated timestamp
old_timestamp = '''      {getLastUpdated() && ('''

new_timestamp = '''      {/* Edit JSON button — only for data tabs (not reconcile) */}
      {activeSection !== "reconcile" && tabData[activeSection] && (
        <div style="display: flex; justify-content: flex-end; margin-bottom: 8px;">
          <button
            type="button"
            onClick={handleEditOpen}
            style="background: transparent; border: 1px solid var(--border-light); color: var(--text-secondary); padding: 6px 14px; border-radius: 6px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 6px;"
          >
            <span>✏️</span> Edit JSON
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {editMode && (
        <div style="position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;">
          <div style="background: var(--background-secondary); border-radius: 12px; width: 90vw; max-width: 1000px; max-height: 90vh; display: flex; flex-direction: column; border: 1px solid var(--border-light);">
            <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; font-size: 16px; color: var(--text-primary);">Edit JSON — {activeSection}</h3>
              <button type="button" onClick={() => setEditMode(false)} style="background: transparent; border: none; color: var(--text-secondary); font-size: 20px; cursor: pointer;">✕</button>
            </div>
            <div style="flex: 1; overflow: auto; padding: 16px;">
              <textarea
                value={editJson}
                onInput={(e: any) => setEditJson(e.target.value)}
                style="width: 100%; min-height: 60vh; font-family: ui-monospace, monospace; font-size: 12px; line-height: 1.5; background: var(--background-tertiary); color: var(--text-primary); border: 1px solid var(--border-light); border-radius: 8px; padding: 16px; resize: vertical; box-sizing: border-box;"
                spellcheck={false}
              />
            </div>
            <div style="padding: 12px 20px; border-top: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: center;">
              <div>
                {editError && <span style="color: var(--apple-red); font-size: 12px;">{editError}</span>}
                {editSuccess && <span style="color: var(--apple-green); font-size: 12px;">{editSuccess}</span>}
              </div>
              <div style="display: flex; gap: 8px;">
                <button type="button" onClick={() => setEditMode(false)} style="padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border-light); background: transparent; color: var(--text-secondary); cursor: pointer;">Cancel</button>
                <button type="button" onClick={handleEditSave} disabled={editSaving} style="padding: 8px 16px; border-radius: 6px; border: none; background: var(--apple-blue); color: white; cursor: pointer; opacity: editSaving ? 0.5 : 1;">{editSaving ? "Saving..." : "Save"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {getLastUpdated() && ('''

content = content.replace(old_timestamp, new_timestamp)

with open(filepath, "w") as f:
    f.write(content)
print("Island patched with edit button: %d bytes" % len(content))

# Verify
with open(filepath, "r") as f:
    text = f.read()
checks = [
    ("editMode state", "editMode" in text),
    ("handleEditOpen", "handleEditOpen" in text),
    ("handleEditSave", "handleEditSave" in text),
    ("SECTION_API_SLUGS", "SECTION_API_SLUGS" in text),
    ("Edit JSON button", "Edit JSON" in text),
    ("Edit Modal", "Edit Modal" in text),
    ("/api/architecture/", "/api/architecture/" in text),
    ("backup", "backup" in text),
]
for label, ok in checks:
    print("%s: %s" % (label, "OK" if ok else "MISSING"))
