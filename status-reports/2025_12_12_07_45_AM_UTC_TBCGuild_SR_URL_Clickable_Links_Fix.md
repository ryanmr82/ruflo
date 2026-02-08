# TBC Guild Website - SR URL Clickable Links Fix

**Date:** December 12, 2025, 07:45 AM UTC
**Status:** Completed Successfully
**Type:** Bug Fix
**Server:** torreyserver (132.226.72.121)

---

## Summary

Fixed non-clickable SR (Soft Reserve) URLs on raid detail pages. The raidres.top URLs in raid descriptions are now clickable hyperlinks that open in a new tab.

---

## Problem

On raid detail pages (e.g., `/raids/1446768982634791035`), the SR URL displayed in the raid description was plain text:

```
🛡 SR → https://raidres.top/res/4Z5NVH
```

Users could not click the URL to navigate to their soft reserve sheet.

---

## Solution

Added a `linkifyDescription()` function that converts URLs in text to clickable anchor tags:

```typescript
function linkifyDescription(text: string): JSX.Element {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\^`\[\]]+)/g;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        if (part.match(/^https?:\/\//)) {
          return (
            <a key={index} href={part} target="_blank" rel="noopener noreferrer"
               style="color: var(--apple-blue); text-decoration: underline;">{part}</a>
          );
        }
        return part;
      })}
    </>
  );
}
```

---

## Files Modified

| File | Location | Changes |
|------|----------|---------|
| `[id].tsx` | `/home/opc/tbc-website/routes/raids/` | Added `linkifyDescription` function, added JSX import, updated description rendering |

**Backup created:** `/home/opc/tbc-website/routes/raids/[id].tsx.backup_20251211_234048`

---

## Changes Made

1. **Added import** (line 2):
   ```typescript
   import { JSX } from "preact";
   ```

2. **Added linkifyDescription function** (lines 161-178):
   - Splits text by URL regex pattern
   - Wraps URLs in anchor tags with `target="_blank"` and security attributes
   - Preserves non-URL text as-is

3. **Updated description rendering** (line 253):
   ```diff
   - <p ...>{raid.description}</p>
   + <p ...>{linkifyDescription(raid.description)}</p>
   ```

---

## Verification

Tested on multiple raid pages:

| Raid | SR URL | Status |
|------|--------|--------|
| Temple of Ahn'Qiraj | `https://raidres.top/res/4Z5NVH` | Clickable |
| Molten Core | `https://raidres.top/res/TQZ8BC` | Clickable |

All SR URLs now render as:
```html
<a href="https://raidres.top/res/..." target="_blank" rel="noopener noreferrer"
   style="color: var(--apple-blue); text-decoration: underline;">https://raidres.top/res/...</a>
```

---

## Commands Used

```bash
# Backup original file
ssh torreyserver 'cp /home/opc/tbc-website/routes/raids/\[id\].tsx /home/opc/tbc-website/routes/raids/\[id\].tsx.backup_$(date +%Y%m%d_%H%M%S)'

# Add JSX import
ssh torreyserver 'sed -i "1a import { JSX } from \"preact\";" /home/opc/tbc-website/routes/raids/\[id\].tsx'

# Insert linkifyDescription function after getClassColor
ssh torreyserver 'sed -i "159r /tmp/linkify_function.txt" /home/opc/tbc-website/routes/raids/\[id\].tsx'

# Update description rendering
ssh torreyserver 'sed -i "s/{raid.description}/{linkifyDescription(raid.description)}/" /home/opc/tbc-website/routes/raids/\[id\].tsx'

# Restart service
ssh torreyserver 'sudo systemctl restart tbc-website'

# Verify fix
curl -s "https://tbcguild.duckdns.org/raids/1446768982634791035" | grep -o '<a href="https://raidres.top/res/[^"]*"[^>]*>[^<]*</a>'
```

---

## Rollback Procedure

If needed, restore from backup:

```bash
ssh torreyserver 'cp /home/opc/tbc-website/routes/raids/\[id\].tsx.backup_20251211_234048 /home/opc/tbc-website/routes/raids/\[id\].tsx'
ssh torreyserver 'sudo systemctl restart tbc-website'
```

---

## Notes

- The Deno Fresh server uses `--watch` mode, so changes are automatically detected and reloaded
- The function handles any URL pattern (http/https), not just raidres.top, making it future-proof
- Links open in new tab (`target="_blank"`) with proper security (`rel="noopener noreferrer"`)

---

*Report generated: December 12, 2025, 07:45 AM UTC*
