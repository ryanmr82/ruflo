# Website Background Images Update

## Date
January 20, 2026, 8:59 PM PST (Updated 9:03 PM PST)

## Summary
Replaced the website background image and Admin page background images on the TBC website Linux server. Initial upload only placed files in staging folder - required copying to actual static/images folder and updating CSS/TSX code references.

## Task Details

### Operations Performed

#### 1. Deleted Old Image
- **File:** `twow website image jan 2026.png` (818 KB)
- **Server Path:** `/home/opc/tbc-website-uploads/`
- **Reason:** Replaced with updated Maraudon loading screen

#### 2. Uploaded Website Background Image
- **Source:** `C:\Users\ryanr\OneDrive\Desktop\Maraudon_Redrawn_Loading_Screen.png`
- **Destination:** `/home/opc/tbc-website-uploads/Maraudon_Redrawn_Loading_Screen.png`
- **Size:** 2,765,827 bytes (~2.77 MB)
- **Purpose:** Main website background image

#### 3. Uploaded Admin Page Background Image
- **Source:** `C:\Users\ryanr\OneDrive\Desktop\Scarlet_Monastery_Loading_Screen_1.png`
- **Destination:** `/home/opc/tbc-website-uploads/Scarlet_Monastery_Loading_Screen_1.png`
- **Size:** 2,861,517 bytes (~2.86 MB)
- **Purpose:** Admin page background image

### Server Configuration
- **Server:** torreyserver (132.226.72.121)
- **User:** opc
- **SSH Config:** `~/.ssh/config` host alias

## Commands Used

### Delete old image
```bash
ssh torreyserver "rm '/home/opc/tbc-website-uploads/twow website image jan 2026.png'"
```

### Upload Maraudon image
```bash
scp "/c/Users/ryanr/OneDrive/Desktop/Maraudon_Redrawn_Loading_Screen.png" torreyserver:/home/opc/tbc-website-uploads/
```

### Upload Scarlet Monastery image
```bash
scp "/c/Users/ryanr/OneDrive/Desktop/Scarlet_Monastery_Loading_Screen_1.png" torreyserver:/home/opc/tbc-website-uploads/
```

### Verification
```bash
ssh torreyserver "ls -la /home/opc/tbc-website-uploads/*.png"
```

**Result:**
```
-rw-r--r--. 1 opc opc 2765827 Jan 20 20:59 Maraudon_Redrawn_Loading_Screen.png
-rw-r--r--. 1 opc opc   36754 Jan 10 03:18 parting2.png
-rw-r--r--. 1 opc opc   47310 Jan 10 03:13 parting.png
-rw-r--r--. 1 opc opc 2861517 Jan 20 20:59 Scarlet_Monastery_Loading_Screen_1.png
```

## Files Modified on Linux Server

| Path | Action | Size |
|------|--------|------|
| `/home/opc/tbc-website-uploads/twow website image jan 2026.png` | Deleted | 818 KB |
| `/home/opc/tbc-website-uploads/Maraudon_Redrawn_Loading_Screen.png` | Created | 2.77 MB |
| `/home/opc/tbc-website-uploads/Scarlet_Monastery_Loading_Screen_1.png` | Created | 2.86 MB |

## Note on File Naming
User requested "Moradon Redraw Loading Screen" - actual filename was `Maraudon_Redrawn_Loading_Screen.png` (Maraudon is a WoW dungeon).

## Website Integration Notes
These images are uploaded to the server but may require website code updates to reference them:
- **Maraudon image:** For main website background
- **Scarlet Monastery image:** For Admin page background

Check the website template/CSS files if the background doesn't automatically update.

## Rollback Procedure
The original TWOW image was deleted. If needed, re-upload from local:
```bash
# Note: Original file still exists locally at:
# C:\Users\ryanr\OneDrive\Desktop\twow website image jan 2026.png
scp "/c/Users/ryanr/OneDrive/Desktop/twow website image jan 2026.png" torreyserver:/home/opc/tbc-website-uploads/
```

## Additional Steps Required (9:03 PM Update)

Initial upload to `/home/opc/tbc-website-uploads/` was only a staging folder. The website serves images from `/home/opc/tbc-website/static/images/`.

### Actual Fix Required:

#### 1. Copy images to correct location
```bash
scp "Maraudon_Redrawn_Loading_Screen.png" torreyserver:/home/opc/tbc-website/static/images/
scp "Scarlet_Monastery_Loading_Screen_1.png" torreyserver:/home/opc/tbc-website/static/images/
```

#### 2. Update CSS for main card backgrounds
**File:** `/home/opc/tbc-website/static/styles.css`
**Line 347:** Changed from external URL to local image
```css
/* Before */
background-image: url('https://static.wikia.nocookie.net/wowpedia/images/2/20/Molten_Core_loading_screen.jpg');

/* After */
background-image: url('/images/Maraudon_Redrawn_Loading_Screen.png');
```

#### 3. Update Admin page backgrounds
**File:** `/home/opc/tbc-website/routes/admin.tsx`

**Line 71 (Login page):**
```tsx
/* Before */ background-image: url('/images/naxx-real.jpg');
/* After */  background-image: url('/images/Scarlet_Monastery_Loading_Screen_1.png');
```

**Line 136 (Admin panel):**
```tsx
/* Before */ background-image: url('/images/Thrall01-Header-062016.webp');
/* After */  background-image: url('/images/Scarlet_Monastery_Loading_Screen_1.png');
```

#### 4. Restart website service
```bash
sudo systemctl restart tbc-website
```

## Lessons Learned
- The `/home/opc/tbc-website-uploads/` folder is a **staging area**, not where the website serves files from
- Website serves static images from `/home/opc/tbc-website/static/images/`
- CSS changes alone aren't enough if they reference the wrong path - must update code references
- Route files (`.tsx`) require service restart; static CSS may need browser cache clear

## Files Modified on Linux Server (Final)

| Path | Action |
|------|--------|
| `/home/opc/tbc-website/static/images/Maraudon_Redrawn_Loading_Screen.png` | Created (2.77 MB) |
| `/home/opc/tbc-website/static/images/Scarlet_Monastery_Loading_Screen_1.png` | Created (2.86 MB) |
| `/home/opc/tbc-website/static/styles.css` | Modified line 347 |
| `/home/opc/tbc-website/routes/admin.tsx` | Modified lines 71, 136 |
| `tbc-website.service` | Restarted |

## Status
**COMPLETED** - Images copied to correct location, CSS and TSX updated, service restarted. Hard refresh (Ctrl+Shift+R) may be needed in browser.
