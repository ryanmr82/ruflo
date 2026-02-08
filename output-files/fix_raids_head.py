import re

# Read the file
with open("/home/opc/tbc-website/routes/raids.tsx", "r") as f:
    content = f.read()

# The style content we want
style_content = """body::before {
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
          }"""

# Replace empty style block with our content
old_pattern = r"<style>\{\}</style>"
new_pattern = "<style>{`\n          " + style_content + "\n        `}</style>"
content = re.sub(old_pattern, new_pattern, content)

# Write back
with open("/home/opc/tbc-website/routes/raids.tsx", "w") as f:
    f.write(content)

print("Head style section fixed")
