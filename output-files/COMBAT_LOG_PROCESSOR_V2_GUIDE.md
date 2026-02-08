# 🐢 Turtle WoW Combat Log Processor v2.0

**Complete User Guide**
**Created:** October 20, 2025
**Location:** `C:\turtlewow\Logs\`

---

## 🎯 What This Does

Automatically extracts, formats, and prepares your Turtle WoW combat logs for upload to **Legacy Logs** (the combat log analyzer).

### **Key Features:**
- ✅ **Time-based extraction** - Only extract specific raid timeframes
- ✅ **Auto-detect boss deaths** - Finds when final boss dies
- ✅ **Raid exodus detection** - Detects when 3+ people hearth/portal
- ✅ **Automatic formatting** - Converts "You/Your" to player name
- ✅ **Pet attribution** - Credits owners for pet damage
- ✅ **Auto-archiving** - Saves original log, creates fresh one
- ✅ **Web GUI** - Easy-to-use browser interface
- ✅ **CLI version** - Command-line for advanced users

---

## 📦 What Was Created

### **New Files in `C:\turtlewow\Logs\`:**

| File | Purpose |
|------|---------|
| `raids.json` | Raid configuration (boss names, aliases) |
| `format_log_v2.py` | Enhanced log processor with time extraction |
| `flask_app.py` | Web server for browser interface |
| `requirements.txt` | Python dependencies (Flask) |
| `start_web_app.bat` | Double-click to launch web interface |

### **Backups Created:**
- `format_log_for_upload.py.backup_TIMESTAMP`
- `run_format_log.bat.backup_TIMESTAMP`

---

## 🚀 Quick Start (Web Interface - Recommended)

### **Step 1: Launch the Web App**
1. Navigate to `C:\turtlewow\Logs\`
2. Double-click `start_web_app.bat`
3. Browser opens automatically to `http://localhost:5000`

### **Step 2: Fill Out the Form**
1. **Player Name:** Your character name
2. **Raid:** Select from dropdown (MC, BWL, AQ40, etc.)
3. **Start Time:** When raid started (e.g., `10/20/2025` `4:00 PM`)
4. **End Detection:** Choose Auto-detect or Manual

### **Step 3: Process**
1. Click "🚀 Process Combat Log"
2. Watch progress and status messages
3. Click "📥 Download ZIP File" when complete

### **Step 4: Upload to Legacy Logs**
1. Go to Legacy Logs website
2. Upload the `.zip` file
3. View your raid parse!

---

## 🖥️ CLI Version (Advanced Users)

If you prefer command-line:

```bash
cd C:\turtlewow\Logs
python format_log_v2.py
```

**Prompts:**
1. Player name
2. Raid (MC, BWL, etc.)
3. Start date (MM/DD/YYYY)
4. Start time (4:00 PM)
5. End detection (automatic or manual)

---

## 🎯 End Time Detection Logic

The system uses **3-tier detection**:

### **Tier 1: Boss Death (Most Accurate)**
```
Searching for: "Ragnaros dies"
✅ Found: Ragnaros dies at 6:03:03 PM
End Time: 6:03:03 PM
```

### **Tier 2: Raid Exodus (Fallback)**
```
No boss death found
Searching for raid exodus...
✅ Found: 5 people hearthed at ~7:28 PM
   - Vvulf (7:28 PM)
   - Klifford (7:29 PM)
   - Whora (7:29 PM)
End Time: 7:28 PM
```

### **Tier 3: Manual Entry (Last Resort)**
```
No boss death or exodus detected
📝 Please enter end time manually:
   Date: 10/20/2025
   Time: 7:30 PM
```

---

## 📋 Supported Raids

All configured in `raids.json`:

| Code | Raid Name | Final Boss |
|------|-----------|------------|
| **MC** | Molten Core | Ragnaros |
| **BWL** | Blackwing Lair | Nefarian |
| **ONY** | Onyxia's Lair | Onyxia |
| **ZG** | Zul'Gurub | Hakkar |
| **AQ20** | Ruins of Ahn'Qiraj | Ossirian |
| **AQ40** | Temple of Ahn'Qiraj | C'Thun |
| **NAXX** | Naxxramas | Kel'Thuzad |
| **KARAZHAN** | Karazhan Crypts | Atiesh |
| **EMERALD** | Emerald Sanctum | Eranikus |

### **Adding New Raids:**
Edit `raids.json` and add new entry:
```json
"NEWRAID": {
  "name": "New Raid",
  "full_name": "New Raid Full Name",
  "final_boss": "Boss Name",
  "aliases": ["newraid", "nr"]
}
```

---

## 🔧 Configuration (`raids.json`)

### **Exodus Detection Settings:**
```json
"settings": {
  "exodus_threshold": 3,           // How many people = exodus
  "exodus_time_window_minutes": 3,  // Within how many minutes
  "archive_original_log": true,     // Archive after extraction
  "create_zip": true                // Create ZIP for upload
}
```

### **Exodus Patterns Detected:**
- Hearthstone casting
- Teleport: Orgrimmar
- Teleport: Ironforge
- Teleport: Undercity
- Teleport to Guild House
- All major city teleports

---

## 📂 Output Files

### **After Processing:**
```
TurtLog-MC-2025-10-20-Ragnaros.txt       // Formatted log
TurtLog-MC-2025-10-20-Ragnaros.txt.zip   // Ready for upload
WoWCombatLog.archived.2025-10-20_18-30-00.txt  // Backup
WoWCombatLog.txt                          // Fresh/empty
```

