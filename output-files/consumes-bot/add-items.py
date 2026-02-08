#!/usr/bin/env python3
# Add missing consumables to prices.ts

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "r") as f:
    content = f.read()

# Items to add to different sections

# 1. Add melee items after GoblinSapper
melee_additions = '''      { id: "WinterfallFirewater", name: "Winterfall Firewater", itemId: 12820, description: "+35 Attack Power for 20 min." },
      { id: "JujuPower", name: "Juju Power", itemId: 12451, description: "+30 Strength for 30 min." },
      { id: "JujuMight", name: "Juju Might", itemId: 12460, description: "+40 Attack Power for 10 min." },
      { id: "JujuFlurry", name: "Juju Flurry", itemId: 12450, description: "+3% Attack Speed for 20 sec." },
      { id: "ROIDS", name: "R.O.I.D.S.", itemId: 8410, description: "+25 Strength for 1 hour. Blasted Lands." },
      { id: "GroundScorpok", name: "Ground Scorpok Assay", itemId: 8412, description: "+25 Agility for 1 hour. Blasted Lands." },
      { id: "LungJuice", name: "Lung Juice Cocktail", itemId: 8411, description: "+25 Stamina for 1 hour. Blasted Lands." }'''

# Find and replace melee section ending
old_melee_end = '{ id: "GoblinSapper", name: "Goblin Sapper Charge", itemId: 10646, description: "450-750 fire damage to nearby enemies and yourself." }\n    ]\n  },'
new_melee_end = '{ id: "GoblinSapper", name: "Goblin Sapper Charge", itemId: 10646, description: "450-750 fire damage to nearby enemies and yourself." },\n' + melee_additions + '\n    ]\n  },'
content = content.replace(old_melee_end, new_melee_end)

# 2. Add caster items after Dreamshard
caster_additions = '''      { id: "CerebralCortex", name: "Cerebral Cortex Compound", itemId: 8423, description: "+25 Intellect for 1 hour. Blasted Lands." },
      { id: "GizzardGum", name: "Gizzard Gum", itemId: 8424, description: "+25 Spirit for 1 hour. Blasted Lands." },
      { id: "DarkRune", name: "Dark Rune", itemId: 20520, description: "Restores 900-1500 mana. Costs HP. 15 min CD." },
      { id: "DemonicRune", name: "Demonic Rune", itemId: 12662, description: "Restores 900-1500 mana. Costs HP. No CD." },
      { id: "SpiritOfZanza", name: "Spirit of Zanza", itemId: 20079, description: "+50 Stamina and Spirit for 2 hours." }'''

old_caster_end = '{ id: "Dreamshard", name: "Dreamshard Elixir", itemId: 61423, description: "+30 Spell Damage and Healing for 1 hour." }\n    ]\n  },'
new_caster_end = '{ id: "Dreamshard", name: "Dreamshard Elixir", itemId: 61423, description: "+30 Spell Damage and Healing for 1 hour." },\n' + caster_additions + '\n    ]\n  },'
content = content.replace(old_caster_end, new_caster_end)

# 3. Add food items after MedivhMerlotBlue
food_additions = '''      { id: "BlessedSunfruit", name: "Blessed Sunfruit", itemId: 13810, description: "+10 Strength for 10 min." },
      { id: "BlessedSunfruitJuice", name: "Blessed Sunfruit Juice", itemId: 13813, description: "+10 Spirit for 10 min." },
      { id: "DragonbreathChili", name: "Dragonbreath Chili", itemId: 12217, description: "Fire damage proc when hit for 10 min." }'''

old_food_end = '{ id: "MedivhMerlotBlue", name: "Medivh\'s Merlot Blue", itemId: 61175, description: "+15 Intellect for 15 min." }\n    ]\n  },'
new_food_end = '{ id: "MedivhMerlotBlue", name: "Medivh\'s Merlot Blue", itemId: 61175, description: "+15 Intellect for 15 min." },\n' + food_additions + '\n    ]\n  },'
content = content.replace(old_food_end, new_food_end)

# 4. Add protection items after Quickness
protection_additions = '''      { id: "MagicResistance", name: "Magic Resistance Potion", itemId: 9036, description: "+50 All Magic Resistance for 3 min." },
      { id: "MajorHealing", name: "Major Healing Potion", itemId: 13446, description: "Restores 1050-1750 health." },
      { id: "GreaterMana", name: "Greater Mana Potion", itemId: 6149, description: "Restores 700-900 mana." }'''

old_protection_end = '{ id: "Quickness", name: "Potion of Quickness", itemId: 5631, description: "+50% attack speed for 15 seconds." }\n    ]\n  },'
new_protection_end = '{ id: "Quickness", name: "Potion of Quickness", itemId: 5631, description: "+50% attack speed for 15 seconds." },\n' + protection_additions + '\n    ]\n  },'
content = content.replace(old_protection_end, new_protection_end)

# 5. Add scrolls category before flasks
scrolls_category = '''  "scrolls": {
    name: "Scrolls",
    items: [
      { id: "ScrollStrength4", name: "Scroll of Strength IV", itemId: 10310, description: "+17 Strength for 30 min." },
      { id: "ScrollAgility4", name: "Scroll of Agility IV", itemId: 10309, description: "+17 Agility for 30 min." },
      { id: "ScrollSpirit4", name: "Scroll of Spirit IV", itemId: 10306, description: "+17 Spirit for 30 min." },
      { id: "ScrollStamina4", name: "Scroll of Stamina IV", itemId: 10307, description: "+17 Stamina for 30 min." },
      { id: "ScrollIntellect4", name: "Scroll of Intellect IV", itemId: 10308, description: "+17 Intellect for 30 min." },
      { id: "ScrollProtection4", name: "Scroll of Protection IV", itemId: 10305, description: "+240 Armor for 30 min." }
    ]
  },
'''

content = content.replace('  "flasks": {', scrolls_category + '  "flasks": {')

with open("/home/opc/tbc-website/routes/api/consumes/prices.ts", "w") as f:
    f.write(content)

print("Items added successfully!")
print("Added:")
print("- 7 melee items (Winterfall Firewater, Jujus, Blasted Lands)")
print("- 5 caster items (Cerebral Cortex, Gizzard Gum, Runes, Spirit of Zanza)")
print("- 3 food items (Blessed Sunfruit, Dragonbreath Chili)")
print("- 3 protection items (Magic Resistance, Major Healing, Greater Mana)")
print("- 6 scroll items (new Scrolls category)")
