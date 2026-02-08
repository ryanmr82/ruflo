# GuildShopSync - Auto-uploads prices to TBC Guild website
# Watches for trigger from in-game addon and uploads immediately

param(
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$RunOnce
)

$ScriptPath = $PSScriptRoot
$ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices"

# SavedVariables paths to check
$SavedVarsPaths = @(
    "C:\turtlewow\WTF\Account\STORMSHADOW\SavedVariables\GuildShopSync.lua",
    "C:\turtlewow\WTF\Account\*\SavedVariables\GuildShopSync.lua"
)

$LogFile = "$ScriptPath\sync.log"
$PidFile = "$ScriptPath\sync.pid"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LogFile -Append
    Write-Host "$timestamp - $Message"
}

function Find-SavedVars {
    foreach ($path in $SavedVarsPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            return $found.FullName
        }
    }
    return $null
}

function Get-Prices {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) {
        return $null
    }

    $content = Get-Content $FilePath -Raw

    # Check for trigger flag
    if ($content -notmatch '\["triggerUpload"\]\s*=\s*true') {
        return $null  # No trigger, skip
    }

    # Extract prices from GuildShopSyncDB.prices
    $prices = @{}
    $pattern = '\["(\w+)"\]\s*=\s*(\d+)'

    # Find the prices section
    if ($content -match '\["prices"\]\s*=\s*\{([^}]+)\}') {
        $pricesSection = $Matches[1]
        $priceMatches = [regex]::Matches($pricesSection, $pattern)

        foreach ($match in $priceMatches) {
            $shopId = $match.Groups[1].Value
            $price = [int]$match.Groups[2].Value
            $prices[$shopId] = $price
        }
    }

    return $prices
}

function Clear-Trigger {
    param([string]$FilePath)

    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $content = $content -replace '\["triggerUpload"\]\s*=\s*true', '["triggerUpload"] = false'
        $content | Set-Content $FilePath -NoNewline
    }
}

function Upload-Prices {
    param([hashtable]$Prices)

    if ($Prices.Count -eq 0) {
        Write-Log "No prices to upload"
        return $false
    }

    Write-Log "Uploading $($Prices.Count) prices..."

    foreach ($key in $Prices.Keys) {
        $gold = [math]::Floor($Prices[$key] / 10000)
        $silver = [math]::Floor(($Prices[$key] % 10000) / 100)
        Write-Log "  $key : ${gold}g ${silver}s"
    }

    $payload = @{
        prices = $Prices
        source = "GuildShopSync-addon"
        updatedBy = "GuildShopSync"
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Put -ContentType "application/json" -Body $payload

        if ($response.success) {
            Write-Log "SUCCESS: Uploaded $($response.updatedCount) prices to guild website"
            return $true
        } else {
            Write-Log "ERROR: Upload failed - $($response | ConvertTo-Json)"
            return $false
        }
    } catch {
        Write-Log "ERROR: Upload exception - $_"
        return $false
    }
}

function Start-Watcher {
    Write-Log "=== GuildShopSync Service Started ==="
    Write-Log "Watching for in-game sync trigger..."
    Write-Log "API: $ApiUrl"

    # Save PID
    $PID | Out-File $PidFile

    $lastCheck = $null

    while ($true) {
        try {
            $svPath = Find-SavedVars

            if ($svPath) {
                $prices = Get-Prices -FilePath $svPath

                if ($prices -and $prices.Count -gt 0) {
                    Write-Log "Trigger detected! Found $($prices.Count) prices"

                    if (Upload-Prices -Prices $prices) {
                        Clear-Trigger -FilePath $svPath
                        Write-Log "Upload complete. Trigger cleared."

                        # Show Windows notification
                        [System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms') | Out-Null
                        $balloon = New-Object System.Windows.Forms.NotifyIcon
                        $balloon.Icon = [System.Drawing.SystemIcons]::Information
                        $balloon.BalloonTipTitle = "Guild Shop Sync"
                        $balloon.BalloonTipText = "Uploaded $($prices.Count) prices to guild website!"
                        $balloon.Visible = $true
                        $balloon.ShowBalloonTip(5000)
                        Start-Sleep -Seconds 6
                        $balloon.Dispose()
                    }
                }
            }
        } catch {
            Write-Log "ERROR: $($_)"
        }

        # Check every 5 seconds
        Start-Sleep -Seconds 5
    }
}

function Install-Service {
    Write-Log "Installing GuildShopSync as scheduled task..."

    # Create VBS wrapper to run hidden
    $vbsPath = "$ScriptPath\RunHidden.vbs"
    @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File ""$PSCommandPath""", 0, False
"@ | Out-File $vbsPath -Encoding ASCII

    $action = New-ScheduledTaskAction -Execute "wscript.exe" -Argument "`"$vbsPath`""
    $trigger = New-ScheduledTaskTrigger -AtLogon
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartInterval (New-TimeSpan -Minutes 1) -RestartCount 3
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Limited

    Register-ScheduledTask -TaskName "GuildShopSync" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Force

    Write-Log "Installed! Starting task..."
    Start-ScheduledTask -TaskName "GuildShopSync"
    Write-Log "GuildShopSync is now running in the background."
    Write-Log "You will see a Windows notification when prices are uploaded."
}

function Uninstall-Service {
    Write-Log "Stopping and uninstalling GuildShopSync..."

    # Kill running process
    if (Test-Path $PidFile) {
        $pid = Get-Content $PidFile
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Remove-Item $PidFile -Force
    }

    Stop-ScheduledTask -TaskName "GuildShopSync" -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName "GuildShopSync" -Confirm:$false -ErrorAction SilentlyContinue

    Write-Log "Uninstalled."
}

# Main
if ($Install) {
    Install-Service
} elseif ($Uninstall) {
    Uninstall-Service
} elseif ($RunOnce) {
    Write-Log "=== Running one-time check ==="
    $svPath = Find-SavedVars
    if ($svPath) {
        Write-Log "Found: $svPath"
        $prices = Get-Prices -FilePath $svPath
        if ($prices -and $prices.Count -gt 0) {
            Write-Log "Found $($prices.Count) prices with trigger"
            if (Upload-Prices -Prices $prices) {
                Clear-Trigger -FilePath $svPath
            }
        } else {
            Write-Log "No trigger or no prices found. Use the button in aux to scan first."
        }
    } else {
        Write-Log "SavedVariables file not found. Log out of WoW first."
    }
} else {
    Start-Watcher
}
