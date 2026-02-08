; GuildShopSync Installer Script v3.1
; Inno Setup 6.x
;
; v3.1: Replaced PowerShell service with compiled .NET WinForms EXE.
;       Replaced Task Scheduler with Registry Run key.
;       Eliminates STATUS_CONTROL_C_EXIT failures from all previous versions.

#define MyAppName "GuildShopSync"
#define MyAppVersion "3.1"
#define MyAppPublisher "Thralls Book Club"
#define MyAppURL "https://tbcguild.duckdns.org/consumes"
#define MyAppExeName "GuildShopSyncTray.exe"

[Setup]
AppId={{8F4E5A2B-1C3D-4E5F-A6B7-C8D9E0F1A2B3}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputDir=output
OutputBaseFilename=GuildShopSync-Setup-v{#MyAppVersion}
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
DisableProgramGroupPage=yes

; Inno Setup can now detect and close our named EXE (not generic powershell.exe)
CloseApplications=force
CloseApplicationsFilter=GuildShopSyncTray.exe
RestartApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Files]
; Main executable - compiled .NET WinForms app (GUI subsystem, not console)
Source: "source\GuildShopSyncTray.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "source\README.txt"; DestDir: "{app}"; Flags: ignoreversion

; Addon files - copied to WoW folder during install
Source: "source\GuildShopSync.lua"; DestDir: "{app}\Addon"; Flags: ignoreversion
Source: "source\GuildShopSync.toc"; DestDir: "{app}\Addon"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{#MyAppName} README"; Filename: "{app}\README.txt"
Name: "{group}\Uninstall {#MyAppName}"; Filename: "{uninstallexe}"

[Registry]
; WoW path for the tray app (set by installer, read at runtime)
Root: HKCU; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "WoWPath"; ValueData: "{code:GetWoWPath}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

; AUTO-START: Registry Run key - standard method for tray apps.
; This replaces the Task Scheduler approach from v2.6-v3.0 which was unreliable.
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue

[Run]
; Kill any old PowerShell-based sync processes (from v2.x / v3.0)
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *GuildShopSync*"""; Flags: runhidden waituntilterminated; StatusMsg: "Stopping old sync processes..."

; Kill any running tray app (upgrade scenario)
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; Flags: runhidden waituntilterminated; StatusMsg: "Stopping running tray app..."

; Remove old scheduled task from v2.x/v3.0 (cleanup)
Filename: "schtasks"; Parameters: "/delete /tn ""GuildShopSync"" /f"; Flags: runhidden waituntilterminated; StatusMsg: "Removing old scheduled task..."

; Install addon to WoW folder
Filename: "xcopy"; Parameters: """{app}\Addon\*"" ""{code:GetWoWPath}\Interface\AddOns\GuildShopSync\"" /E /I /Y"; Flags: runhidden waituntilterminated; StatusMsg: "Installing addon to WoW folder..."

; Launch tray app after install (checkbox on final page)
Filename: "{app}\{#MyAppExeName}"; Description: "Launch GuildShopSync"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Kill the tray app
Filename: "taskkill"; Parameters: "/f /im {#MyAppExeName}"; Flags: runhidden waituntilterminated

; Kill any old PowerShell processes (in case of mixed install)
Filename: "taskkill"; Parameters: "/f /im powershell.exe /fi ""WINDOWTITLE eq *GuildShopSync*"""; Flags: runhidden

; Remove old scheduled task if it still exists (cleanup from v2.x/v3.0)
Filename: "schtasks"; Parameters: "/delete /tn ""GuildShopSync"" /f"; Flags: runhidden

; Clean up old environment variable from v2.5
Filename: "cmd"; Parameters: "/c REG delete ""HKCU\Environment"" /v GUILDSHOPSYNC_WOWPATH /f"; Flags: runhidden

[UninstallDelete]
; Remove addon from WoW folder
Type: filesandordirs; Name: "{code:GetWoWPath}\Interface\AddOns\GuildShopSync"

; Remove log folder
Type: filesandordirs; Name: "{localappdata}\GuildShopSync"

[InstallDelete]
; Remove old PowerShell scripts from previous versions
Type: files; Name: "{app}\SyncService.ps1"
Type: files; Name: "{app}\SetupTask.ps1"
Type: files; Name: "{app}\KillSyncService.ps1"

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

  // Check registry for saved path from previous install
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
begin
  // Kill old PowerShell sync processes
  Exec('taskkill', '/f /im powershell.exe /fi "WINDOWTITLE eq *GuildShopSync*"',
    '', SW_HIDE, ewWaitUntilTerminated, ResultCode);

  // Kill old tray app
  Exec('taskkill', '/f /im GuildShopSyncTray.exe',
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
end;

function CheckPreviousInstall: Boolean;
var
  UninstallKey: String;
  UninstallString: String;
  ResultCode: Integer;
  PrevVersion: String;
begin
  Result := True;
  UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{8F4E5A2B-1C3D-4E5F-A6B7-C8D9E0F1A2B3}_is1';

  if RegQueryStringValue(HKLM, UninstallKey, 'UninstallString', UninstallString) or
     RegQueryStringValue(HKCU, UninstallKey, 'UninstallString', UninstallString) then
  begin
    RegQueryStringValue(HKCU, 'Software\GuildShopSync', 'Version', PrevVersion);

    if MsgBox('A previous version of GuildShopSync (' + PrevVersion + ') is installed.' + #13#10 + #13#10 +
              'It will be automatically removed before installing version {#MyAppVersion}.' + #13#10 + #13#10 +
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
    'Select the folder where TurtleWoW is installed, then click Next.',
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
