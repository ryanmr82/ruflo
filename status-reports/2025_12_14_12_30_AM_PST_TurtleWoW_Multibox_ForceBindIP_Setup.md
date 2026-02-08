# TurtleWoW Multiboxing Setup with ForceBindIP and Cloudflare WARP

**Date:** December 14, 2025, 12:30 AM PST
**Task:** Configure dual WoW.exe instances to run with different IP addresses
**Status:** Completed Successfully

---

## Summary

Set up ForceBindIP to allow running two TurtleWoW clients simultaneously, each appearing with a different IP address:
- **Client 1 (Real IP):** Uses the physical Ethernet adapter (192.168.1.69)
- **Client 2 (WARP):** Routes through Cloudflare WARP VPN (172.16.0.2)

---

## What Was Accomplished

### 1. ForceBindIP Installation
- Downloaded ForceBindIP v1.32 from official source (r1ch.net)
- Installed to: `C:\TurtleWoW\Tools\ForceBindIP\`
- Contains both 32-bit and 64-bit versions

### 2. Network Configuration Identified
| Adapter | IP Address | Purpose |
|---------|------------|---------|
| Ethernet (Realtek Gaming 2.5GbE) | 192.168.1.69 | Real IP - bypasses WARP |
| CloudflareWARP | 172.16.0.2 | VPN IP - routes through Cloudflare |

### 3. Desktop Shortcuts Created
Two shortcuts placed on Desktop (`C:\Users\ryanr\OneDrive\Desktop\`):

**TurtleWoW - Real IP.lnk**
- Target: `C:\TurtleWoW\Tools\ForceBindIP\ForceBindIP.exe`
- Arguments: `192.168.1.69 "C:\TurtleWoW\WoW.exe"`
- Purpose: Runs WoW bound to physical Ethernet, bypassing WARP

**TurtleWoW - WARP.lnk**
- Target: `C:\TurtleWoW\Tools\ForceBindIP\ForceBindIP.exe`
- Arguments: `172.16.0.2 "C:\TurtleWoW\WoW.exe"`
- Purpose: Runs WoW through Cloudflare WARP

---

## How To Use

### Prerequisites
1. Cloudflare WARP must be **connected** before launching either shortcut
2. Both shortcuts require WARP to be ON (even the "Real IP" one needs WARP running to have both adapters available)

### Launch Procedure
1. **Connect WARP** (click WARP icon in system tray → Connect)
2. Double-click **"TurtleWoW - Real IP"** → Log into first account
3. Double-click **"TurtleWoW - WARP"** → Log into second account
4. Both clients now appear as different IPs to the server

### Verification
To verify each client has a different IP:
- In-game: Type `/run print((GetNetStats()))` or check your account's login IP on Turtle WoW website
- Or use an IP checking website before launching each client

---

## Files Modified/Created

| Path | Action |
|------|--------|
| `C:\TurtleWoW\Tools\ForceBindIP\` | Created - Contains ForceBindIP installation |
| `C:\TurtleWoW\Tools\ForceBindIP\ForceBindIP.exe` | Created - 32-bit executable |
| `C:\TurtleWoW\Tools\ForceBindIP\ForceBindIP64.exe` | Created - 64-bit executable |
| `C:\TurtleWoW\Tools\ForceBindIP\BindIP.dll` | Created - 32-bit helper DLL |
| `C:\TurtleWoW\Tools\ForceBindIP\BindIP64.dll` | Created - 64-bit helper DLL |
| `C:\Users\ryanr\OneDrive\Desktop\TurtleWoW - Real IP.lnk` | Created - Shortcut |
| `C:\Users\ryanr\OneDrive\Desktop\TurtleWoW - WARP.lnk` | Created - Shortcut |
| `C:\Temp\Downloads\ForceBindIP.zip` | Temporary - Can be deleted |
| `C:\Temp\Downloads\ForceBindIP\` | Temporary - Can be deleted |
| `C:\Temp\Downloads\create-shortcuts.ps1` | Temporary - Can be deleted |
| `C:\Temp\Downloads\verify-shortcuts.ps1` | Temporary - Can be deleted |

---

## Commands Used

```powershell
# Check network adapters
Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress

# Check WARP status
& 'C:\Program Files\Cloudflare\Cloudflare WARP\warp-cli.exe' status

# Connect WARP
& 'C:\Program Files\Cloudflare\Cloudflare WARP\warp-cli.exe' connect

# Download ForceBindIP
Invoke-WebRequest -Uri 'https://r1ch.net/assets/forcebindip/ForceBindIP-1.32.zip' -OutFile 'C:\Temp\Downloads\ForceBindIP.zip'

# Extract and install
Expand-Archive -Path 'C:\Temp\Downloads\ForceBindIP.zip' -DestinationPath 'C:\Temp\Downloads\ForceBindIP'
Copy-Item 'C:\Temp\Downloads\ForceBindIP\*' -Destination 'C:\TurtleWoW\Tools\ForceBindIP'
```

---

## Troubleshooting

### Issue: WoW doesn't launch when clicking shortcut
- **Cause:** WARP not connected
- **Solution:** Connect WARP first, then launch shortcuts

### Issue: Both clients show same IP
- **Cause:** WARP adapter IP changed (DHCP renewal)
- **Solution:** Run `Get-NetIPAddress -AddressFamily IPv4` to find new WARP IP, update shortcut arguments

### Issue: "BindIP.dll not found" error
- **Cause:** DLL not in same folder as ForceBindIP.exe
- **Solution:** Ensure all 4 files are in `C:\TurtleWoW\Tools\ForceBindIP\`

### Issue: Client crashes immediately
- **Cause:** Using wrong ForceBindIP version (32 vs 64 bit)
- **Solution:** TurtleWoW uses 32-bit WoW.exe, so ForceBindIP.exe (not ForceBindIP64.exe) is correct

---

## Lessons Learned

1. **ForceBindIP requires WARP to be connected** - The virtual adapter only exists when WARP is actively connected
2. **Admin privileges not required** - ForceBindIP can be installed to user-accessible folders
3. **Simple toggle method doesn't work** - Enabling WARP while WoW is running disconnects existing sessions

---

## Rollback Procedure

To remove this setup:
1. Delete shortcuts from Desktop
2. Delete folder: `C:\TurtleWoW\Tools\ForceBindIP\`
3. Optionally clean temp files in `C:\Temp\Downloads\`

---

## Related Resources

- ForceBindIP Official: https://r1ch.net/projects/forcebindip
- Cloudflare WARP: https://1.1.1.1/

---

**Session Duration:** ~10 minutes
**Tools Used:** PowerShell, ForceBindIP, Cloudflare WARP CLI
