#!/usr/bin/env python3
"""
AtlasLoot Tailoring Recipe Parser

This script extracts and documents all Tailoring recipes from the AtlasLoot addon
for World of Warcraft (Turtle WoW).

Data Structure in AtlasLoot:
{ "s[spellID]", "icon", "=q[quality]=[Item Name]", "=ds=#sr# =so1=[orange] =so2=[yellow] =so3=[green] =so4=[gray]" }

Where:
- spellID: The WoW spell ID for crafting this item
- icon: Texture name for the item icon
- quality: 1=common (white), 2=uncommon (green), 3=rare (blue), 4=epic (purple)
- sr: Skill Required
- so1-so4: Skill levels where recipe is Orange/Yellow/Green/Gray
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
    # Pattern: { "s2963", "inv_fabric_linen_02", "=q1=Bolt of Linen Cloth", "=ds=#sr# =so1=1 =so2=25 =so3=37 =so4=50" }
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
                "orange": int(orange),  # Guaranteed skill-up
                "yellow": int(yellow),  # High chance skill-up
                "green": int(green),    # Low chance skill-up
                "gray": int(gray)       # No skill-up
            }
        }
    return None

def extract_tailoring_recipes(file_path):
    """Extract all Tailoring recipes from Crafting.lua"""

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the Tailoring section
    tailoring_match = re.search(r'-- Tailoring --.*?(?=^--\s*\w)', content, re.DOTALL | re.MULTILINE)

    if not tailoring_match:
        print("Could not find Tailoring section!")
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

    return categories

def generate_markdown_documentation(recipes_by_category):
    """Generate comprehensive Markdown documentation"""

    doc = "# AtlasLoot Tailoring Recipes Documentation\n\n"
    doc += "**Source:** Turtle WoW - AtlasLoot Addon\n\n"
    doc += "**Note:** This documentation shows skill requirements and progression. For material requirements, "
    doc += "you can look up each recipe by spell ID on sites like:\n"
    doc += "- [Turtle WoW Database](https://database.turtlecraft.gg/)\n"
    doc += "- [Classic WoW Database](https://classic.wowhead.com/)\n\n"

    doc += "## Understanding Skill Levels\n\n"
    doc += "- **Orange:** Guaranteed skill point gain\n"
    doc += "- **Yellow:** High chance of skill point gain\n"
    doc += "- **Green:** Low chance of skill point gain\n"
    doc += "- **Gray:** No skill point gain (recipe is trivial)\n\n"
    doc += "---\n\n"

    # Group categories by tier
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

    # Generate documentation for each tier
    for tier_name, categories in tier_groups.items():
        if not categories:
            continue

        doc += f"## {tier_name}\n\n"

        for cat_name in categories:
            recipes = recipes_by_category[cat_name]
            doc += f"### {cat_name} ({len(recipes)} recipes)\n\n"

            # Sort recipes by orange skill level
            recipes_sorted = sorted(recipes, key=lambda x: x["skill_levels"]["orange"])

            doc += "| Recipe Name | Quality | Spell ID | Orange | Yellow | Green | Gray |\n"
            doc += "|-------------|---------|----------|--------|--------|-------|------|\n"

            for recipe in recipes_sorted:
                doc += f"| {recipe['name']} | {recipe['quality']} | {recipe['spell_id']} | "
                doc += f"{recipe['skill_levels']['orange']} | {recipe['skill_levels']['yellow']} | "
                doc += f"{recipe['skill_levels']['green']} | {recipe['skill_levels']['gray']} |\n"

            doc += "\n"

    return doc

def generate_json_export(recipes_by_category):
    """Generate JSON export for programmatic use"""
    return json.dumps(recipes_by_category, indent=2)

def generate_csv_export(recipes_by_category):
    """Generate CSV export"""
    csv = "Category,Recipe Name,Quality,Spell ID,Orange,Yellow,Green,Gray\n"

    for cat_name, recipes in sorted(recipes_by_category.items()):
        for recipe in sorted(recipes, key=lambda x: x["skill_levels"]["orange"]):
            csv += f'"{cat_name}","{recipe["name"]}",{recipe["quality"]},{recipe["spell_id"]},'
            csv += f'{recipe["skill_levels"]["orange"]},{recipe["skill_levels"]["yellow"]},'
            csv += f'{recipe["skill_levels"]["green"]},{recipe["skill_levels"]["gray"]}\n'

    return csv

def main():
    """Main execution function"""

    input_file = r"C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua"
    output_dir = r"C:\Claude-Flow\output-files"

    print("[*] Parsing AtlasLoot Tailoring recipes...")
    recipes = extract_tailoring_recipes(input_file)

    if not recipes:
        print("[X] No recipes found!")
        return

    total_recipes = sum(len(r) for r in recipes.values())
    print(f"[+] Found {total_recipes} recipes across {len(recipes)} categories")

    # Generate outputs
    print("\n[*] Generating documentation...")

    # Markdown documentation
    markdown = generate_markdown_documentation(recipes)
    with open(f"{output_dir}/tailoring_recipes.md", 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f"[+] Created: {output_dir}/tailoring_recipes.md")

    # JSON export
    json_data = generate_json_export(recipes)
    with open(f"{output_dir}/tailoring_recipes.json", 'w', encoding='utf-8') as f:
        f.write(json_data)
    print(f"[+] Created: {output_dir}/tailoring_recipes.json")

    # CSV export
    csv_data = generate_csv_export(recipes)
    with open(f"{output_dir}/tailoring_recipes.csv", 'w', encoding='utf-8') as f:
        f.write(csv_data)
    print(f"[+] Created: {output_dir}/tailoring_recipes.csv")

    print("\n[*] Summary by Category:")
    for cat_name, recipe_list in sorted(recipes.items()):
        print(f"  - {cat_name}: {len(recipe_list)} recipes")

    print("\n[+] Documentation complete!")
    print(f"\n[!] Next steps:")
    print("   1. Review the generated markdown file for comprehensive documentation")
    print("   2. Use the JSON file for programmatic access to recipe data")
    print("   3. Use the CSV file for spreadsheet analysis")
    print("   4. Look up spell IDs on Turtle WoW database for material requirements")

if __name__ == "__main__":
    main()
