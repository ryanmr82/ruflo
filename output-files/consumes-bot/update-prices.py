#!/usr/bin/env python3
"""Update prices.ts: Remove Scrolls category and add 13 new items"""

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    content = f.read()

# 1. Remove the entire Scrolls category
import re
content = re.sub(r',?\s*scrolls:\s*\{[^}]*items:\s*\[[^\]]*\][^}]*\}', '', content, flags=re.DOTALL)

# 2. Add new items to food category (after existing food items)
new_food_items = '''
    { id: "DanozoDelight", name: "Danonzo's Tel'Abim Delight", itemId: 60977, description: "+22 Spell Damage for 15 min" },
    { id: "DanozoSurprise", name: "Danonzo's Tel'Abim Surprise", itemId: 60976, description: "+45 Ranged AP for 15 min" },
    { id: "DanozoMedley", name: "Danonzo's Tel'Abim Medley", itemId: 60978, description: "+2% Haste for 15 min" },
    { id: "PowerMushroom", name: "Power Mushroom", itemId: 51720, description: "+20 Strength for 15 min" },
    { id: "SmokedDesertDumplings", name: "Smoked Desert Dumplings", itemId: 20452, description: "+20 Strength for 15 min" },
    { id: "GilneasHotStew", name: "Gilneas Hot Stew", itemId: 84041, description: "+12 Spell Damage for 15 min" },
    { id: "RumseyRumBlackLabel", name: "Rumsey Rum Black Label", itemId: 21151, description: "+15 Stamina for 15 min" },
    { id: "TeaWithSugar", name: "Tea with Sugar", itemId: 15723, description: "Restores 525-876 HP and 810-1351 mana" },
    { id: "NordanaarHerbalTea", name: "Nordanaar Herbal Tea", itemId: 61675, description: "Restores 525-876 HP and 810-1351 mana" },'''

# Find the food category and add items before the closing bracket
food_pattern = r'(food:\s*\{[^}]*items:\s*\[[^\]]*)(]\s*\})'
match = re.search(food_pattern, content, flags=re.DOTALL)
if match:
    content = content[:match.end(1)] + new_food_items + content[match.end(1):]

# 3. Add elixirs to concoctions category
new_concoction_items = '''
    { id: "ElixirOfDemonslaying", name: "Elixir of Demonslaying", itemId: 9224, description: "+265 AP vs Demons for 5 min" },
    { id: "ElixirOfBruteForce", name: "Elixir of Brute Force", itemId: 13453, description: "+18 Str/Stam for 60 min" },
    { id: "Dreamtonic", name: "Dreamtonic", itemId: 61423, description: "+35 Spell Damage for 20 min" },'''

concoction_pattern = r'(concoctions:\s*\{[^}]*items:\s*\[[^\]]*)(]\s*\})'
match = re.search(concoction_pattern, content, flags=re.DOTALL)
if match:
    content = content[:match.end(1)] + new_concoction_items + content[match.end(1):]

# 4. Add Dense Sharpening Stone to weaponbuffs category
new_weaponbuff_item = '''
    { id: "DenseSharpeningStone", name: "Dense Sharpening Stone", itemId: 12404, description: "+8 Weapon Damage for 30 min" },'''

weaponbuff_pattern = r'(weaponbuffs:\s*\{[^}]*items:\s*\[[^\]]*)(]\s*\})'
match = re.search(weaponbuff_pattern, content, flags=re.DOTALL)
if match:
    content = content[:match.end(1)] + new_weaponbuff_item + content[match.end(1):]

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("Removed Scrolls category")
print("Added 9 new food items")
print("Added 3 new concoctions/elixirs")
print("Added 1 new weapon buff")
print("Total: 13 new items added")
