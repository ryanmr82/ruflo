# Linux SMB Share Setup Complete! ✅

## 🎉 SUCCESS: Your Oracle Linux 9 server is now configured with SMB shares!

---

## 📁 Available Network Shares

Your Linux server now has **TWO shared drives** accessible from Windows:

1. **MainDrive** - Full access to the Oracle Linux main system (root filesystem)
2. **OLEDDrive** - Full access to the OLED storage volume at `/var/oled`

---

## 🔌 How to Connect from Windows File Explorer

### Method 1: Using Windows Run Dialog (Recommended)
1. Press **Windows + R** to open the Run dialog
2. Enter one of these paths and press Enter:
   - `\\144.24.24.215` (to see both shares)
   - `\\144.24.24.215\MainDrive` (direct to main drive)
   - `\\144.24.24.215\OLEDDrive` (direct to OLED drive)

### Method 2: Using File Explorer Address Bar
1. Open Windows File Explorer
2. Click in the address bar at the top
3. Type `\\144.24.24.215` and press Enter
4. You'll see both MainDrive and OLEDDrive folders

### Method 3: Map as Network Drive (Permanent Access)
1. Open File Explorer
2. Right-click on "This PC" in the left sidebar
3. Select "Map network drive..."
4. Choose a drive letter (e.g., L: for Linux Main, O: for OLED)
5. Enter the folder path:
   - For Main Drive: `\\144.24.24.215\MainDrive`
   - For OLED Drive: `\\144.24.24.215\OLEDDrive`
6. Check "Reconnect at sign-in" for permanent mapping
7. Click "Finish"

---

## 🔐 Authentication Credentials

When Windows prompts for credentials, use:

- **Username**: `opc`
- **Password**: `oracle`
- **Domain**: Leave blank or use `WORKGROUP`

💡 **Tip**: Check "Remember my credentials" to avoid entering them each time.

---

## 🖥️ What Was Configured

### On the Linux Server:
1. ✅ Installed Samba 4.21.3 on Oracle Linux 9
2. ✅ Created two SMB shares:
   - **MainDrive**: Full access to `/` (root filesystem)
   - **OLEDDrive**: Full access to `/var/oled` (OLED storage)
3. ✅ Configured NetBIOS name: `TORREYBOT`
4. ✅ Set up OPC user with full read/write/delete permissions
5. ✅ Configured firewall to allow SMB traffic (ports 139, 445)
6. ✅ Enabled automatic startup on system boot

### Security Configuration:
- User authentication required (no guest access)
- SMB2 protocol minimum (secure for Windows 10/11)
- Full permissions for OPC user only
- Firewall properly configured

---

## 🚀 Quick Access URLs

Copy and paste these into Windows Explorer:

```
\\144.24.24.215\MainDrive
\\144.24.24.215\OLEDDrive
```

Or try the NetBIOS name:
```
\\TORREYBOT\MainDrive
\\TORREYBOT\OLEDDrive
```

---

## 🛠️ Troubleshooting

### If you can't connect:

1. **Check Windows Network Discovery**:
   - Open Control Panel → Network and Sharing Center
   - Click "Change advanced sharing settings"
   - Ensure "Turn on network discovery" is selected
   - Ensure "Turn on file and printer sharing" is selected

2. **Clear Windows Credential Cache**:
   ```cmd
   net use * /delete
   ```

3. **Test connectivity**:
   ```cmd
   ping 144.24.24.215
   ```

4. **Force SMB protocol** (if needed):
   - Run in elevated PowerShell:
   ```powershell
   Enable-WindowsOptionalFeature -Online -FeatureName SMB1Protocol
   ```

### About the Existing "Linux" Entry:
The Linux entry with penguin icon you see in File Explorer is likely from Windows Subsystem for Linux (WSL) or a previous configuration. The new SMB shares will appear under Network or as mapped drives, not under that existing Linux entry.

---

## 📊 Server Details

- **Server IP**: 144.24.24.215
- **Internal IP**: 10.0.1.229
- **Hostname**: torreybot-oraclelinux
- **NetBIOS Name**: TORREYBOT
- **Operating System**: Oracle Linux 9
- **Samba Version**: 4.21.3

---

## ✅ Verification Checklist

All components verified and working:
- [x] Samba services running (smb, nmb)
- [x] Firewall configured for SMB
- [x] OPC user has SMB access
- [x] Both shares visible via smbclient
- [x] Services enabled for automatic startup
- [x] Full read/write permissions configured

---

## 📝 Notes

- The shares provide **FULL ACCESS** to the Linux filesystem as the OPC user
- You can create, modify, delete, copy, and move files/folders
- Changes are immediate and permanent
- Be cautious when modifying system files in MainDrive

---

*Setup completed successfully on January 12, 2025*