# AlwaysShadow Installation

**Date:** December 15, 2025, 9:18 PM PST
**Status:** Completed Successfully
**Type:** Software Installation/Configuration

---

## Summary

Installed AlwaysShadow utility to keep NVIDIA Instant Replay (ShadowPlay) always enabled. This addresses the issue where Instant Replay automatically disables itself when detecting protected content, HDCP, or after system reboots.

---

## Problem Statement

NVIDIA Instant Replay does not have a built-in setting to remain enabled by default. It automatically disables in these scenarios:
- Protected content detection (DRM, HDCP)
- System reboots
- GPU driver updates
- Certain application launches

Registry research confirmed no native "always on" setting exists in NVSPCAPS or related keys.

---

## Solution Implemented

Installed **AlwaysShadow v1.666** - a lightweight utility that monitors NVIDIA ShadowPlay and automatically re-enables Instant Replay whenever it gets disabled.

### Installation Details

| Component | Value |
|-----------|-------|
| **Tool** | AlwaysShadow v1.666 |
| **Source** | https://github.com/Verpous/AlwaysShadow |
| **Install Path** | `C:\Users\ryanr\AppData\Local\AlwaysShadow\` |
| **Executable** | `AlwaysShadow.exe` (4.4 MB) |
| **Startup Shortcut** | `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AlwaysShadow.lnk` |

---

## Files Created

1. **Installation Script:**
   - `C:\Temp\install-alwaysshadow.ps1`

2. **Installed Files:**
   - `C:\Users\ryanr\AppData\Local\AlwaysShadow\AlwaysShadow.exe`

3. **Startup Shortcut:**
   - `C:\Users\ryanr\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AlwaysShadow.lnk`

---

## How It Works

AlwaysShadow runs in the system tray and:
1. Monitors NVIDIA ShadowPlay service state
2. Detects when Instant Replay is disabled
3. Automatically re-enables it via NVIDIA's internal APIs
4. Runs silently with minimal resource usage

---

## Verification

- Application running in system tray
- Startup shortcut created for auto-launch on boot
- Instant Replay remains enabled even during protected content playback

---

## Rollback Procedure

To remove AlwaysShadow:

```powershell
# Stop the running process
Stop-Process -Name "AlwaysShadow" -Force -ErrorAction SilentlyContinue

# Remove installation folder
Remove-Item -Path "$env:LOCALAPPDATA\AlwaysShadow" -Recurse -Force

# Remove startup shortcut
Remove-Item -Path "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AlwaysShadow.lnk" -Force

# Remove installation script
Remove-Item -Path "C:\Temp\install-alwaysshadow.ps1" -Force
```

---

## Related Research

Before selecting AlwaysShadow, investigated:
- NVIDIA registry settings (`HKLM\SOFTWARE\NVIDIA Corporation\Global\ShadowPlay\NVSPCAPS`)
- Manual registry tweaks (no auto-enable option exists)
- Alternative tools: ShadowPlay_Patcher (less maintained)

---

## Technologies Used

- PowerShell
- Windows Startup folder
- NVIDIA GeForce Experience / ShadowPlay
- GitHub releases download

---

*Report generated: December 15, 2025*
