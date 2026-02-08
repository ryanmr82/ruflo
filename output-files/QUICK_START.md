# AtlasLoot Recipe Extraction - QUICK START

**Goal:** Extract all Tailoring (or any profession) recipes with materials from AtlasLoot addon.

---

## 1. Install Python

Download: https://www.python.org/downloads/
- ✅ Check "Add Python to PATH" during install

---

## 2. Save This Script

Save as `extract_recipes.py`:

**EDIT THESE 3 LINES:**
```python
WOW_FOLDER = r"C:\turtlewow"           # ← YOUR WOW FOLDER
PROFESSION = "Tailoring"                # ← PROFESSION NAME
OUTPUT_FOLDER = r"C:\WoW-Recipes"      # ← OUTPUT LOCATION
```

Then paste the full script from `ATLASLOOT_EXTRACTION_GUIDE.md` (search for "Save this as")

---

## 3. Run It

**Method A:** Double-click `extract_recipes.py`

**Method B:**
```
cd C:\WoW-Recipes
python extract_recipes.py
```

---

## 4. Get Your Files

Check `C:\WoW-Recipes\` for:
- `tailoring_recipes.md` - Read this
- `tailoring_recipes.json` - Use in code
- `tailoring_recipes.csv` - Open in Excel

---

## What You Get

```markdown
### Brown Linen Shirt
- Quality: Common
- Skill: 1 (Orange) / 35 (Yellow) / 47 (Green) / 60 (Gray)
- Materials Required:
  - Item ID 2996: x1
  - Item ID 2320: x1
```

---

## Other Professions

Change line in script:
```python
PROFESSION = "Blacksmithing"  # Or: Alchemy, Engineering, etc.
```

Available: `Tailoring`, `Blacksmithing`, `Alchemy`, `Engineering`, `Leatherworking`, `Enchanting`, `Cooking`, `First Aid`

---

## Troubleshooting

**"File not found":**
- Check WOW_FOLDER path
- Verify AtlasLoot is installed
- Test path: `C:\turtlewow\Interface\AddOns\AtlasLoot\Database\Crafting.lua`

**"Python not recognized":**
- Reinstall Python
- Check "Add to PATH"
- Restart Command Prompt

---

## Item ID Lookup

- Turtle WoW: https://database.turtlecraft.gg/?item=2996
- Classic: https://classic.wowhead.com/item=2996

---

**Done!** See `ATLASLOOT_EXTRACTION_GUIDE.md` for detailed instructions.
