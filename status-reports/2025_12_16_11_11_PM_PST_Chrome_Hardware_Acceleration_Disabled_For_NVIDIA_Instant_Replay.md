# Chrome Hardware Acceleration Disabled for NVIDIA Instant Replay

**Date:** December 16, 2025, 11:11 PM PST
**Status:** Completed Successfully
**Type:** Configuration Fix

---

## Summary

Disabled Chrome's hardware acceleration to prevent NVIDIA Instant Replay from being repeatedly disabled due to DRM/protected content detection (Widevine).

---

## Problem Statement

After installing AlwaysShadow to keep NVIDIA Instant Replay always enabled, the user experienced errors and Instant Replay continuously disabling when Chrome was running.

**Root Cause:** Chrome's DRM (Widevine) triggers NVIDIA's protected content detection. Even visiting certain websites or having Chrome open can flag HDCP protection, causing Instant Replay to disable. AlwaysShadow tries to re-enable it, but Chrome keeps triggering the disable - creating an error loop.

---

## Solution Implemented

Disabled hardware acceleration in Chrome. Without GPU decoding, the HDCP trigger never fires, allowing Instant Replay to remain active.

### Technical Details

| Setting | Value |
|---------|-------|
| **Chrome Preference Key** | `hardware_acceleration_mode.enabled` |
| **New Value** | `false` |
| **Preferences File** | `%LOCALAPPDATA%\Google\Chrome\User Data\Default\Preferences` |

---

## Alternative Solutions Considered

| Option | Description | Why Not Chosen |
|--------|-------------|----------------|
| Disable DRM in Chrome | Prevents Widevine from triggering | Breaks Netflix, Disney+, Spotify web |
| Use Brave Browser | NVIDIA doesn't detect Brave | Requires switching browsers |
| ShadowPlay_Patcher | Patches out NVIDIA's DRM check entirely | More invasive, requires re-patching after updates |
| Disable Desktop Capture | Only record fullscreen games | Limits recording capability |

**Chosen Solution:** Disable hardware acceleration - Chrome still works normally, just uses CPU for video decode. Most modern CPUs handle this efficiently.

---

## Files Created

1. **Configuration Script:**
   - `C:\Temp\disable-chrome-hw-accel.ps1`

---

## Files Modified

1. **Chrome Preferences:**
   - `C:\Users\ryanr\AppData\Local\Google\Chrome\User Data\Default\Preferences`
   - Added: `"hardware_acceleration_mode":{"enabled":false}`

---

## Verification

To verify the setting in Chrome:
1. Open Chrome
2. Navigate to `chrome://settings/system`
3. Confirm "Use hardware acceleration when available" is **OFF**

---

## Rollback Procedure

To re-enable hardware acceleration:

### Option 1: Via Chrome UI
1. Open Chrome
2. Go to `Settings > System`
3. Toggle ON "Use hardware acceleration when available"
4. Relaunch Chrome

### Option 2: Via PowerShell
```powershell
$prefsPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Preferences"
$prefs = Get-Content $prefsPath -Raw | ConvertFrom-Json
$prefs.hardware_acceleration_mode.enabled = $true
$prefs | ConvertTo-Json -Depth 100 -Compress | Set-Content $prefsPath -Encoding UTF8
```

---

## Related Configuration

This fix works in conjunction with:
- **AlwaysShadow v1.666** - Installed at `C:\Users\ryanr\AppData\Local\AlwaysShadow\`
- Keeps Instant Replay enabled; Chrome fix prevents the DRM trigger loop

---

## Technologies Used

- PowerShell
- Chrome Preferences JSON
- NVIDIA ShadowPlay / Instant Replay
- Widevine DRM

---

## References

- [NVIDIA Forums - Shadowplay disabled when Chrome running](https://www.nvidia.com/en-us/geforce/forums/geforce-experience/14/536448/shadowplay-disabled-when-chrome-is-running/)
- [AlwaysShadow GitHub](https://github.com/Verpous/AlwaysShadow)
- [ShadowPlay_Patcher GitHub](https://github.com/furyzenblade/ShadowPlay_Patcher)

---

*Report generated: December 16, 2025*
