# How to Get Analysis File with Pre-Raid Buffer

## ❓ Problem

You're seeing the **old log file** in the dropdown, which doesn't have the 10-minute pre-raid buffer. This is because the file was created **before** the two-file system was implemented.

---

## ✅ Solution: Re-Create the Raid Log

You need to re-process your raid log to get the new `_analysis.txt` file that includes pre-raid consumables.

---

## 🚀 Method 1: Via Web Interface (EASIEST)

### Steps:

1. **Open the flask app**: http://localhost:5000

2. **Go to "Create Raid Log ZIP" tab**

3. **Fill in the form**:
   ```
   Player Name: [Your Character Name]
   Raid: MC
   Start Date: 10/20/2025
   Start Time: 4:00 PM  (or your actual raid start time)
   End Mode: Auto  (will detect Ragnaros death)
   ```

4. **Click "Process Log"**

5. **Wait for completion** - You'll see:
   ```
   ✅ Combat log processed successfully!
   Created 2 files:
   - TurtLog-MC-2025-10-20-Ragnaros.txt (exact raid time, for upload)
   - TurtLog-MC-2025-10-20-Ragnaros_analysis.txt (with 10min pre-raid buffer, for analysis)
   ```

6. **Go back to "Player Behavior Analysis" tab**

7. **The dropdown should now show**: `TurtLog-MC-2025-10-20-Ragnaros_analysis.txt`

8. **Select it and click "Analyze Player Behavior"**

9. **Done!** You'll now see consumables from 3:50 PM onwards (10 minutes before raid start)

---

## 🔧 Method 2: Via Python Script (ADVANCED)

If you prefer command-line:

### Step 1: Edit Configuration

Open `C:\turtlewow\Logs\recreate_analysis_file.py` and edit these lines:

```python
# CONFIGURE THESE:
raid_start = datetime(2025, 10, 20, 16, 0, 0)  # 4:00 PM on 10/20/2025
raid_end = datetime(2025, 10, 20, 18, 0, 0)    # 6:00 PM on 10/20/2025
player_name = "Yourname"  # Replace with your actual character name
buffer_minutes = 10  # Pre-raid buffer (captures 3:50 PM onwards)
```

### Step 2: Run the Script

```bash
cd "C:\turtlewow\Logs"
python recreate_analysis_file.py
```

### Step 3: Verify Output

```
Creating analysis file with 10-minute pre-raid buffer...
  Start: 04:00 PM (buffered to 03:50 PM)
  End: 06:00 PM

Extracting combat log from 10/20/2025 03:50 PM to 10/20/2025 06:00 PM...
  (Official raid start: 04:00 PM, capturing 10 min pre-raid buffer)
✅ Extracted 132,500 lines covering 2.17 hours

✅ Created: TurtLog-MC-2025-10-20-Ragnaros_analysis.txt
   Use this file for player analysis to capture pre-raid consumables!
```

### Step 4: Analyze

Go to web interface → "Player Behavior Analysis" tab → Select the `_analysis.txt` file → Analyze

---

## 🎯 What You'll See After Re-Processing

### Before (Old File Without Buffer):
```
File: TurtLog-MC-2025-10-20-Ragnaros.txt
Start: 4:00 PM
Lines: 125,000

Meltyougood consumables:
  - Greater Arcane Elixir: 1 (only the one at 4:55 PM)
  - Flask of Supreme Power: 1 (the one at 4:46 PM)
  ❌ Missing: Early consumables from 3:50-4:00 PM
```

### After (New Analysis File With Buffer):
```
File: TurtLog-MC-2025-10-20-Ragnaros_analysis.txt
Start: 3:50 PM (10-min buffer)
Lines: 132,500

Meltyougood consumables:
  - Greater Arcane Elixir: 2 (one at 3:55 PM ✅, one at 4:55 PM)
  - Flask of Supreme Power: 1 (4:46 PM)
  ✅ Includes: All pre-raid consumables
```

---

## 📊 Verification

To verify the buffer is working, check the analysis file:

```bash
cd "C:\turtlewow\Logs"
head -20 TurtLog-MC-2025-10-20-Ragnaros_analysis.txt
```

**You should see timestamps starting around 3:50 PM** (10 minutes before raid start)

Example:
```
10/20 15:50:13.215  Meltyougood uses Greater Arcane Elixir.
10/20 15:52:47.920  Whora uses Flask of Supreme Power.
10/20 15:55:32.105  Gobsta uses Elixir of the Mongoose.
10/20 15:58:11.442  Dirtmcskrt uses Winterfall Firewater.
10/20 16:00:00.978  Jrock gains 10 Mana from Veryheavy 's Mana Spring.  ← Raid officially starts
```

---

## 🔍 Troubleshooting

### Issue: Still seeing old file in dropdown

**Solution**:
1. Refresh the browser page (Ctrl+F5)
2. Check that `_analysis.txt` file actually exists in the Logs folder
3. File list API should automatically prefer `_analysis.txt` files

### Issue: Script fails with "extract_time_range not found"

**Solution**:
```bash
# Make sure you're in the Logs directory
cd "C:\turtlewow\Logs"

# Check that format_log_v2.py exists
ls format_log_v2.py
```

### Issue: Don't know exact raid start/end times

**Solution**: Use the web interface (Method 1) with "Auto" end mode. It will:
- Detect Ragnaros death automatically
- Use that as end time
- You only need to provide approximate start time

---

## 💡 Pro Tip

**Always re-process after any code updates** to ensure you have the latest file format with all fixes:
- Pre-raid buffer ✅
- Conjured items excluded ✅
- Proper consumable categories ✅
- Windfury totem excluded ✅

---

## 🎯 Summary

**Quick Answer**: Use the web interface to re-create the raid log. It will automatically create the `_analysis.txt` file with the 10-minute pre-raid buffer, and that file will appear in the analysis dropdown.

**File to use for analysis**: `TurtLog-MC-2025-10-20-Ragnaros_analysis.txt` (with buffer)
**File to upload**: `TurtLog-MC-2025-10-20-Ragnaros.txt.zip` (exact time, no buffer)
