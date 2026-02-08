#!/usr/bin/env python3
"""Fix prices.ts: Remove scrolls, add new items"""

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    lines = f.readlines()

content = "".join(lines)

# 1. Remove the entire scrolls section
scrolls_start = content.find('"scrolls": {')
if scrolls_start != -1:
    # Find the closing } for scrolls and the following , or whitespace
    depth = 0
    i = scrolls_start
    while i < len(content):
        if content[i] == '{':
            depth += 1
        elif content[i] == '}':
            depth -= 1
            if depth == 0:
                # Found the end of scrolls section
                scrolls_end = i + 1
                # Also remove any trailing comma
                while scrolls_end < len(content) and content[scrolls_end] in ' \n\t':
                    scrolls_end += 1
                if scrolls_end < len(content) and content[scrolls_end] == ',':
                    scrolls_end += 1
                content = content[:scrolls_start] + content[scrolls_end:]
                break
        i += 1

# 2. Add new food items after DragonbreathChili
new_food = '''      { id: "DanozoDelight", name: "Danonzo's Tel'Abim Delight", itemId: 60977, description: "+22 Spell Damage for 15 min. (Well Fed)" },
      { id: "DanozoSurprise", name: "Danonzo's Tel'Abim Surprise", itemId: 60976, description: "+45 Ranged AP for 15 min. (Well Fed)" },
      { id: "DanozoMedley", name: "Danonzo's Tel'Abim Medley", itemId: 60978, description: "+2% Haste for 15 min. (Well Fed)" },
      { id: "PowerMushroom", name: "Power Mushroom", itemId: 51720, description: "+20 Strength for 15 min. (Well Fed)" },
      { id: "SmokedDesertDumplings", name: "Smoked Desert Dumplings", itemId: 20452, description: "+20 Strength for 15 min. (Well Fed)" },
      { id: "GilneasHotStew", name: "Gilneas Hot Stew", itemId: 84041, description: "+12 Spell Damage for 15 min. (Well Fed)" },
      { id: "RumseyRumBlackLabel", name: "Rumsey Rum Black Label", itemId: 21151, description: "+15 Stamina for 15 min." },
      { id: "TeaWithSugar", name: "Tea with Sugar", itemId: 15723, description: "Restores 525-876 HP and 810-1351 mana." },
      { id: "NordanaarHerbalTea", name: "Nordanaar Herbal Tea", itemId: 61675, description: "Restores 525-876 HP and 810-1351 mana." },
'''

# Find DragonbreathChili line and insert after it
dragonbreath_pattern = '{ id: "DragonbreathChili"'
dragonbreath_pos = content.find(dragonbreath_pattern)
if dragonbreath_pos != -1:
    # Find end of that line
    line_end = content.find('\n', dragonbreath_pos)
    if line_end != -1:
        content = content[:line_end+1] + new_food + content[line_end+1:]

# 3. Add new concoctions after Dreamwater
new_concoctions = '''      { id: "ElixirOfDemonslaying", name: "Elixir of Demonslaying", itemId: 9224, description: "+265 AP vs Demons for 5 min." },
      { id: "ElixirOfBruteForce", name: "Elixir of Brute Force", itemId: 13453, description: "+18 Str/Stam for 60 min." },
      { id: "Dreamtonic", name: "Dreamtonic", itemId: 61423, description: "+35 Spell Damage for 20 min." },
'''

dreamwater_pattern = '{ id: "Dreamwater"'
dreamwater_pos = content.find(dreamwater_pattern)
if dreamwater_pos != -1:
    line_end = content.find('\n', dreamwater_pos)
    if line_end != -1:
        content = content[:line_end+1] + new_concoctions + content[line_end+1:]

# 4. Add Dense Sharpening Stone to weaponbuffs (after BrilliantWizardOil)
new_weaponbuff = '''      { id: "DenseSharpeningStone", name: "Dense Sharpening Stone", itemId: 12404, description: "+8 Weapon Damage for 30 min." },
'''

brilliantwizard_pattern = '{ id: "BrilliantWizardOil"'
brilliantwizard_pos = content.find(brilliantwizard_pattern)
if brilliantwizard_pos != -1:
    line_end = content.find('\n', brilliantwizard_pos)
    if line_end != -1:
        content = content[:line_end+1] + new_weaponbuff + content[line_end+1:]

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("Done!")
print("- Removed scrolls category")
print("- Added 9 new food items")
print("- Added 3 new concoctions")
print("- Added 1 new weapon buff")
