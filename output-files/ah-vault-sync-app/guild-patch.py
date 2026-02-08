import sys

with open('/home/opc/tbc-website/islands/GuildStorageTabs.tsx', 'r') as f:
    content = f.read()

old_start = '''export default function GuildStorageTabs() {
  const [mainTab, setMainTab] = useState<"combined" | "vault" | "alts">("combined");

  return (
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">'''

new_start = '''export default function GuildStorageTabs() {
  const [mainTab, setMainTab] = useState<"combined" | "vault" | "alts">("combined");
  const { hasAdminCookie: authAdminCookie } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [hasAdminCookie, setHasAdminCookie] = useState(false);

  useEffect(() => {
    if (authAdminCookie) setHasAdminCookie(true);
  }, [authAdminCookie]);

  function handleAdminClick() {
    if (isAdmin) {
      setIsAdmin(false);
    } else if (hasAdminCookie) {
      setIsAdmin(true);
    } else {
      setShowPasswordModal(true);
      setPasswordInput("");
      setPasswordError(false);
    }
  }

  async function handlePasswordSubmit() {
    try {
      const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: passwordInput }) });
      if (response.ok) {
        setHasAdminCookie(true);
        setIsAdmin(true);
        setShowPasswordModal(false);
        setPasswordInput("");
        setPasswordError(false);
      } else {
        setPasswordError(true);
      }
    } catch { setPasswordError(true); }
  }

  return (
    <div style="max-width: 1200px; margin: 0 auto; padding: 0 20px;">
      {/* Admin toggle */}
      <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
        <button
          onClick={handleAdminClick}
          style={{
            padding: "6px 14px",
            border: "1px solid var(--border-light)",
            borderRadius: "8px",
            background: isAdmin ? "rgba(52, 199, 89, 0.15)" : "transparent",
            color: isAdmin ? "#34c759" : "var(--text-secondary)",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
            transition: "all 0.2s ease",
          }}
        >
          {isAdmin ? "\U0001f513 Exit Admin" : "\U0001f512 Admin"}
        </button>
      </div>

      {/* Download section - admin only */}
      {isAdmin && (
        <div style="margin-bottom: 16px; padding: 14px 18px; background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.25); border-radius: 10px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-weight: 600; font-size: 14px; color: var(--text-primary);">AH & Vault Sync Desktop App</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">v6.0.0 \u2014 Auto-syncs AH prices, guild vault, and bank alt inventories</div>
          </div>
          <a
            href="/api/downloads/tray-app"
            style="padding: 8px 18px; background: #34c759; color: #fff; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; white-space: nowrap;"
          >
            Download Installer (.zip)
          </a>
        </div>
      )}

      {/* Password modal */}
      {showPasswordModal && (
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); z-index: 1000; display: flex; align-items: center; justify-content: center;" onClick={() => setShowPasswordModal(false)}>
          <div style="background: var(--background-primary); border: 1px solid var(--border-light); border-radius: 12px; padding: 24px; width: 340px; max-width: 90vw;" onClick={(e: Event) => e.stopPropagation()}>
            <h3 style="margin: 0 0 16px; font-size: 16px;">Admin Login</h3>
            <input
              type="password"
              value={passwordInput}
              onInput={(e: Event) => { setPasswordInput((e.target as HTMLInputElement).value); setPasswordError(false); }}
              onKeyPress={(e: KeyboardEvent) => { if (e.key === "Enter") handlePasswordSubmit(); }}
              placeholder="Enter password"
              autoFocus
              style={{
                width: "100%",
                padding: "10px 12px",
                border: passwordError ? "1px solid #ff3b30" : "1px solid var(--border-light)",
                borderRadius: "8px",
                background: "var(--background-secondary)",
                color: "var(--text-primary)",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
            {passwordError && <div style="color: #ff3b30; font-size: 12px; margin-top: 6px;">Incorrect password</div>}
            <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;">
              <button onClick={() => setShowPasswordModal(false)} style="padding: 8px 16px; border: 1px solid var(--border-light); border-radius: 8px; background: transparent; color: var(--text-secondary); cursor: pointer; font-size: 13px;">Cancel</button>
              <button onClick={handlePasswordSubmit} style="padding: 8px 16px; border: none; border-radius: 8px; background: var(--apple-blue); color: #fff; cursor: pointer; font-size: 13px; font-weight: 600;">Login</button>
            </div>
          </div>
        </div>
      )}'''

if old_start in content:
    content = content.replace(old_start, new_start, 1)
    with open('/home/opc/tbc-website/islands/GuildStorageTabs.tsx', 'w') as f:
        f.write(content)
    print('Patch applied successfully')
else:
    print('ERROR: Could not find target string')
    sys.exit(1)
