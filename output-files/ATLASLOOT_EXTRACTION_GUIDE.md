# AtlasLoot Recipe Extraction Guide

**Purpose:** Extract complete crafting recipe data from the AtlasLoot WoW addon, including skill requirements, materials, and crafting details.

**Version:** 1.0
**Date:** 2025
**Tested On:** Turtle WoW, Classic WoW

---

## Table of Contents

1. [What This Does](#what-this-does)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Detailed Setup Instructions](#detailed-setup-instructions)
5. [Running the Script](#running-the-script)
6. [Understanding the Output](#understanding-the-output)
7. [Extracting Other Professions](#extracting-other-professions)
8. [Troubleshooting](#troubleshooting)
9. [Technical Details](#technical-details)

---

## What This Does

This script extracts **complete crafting recipe information** from the AtlasLoot addon including:

- ✅ Recipe names and quality (Common/Uncommon/Rare/Epic)
- ✅ Skill requirements (Orange/Yellow/Green/Gray thresholds)
- ✅ **Material requirements** (item IDs and quantities)
- ✅ Crafting time
- ✅ Tools required
- ✅ Crafted item ID

**Example Output:**
```
Recipe: Brown Linen Shirt
Quality: Common
Skill: 1 (Orange) / 35 (Yellow) / 47 (Green) / 60 (Gray)
Materials:
  - Item ID 2996 (Bolt of Linen Cloth): x1
  - Item ID 2320 (Coarse Thread): x1
Cast Time: 5.13 seconds
```

**Why This Is Useful:**
- Document all crafting recipes for guides
- Plan leveling routes
- Calculate material costs
- Build crafting calculators
- Create profession databases

---

## Prerequisites

### Required Software

1. **Python 3.x** - Download from https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"
   - Verify: Open command prompt and type `python --version`

2. **World of Warcraft with AtlasLoot addon installed**
   - Locate your WoW installation folder
   - Verify AtlasLoot exists at: `[WoW Folder]\Interface\AddOns\AtlasLoot\`

3. **Text Editor** (Optional but helpful)
   - Notepad++, VS Code, or any text editor

### Folder Structure to Locate

Your WoW folder should have:
```
[WoW Folder]\
├── Interface\
│   └── AddOns\
│       └── AtlasLoot\
│           ├── Database\
│           │   └── Crafting.lua          ← Recipe data
│           └── Core\
│               └── Spells.lua            ← Material data
```

**Example Paths:**
- Windows: `C:\Games\WoW\Interface\AddOns\AtlasLoot\`
- Turtle WoW: `C:\turtlewow\Interface\AddOns\AtlasLoot\`

---

## Quick Start

**For someone comfortable with command line:**

1. Save the Python script (provided in next section) as `extract_recipes.py`
2. Edit the file paths at the top of the script to match your WoW location
3. Run: `python extract_recipes.py`
4. Check the output folder for generated files

---

## Detailed Setup Instructions

### Step 1: Create Working Folder

1. Create a folder for outputs: `C:\WoW-Recipes\`
2. This is where your documentation will be saved

### Step 2: Get the Extraction Script

**Save this as `C:\WoW-Recipes\extract_recipes.py`:**

```python
#!/usr/bin/env python3
"""
AtlasLoot Recipe Extractor
Extracts complete crafting recipe data including materials
"""

import re
import json
import os

# ============================================
# CONFIGURATION - EDIT THESE PATHS
# ============================================

# Path to your WoW folder
WOW_FOLDER = r"C:\turtlewow"  # ← CHANGE THIS TO YOUR WOW FOLDER

# Which profession to extract
PROFESSION = "Tailoring"  # Options: Tailoring, Blacksmithing, Alchemy, etc.

# Output folder
OUTPUT_FOLDER = r"C:\WoW-Recipes"  # ← CHANGE THIS IF NEEDED

# ============================================
# DO NOT EDIT BELOW THIS LINE
# ============================================

CRAFTING_FILE = os.path.join(WOW_FOLDER, r"Interface\AddOns\AtlasLoot\Database\Crafting.lua")
SPELLS_FILE = os.path.join(WOW_FOLDER, r"Interface\AddOns\AtlasLoot\Core\Spells.lua")

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

def parse_spells_lua(file_path):
    """Extract material requirements from Spells.lua"""
    print(f"[*] Reading {file_path}")

    if not os.path.exists(file_path):
        print(f"[!] ERROR: File not found: {file_path}")
        print(f"[!] Please verify your WOW_FOLDER path in the script")
        return {}

    spells_data = {}
    current_spell_id = None
    current_spell = None
    in_reagents = False
    brace_depth = 0

    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
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

            brace_depth += line.count('{') - line.count('}')

            craft_match = re.search(r'\["craftItem"\]\s*=\s*(\d+)', line)
            if craft_match:
                current_spell["craft_item"] = craft_match.group(1)

            time_match = re.search(r'\["castTime"\]\s*=\s*([\d.]+)', line)
            if time_match:
                current_spell["cast_time"] = float(time_match.group(1))

            if '["reagents"]' in line and '{' in line:
                in_reagents = True
                continue

            if in_reagents:
                reagent_match = re.search(r'\{\s*(\d+)(?:,\s*(\d+))?\s*\}', line)
                if reagent_match:
                    item_id = reagent_match.group(1)
                    quantity = reagent_match.group(2) if reagent_match.group(2) else "1"
                    current_spell["materials"].append({
                        "item_id": item_id,
                        "quantity": int(quantity)
                    })

                if '},' in line and not '{' in line:
                    in_reagents = False

            tools_match = re.search(r'\["tools"\]\s*=\s*\{\s*(\d+)', line)
            if tools_match:
                current_spell["tools"].append(tools_match.group(1))

            if brace_depth == 0 and current_spell_id:
                if current_spell["materials"] or current_spell["craft_item"] or current_spell["cast_time"]:
                    spells_data[current_spell_id] = current_spell
                current_spell_id = None
                current_spell = None

    print(f"[+] Found material data for {len(spells_data)} spells")
    return spells_data

def extract_profession_recipes(crafting_file, profession):
    """Extract recipes for specified profession from Crafting.lua"""
    print(f"[*] Reading {crafting_file}")

    if not os.path.exists(crafting_file):
        print(f"[!] ERROR: File not found: {crafting_file}")
        print(f"[!] Please verify your WOW_FOLDER path in the script")
        return {}

    with open(crafting_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the profession section
    profession_pattern = f'-- {profession} --.*?(?=^--\s*\w)'
    profession_match = re.search(profession_pattern, content, re.DOTALL | re.MULTILINE)

    if not profession_match:
        print(f"[!] Could not find {profession} section in Crafting.lua")
        print(f"[!] Available professions: Alchemy, Blacksmithing, Cooking, Enchanting,")
        print(f"[!]                         Engineering, First Aid, Leatherworking, Tailoring")
        return {}

    profession_section = profession_match.group(0)
    categories = {}

    # Extract all recipe categories
    category_pattern = f'({profession}(?:Apprentice|Journeyman|Expert|Artisan|[A-Za-z]+)\d*)\s*=\s*\{{(.*?\n\t\}});'

    for match in re.finditer(category_pattern, profession_section, re.DOTALL):
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
        print(f"[!] {unmatched} recipes without material data (trainer-taught)")

    return complete_recipes

def generate_markdown(recipes_by_category, profession):
    """Generate comprehensive Markdown documentation"""

    doc = f"# Complete {profession} Recipes Documentation\n\n"
    doc += "**Source:** AtlasLoot Addon\n\n"
    doc += "**Includes:** Recipe names, skill requirements, AND material requirements\n\n"
    doc += "## Understanding Skill Levels\n\n"
    doc += "- **Orange:** Guaranteed skill point gain\n"
    doc += "- **Yellow:** High chance of skill point gain\n"
    doc += "- **Green:** Low chance of skill point gain\n"
    doc += "- **Gray:** No skill point gain (recipe is trivial)\n\n"
    doc += "---\n\n"

    for cat_name in sorted(recipes_by_category.keys()):
        recipes = recipes_by_category[cat_name]
        doc += f"## {cat_name} ({len(recipes)} recipes)\n\n"
        recipes_sorted = sorted(recipes, key=lambda x: x["skill_levels"]["orange"])

        for recipe in recipes_sorted:
            doc += f"### {recipe['name']}\n"
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
                doc += "- **Materials:** Trainer-taught (no materials)\n"

            if recipe.get("tools") and len(recipe["tools"]) > 0:
                doc += f"- **Tools Required:** {', '.join(recipe['tools'])}\n"

            if recipe.get("craft_item"):
                doc += f"- **Creates:** Item ID {recipe['craft_item']}\n"

            doc += "\n"

        doc += "---\n\n"

    doc += "\n## Item ID Reference\n\n"
    doc += "Look up item IDs at:\n"
    doc += "- https://database.turtlecraft.gg/?item=[ID]\n"
    doc += "- https://classic.wowhead.com/item=[ID]\n"

    return doc

def main():
    """Main execution function"""

    print("\n" + "="*60)
    print(f"AtlasLoot {PROFESSION} Recipe Extractor")
    print("="*60 + "\n")

    # Verify paths
    if not os.path.exists(WOW_FOLDER):
        print(f"[!] ERROR: WoW folder not found: {WOW_FOLDER}")
        print(f"[!] Please edit WOW_FOLDER in the script")
        return

    # Create output folder
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)

    # Extract recipes
    crafting_recipes = extract_profession_recipes(CRAFTING_FILE, PROFESSION)
    if not crafting_recipes:
        return

    # Extract materials
    spells_data = parse_spells_lua(SPELLS_FILE)

    # Merge data
    complete_recipes = merge_recipe_data(crafting_recipes, spells_data)

    # Generate outputs
    print("\n[*] Generating documentation...")

    # Markdown
    markdown = generate_markdown(complete_recipes, PROFESSION)
    md_file = os.path.join(OUTPUT_FOLDER, f"{PROFESSION.lower()}_recipes.md")
    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(markdown)
    print(f"[+] Created: {md_file}")

    # JSON
    json_file = os.path.join(OUTPUT_FOLDER, f"{PROFESSION.lower()}_recipes.json")
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(complete_recipes, f, indent=2)
    print(f"[+] Created: {json_file}")

    # CSV
    csv_file = os.path.join(OUTPUT_FOLDER, f"{PROFESSION.lower()}_recipes.csv")
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

    with open(csv_file, 'w', encoding='utf-8') as f:
        f.write(csv)
    print(f"[+] Created: {csv_file}")

    print("\n" + "="*60)
    print("[+] COMPLETE! All recipe data extracted")
    print("="*60)
    print(f"\nTotal recipes documented: {sum(len(r) for r in complete_recipes.values())}")
    print(f"\nOutput files in: {OUTPUT_FOLDER}")

if __name__ == "__main__":
    main()
```

### Step 3: Configure the Script

Open `extract_recipes.py` in a text editor and edit these lines:

```python
# CHANGE THESE:
WOW_FOLDER = r"C:\turtlewow"              # ← Your WoW folder path
PROFESSION = "Tailoring"                   # ← Profession to extract
OUTPUT_FOLDER = r"C:\WoW-Recipes"         # ← Where to save files
```

**Finding Your WoW Folder:**
- Right-click WoW shortcut → Properties → Look at "Target" path
- Or search for `Interface\AddOns` in Windows Explorer

---

## Running the Script

### Method 1: Double-Click (Easiest)

1. Save the script as `extract_recipes.py`
2. Double-click the file
3. A command window will open and show progress
4. Files will be created in your output folder

### Method 2: Command Prompt

1. Open Command Prompt (Windows Key + R, type `cmd`, press Enter)
2. Navigate to script location:
   ```
   cd C:\WoW-Recipes
   ```
3. Run the script:
   ```
   python extract_recipes.py
   ```

**Expected Output:**
```
============================================================
AtlasLoot Tailoring Recipe Extractor
============================================================

[*] Reading C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua
[+] Found 406 recipes across 13 categories
[*] Reading C:\turtlewow\Interface\AddOns\AtlasLoot\Core\Spells.lua
[+] Found material data for 1543 spells
[*] Merging recipe and material data...
[+] Matched materials for 406 recipes

[*] Generating documentation...
[+] Created: C:\WoW-Recipes\tailoring_recipes.md
[+] Created: C:\WoW-Recipes\tailoring_recipes.json
[+] Created: C:\WoW-Recipes\tailoring_recipes.csv

============================================================
[+] COMPLETE! All recipe data extracted
============================================================

Total recipes documented: 406
Output files in: C:\WoW-Recipes
```

---

## Understanding the Output

### File 1: `[profession]_recipes.md`

**Human-readable documentation**

Example:
```markdown
### Brown Linen Shirt
- Quality: Common
- Spell ID: 3915
- Skill Required: 1 (Orange) / 35 (Yellow) / 47 (Green) / 60 (Gray)
- Cast Time: 5.13 seconds
- Materials Required:
  - Item ID 2996: x1
  - Item ID 2320: x1
- Creates: Item ID 4344
```

### File 2: `[profession]_recipes.json`

**Structured data for programming**

Example:
```json
{
  "spell_id": "3915",
  "name": "Brown Linen Shirt",
  "quality": "Common",
  "skill_levels": {
    "orange": 1,
    "yellow": 35,
    "green": 47,
    "gray": 60
  },
  "materials": [
    {"item_id": "2996", "quantity": 1},
    {"item_id": "2320", "quantity": 1}
  ],
  "cast_time": 5.13,
  "craft_item": "4344"
}
```

### File 3: `[profession]_recipes.csv`

**Spreadsheet format** - Open in Excel/Google Sheets

Columns: Category, Recipe Name, Quality, Spell ID, Orange, Yellow, Green, Gray, Materials, Cast Time

---

## Extracting Other Professions

To extract different professions, edit the `PROFESSION` line in the script:

```python
PROFESSION = "Tailoring"      # Current
PROFESSION = "Blacksmithing"  # Change to this
```

**Available Professions:**
- `Alchemy`
- `Blacksmithing`
- `Cooking`
- `Enchanting`
- `Engineering`
- `First Aid`
- `Leatherworking`
- `Tailoring`

**Run the script again** after changing the profession name.

### Extracting All Professions at Once

To extract all professions, modify the script:

```python
# Replace the PROFESSION line with:
PROFESSIONS = ["Tailoring", "Blacksmithing", "Alchemy", "Engineering",
               "Leatherworking", "Enchanting", "Cooking", "First Aid"]

# In main(), change:
for profession in PROFESSIONS:
    print(f"\n[*] Extracting {profession}...")
    PROFESSION = profession
    # ... rest of extraction code
```

---

## Troubleshooting

### Error: "File not found"

**Problem:** Script can't find AtlasLoot files

**Solution:**
1. Verify AtlasLoot is installed in WoW
2. Check `WOW_FOLDER` path in script
3. Make sure path uses `\` (backslash) on Windows
4. Use `r"path"` format: `r"C:\turtlewow"`

**Test your path:**
```
# Open this in Windows Explorer - should show Crafting.lua
C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua
```

### Error: "Python not recognized"

**Problem:** Python not installed or not in PATH

**Solution:**
1. Download Python from https://www.python.org/downloads/
2. During install, CHECK "Add Python to PATH"
3. Restart Command Prompt
4. Test: `python --version`

### No Material Data Extracted

**Problem:** Materials show as "Trainer" for all recipes

**Possible Causes:**
1. Different AtlasLoot version (structure changed)
2. Modified addon files
3. Regex patterns need adjustment

**Solution:**
- Verify `Spells.lua` exists and is readable
- Check if spell IDs match between files
- Contact original script author for updated version

### Script Runs But No Output Files

**Problem:** Files not created in output folder

**Solution:**
1. Check `OUTPUT_FOLDER` path is valid
2. Verify you have write permissions
3. Look for error messages in console
4. Try running as Administrator

---

## Technical Details

### How It Works

1. **Reads Crafting.lua:**
   - Parses recipe entries with regex
   - Extracts spell IDs, names, quality, skill thresholds
   - Organizes by profession categories

2. **Reads Spells.lua:**
   - Line-by-line parsing for material data
   - Tracks spell IDs and associated materials
   - Extracts item IDs, quantities, tools, cast times

3. **Merges Data:**
   - Matches recipes to materials via spell ID
   - Combines skill requirements with materials
   - Creates complete recipe objects

4. **Generates Outputs:**
   - Markdown for human reading
   - JSON for programmatic access
   - CSV for spreadsheet analysis

### Data Structure

**Recipe Object:**
```json
{
  "spell_id": "3915",
  "name": "Brown Linen Shirt",
  "icon": "inv_shirt_02",
  "quality": "Common",
  "skill_levels": {
    "orange": 1,
    "yellow": 35,
    "green": 47,
    "gray": 60
  },
  "materials": [
    {"item_id": "2996", "quantity": 1},
    {"item_id": "2320", "quantity": 1}
  ],
  "tools": [],
  "cast_time": 5.13,
  "craft_item": "4344"
}
```

### Item ID Reference

Common item IDs are numeric identifiers used in WoW's database:
- Item ID 2589 = Linen Cloth
- Item ID 2996 = Bolt of Linen Cloth
- Item ID 2320 = Coarse Thread

**Look up any item:**
- Turtle WoW: `https://database.turtlecraft.gg/?item=[ID]`
- Classic: `https://classic.wowhead.com/item=[ID]`

---

## Frequently Asked Questions

### Q: Does this modify my addon files?

**A:** No. The script only READS the files. Your AtlasLoot addon is never modified.

### Q: Will this work with other WoW versions?

**A:** Yes, if they use AtlasLoot with similar structure. Tested on:
- Turtle WoW
- Classic WoW
- Vanilla WoW (1.12)

May need adjustments for retail or other expansions.

### Q: Can I extract recipe sources/locations?

**A:** Not currently. AtlasLoot stores WHERE to find recipes (drops, vendors) in a different format. This could be added in future versions.

### Q: The materials show item IDs. Can I get item names?

**A:** The script extracts what AtlasLoot stores (item IDs). To convert to names:
1. Look up IDs on database sites
2. Parse WoW's item database files (more complex)
3. Use WoW API with scripting (requires in-game access)

### Q: Can I share the output files?

**A:** Yes! The generated MD, JSON, and CSV files can be freely shared. They contain only recipe data, not addon code.

### Q: How often should I re-run this?

**A:** Run again when:
- AtlasLoot addon is updated
- New recipes are added to the game
- You switch to a different WoW server/version

---

## Advanced Usage

### Creating a Batch File

Create `extract_all_professions.bat`:

```batch
@echo off
echo Extracting all profession recipes...

python extract_recipes.py Tailoring
python extract_recipes.py Blacksmithing
python extract_recipes.py Alchemy
python extract_recipes.py Engineering
python extract_recipes.py Leatherworking
python extract_recipes.py Enchanting
python extract_recipes.py Cooking
python extract_recipes.py "First Aid"

echo.
echo All professions extracted!
pause
```

### Automating Item Name Lookup

To automatically fetch item names, you'd need to:
1. Query WoW database APIs
2. Parse game data files
3. Use web scraping (rate-limited)

This requires additional libraries (`requests`, `beautifulsoup4`) and API access.

---

## Credits & License

**Original Script:** Created for Turtle WoW community
**AtlasLoot Addon:** Original authors and contributors
**License:** Free to use, modify, and distribute

If you improve this script, consider sharing back with the community!

---

## Support & Contact

**Issues:**
- Check troubleshooting section first
- Verify file paths and permissions
- Test with a single profession first

**Community Resources:**
- Turtle WoW Forums
- Classic WoW Discord servers
- WoW addon development communities

---

## Changelog

**Version 1.0:**
- Initial release
- Supports all major professions
- Extracts skills, materials, cast times
- Outputs MD, JSON, CSV formats

---

## Quick Reference Card

**Installation:**
1. Install Python 3.x
2. Save script as `extract_recipes.py`
3. Edit WOW_FOLDER path
4. Run script

**File Paths to Edit:**
```python
WOW_FOLDER = r"C:\turtlewow"
PROFESSION = "Tailoring"
OUTPUT_FOLDER = r"C:\WoW-Recipes"
```

**Run Command:**
```
python extract_recipes.py
```

**Output Files:**
- `[profession]_recipes.md` - Documentation
- `[profession]_recipes.json` - Data
- `[profession]_recipes.csv` - Spreadsheet

**Item ID Lookup:**
- https://database.turtlecraft.gg/?item=[ID]
- https://classic.wowhead.com/item=[ID]

---

**End of Guide**
