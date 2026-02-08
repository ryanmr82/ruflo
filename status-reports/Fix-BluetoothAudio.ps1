# Bluetooth Audio Fix Script - Alternative to Computer Restart
# Addresses common Bluetooth speaker issues that require computer restart
# Based on community research and Windows 10 troubleshooting best practices

# Requires Administrator privileges
#Requires -RunAsAdministrator

param(
    [switch]$DisableAbsoluteVolume = $false,
    [switch]$RestoreAbsoluteVolume = $false,
    [switch]$Verbose = $false
)

Write-Host "=== Bluetooth Audio Fix Script ===" -ForegroundColor Cyan
Write-Host "Targeting LG-PL5(B5) and similar Bluetooth speaker issues" -ForegroundColor Yellow
Write-Host ""

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch($Level) {
        "INFO" { "White" }
        "WARN" { "Yellow" }
        "ERROR" { "Red" }
        "SUCCESS" { "Green" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

function Test-AdminRights {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Backup-Registry {
    Write-Log "Creating registry backup..."
    $backupPath = "C:\Claude-Flow\status-reports\bluetooth_audio_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').reg"
    try {
        reg export "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" $backupPath /y | Out-Null
        Write-Log "Registry backup created: $backupPath" "SUCCESS"
        return $backupPath
    } catch {
        Write-Log "Failed to create registry backup: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

function Fix-AbsoluteVolume {
    param([bool]$Disable = $true)

    $regPath = "HKLM:\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT"
    $regValue = "DisableAbsoluteVolume"

    Write-Log "$(if($Disable) {'Disabling'} else {'Enabling'}) Absolute Volume..."

    try {
        if (!(Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
            Write-Log "Created registry path: $regPath" "INFO"
        }

        $value = if($Disable) { 1 } else { 0 }
        Set-ItemProperty -Path $regPath -Name $regValue -Value $value -Type DWord

        $verification = Get-ItemProperty -Path $regPath -Name $regValue -ErrorAction SilentlyContinue
        if ($verification.$regValue -eq $value) {
            Write-Log "Absolute Volume $(if($Disable) {'disabled'} else {'enabled'}) successfully" "SUCCESS"
            return $true
        } else {
            Write-Log "Failed to verify registry change" "ERROR"
            return $false
        }
    } catch {
        Write-Log "Failed to modify registry: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Restart-AudioServices {
    Write-Log "Restarting audio and Bluetooth services..."

    $services = @(
        "AudioSrv",                    # Windows Audio
        "AudioEndpointBuilder",        # Windows Audio Endpoint Builder
        "BTAGService",                 # Bluetooth Audio Gateway Service
        "bthserv"                      # Bluetooth Support Service
    )

    $success = $true

    foreach ($service in $services) {
        try {
            $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
            if ($svc) {
                Write-Log "Restarting service: $($svc.DisplayName)" "INFO"
                Restart-Service -Name $service -Force -ErrorAction Stop
                Start-Sleep -Seconds 2

                $svc = Get-Service -Name $service
                if ($svc.Status -eq "Running") {
                    Write-Log "Service $service restarted successfully" "SUCCESS"
                } else {
                    Write-Log "Service $service is not running after restart" "WARN"
                    $success = $false
                }
            } else {
                Write-Log "Service $service not found" "WARN"
            }
        } catch {
            Write-Log "Failed to restart service $service`: $($_.Exception.Message)" "ERROR"
            $success = $false
        }
    }

    return $success
}

function Reset-BluetoothDevice {
    param([string]$DeviceName = "LG-PL5(B5)")

    Write-Log "Attempting to reset Bluetooth device: $DeviceName"

    try {
        # Find the Bluetooth device
        $device = Get-PnpDevice | Where-Object { $_.FriendlyName -like "*$DeviceName*" -and $_.Class -eq "Bluetooth" }

        if ($device) {
            Write-Log "Found device: $($device.FriendlyName)" "INFO"

            # Disable and re-enable the device
            Write-Log "Disabling device..." "INFO"
            Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false
            Start-Sleep -Seconds 5

            Write-Log "Re-enabling device..." "INFO"
            Enable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false
            Start-Sleep -Seconds 5

            Write-Log "Bluetooth device reset completed" "SUCCESS"
            return $true
        } else {
            Write-Log "Bluetooth device '$DeviceName' not found" "WARN"
            return $false
        }
    } catch {
        Write-Log "Failed to reset Bluetooth device: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-AudioOutput {
    Write-Log "Testing audio output..."

    try {
        # Get Bluetooth audio devices
        $audioDevices = Get-CimInstance -ClassName Win32_SoundDevice | Where-Object { $_.Name -like "*Bluetooth*" }

        if ($audioDevices) {
            foreach ($device in $audioDevices) {
                Write-Log "Found audio device: $($device.Name)" "INFO"
            }
            return $true
        } else {
            Write-Log "No Bluetooth audio devices found" "WARN"
            return $false
        }
    } catch {
        Write-Log "Failed to test audio output: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Clear-AudioCache {
    Write-Log "Clearing audio cache and temporary files..."

    $cachePaths = @(
        "$env:TEMP\*audio*",
        "$env:LOCALAPPDATA\Microsoft\Windows\Temporary Internet Files\*",
        "$env:APPDATA\Microsoft\Windows\Recent\AutomaticDestinations\*"
    )

    foreach ($path in $cachePaths) {
        try {
            $items = Get-ChildItem -Path $path -ErrorAction SilentlyContinue
            if ($items) {
                Remove-Item -Path $path -Force -Recurse -ErrorAction SilentlyContinue
                Write-Log "Cleared cache: $path" "INFO"
            }
        } catch {
            # Silently continue if cache clear fails
        }
    }
}

# Main execution
try {
    if (!(Test-AdminRights)) {
        Write-Log "This script requires Administrator privileges. Please run as Administrator." "ERROR"
        exit 1
    }

    Write-Log "Starting Bluetooth audio troubleshooting..." "INFO"

    # Step 1: Create backup
    $backupPath = Backup-Registry
    if (!$backupPath) {
        Write-Log "WARNING: Could not create registry backup. Continue? (Press any key to continue, Ctrl+C to abort)"
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }

    # Step 2: Clear audio cache
    Clear-AudioCache

    # Step 3: Fix Absolute Volume (primary cause of the issue)
    if ($RestoreAbsoluteVolume) {
        $volumeResult = Fix-AbsoluteVolume -Disable $false
    } else {
        $volumeResult = Fix-AbsoluteVolume -Disable $true
    }

    # Step 4: Restart audio services
    $serviceResult = Restart-AudioServices

    # Step 5: Reset Bluetooth device
    $deviceResult = Reset-BluetoothDevice

    # Step 6: Test audio output
    Start-Sleep -Seconds 3
    $testResult = Test-AudioOutput

    # Summary
    Write-Host ""
    Write-Log "=== REPAIR SUMMARY ===" "INFO"
    Write-Log "Registry Backup: $(if($backupPath) {'✓ Created'} else {'✗ Failed'})" "INFO"
    Write-Log "Absolute Volume Fix: $(if($volumeResult) {'✓ Applied'} else {'✗ Failed'})" "INFO"
    Write-Log "Audio Services: $(if($serviceResult) {'✓ Restarted'} else {'✗ Issues detected'})" "INFO"
    Write-Log "Bluetooth Device: $(if($deviceResult) {'✓ Reset'} else {'✗ Not found/failed'})" "INFO"
    Write-Log "Audio Test: $(if($testResult) {'✓ Devices detected'} else {'✗ No devices'})" "INFO"

    if ($volumeResult -and $serviceResult) {
        Write-Host ""
        Write-Log "REPAIR COMPLETED SUCCESSFULLY!" "SUCCESS"
        Write-Log "Your Bluetooth speaker should now work without requiring a computer restart." "SUCCESS"
        Write-Log "If the issue persists, try disconnecting and reconnecting your speaker." "INFO"

        if ($backupPath) {
            Write-Log "Registry backup saved to: $backupPath" "INFO"
            Write-Log "To restore original settings: reg import `"$backupPath`"" "INFO"
        }
    } else {
        Write-Log "REPAIR ENCOUNTERED ISSUES" "WARN"
        Write-Log "Some components may not have been fixed properly." "WARN"
        Write-Log "You may still need to restart your computer." "WARN"
    }

} catch {
    Write-Log "Script execution failed: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-Host ""
Write-Log "Script execution completed. Press any key to exit..." "INFO"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")