#!/usr/bin/env python3
import re

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    content = f.read()

# Delete Greater Mana Potion line
content = re.sub(r'\s*\{ id: "GreaterMana"[^}]+\},?\n?', '\n', content)

# Delete Spirit of Zanza line
content = re.sub(r'\s*\{ id: "SpiritOfZanza"[^}]+\},?\n?', '\n', content)

# Convert seconds to minutes in descriptions
def convert_seconds(text):
    def replacer(match):
        full = match.group(0)
        seconds = int(match.group(1))
        if seconds >= 60:
            minutes = seconds // 60
            remaining = seconds % 60
            if remaining > 0:
                replacement = f"{minutes} min {remaining} sec"
            else:
                replacement = f"{minutes} min"
        else:
            replacement = f"{seconds} sec"
        return replacement + match.group(2)

    # Match patterns like "3600 sec." or "3600 sec," or "600 sec)"
    return re.sub(r'(\d+) sec([.,\)])', replacer, text)

content = convert_seconds(content)

# Clean up double empty lines
content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("Done:")
print("- Removed Greater Mana Potion")
print("- Removed Spirit of Zanza")
print("- Converted seconds to minutes")
