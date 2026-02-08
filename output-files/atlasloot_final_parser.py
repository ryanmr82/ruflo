#!/usr/bin/env python3
"""
FINAL Complete AtlasLoot Tailoring Recipe Parser with Materials
Uses line-by-line parsing for better accuracy
"""

import re
import json

def parse_quality(quality_code):
    """Convert quality code to readable name"""
    qualities = {"q1": "Common", "q2": "Uncommon", "q3": "Rare", "q4": "Epic"}
    return qualities.get(quality_code, "Unknown")

def parse_recipe_line(line):
    """Parse a single recipe line from Crafting.lua"""
    pattern = r'\{\s*"s(\d+)",\s*"([^"]+)",\s*"=q(\d)=([^"]+)",\s*"=ds=#sr#\s*=so1=(\d+)\s*=so2=(\d+)\s*=so3=(\d+)\s*=so4=(\d+)"\s*\}'
    match = re.search(pattern, line)
    if match:
        spell_id, icon, quality, name, orange, yellow, green, gray = match.groups()
        return {
            "spell_id": spell_id,
            "name": name,
            "icon": icon,
            "quality": parse_quality(f"q{quality}"),
            "skill_levels": {
                "orange": int(orange),
                "yellow": int(yellow),
                "green": int(green),
                "gray": int(gray)
            }
        }
    return None

def parse_spells_lua_line_by_line(file_path):
    """Parse Spells.lua line by line to extract material data"""
    print("[*] Parsing Spells.lua line by line for material data...")

    spells_data = {}
    current_spell_id = None
    current_spell = None
    in_reagents = False
    brace_depth = 0

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            # Check for new spell entry: [spellID] = {
            spell_match = re.match(r'\s*\[(\d+)\]\s*=\s*\{', line)
            if spell_match:
                current_spell_id = spell_match.group(1)
                current_spell = {
                    "materials": [],
                    "tools": [],
                    "craft_item": None,
                    "cast_time": None
                }
                brace_depth = 1
                in_reagents = False
                continue

            if current_spell_id is None:
                continue

            # Track brace depth
            brace_depth += line.count('{') - line.count('}')

            # Extract craftItem
            craft_match = re.search(r'\["craftItem"\]\s*=\s*(\d+)', line)
            if craft_match:
                current_spell["craft_item"] = craft_match.group(1)

            # Extract castTime
            time_match = re.search(r'\["castTime"\]\s*=\s*([\d.]+)', line)
            if time_match:
                current_spell["cast_time"] = float(time_match.group(1))

            # Check if entering reagents block
            if '["reagents"]' in line and '{' in line:
                in_reagents = True
                continue

            # Parse reagent entries
            if in_reagents:
                # Check for reagent line like: { 2996 } or { 2996, 2 }
                reagent_match = re.search(r'\{\s*(\d+)(?:,\s*(\d+))?\s*\}', line)
                if reagent_match:
                    item_id = reagent_match.group(1)
                    quantity = reagent_match.group(2) if reagent_match.group(2) else "1"
                    current_spell["materials"].append({
                        "item_id": item_id,
                        "quantity": int(quantity)
                    })

                # Check if exiting reagents block
                if '},' in line and not '{' in line:
                    in_reagents = False

            # Extract tools
            tools_match = re.search(r'\["tools"\]\s*=\s*\{\s*(\d+)', line)
            if tools_match:
                current_spell["tools"].append(tools_match.group(1))

            # Check if spell entry is complete
            if brace_depth == 0 and current_spell_id:
                if current_spell["materials"] or current_spell["craft_item"] or current_spell["cast_time"]:
                    spells_data[current_spell_id] = current_spell
                current_spell_id = None
                current_spell = None

    print(f"[+] Found material data for {len(spells_data)} spells")

    # Debug: Show some tailoring spells
    tailoring_spells = [k for k in spells_data.keys() if k in ["2385", "2387", "2963", "3915"]]
    if tailoring_spells:
        print(f"[*] Sample tailoring spells found: {', '.join(tailoring_spells)}")
        for spell_id in tailoring_spells[:2]:
            print(f"    Spell {spell_id}: {len(spells_data[spell_id]['materials'])} materials")

    return spells_data

