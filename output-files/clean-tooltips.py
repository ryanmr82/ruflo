#!/usr/bin/env python3
import json
import re

with open("static/item-tooltips.json", "r") as f:
    data = json.load(f)

# Pattern to remove: <span style="color:#1eff00">+XX Something</span>
# But keep class-based styling like <span class="q2">
pattern = r'<span style="color:#1eff00">([^<]*)</span>'

count = 0
for item_id, item in data.items():
    if "tooltipHtml" in item:
        old = item["tooltipHtml"]
        new = re.sub(pattern, r'\1', old)
        if old != new:
            item["tooltipHtml"] = new
            count += 1

with open("static/item-tooltips.json", "w") as f:
    json.dump(data, f, indent=2)

print(f"Cleaned {count} items")
