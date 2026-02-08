#!/usr/bin/env python3
"""Remove Bind-on-Pickup items from prices.ts"""

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    lines = f.readlines()

# Items to remove (BoP - can't be traded)
bop_items = [
    "JujuPower",
    "JujuMight",
    "JujuFlurry",
    "GroundScorpok",
    "ROIDS",
    "LungJuice",
    "DemonicRune",
    "CerebralCortex",
    "GizzardGum",
    "BlessedSunfruit",
    "BlessedSunfruitJuice",
    "TeaWithSugar",
]

new_lines = []
skip_count = 0
removed = []

for line in lines:
    should_skip = False
    for item_id in bop_items:
        if f'id: "{item_id}"' in line:
            should_skip = True
            removed.append(item_id)
            break

    if not should_skip:
        new_lines.append(line)
    else:
        skip_count += 1

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.writelines(new_lines)

print(f"Removed {skip_count} BoP items:")
for item in removed:
    print(f"  - {item}")