def extract_tailoring_recipes(crafting_file):
    """Extract all Tailoring recipes from Crafting.lua"""
    print("[*] Parsing Crafting.lua for recipe data...")

    with open(crafting_file, 'r', encoding='utf-8') as f:
        content = f.read()

    tailoring_match = re.search(r'-- Tailoring --.*?(?=^--\s*\w)', content, re.DOTALL | re.MULTILINE)
    if not tailoring_match:
        print("[X] Could not find Tailoring section!")
        return {}

    tailoring_section = tailoring_match.group(0)
    categories = {}
    category_pattern = r'(Tailoring(?:Apprentice|Journeyman|Expert|Artisan|Helm|Shoulders|Cloak|Chest|Bracers|Gloves|Belt|Pants|Boots|Bags|Shirt|Misc)\d*)\s*=\s*\{(.*?\n\t\};)'

    for match in re.finditer(category_pattern, tailoring_section, re.DOTALL):
        category_name = match.group(1)
        category_content = match.group(2)
        recipes = []
        for line in category_content.split('\n'):
            recipe = parse_recipe_line(line)
            if recipe:
                recipes.append(recipe)
        if recipes:
            categories[category_name] = recipes

    total = sum(len(r) for r in categories.values())
    print(f"[+] Found {total} recipes across {len(categories)} categories")
    return categories

def merge_recipe_data(crafting_recipes, spells_data):
    """Merge crafting recipes with material data"""
    print("[*] Merging recipe and material data...")

    complete_recipes = {}
    matched = 0
    unmatched = 0

    for category, recipes in crafting_recipes.items():
        complete_recipes[category] = []

        for recipe in recipes:
            spell_id = recipe["spell_id"]

            if spell_id in spells_data:
                recipe["materials"] = spells_data[spell_id]["materials"]
                recipe["tools"] = spells_data[spell_id]["tools"]
                recipe["cast_time"] = spells_data[spell_id]["cast_time"]
                recipe["craft_item"] = spells_data[spell_id]["craft_item"]
                matched += 1
            else:
                recipe["materials"] = []
                recipe["tools"] = []
                recipe["cast_time"] = None
                recipe["craft_item"] = None
                unmatched += 1

            complete_recipes[category].append(recipe)

    print(f"[+] Matched materials for {matched} recipes")
    if unmatched > 0:
        print(f"[!] {unmatched} recipes without material data")

    return complete_recipes

def generate_complete_markdown(recipes_by_category):
    """Generate comprehensive Markdown documentation with materials"""

    doc = "# Complete AtlasLoot Tailoring Recipes Documentation\n\n"
    doc += "**Source:** Turtle WoW - AtlasLoot Addon\n\n"
    doc += "**Includes:** Recipe names, skill requirements, AND material requirements\n\n"
    doc += "## Understanding Skill Levels\n\n"
    doc += "- **Orange:** Guaranteed skill point gain\n"
    doc += "- **Yellow:** High chance of skill point gain\n"
    doc += "- **Green:** Low chance of skill point gain\n"
    doc += "- **Gray:** No skill point gain (recipe is trivial)\n\n"
    doc += "---\n\n"

    tier_groups = {
        "Apprentice (1-75)": [],
        "Journeyman (75-150)": [],
        "Expert (150-225)": [],
        "Artisan (225-300)": [],
    }

    for cat_name in sorted(recipes_by_category.keys()):
        if "Apprentice" in cat_name:
            tier_groups["Apprentice (1-75)"].append(cat_name)
        elif "Journeyman" in cat_name:
            tier_groups["Journeyman (75-150)"].append(cat_name)
        elif "Expert" in cat_name:
            tier_groups["Expert (150-225)"].append(cat_name)
        elif "Artisan" in cat_name:
            tier_groups["Artisan (225-300)"].append(cat_name)

    for tier_name, categories in tier_groups.items():
        if not categories:
            continue

        doc += f"## {tier_name}\n\n"

        for cat_name in categories:
            recipes = recipes_by_category[cat_name]
            doc += f"### {cat_name} ({len(recipes)} recipes)\n\n"
            recipes_sorted = sorted(recipes, key=lambda x: x["skill_levels"]["orange"])

            for recipe in recipes_sorted:
                doc += f"#### {recipe['name']}\n"
                doc += f"- **Quality:** {recipe['quality']}\n"
                doc += f"- **Spell ID:** {recipe['spell_id']}\n"
                doc += f"- **Skill Required:** {recipe['skill_levels']['orange']} (Orange) / "
                doc += f"{recipe['skill_levels']['yellow']} (Yellow) / "
                doc += f"{recipe['skill_levels']['green']} (Green) / "
                doc += f"{recipe['skill_levels']['gray']} (Gray)\n"

                if recipe.get("cast_time"):
                    doc += f"- **Cast Time:** {recipe['cast_time']} seconds\n"

                if recipe.get("materials") and len(recipe["materials"]) > 0:
                    doc += "- **Materials Required:**\n"
                    for mat in recipe["materials"]:
                        doc += f"  - Item ID {mat['item_id']}: x{mat['quantity']}\n"
                else:
                    doc += "- **Materials:** Trainer-taught (no materials shown)\n"

                if recipe.get("tools") and len(recipe["tools"]) > 0:
                    doc += f"- **Tools Required:** {', '.join(recipe['tools'])}\n"

                doc += "\n"

            doc += "---\n\n"

    doc += "\n## Item ID Reference\n\n"
    doc += "Look up item IDs at: https://database.turtlecraft.gg/?item=[ID]\n\n"
    doc += "Common Tailoring Materials:\n"
    doc += "- 2589: Linen Cloth\n"
    doc += "- 2592: Wool Cloth\n"
    doc += "- 4306: Silk Cloth\n"
    doc += "- 4338: Mageweave Cloth\n"
    doc += "- 14047: Runecloth\n"
    doc += "- 2320: Coarse Thread\n"
    doc += "- 2321: Fine Thread\n"
    doc += "- 2996: Bolt of Linen Cloth\n"
    doc += "- 2997: Bolt of Woolen Cloth\n"

    return doc

