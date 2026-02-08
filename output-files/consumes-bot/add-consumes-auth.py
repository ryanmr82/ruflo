#!/usr/bin/env python3
"""Add Discord login prompt to ConsumesShop.tsx"""

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "r") as f:
    content = f.read()

# 1. Add user state after isAdmin state
old_state = "const [isAdmin, setIsAdmin] = useState(false);"
new_state = """const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ discordId: string; discordUsername: string; discordDisplayName: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);"""

content = content.replace(old_state, new_state)

# 2. Add auth check in useEffect - find where loading is set and add auth check before it
# Look for the prices fetch useEffect
old_fetch = """useEffect(() => {
    const fetchPrices = async () => {"""

new_fetch = """useEffect(() => {
    // Check Discord authentication
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setUser(data.user);
          }
        }
      } catch (e) {
        console.error("Auth check failed:", e);
      }
      setAuthChecked(true);
    };
    checkAuth();

    const fetchPrices = async () => {"""

content = content.replace(old_fetch, new_fetch)

# 3. Add CSS for login prompt - find .consumes-container and add before it
login_css = """        .login-prompt-banner { background: linear-gradient(135deg, #2d4a6d, #1a3a5c); border: 2px solid #5dade2; border-radius: 12px; padding: 20px 30px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px; }
        .login-prompt-text { color: #b0c4de; }
        .login-prompt-text h3 { color: #5dade2; margin: 0 0 5px 0; font-size: 1.1rem; }
        .login-prompt-text p { margin: 0; font-size: 0.9rem; }
        .discord-login-btn { display: inline-flex; align-items: center; gap: 8px; background: #5865F2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; transition: all 0.2s; font-size: 0.9rem; }
        .discord-login-btn:hover { background: #4752c4; transform: translateY(-1px); }
        .discord-login-btn svg { width: 20px; height: 20px; }
        .user-welcome { color: #4ade80; font-size: 0.85rem; margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .user-welcome-avatar { width: 24px; height: 24px; border-radius: 50%; }
"""

content = content.replace(
    "        .consumes-container { max-width: 1200px;",
    login_css + "        .consumes-container { max-width: 1200px;"
)

# 4. Add login banner JSX after the header section
# Find the discount badge area and add login prompt before the price legend
old_header_end = """{/* Price Source Legend */}
          <div class="price-legend">"""

discord_svg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>'

new_header_end = f"""{{/* Login Banner or User Welcome */}}
          {{authChecked && !user ? (
            <div class="login-prompt-banner">
              <div class="login-prompt-text">
                <h3>Sign in to Place Orders</h3>
                <p>Connect your Discord to order consumes and track deliveries</p>
              </div>
              <a href="/api/auth/discord/login?redirect=/consumes" class="discord-login-btn">
                {discord_svg}
                Sign in with Discord
              </a>
            </div>
          ) : user ? (
            <div class="user-welcome">
              Signed in as <strong>{{user.discordDisplayName || user.discordUsername}}</strong>
            </div>
          ) : null}}

          {{/* Price Source Legend */}}
          <div class="price-legend">"""

content = content.replace(old_header_end, new_header_end)

# 5. Disable cart/checkout if not logged in - find the checkout button
old_checkout = 'disabled={Object.keys(cart).length === 0}'
new_checkout = 'disabled={Object.keys(cart).length === 0 || !user}'

content = content.replace(old_checkout, new_checkout)

# Also update the checkout button text to show login requirement
old_checkout_text = '{Object.keys(cart).length === 0 ? "Cart Empty" : "Submit Order via Discord"}'
new_checkout_text = '{!user ? "Sign in to Order" : Object.keys(cart).length === 0 ? "Cart Empty" : "Submit Order via Discord"}'

content = content.replace(old_checkout_text, new_checkout_text)

with open("/home/opc/tbc-website/islands/ConsumesShop.tsx", "w") as f:
    f.write(content)

print("Added Discord login to ConsumesShop.tsx")
print("- Added user state and auth check")
print("- Added login banner CSS")
print("- Added login prompt banner in UI")
print("- Disabled checkout if not logged in")
