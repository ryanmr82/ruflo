# SuperWoW and Vanilla Tweaks Compatibility Report
*Definitive answers based on documentation and verified user reports*

## Direct Answers to Your Questions

### Question 1: Will installing SuperWoW override Vanilla Tweaks?
**Answer: NO** - SuperWoW does NOT override Vanilla Tweaks. They are separate DLL modifications that work alongside each other. The official documentation confirms they are compatible and many users run them together as "the trilogy" (VanillaFixes + Vanilla Tweaks + SuperWoW).

### Question 2: Will you lose auto-looting functionality?
**Answer: NO** - You will NOT lose auto-looting, but the behavior will be REVERSED. According to the SuperAPI documentation:
> "NOTE: If using Vanilla Tweaks quickloot all of the Autoloot options will be reversed (always on will actually be always off, Shift to toggle on will be Shift to toggle off etc)."

This means:
- Your auto-loot will still work
- The toggle settings in SuperAPI will function opposite to their labels
- If you want auto-loot always on, you must select "Always off" in SuperAPI settings

### Question 3: Does SuperWoW have auto-looting integrated?
**Answer: YES** - SuperWoW includes its own auto-loot functionality configured through the SuperAPI addon's minimap icon. The README explicitly lists "autoloot" as one of SuperWoW's configurable features.

---

## Compatibility Facts

### Confirmed Compatible Setup
The following configuration is confirmed to work together:
- **VanillaFixes** (which you have)
- **Vanilla Tweaks** (which you have)  
- **SuperWoW** (what you're considering)

### How They Work Together
1. **VanillaFixes** provides the base launcher and DXVK support
2. **Vanilla Tweaks** patches the executable for QoL features including quickloot
3. **SuperWoW** adds DLL injection for advanced features and responsiveness

### Installation Method for Your Setup
Since you already have VanillaFixes and Vanilla Tweaks installed:

1. Download SuperWoW components:
   - SuperWoWhook.dll
   - SuperAPI addon

2. Add to your existing dlls.txt file:
   ```
   SuperWoWhook.dll
   ```

3. Place SuperAPI addon in Interface/Addons/

4. Launch using VanillaFixes.exe (your existing launcher)

---

## Auto-Loot Behavior Matrix

When using Vanilla Tweaks + SuperWoW together:

| SuperAPI Setting | Actual Behavior |
|-----------------|-----------------|
| Always on | Auto-loot is OFF |
| Always off | Auto-loot is ON |
| Shift to toggle on | Shift to toggle OFF |
| Shift to toggle off | Shift to toggle ON |

---

## User-Verified Information

### Forum Confirmation
Multiple users confirm using all three together:
- "I used the trilogy: Vanilla-tweaks, Vanilla fixes and Super Wow"
- "Just launch the game with VanillaFixes, make sure it loads the SuperWoWhook.dll and set the autoloot in SuperAPI addon"

### Official Wiki Statement
From Turtle WoW Wiki Client Fixes and Tweaks page:
> "All entries listed here are compatible with each other, and should also be compatible with other Addons and Mods"

---

## Important Notes

### Security Consideration
SuperWoW is closed-source code, unlike VanillaFixes and Vanilla Tweaks which are open-source. The community uses it widely without issues, but this is worth noting.

### Windows Security
You will need to:
1. Temporarily disable Windows real-time protection during installation
2. Add your Turtle WoW folder to Windows Security exclusions
3. Add WoW.exe to DEP exception list (if not already done)

### No Reinstallation Needed
You do NOT need to reinstall Vanilla Tweaks after installing SuperWoW. They coexist without conflict.

---

## Recommendation

**You can safely install SuperWoW** with your existing VanillaFixes + Vanilla Tweaks setup. You will maintain auto-loot functionality, though you'll need to remember the reversed toggle behavior in SuperAPI settings. The main benefit you'll gain is the keypress-down activation for abilities, which provides noticeable responsiveness improvement.

---

*Report compiled from: GitHub documentation (pepopo978/SuperwowInstallation, balakethelock/SuperAPI, brndd/vanilla-tweaks), Turtle WoW Wiki, and verified forum user reports*