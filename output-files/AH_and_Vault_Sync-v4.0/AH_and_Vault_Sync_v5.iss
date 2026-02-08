; AH & Vault Sync - Unified Installer Script v5.0
; Inno Setup 6.x
;
; v5.0: Added BankAltExport addon + Settings GUI for account/character selection
;       Single compiled .NET WinForms tray app with all three addons.

#define MyAppName "AH & Vault Sync"
#define MyAppNameClean "AH_and_Vault_Sync"
#define MyAppVersion "5.0"
#define MyAppPublisher "Thralls Book Club"
#define MyAppURL "https://tbcguild.duckdns.org/consumes"
#define MyAppExeName "AH_and_VaultSyncTray.exe"

[Setup]
AppId={{8F4E5A2B-1C3D-4E5F-A6B7-C8D9E0F1A2B3}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppNameClean}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=AH_and_Vault_Sync-Setup-v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes

; Inno Setup can detect and close our named EXE
CloseApplications=force
CloseApplicationsFilter={#MyAppExeName},GuildShopSyncTray.exe
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Main executable - unified compiled .NET WinForms app (GUI subsystem, not console)
Source: "source\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion
Source: "source\README.txt"; DestDir: "{app}"; Flags: ignoreversion

; GuildShopSync addon files - copied to WoW folder during install
Source: "source\GuildShopSync.lua"; DestDir: "{app}\Addon\GuildShopSync"; Flags: ignoreversion
Source: "source\GuildShopSync.toc"; DestDir: "{app}\Addon\GuildShopSync"; Flags: ignoreversion

; GBankExport addon files - copied to WoW folder during install
Source: "source\GBankExport.lua"; DestDir: "{app}\Addon\GBankExport"; Flags: ignoreversion
Source: "source\GBankExport.toc"; DestDir: "{app}\Addon\GBankExport"; Flags: ignoreversion

; BankAltExport addon files (NEW in v5.0) - copied to WoW folder during install
Source: "source\BankAltExport.lua"; DestDir: "{app}\Addon\BankAltExport"; Flags: ignoreversion
Source: "source\BankAltExport.toc"; DestDir: "{app}\Addon\BankAltExport"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{#MyAppName} README"; Filename: "{app}\README.txt"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[Registry]
; WoW path for the tray app (set by installer, read at runtime)
Root: HKCU; Subkey: "Software\{#MyAppNameClean}"; ValueType: string; ValueName: "WoWPath"; ValueData: "{code:GetWoWPath}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#MyAppNameClean}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

; AUTO-START: Registry Run key - standard method for tray apps.
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppNameClean}"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

; Remove old GuildShopSync Run key (from v3.x)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: none; ValueName: "GuildShopSync"; Flags: deletevalue

[Run]
; ---- CLEANUP OLD INSTALLATIONS ----

; Kill old GuildShopSyncTray.exe (v3.x)
Filename: "taskkill"; Parameters: "/f /im GuildShopSyncTray.exe"; Flags: runhidden waituntilterminated; StatusMsg: "Stopping old GuildShopSync tray app..."

; Kill old PowerShell-based sync processes (v2.x / v3.0)
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *GuildShopSync*"""; Flags: runhidden waituntilterminated; StatusMsg: "Stopping old GuildShopSync PowerShell processes..."

; Kill old AutoExport.ps1 PowerShell processes (GBankExport)
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *AutoExport*"""; Flags: runhidden waituntilterminated; StatusMsg: "Stopping old AutoExport processes..."
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *GBankExport*"""; Flags: runhidden waituntilterminated; StatusMsg: "Stopping old GBankExport processes..."

; Kill any running unified tray app (upgrade scenario)
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; Flags: runhidden waituntilterminated; StatusMsg: "Stopping running tray app..."

; Remove old scheduled task from GuildShopSync v2.x/v3.0 (cleanup)
Filename: "schtasks"; Parameters: "/delete /tn ""GuildShopSync"" /f"; Flags: runhidden waituntilterminated; StatusMsg: "Removing old scheduled task..."

; ---- INSTALL ADDONS TO WOW FOLDER ----

; Install GuildShopSync addon
Filename: "xcopy"; Parameters: """{app}\Addon\GuildShopSync\*"" ""{code:GetWoWPath}\Interface\AddOns\GuildShopSync\"" /E /I /Y"; Flags: runhidden waituntilterminated; StatusMsg: "Installing GuildShopSync addon..."

; Install GBankExport addon
Filename: "xcopy"; Parameters: """{app}\Addon\GBankExport\*"" ""{code:GetWoWPath}\Interface\AddOns\GBankExport\"" /E /I /Y"; Flags: runhidden waituntilterminated; StatusMsg: "Installing GBankExport addon..."

; Install BankAltExport addon (NEW in v5.0)
Filename: "xcopy"; Parameters: """{app}\Addon\BankAltExport\*"" ""{code:GetWoWPath}\Interface\AddOns\BankAltExport\"" /E /I /Y"; Flags: runhidden waituntilterminated; StatusMsg: "Installing BankAltExport addon..."

; ---- LAUNCH ----

; Launch tray app after install (checkbox on final page)
Filename: "{app}\{#MyAppExeName}"; Description: "Launch AH && Vault Sync"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill the unified tray app
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; Flags: runhidden waituntilterminated

; Kill old GuildShopSyncTray.exe if still lingering
Filename: "taskkill"; Parameters: "/f /im GuildShopSyncTray.exe"; Flags: runhidden

; Kill any old PowerShell processes (in case of mixed install)
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *GuildShopSync*"""; Flags: runhidden
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *AutoExport*"""; Flags: runhidden

; Remove old scheduled task if it still exists (cleanup from v2.x/v3.0)
Filename: "schtasks"; Parameters: "/delete /tn ""GuildShopSync"" /f"; Flags: runhidden

; Clean up old environment variable from v2.5
Filename: "cmd"; Parameters: "/c REG delete ""HKCU\Environment"" /v GUILDSHOPSYNC_WOWPATH /f"; Flags: runhidden

[UninstallDelete]
; Remove addons from WoW folder
Type: filesandordirs; Name: "{code:GetWoWPath}\Interface\AddOns\GuildShopSync"
Type: filesandordirs; Name: "{code:GetWoWPath}\Interface\AddOns\GBankExport"
Type: filesandordirs; Name: "{code:GetWoWPath}\Interface\AddOns\BankAltExport"

; Remove log folder
Type: filesandordirs; Name: "{localappdata}\AH_and_VaultSync"

; Remove old GuildShopSync log folder
Type: filesandordirs; Name: "{localappdata}\GuildShopSync"

[InstallDelete]
; Remove old PowerShell scripts from previous GuildShopSync versions
Type: files; Name: "{app}\SyncService.ps1"
Type: files; Name: "{app}\SetupTask.ps1"
Type: files; Name: "{app}\KillSyncService.ps1"
; Remove old GuildShopSyncTray.exe if upgrading in place
Type: files; Name: "{app}\GuildShopSyncTray.exe"

[Code]
var
  WoWPathPage: TInputDirWizardPage;
  WoWPath: String;

function GetWoWPath(Param: String): String;
begin
  Result := WoWPath;
end;

function DetectWoWPath: String;
var
  TestPaths: array[0..6] of String;
  i: Integer;
  RegPath: String;
begin
  Result := '';

  // Check new unified registry key first
  if RegQueryStringValue(HKCU, 'Software\AH_and_VaultSync', 'WoWPath', RegPath) then
  begin
    if DirExists(RegPath) and FileExists(RegPath + '\WoW.exe') then
    begin
      Result := RegPath;
      Exit;
    end;
  end;

  // Check legacy GuildShopSync registry key (upgrade from v3.x)
  if RegQueryStringValue(HKCU, 'Software\GuildShopSync', 'WoWPath', RegPath) then
  begin
    if DirExists(RegPath) and FileExists(RegPath + '\WoW.exe') then
    begin
      Result := RegPath;
      Exit;
    end;
  end;

  // Common TurtleWoW installation paths
  TestPaths[0] := 'C:\turtlewow';
  TestPaths[1] := 'D:\turtlewow';
  TestPaths[2] := 'C:\Games\turtlewow';
  TestPaths[3] := 'D:\Games\turtlewow';
  TestPaths[4] := ExpandConstant('{userdocs}') + '\turtlewow';
  TestPaths[5] := 'C:\Program Files\turtlewow';
  TestPaths[6] := 'C:\Program Files (x86)\turtlewow';

  for i := 0 to 6 do
  begin
    if DirExists(TestPaths[i]) and FileExists(TestPaths[i] + '\WoW.exe') then
    begin
      Result := TestPaths[i];
      Exit;
    end;
  end;
end;

procedure CleanupOldInstallation;
var
  ResultCode: Integer;
  OldStartupVbs: String;
  OldGBankVbs: String;
begin
  // Kill old GuildShopSync PowerShell processes
  Exec('taskkill', '/f /im powershell.exe /fi "WINDOWTITLE eq *GuildShopSync*"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Kill old GuildShopSyncTray.exe
  Exec('taskkill', '/f /im GuildShopSyncTray.exe',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Kill old AutoExport.ps1 processes
  Exec('taskkill', '/f /im powershell.exe /fi "WINDOWTITLE eq *AutoExport*"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Remove old scheduled task
  Exec('schtasks', '/delete /tn "GuildShopSync" /f',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Clean up old environment variable from v2.5
  Exec('cmd', '/c REG delete "HKCU\Environment" /v GUILDSHOPSYNC_WOWPATH /f',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Remove old VBS startup scripts from manual installations
  OldStartupVbs := ExpandConstant('{userstartup}') + '\GuildShopSync.vbs';
  if FileExists(OldStartupVbs) then
    DeleteFile(OldStartupVbs);

  // Remove old GBankExport-AutoExport.vbs from Windows Startup
  OldGBankVbs := ExpandConstant('{userstartup}') + '\GBankExport-AutoExport.vbs';
  if FileExists(OldGBankVbs) then
    DeleteFile(OldGBankVbs);

  // Clean up old GuildShopSync registry Run key
  RegDeleteValue(HKCU, 'Software\Microsoft\Windows\CurrentVersion\Run', 'GuildShopSync');
end;

function CheckPreviousInstall: Boolean;
var
  UninstallKey: String;
  UninstallString: String;
  ResultCode: Integer;
  PrevVersion: String;
  PrevAppName: String;
begin
  Result := True;
  UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{8F4E5A2B-1C3D-4E5F-A6B7-C8D9E0F1A2B3}_is1';

  if RegQueryStringValue(HKLM, UninstallKey, 'UninstallString', UninstallString) or
     RegQueryStringValue(HKCU, UninstallKey, 'UninstallString', UninstallString) then
  begin
    // Try to determine what version is installed
    PrevVersion := 'unknown';
    PrevAppName := 'GuildShopSync';
    if RegQueryStringValue(HKCU, 'Software\AH_and_VaultSync', 'Version', PrevVersion) then
      PrevAppName := 'AH & Vault Sync'
    else if RegQueryStringValue(HKCU, 'Software\GuildShopSync', 'Version', PrevVersion) then
      PrevAppName := 'GuildShopSync';

    if MsgBox('A previous version of ' + PrevAppName + ' (' + PrevVersion + ') is installed.' + #13#10 + #13#10 +
              'It will be automatically removed before installing AH & Vault Sync v{#MyAppVersion}.' + #13#10 + #13#10 +
              'Continue?', mbConfirmation, MB_YESNO) = IDYES then
    begin
      UninstallString := RemoveQuotes(UninstallString);
      Exec(UninstallString, '/VERYSILENT /NORESTART', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Result := True;
    end
    else
      Result := False;
  end
  else
  begin
    CleanupOldInstallation;
  end;
end;

procedure InitializeWizard;
begin
  WoWPath := DetectWoWPath;

  WoWPathPage := CreateInputDirPage(wpSelectDir,
    'Select World of Warcraft Location',
    'Where is TurtleWoW installed?',
    'Select the folder where TurtleWoW is installed, then click Next.' + #13#10 +
    'The GuildShopSync (AH prices), GBankExport (guild bank), and BankAltExport (bank alt) addons will be installed.',
    False, '');
  WoWPathPage.Add('');

  if WoWPath <> '' then
    WoWPathPage.Values[0] := WoWPath
  else
    WoWPathPage.Values[0] := 'C:\turtlewow';
end;

function InitializeSetup: Boolean;
begin
  Result := CheckPreviousInstall;
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = WoWPathPage.ID then
  begin
    WoWPath := WoWPathPage.Values[0];

    if not DirExists(WoWPath) then
    begin
      MsgBox('The selected folder does not exist.' + #13#10 + #13#10 +
             'Please select your TurtleWoW installation folder.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if not FileExists(WoWPath + '\WoW.exe') then
    begin
      MsgBox('WoW.exe was not found in the selected folder.' + #13#10 + #13#10 +
             'Please select your TurtleWoW installation folder.', mbError, MB_OK);
      Result := False;
      Exit;
    end;

    if not DirExists(WoWPath + '\Interface\AddOns') then
      ForceDirectories(WoWPath + '\Interface\AddOns');
  end;
end;
