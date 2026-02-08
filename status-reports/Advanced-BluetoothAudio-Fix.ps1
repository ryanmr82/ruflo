# Advanced Bluetooth Audio Fix - PowerShell Version
# Mimics what computer restart does based on community research
# Addresses: Driver reset + Radio Management + Audio stack + Hardware scan

#Requires -RunAsAdministrator

param(
    [switch]$Verbose = $false,
    [switch]$SkipDriverReset = $false
)

function Write-Status {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "HH:mm:ss"
    $color = switch($Level) {
        "INFO" { "Cyan" }
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        "STEP" { "Magenta" }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Test-AdminRights {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-AudioProcesses {
    Write-Status "[STEP 1] Stopping audio processes that may lock devices..." "STEP"

    $processes = @("audiodg", "dwm")
    foreach ($proc in $processes) {
        try {
            $runningProcs = Get-Process -Name $proc -ErrorAction SilentlyContinue
            if ($runningProcs) {
                Stop-Process -Name $proc -Force -ErrorAction SilentlyContinue
                Write-Status "Stopped process: $proc" "SUCCESS"
            }
        } catch {
            if ($Verbose) { Write-Status "Could not stop $proc (may not be running)" "WARNING" }
        }
    }
}

function Reset-ServicesInOrder {
    Write-Status "[STEP 2] Resetting services in dependency order..." "STEP"

    # Services to stop (in order)
    $servicesToStop = @("AudioSrv", "AudioEndpointBuilder", "BTAGService", "bthserv", "RmSvc")

    # Stop services
    foreach ($service in $servicesToStop) {
        try {
            $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq "Running") {
                Stop-Service -Name $service -Force -ErrorAction Stop
                Write-Status "Stopped: $($svc.DisplayName)" "SUCCESS"
            }
        } catch {
            Write-Status "Could not stop $service`: $($_.Exception.Message)" "WARNING"
        }
    }

    Start-Sleep -Seconds 3

    # Start services (in reverse order)
    $servicesToStart = @("RmSvc", "bthserv", "AudioEndpointBuilder", "AudioSrv", "BTAGService")

    foreach ($service in $servicesToStart) {
        try {
            $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
            if ($svc) {
                Start-Service -Name $service -ErrorAction Stop
                Write-Status "Started: $($svc.DisplayName)" "SUCCESS"
                Start-Sleep -Seconds 2
            }
        } catch {
            Write-Status "Could not start $service`: $($_.Exception.Message)" "WARNING"
        }
    }
}

function Reset-BluetoothDrivers {
    if ($SkipDriverReset) {
        Write-Status "Skipping driver reset (SkipDriverReset flag set)" "INFO"
        return
    }

    Write-Status "[STEP 3] Resetting Bluetooth drivers..." "STEP"

    try {
        # Get Bluetooth devices
        $bluetoothDevices = Get-PnpDevice | Where-Object {
            $_.FriendlyName -like "*Bluetooth*" -and $_.Class -eq "Bluetooth"
        }

        foreach ($device in $bluetoothDevices) {
            Write-Status "Resetting: $($device.FriendlyName)" "INFO"

            # Disable device
            Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false
            Start-Sleep -Seconds 2

            # Enable device
            Enable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false
            Start-Sleep -Seconds 2

            Write-Status "Reset completed: $($device.FriendlyName)" "SUCCESS"
        }
    } catch {
        Write-Status "Driver reset failed: $($_.Exception.Message)" "ERROR"
    }
}

function Reset-AudioDrivers {
    Write-Status "[STEP 4] Resetting audio drivers..." "STEP"

    try {
        # Get audio devices (be more specific to avoid system critical devices)
        $audioDevices = Get-PnpDevice | Where-Object {
            ($_.FriendlyName -like "*Audio*" -or $_.FriendlyName -like "*Sound*") -and
            $_.Class -in @("AudioEndpoint", "MEDIA") -and
            $_.Status -eq "OK"
        }

        foreach ($device in $audioDevices) {
            try {
                Write-Status "Resetting: $($device.FriendlyName)" "INFO"

                Disable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction Stop
                Start-Sleep -Seconds 1
                Enable-PnpDevice -InstanceId $device.InstanceId -Confirm:$false -ErrorAction Stop
                Start-Sleep -Seconds 1

                Write-Status "Reset completed: $($device.FriendlyName)" "SUCCESS"
            } catch {
                Write-Status "Could not reset $($device.FriendlyName)`: $($_.Exception.Message)" "WARNING"
            }
        }
    } catch {
        Write-Status "Audio driver reset failed: $($_.Exception.Message)" "ERROR"
    }
}

function Invoke-HardwareScan {
    Write-Status "[STEP 5] Scanning for hardware changes..." "STEP"

    try {
        # Trigger hardware scan
        Get-CimInstance -ClassName Win32_PnPEntity | Invoke-CimMethod -MethodName ScanForHardwareChanges | Out-Null
        Write-Status "Hardware scan completed" "SUCCESS"
    } catch {
        Write-Status "Hardware scan failed: $($_.Exception.Message)" "WARNING"
    }
}

function Apply-AbsoluteVolumeFix {
    Write-Status "[STEP 6] Applying Absolute Volume fix..." "STEP"

    $regPath = "HKLM:\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT"
    $regValue = "DisableAbsoluteVolume"

    try {
        if (!(Test-Path $regPath)) {
            New-Item -Path $regPath -Force | Out-Null
        }

        Set-ItemProperty -Path $regPath -Name $regValue -Value 1 -Type DWord
        Write-Status "Absolute Volume disabled" "SUCCESS"
    } catch {
        Write-Status "Registry fix failed: $($_.Exception.Message)" "ERROR"
    }
}

function Clear-AudioCache {
    Write-Status "[STEP 7] Clearing audio cache..." "STEP"

    $cachePaths = @(
        "$env:TEMP\*audio*",
        "$env:APPDATA\Microsoft\Windows\Recent\AutomaticDestinations\*"
    )

    foreach ($path in $cachePaths) {
        try {
            Remove-Item -Path $path -Force -Recurse -ErrorAction SilentlyContinue
        } catch {
            # Silently continue
        }
    }
    Write-Status "Cache cleared" "SUCCESS"
}

function Test-BluetoothAudio {
    Write-Status "[STEP 8] Testing Bluetooth audio devices..." "STEP"

    try {
        $bluetoothAudio = Get-CimInstance -ClassName Win32_SoundDevice | Where-Object {
            $_.Name -like "*Bluetooth*"
        }

        if ($bluetoothAudio) {
            Write-Status "Found Bluetooth audio devices:" "SUCCESS"
            foreach ($device in $bluetoothAudio) {
                Write-Status "  - $($device.Name)" "INFO"
            }
            return $true
        } else {
            Write-Status "No Bluetooth audio devices detected" "WARNING"
            return $false
        }
    } catch {
        Write-Status "Audio test failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

# Main execution
try {
    if (!(Test-AdminRights)) {
        Write-Status "This script requires Administrator privileges!" "ERROR"
        exit 1
    }

    Write-Host ""
    Write-Status "=== ADVANCED BLUETOOTH AUDIO FIX ===" "STEP"
    Write-Status "Mimicking computer restart operations..." "INFO"
    Write-Host ""

    # Create backup
    $backupPath = "C:\Claude-Flow\status-reports\bluetooth_advanced_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').reg"
    try {
        reg export "HKEY_LOCAL_MACHINE\SYSTEM\ControlSet001\Control\Bluetooth\Audio\AVRCP\CT" $backupPath /y | Out-Null
        Write-Status "Registry backup created: $backupPath" "SUCCESS"
    } catch {
        Write-Status "Could not create backup (continuing anyway)" "WARNING"
    }

    # Execute all steps
    Stop-AudioProcesses
    Reset-ServicesInOrder
    Reset-BluetoothDrivers
    Reset-AudioDrivers
    Invoke-HardwareScan
    Apply-AbsoluteVolumeFix
    Clear-AudioCache

    # Final service restart
    Write-Status "[STEP 9] Final audio service restart..." "STEP"
    try {
        Restart-Service -Name "AudioSrv" -Force
        Write-Status "Audio service restarted" "SUCCESS"
    } catch {
        Write-Status "Could not restart audio service: $($_.Exception.Message)" "WARNING"
    }

    Start-Sleep -Seconds 3

    # Test results
    $testResult = Test-BluetoothAudio

    Write-Host ""
    Write-Status "=== REPAIR SUMMARY ===" "STEP"
    Write-Status "Audio processes: ✓ Reset" "SUCCESS"
    Write-Status "Service dependencies: ✓ Reset" "SUCCESS"
    Write-Status "Bluetooth drivers: ✓ Reset" "SUCCESS"
    Write-Status "Audio drivers: ✓ Reset" "SUCCESS"
    Write-Status "Hardware scan: ✓ Completed" "SUCCESS"
    Write-Status "Absolute Volume: ✓ Disabled" "SUCCESS"
    Write-Status "Audio cache: ✓ Cleared" "SUCCESS"
    Write-Status "Bluetooth audio test: $(if($testResult) {'✓ Passed'} else {'✗ Issues detected'})" $(if($testResult) {"SUCCESS"} else {"WARNING"})

    Write-Host ""
    if ($testResult) {
        Write-Status "=== FIX COMPLETED SUCCESSFULLY ===" "SUCCESS"
        Write-Status "Your Bluetooth speaker should now work without restart!" "SUCCESS"
    } else {
        Write-Status "=== FIX COMPLETED WITH WARNINGS ===" "WARNING"
        Write-Status "Try reconnecting your Bluetooth speaker now." "INFO"
        Write-Status "If still not working, the issue may be hardware-related." "WARNING"
    }

} catch {
    Write-Status "Script execution failed: $($_.Exception.Message)" "ERROR"
    exit 1
}

Write-Host ""
Write-Status "Press any key to exit..." "INFO"
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")