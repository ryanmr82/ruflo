#!/usr/bin/env python3
"""Add Discord login prompt to ConsumesShop.tsx - Clean version"""

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
state_added = False
auth_check_added = False
banner_added = False

for i, line in enumerate(lines):
    # 1. Add user and authChecked state after isAdmin state
    if "const [isAdmin, setIsAdmin] = useState(false);" in line and not state_added:
        new_lines.append(line)
        new_lines.append("  const [user, setUser] = useState<{ discordId: string; discordUsername: string; discordDisplayName: string } | null>(null);\n")
        new_lines.append("  const [authChecked, setAuthChecked] = useState(false);\n")
        state_added = True
        continue

    # 2. Add auth check in useEffect - find the one-liner useEffect
    if "useEffect(() => { fetchPrices(); }, []);" in line and not auth_check_added:
        new_lines.append("  useEffect(() => {\n")
        new_lines.append("    // Check Discord auth\n")
        new_lines.append("    fetch('/api/auth/me').then(r => r.ok ? r.json() : null).then(data => {\n")
        new_lines.append("      if (data?.authenticated) setUser(data.user);\n")
        new_lines.append("      setAuthChecked(true);\n")
        new_lines.append("    }).catch(() => setAuthChecked(true));\n")
        new_lines.append("    fetchPrices();\n")
        new_lines.append("  }, []);\n")
        auth_check_added = True
        continue

    # 3. Add login banner after the header closes - find the closing of consumes-header
    if '</div>' in line and 'consumes-header' not in line and not banner_added:
        # Check if previous content suggests we're at the header close (after last-updated)
        prev_content = ''.join(new_lines[-20:]) if len(new_lines) > 20 else ''.join(new_lines)
        if 'formatRelativeTime' in prev_content and '}) : null;' in prev_content:
            new_lines.append(line)  # Add the closing div
            new_lines.append("\n")
            new_lines.append("      {/* Login/Welcome Banner */}\n")
            new_lines.append("      {authChecked && !user && (\n")
            new_lines.append("        <div style={{ background: 'linear-gradient(135deg, #2d4a6d, #1a3a5c)', border: '2px solid #5dade2', borderRadius: '12px', padding: '20px 30px', margin: '15px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>\n")
            new_lines.append("          <div>\n")
            new_lines.append("            <div style={{ color: '#5dade2', fontWeight: 'bold', marginBottom: '5px' }}>Sign in to Place Orders</div>\n")
            new_lines.append("            <div style={{ color: '#b0c4de', fontSize: '0.9rem' }}>Connect your Discord to order consumes</div>\n")
            new_lines.append("          </div>\n")
            new_lines.append('          <a href="/api/auth/discord/login?redirect=/consumes" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#5865F2", color: "white", padding: "10px 20px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>Sign in with Discord</a>\n')
            new_lines.append("        </div>\n")
            new_lines.append("      )}\n")
            new_lines.append("      {user && <div style={{ color: '#4ade80', fontSize: '0.85rem', margin: '10px 0' }}>Welcome, <strong>{user.discordDisplayName || user.discordUsername}</strong>!</div>}\n")
            new_lines.append("\n")
            banner_added = True
            continue

    new_lines.append(line)

# 4. Disable checkout if not logged in - do a simple replacement
content = ''.join(new_lines)
content = content.replace(
    'disabled={Object.keys(cart).length === 0}',
    'disabled={Object.keys(cart).length === 0 || !user}'
)
content = content.replace(
    '{Object.keys(cart).length === 0 ? "Cart Empty" : "Submit Order via Discord"}',
    '{!user ? "Sign in to Order" : Object.keys(cart).length === 0 ? "Cart Empty" : "Submit Order via Discord"}'
)

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "w") as f:
    f.write(content)

print("Changes applied:")
print(f"  - State variables added: {state_added}")
print(f"  - Auth check added: {auth_check_added}")
print(f"  - Login banner added: {banner_added}")
