#!/usr/bin/env python3
"""
Update prices.ts descriptions with accurate data from item-tooltips.json
"""
import json
import re
import html

# Load static item cache
with open("/home/opc/tbc-website/static/item-tooltips.json", "r") as f:
    items_cache = json.load(f)

# Load prices.ts
with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    prices_content = f.read()

def extract_use_description(tooltip_html):
    """Extract the Use: description from tooltip HTML"""
    if not tooltip_html:
        return None

    # Decode HTML entities
    text = html.unescape(tooltip_html)

    # Remove HTML tags but keep text
    text = re.sub(r'<[^>]+>', ' ', text)

    # Clean up whitespace
    text = ' '.join(text.split())

    # Look for Use: description
    use_match = re.search(r'Use:\s*(.+?)(?:$|\s+Requires|\s+Item Level|\s+Cooldown)', text)
    if use_match:
        desc = use_match.group(1).strip()
        # Clean up trailing punctuation
        desc = re.sub(r'\s+$', '', desc)
        return desc

    # Look for Equip: description
    equip_match = re.search(r'Equip:\s*(.+?)(?:$|\s+Requires|\s+Item Level)', text)
    if equip_match:
        return equip_match.group(1).strip()

    return None

# Get all item IDs from prices.ts
item_ids = re.findall(r'itemId:\s*(\d+)', prices_content)

print(f"Found {len(item_ids)} items in prices.ts")
print("\nUpdating descriptions from static cache:\n")

updates = []
for item_id in item_ids:
    if item_id in items_cache:
        item = items_cache[item_id]
        tooltip = item.get("tooltipHtml", "")
        desc = extract_use_description(tooltip)

        if desc:
            # Shorten long descriptions
            if len(desc) > 100:
                # Take first sentence or meaningful part
                short_desc = desc[:100]
                if '.' in short_desc:
                    short_desc = short_desc[:short_desc.rfind('.')+1]
                else:
                    short_desc = short_desc + "..."
                desc = short_desc

            updates.append({
                "id": item_id,
                "name": item.get("name", "Unknown"),
                "description": desc
            })
            print(f"  {item_id}: {item.get('name', 'Unknown')}")
            print(f"    -> {desc}\n")
        else:
            print(f"  {item_id}: {item.get('name', 'Unknown')} - NO USE DESCRIPTION FOUND")
    else:
        print(f"  {item_id}: NOT IN CACHE")

# Update the prices.ts file with new descriptions
for update in updates:
    item_id = update["id"]
    new_desc = update["description"].replace('"', '\\"')

    # Find and replace the description for this itemId
    pattern = rf'(itemId:\s*{item_id},\s*description:\s*")[^"]*(")'
    replacement = rf'\g<1>{new_desc}\g<2>'
    prices_content = re.sub(pattern, replacement, prices_content)

# Write updated file
with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(prices_content)

print(f"\n✅ Updated {len(updates)} descriptions in prices.ts")
