# Image Transfer: TWOW Website Image to Linux Server

## Date
January 20, 2026, 4:26 AM PST

## Summary
Successfully transferred a website image from the local Windows desktop (OneDrive-synced) to the remote Linux server (torreyserver).

## Task Details

### Source File
- **Path:** `C:\Users\ryanr\OneDrive\Desktop\twow website image jan 2026.png`
- **Size:** 818,849 bytes (~800 KB)
- **Type:** PNG image

### Destination
- **Server:** torreyserver (132.226.72.121)
- **Path:** `/home/opc/tbc-website-uploads/twow website image jan 2026.png`
- **User:** opc

### SSH Configuration Used
```
Host torreyserver
    HostName 132.226.72.121
    User opc
    IdentityFile ~/.ssh/linux-server.key
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

## Commands Used

### 1. Locate the file
```bash
find "/c/Users/ryanr" -maxdepth 4 -iname "*twow*"
```
**Result:** `/c/Users/ryanr/OneDrive/Desktop/twow website image jan 2026.png`

### 2. Transfer via SCP
```bash
scp "/c/Users/ryanr/OneDrive/Desktop/twow website image jan 2026.png" torreyserver:/home/opc/tbc-website-uploads/
```

### 3. Verify transfer
```bash
ssh torreyserver "ls -la /home/opc/tbc-website-uploads/ | grep -i twow"
```
**Result:**
```
-rw-r--r--.  1 opc opc   818849 Jan 20 04:26 twow website image jan 2026.png
```

## Files Modified
| Location | File | Action |
|----------|------|--------|
| Linux Server | `/home/opc/tbc-website-uploads/twow website image jan 2026.png` | Created (transferred) |

## Key Observations
1. The desktop file was located in the OneDrive-synced Desktop folder (`C:\Users\ryanr\OneDrive\Desktop\`), not the local Desktop folder (`C:\Users\ryanr\Desktop\`)
2. The SSH config already had `torreyserver` configured, so the `sshtotorrey` shortcut wasn't needed - direct host alias worked
3. Transfer completed successfully with full file integrity (818,849 bytes)

## Lessons Learned
- Always check OneDrive Desktop sync location in addition to local Desktop when searching for user files
- The SSH config file at `~/.ssh/config` provides convenient host aliases that work with both `ssh` and `scp`

## Rollback Procedure
If needed, remove the file from the server:
```bash
ssh torreyserver "rm /home/opc/tbc-website-uploads/twow\ website\ image\ jan\ 2026.png"
```

## Status
**COMPLETED** - File successfully transferred and verified on remote server.
