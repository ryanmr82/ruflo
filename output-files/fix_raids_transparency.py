import re

# Read the file
with open("/home/opc/tbc-website/routes/raids.tsx", "r") as f:
    content = f.read()

# New style content with transparent cards but opaque sub-panels
new_style = """body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('/images/download.jpg');
            background-size: cover;
            background-position: center;
            opacity: 0.15;
            z-index: -1;
            pointer-events: none;
          }
          /* Remove card background images on this page */
          .card::before {
            background-image: none !important;
            opacity: 0 !important;
          }
          /* Make main cards semi-transparent so body background shows through */
          .card {
            background: linear-gradient(135deg, rgba(42, 42, 46, 0.5) 0%, rgba(31, 31, 35, 0.5) 100%) !important;
          }
          /* Keep calendar day cells opaque */
          .calendar-day {
            background: linear-gradient(135deg, rgba(50, 50, 54, 0.95) 0%, rgba(42, 42, 46, 0.95) 100%) !important;
          }
          /* Keep upcoming list items opaque */
          .upcoming-item {
            background: rgba(42, 42, 46, 0.95) !important;
          }
          /* Keep view toggle buttons opaque */
          .view-btn {
            background: var(--background-tertiary) !important;
          }
          .view-btn.active {
            background: var(--apple-blue) !important;
          }
          /* Keep calendar nav buttons opaque */
          .calendar-nav-btn {
            background: var(--background-tertiary) !important;
          }"""

# Replace existing style content
old_pattern = r"<style>\{\`\s*body::before \{[^}]+\}[^`]+\`\}</style>"
new_pattern = "<style>{`\n          " + new_style + "\n        `}</style>"
content = re.sub(old_pattern, new_pattern, content, flags=re.DOTALL)

# Write back
with open("/home/opc/tbc-website/routes/raids.tsx", "w") as f:
    f.write(content)

print("Transparency styles updated")
