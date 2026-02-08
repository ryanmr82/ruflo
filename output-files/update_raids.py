import re

# Read the file
with open("/home/opc/tbc-website/routes/raids.tsx", "r") as f:
    content = f.read()

# New Head section with styles
new_head = '''      <Head>
        <title>Raid Schedule - Thralls Book Club</title>
        <style>{`
          body::before {
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
        `}</style>
      </Head>'''

# Replace old Head
old_head_pattern = r"<Head>\s*<title>Raid Schedule - Thralls Book Club</title>\s*</Head>"
content = re.sub(old_head_pattern, new_head, content)

# Remove inline background from calendar card - find the specific pattern
# Old: <div class="card mt-3" style="position: relative; overflow: hidden;">
#        <div style="position: absolute; ...background-image..."></div>
#        <div style="position: relative; z-index: 1;">
# New: <div class="card mt-3">
#        <div>

old_calendar = r'<div class="card mt-3" style="position: relative; overflow: hidden;">\s*<div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-image: url\(\'/images/NIS3DMMR209S1565217183624\.webp\'\); background-size: cover; background-position: center; opacity: 0\.20; z-index: 0; pointer-events: none;"></div>\s*<div style="position: relative; z-index: 1;">'
new_calendar = '<div class="card mt-3">\n          <div>'
content = re.sub(old_calendar, new_calendar, content, flags=re.DOTALL)

# Write back
with open("/home/opc/tbc-website/routes/raids.tsx", "w") as f:
    f.write(content)

print("File updated successfully")
