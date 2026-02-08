# Status Report: TurtLog File Transfer to Linux Box

**Date:** December 30, 2025, 5:21 AM PST
**Task:** Transfer TurtLog combat log files from local Windows machine to remote Linux server

---

## Summary

Successfully transferred two WoW combat log files from the local Downloads folder to the remote Linux server at `/home/opc/tbc-website/logs/`.

---

## Files Transferred

| Source File (Local) | Destination File (Remote) | Size |
|---------------------|---------------------------|------|
| `TurtLog-AQ40-2025-12-19-NoKill (1).zip` | `TurtLog-AQ40-2025-12-19-NoKill.txt` | 10,554,073 bytes (10.5 MB) |
| `TurtLog-AQ40-2025-12-22-NoKill.zip` | `TurtLog-AQ40-2025-12-22-NoKill.txt` | 5,459,794 bytes (5.4 MB) |

---

## Steps Performed

1. **Located files** in `C:\Users\ryanr\Downloads\`
2. **Extracted zip files** to temporary folder `C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\`
   - Extracted to separate subfolders (Dec19, Dec22) to avoid overwriting since both zips contained `WoWCombatLog.txt`
   - Renamed extracted files to include date identifiers
3. **Transferred files** via SCP using existing SSH key
4. **Verified transfer** by listing files on remote server
5. **Cleaned up** temporary extraction folder

---

## Commands Used

### Extract Files (PowerShell)
```powershell
Expand-Archive -Path 'C:\Users\ryanr\Downloads\TurtLog-AQ40-2025-12-19-NoKill (1).zip' -DestinationPath 'C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\Dec19' -Force
Expand-Archive -Path 'C:\Users\ryanr\Downloads\TurtLog-AQ40-2025-12-22-NoKill.zip' -DestinationPath 'C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\Dec22' -Force
```

### Transfer Files (SCP)
```bash
scp -i "C:\Users\ryanr\.ssh\git-key" "C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\Dec19\TurtLog-AQ40-2025-12-19-NoKill.txt" "C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\Dec22\TurtLog-AQ40-2025-12-22-NoKill.txt" opc@132.226.72.121:/home/opc/tbc-website/logs/
```

### Verify Transfer (SSH)
```bash
ssh -i "C:\Users\ryanr\.ssh\git-key" opc@132.226.72.121 "ls -la /home/opc/tbc-website/logs/TurtLog-AQ40-2025-12-*.txt"
```

---

## Files Modified

| File Path | Action |
|-----------|--------|
| `C:\Users\ryanr\Downloads\TurtLog-Extract-Temp\` | Created (temp), then deleted |
| `/home/opc/tbc-website/logs/TurtLog-AQ40-2025-12-19-NoKill.txt` | Created on remote |
| `/home/opc/tbc-website/logs/TurtLog-AQ40-2025-12-22-NoKill.txt` | Created on remote |

---

## Connection Details

- **SSH Key:** `C:\Users\ryanr\.ssh\git-key`
- **Remote User:** `opc`
- **Remote Host:** `132.226.72.121`
- **Remote Path:** `/home/opc/tbc-website/logs/`
- **Shortcut Used:** `sshtotorrey` (batch file at `C:\Users\ryanr\bin\sshtotorrey.bat`)

---

## Lessons Learned

1. **Zip extraction note:** Both TurtLog zip files contain a file named `WoWCombatLog.txt` internally. When extracting multiple zips, extract to separate folders first to prevent overwriting.
2. **File naming:** Renamed extracted files to include the date identifier for clarity on the remote server.

---

## Issues Encountered

None. Transfer completed successfully.

---

## Rollback Procedure

If files need to be removed from the remote server:
```bash
ssh -i "C:\Users\ryanr\.ssh\git-key" opc@132.226.72.121 "rm /home/opc/tbc-website/logs/TurtLog-AQ40-2025-12-19-NoKill.txt /home/opc/tbc-website/logs/TurtLog-AQ40-2025-12-22-NoKill.txt"
```

---

## Tags
`file-transfer`, `scp`, `ssh`, `turtlog`, `wow-combat-logs`, `aq40`, `linux-server`