### **File Naming:**
- **Boss Kill:** `TurtLog-MC-2025-10-20-Ragnaros.txt`
- **No Kill:** `TurtLog-MC-2025-10-20-NoKill.txt`
- **Custom:** Based on raid abbreviation + date

---

## 🧪 Testing with Today's MC Run

Let's verify it works with your actual MC log:

### **Test Data:**
- **Raid:** MC (Molten Core)
- **Start:** 10/20/2025 4:00 PM (estimate)
- **Boss Death:** 10/20/2025 6:03:03 PM (Ragnaros)
- **Exodus:** ~6:08 PM (Vvulf hearthed)

### **Expected Result:**
```
✅ Found: Ragnaros dies at 6:03:03 PM
✅ Extracted ~2 hours of combat data
✅ Created: TurtLog-MC-2025-10-20-Ragnaros.txt
✅ Created: TurtLog-MC-2025-10-20-Ragnaros.txt.zip
✅ Original log archived
```

---

## 🔄 Workflow Comparison

### **Old Way (Manual):**
1. Run batch file
2. Enter player name
3. Enter filename
4. Creates/renames files
5. **NO time filtering** - entire massive log included
6. Manual cleanup needed

### **New Way (Automated):**
1. Launch web app
2. Select raid from dropdown
3. Enter start time
4. Auto-detects end time (boss death or exodus)
5. **Time-filtered extraction** - only raid data
6. Auto-archives original
7. Ready-to-upload ZIP created
8. Fresh log file for next raid

---

## ⚠️ Important Notes

### **Original Log Handling:**
- ✅ **Archived** with timestamp after processing
- ✅ **Cleared** to start fresh for next raid
- ✅ **Backed up** before any changes
- ✅ **Never lost** - all data preserved

### **Multiple Raids Same Day:**
- Process first raid → archives original
- New combat logging creates fresh log
- Process second raid → archives again
- Each raid gets separate output file

### **Incomplete Raids:**
- Didn't kill final boss? No problem!
- System detects exodus or asks for manual time
- Still creates properly formatted output

---

## 🐛 Troubleshooting

### **"Flask not found" Error**
```bash
cd C:\turtlewow\Logs
pip install -r requirements.txt
```

### **"Python not found" Error**
Install Python from https://python.org
Make sure "Add to PATH" is checked during install

### **"WoWCombatLog.txt not found"**
- Make sure combat logging is enabled in WoW
- Check file is in `C:\turtlewow\Logs\`
- File might be named differently (check Logs folder)

### **No Boss Death Detected**
- Check spelling in `raids.json`
- Boss name must match exactly: "Ragnaros dies."
- Use manual end time as fallback

### **Wrong Time Range Extracted**
- Verify start time is correct
- Check system assumes current year
- Use manual mode if auto-detect fails

### **Web App Won't Start**
1. Check Python is installed
2. Check port 5000 isn't in use
3. Try closing and restarting
4. Check firewall isn't blocking

---

## 💡 Tips & Best Practices

### **Before Raid:**
- ✅ Clear old combat log or note the start time
- ✅ Enable combat logging in WoW
- ✅ Test web app works

### **During Raid:**
- ✅ Combat logging runs automatically
- ✅ Note exact start time (or approximate)
- ✅ No action needed during raid

### **After Raid:**
- ✅ Process immediately while fresh
- ✅ If unsure of end time, check for boss death message
- ✅ Use auto-detect when possible

### **For Multiple Raids:**
- ✅ Process each raid right after it ends
- ✅ Original gets archived automatically
- ✅ Fresh log ready for next raid

---

## 📊 Example Use Cases

### **Scenario 1: Full MC Clear**
```
Raid: MC
Start: 10/20/2025 4:00 PM
Boss dies: 6:03 PM (auto-detected)
Result: TurtLog-MC-2025-10-20-Ragnaros.txt
```

### **Scenario 2: BWL Progression (Didn't Kill Nef)**
```
Raid: BWL
Start: 10/21/2025 7:00 PM
No boss death found
Exodus detected: 10:30 PM (5 people hearthed)
Result: TurtLog-BWL-2025-10-21-NoKill.txt
```

### **Scenario 3: Ony Quick Kill**
```
Raid: ONY
Start: 10/22/2025 8:00 PM
Boss dies: 8:15 PM (auto-detected)
Result: TurtLog-ONY-2025-10-22-Onyxia.txt
```

---

## 🔗 Related Files

### **Original Files (Backed Up):**
- `format_log_for_upload.py.backup_TIMESTAMP`
- `run_format_log.bat.backup_TIMESTAMP`

### **Can Still Use Old Method:**
Just run the backup files if you prefer the old way.

---

## 📞 Support & Updates

### **Edit Raids:**
Edit `C:\turtlewow\Logs\raids.json`

### **Adjust Settings:**
Edit `settings` section in `raids.json`

### **Add Exodus Patterns:**
Add to `exodus_patterns` in `raids.json`

---

## ✅ Success Checklist

After reading this guide, you should be able to:

- [ ] Launch the web interface
- [ ] Select raid from dropdown
- [ ] Enter start time
- [ ] Understand auto-detection
- [ ] Process a combat log
- [ ] Download the ZIP file
- [ ] Upload to Legacy Logs
- [ ] Find archived original logs
- [ ] Add new raids to config
- [ ] Troubleshoot common issues

---

**Ready to process your first raid log? Launch `start_web_app.bat` and give it a try!** 🚀

---

**Created by:** Claude Code
**Version:** 2.0
**Date:** October 20, 2025
**Location:** C:\turtlewow\Logs\