def main():
    """Main execution function"""

    crafting_file = r"C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua"
    spells_file = r"C:\turtlewow\Interface\AddOns\AtlasLoot\Core\Spells.lua"
    output_dir = r"C:\Claude-Flow\output-files"

    print("\n" + "="*60)
    print("AtlasLoot FINAL Complete Recipe Parser")
    print("="*60 + "\n")

    crafting_recipes = extract_tailoring_recipes(crafting_file)
    if not crafting_recipes:
        return

    spells_data = parse_spells_lua_line_by_line(spells_file)
    complete_recipes = merge_recipe_data(crafting_recipes, spells_data)

    print("\n[*] Generating complete documentation...")

    markdown = generate_complete_markdown(complete_recipes)
    with open(f"{output_dir}/tailoring_COMPLETE.md", 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f"[+] Created: {output_dir}/tailoring_COMPLETE.md")

    with open(f"{output_dir}/tailoring_COMPLETE.json", 'w', encoding='utf-8') as f:
        json.dump(complete_recipes, f, indent=2)
    print(f"[+] Created: {output_dir}/tailoring_COMPLETE.json")

    csv = "Category,Recipe Name,Quality,Spell ID,Orange,Yellow,Green,Gray,Materials,Cast Time\n"
    for cat_name, recipes in sorted(complete_recipes.items()):
        for recipe in sorted(recipes, key=lambda x: x["skill_levels"]["orange"]):
            materials_str = "; ".join([f"{m['item_id']}x{m['quantity']}" for m in recipe.get("materials", [])])
            if not materials_str:
                materials_str = "Trainer"

            csv += f'"{cat_name}","{recipe["name"]}",{recipe["quality"]},{recipe["spell_id"]},'
            csv += f'{recipe["skill_levels"]["orange"]},{recipe["skill_levels"]["yellow"]},'
            csv += f'{recipe["skill_levels"]["green"]},{recipe["skill_levels"]["gray"]},'
            csv += f'"{materials_str}",{recipe.get("cast_time", "")}\n'

    with open(f"{output_dir}/tailoring_COMPLETE.csv", 'w', encoding='utf-8') as f:
        f.write(csv)
    print(f"[+] Created: {output_dir}/tailoring_COMPLETE.csv")

    print("\n" + "="*60)
    print("[+] COMPLETE! All recipe data extracted with materials")
    print("="*60)
    print(f"\nTotal recipes documented: {sum(len(r) for r in complete_recipes.values())}")

if __name__ == "__main__":
    main()
