#!/usr/bin/env python3
import json
import re
import html

with open("/home/opc/tbc-website/static/item-tooltips.json", "r") as f:
    items_cache = json.load(f)

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    content = f.read()

def extract_use_description(tooltip_html):
    if not tooltip_html:
        return None
    text = html.unescape(tooltip_html)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = ' '.join(text.split())

    use_match = re.search(r'Use:\s*(.+?)(?:$|\s+Requires|\s+Item Level|\s+Cooldown)', text)
    if use_match:
        return use_match.group(1).strip()
    return None

def convert_seconds_to_minutes(text):
    def replacer(match):
        seconds = int(match.group(1))
        if seconds >= 60:
            minutes = seconds // 60
            remaining = seconds % 60
            if remaining > 0:
                return f"{minutes} min {remaining} sec"
            else:
                return f"{minutes} min"
        return f"{seconds} sec"
    return re.sub(r'(\d+) sec(?:onds?)?', replacer, text)

# Items that need fixing
truncated_items = {
    "8956": "Oil of Immolation",
    "10646": "Goblin Sapper Charge",
    "20748": "Brilliant Mana Oil",
    "3829": "Frost Oil",
    "20749": "Brilliant Wizard Oil"
}

for item_id, name in truncated_items.items():
    if item_id in items_cache:
        tooltip = items_cache[item_id].get("tooltipHtml", "")
        desc = extract_use_description(tooltip)
        if desc:
            desc = convert_seconds_to_minutes(desc)
            # Escape for string replacement
            desc_escaped = desc.replace('"', '\\"')
            # Find and replace the truncated description
            pattern = rf'(itemId:\s*{item_id},\s*description:\s*")[^"]*(")'
            content = re.sub(pattern, rf'\g<1>{desc_escaped}\g<2>', content)
            print(f"Fixed {item_id} ({name}): {desc[:80]}...")

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("\nDone fixing truncated descriptions")
