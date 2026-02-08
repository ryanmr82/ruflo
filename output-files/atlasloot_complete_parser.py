#!/usr/bin/env python3
"""
Complete AtlasLoot Tailoring Recipe Parser with Materials

This script extracts COMPLETE Tailoring recipe information including:
- Recipe name and quality
- Skill requirements (Orange/Yellow/Green/Gray)
- Material requirements (item IDs and quantities)
- Crafting time
- Tools required

Data is extracted from:
- Crafting.lua: Recipe skill requirements
- Spells.lua: Material requirements and crafting details
"""

import re
import json

def parse_quality(quality_code):
    """Convert quality code to readable name"""
    qualities = {
        "q1": "Common",
        "q2": "Uncommon",
        "q3": "Rare",
        "q4": "Epic"
    }
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

def parse_spells_lua(file_path):
    """Extract material requirements from Spells.lua"""
    print("[*] Parsing Spells.lua for material data...")

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    spells_data = {}

    # Split content into individual spell entries
    # Pattern: [spellID] = { ... },
    spell_entries = re.findall(r'\[(\d+)\]\s*=\s*\{(.*?)\n\t\},', content, re.DOTALL)

    for spell_id, spell_content in spell_entries:

        spell_info = {
            "materials": [],
            "tools": [],
            "craft_item": None,
            "cast_time": None
        }

        # Extract craftItem
        craft_match = re.search(r'\["craftItem"\]\s*=\s*(\d+)', spell_content)
        if craft_match:
            spell_info["craft_item"] = craft_match.group(1)

        # Extract castTime
        time_match = re.search(r'\["castTime"\]\s*=\s*([\d.]+)', spell_content)
        if time_match:
            spell_info["cast_time"] = float(time_match.group(1))

        # Extract reagents/materials
        reagents_match = re.search(r'\["reagents"\]\s*=\s*\{([^}]+)\}', spell_content)
        if reagents_match:
            reagents_content = reagents_match.group(1)
            # Parse material entries like { 2589, 2 } or { 2996 }
            material_pattern = r'\{\s*(\d+)(?:,\s*(\d+))?\s*\}'
            for mat_match in re.finditer(material_pattern, reagents_content):
                item_id = mat_match.group(1)
                quantity = mat_match.group(2) if mat_match.group(2) else "1"
                spell_info["materials"].append({
                    "item_id": item_id,
                    "quantity": int(quantity)
                })

        # Extract tools
        tools_match = re.search(r'\["tools"\]\s*=\s*\{([^}]+)\}', spell_content)
        if tools_match:
            tools_content = tools_match.group(1)
            tool_ids = re.findall(r'(\d+)', tools_content)
            spell_info["tools"] = tool_ids

        if spell_info["materials"] or spell_info["craft_item"]:
            spells_data[spell_id] = spell_info

    print(f"[+] Found material data for {len(spells_data)} spells")
    return spells_data

def extract_tailoring_recipes(crafting_file):
    """Extract all Tailoring recipes from Crafting.lua"""
    print("[*] Parsing Crafting.lua for recipe data...")

    with open(crafting_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the Tailoring section
    tailoring_match = re.search(r'-- Tailoring --.*?(?=^--\s*\w)', content, re.DOTALL | re.MULTILINE)

    if not tailoring_match:
        print("[X] Could not find Tailoring section!")
        return {}

    tailoring_section = tailoring_match.group(0)

    # Extract all recipe categories
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

            # Merge with spell data if available
            if spell_id in spells_data:
                recipe["materials"] = spells_data[spell_id]["materials"]
                recipe["tools"] = spells_data[spell_id]["tools"]
                recipe["cast_time"] = spells_data[spell_id]["cast_time"]
                matched += 1
            else:
                recipe["materials"] = []
                recipe["tools"] = []
                recipe["cast_time"] = None
                unmatched += 1

            complete_recipes[category] = recipes

    print(f"[+] Matched materials for {matched} recipes")
    if unmatched > 0:
        print(f"[!] {unmatched} recipes without material data (may be learned from trainers)")

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

    # Group by tier
    tier_groups = {
        "Apprentice (1-75)": [],
        "Journeyman (75-150)": [],
        "Expert (150-225)": [],
        "Artisan (225-300)": [],
        "By Slot": []
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
        else:
            tier_groups["By Slot"].append(cat_name)

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

                if recipe.get("materials"):
                    doc += "- **Materials Required:**\n"
                    for mat in recipe["materials"]:
                        doc += f"  - Item ID {mat['item_id']}: x{mat['quantity']}\n"
                else:
                    doc += "- **Materials:** Learn from trainer or recipe drop\n"

                if recipe.get("tools"):
                    doc += f"- **Tools Required:** {', '.join(recipe['tools'])}\n"

                doc += "\n"

            doc += "---\n\n"

    return doc

def main():
    """Main execution function"""

    crafting_file = r"C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua"
    spells_file = r"C:\turtlewow\Interface\AddOns\AtlasLoot\Core\Spells.lua"
    output_dir = r"C:\Claude-Flow\output-files"

    print("\n" + "="*60)
    print("AtlasLoot Complete Recipe Parser")
    print("="*60 + "\n")

    # Step 1: Extract crafting recipes
    crafting_recipes = extract_tailoring_recipes(crafting_file)
    if not crafting_recipes:
        return

    # Step 2: Extract material data
    spells_data = parse_spells_lua(spells_file)

    # Step 3: Merge the data
    complete_recipes = merge_recipe_data(crafting_recipes, spells_data)

    # Step 4: Generate outputs
    print("\n[*] Generating complete documentation...")

    # Complete Markdown
    markdown = generate_complete_markdown(complete_recipes)
    with open(f"{output_dir}/tailoring_complete.md", 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f"[+] Created: {output_dir}/tailoring_complete.md")

    # Complete JSON
    with open(f"{output_dir}/tailoring_complete.json", 'w', encoding='utf-8') as f:
        json.dump(complete_recipes, f, indent=2)
    print(f"[+] Created: {output_dir}/tailoring_complete.json")

    # CSV with materials
    csv = "Category,Recipe Name,Quality,Spell ID,Orange,Yellow,Green,Gray,Materials,Cast Time\n"
    for cat_name, recipes in sorted(complete_recipes.items()):
        for recipe in sorted(recipes, key=lambda x: x["skill_levels"]["orange"]):
            materials_str = "; ".join([f"{m['item_id']}x{m['quantity']}" for m in recipe.get("materials", [])])
            if not materials_str:
                materials_str = "See trainer"

            csv += f'"{cat_name}","{recipe["name"]}",{recipe["quality"]},{recipe["spell_id"]},'
            csv += f'{recipe["skill_levels"]["orange"]},{recipe["skill_levels"]["yellow"]},'
            csv += f'{recipe["skill_levels"]["green"]},{recipe["skill_levels"]["gray"]},'
            csv += f'"{materials_str}",{recipe.get("cast_time", "")}\n'

    with open(f"{output_dir}/tailoring_complete.csv", 'w', encoding='utf-8') as f:
        f.write(csv)
    print(f"[+] Created: {output_dir}/tailoring_complete.csv")

    print("\n" + "="*60)
    print("[+] COMPLETE! All recipe data extracted with materials")
    print("="*60)
    print(f"\nTotal recipes documented: {sum(len(r) for r in complete_recipes.values())}")
    print("\nYou now have:")
    print("  - Complete skill requirements")
    print("  - Material requirements (item IDs)")
    print("  - Crafting times")
    print("  - Tool requirements")
    print("\nLook up item IDs at: https://database.turtlecraft.gg/")

if __name__ == "__main__":
    main()
