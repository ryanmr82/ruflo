# GuildShopSync Auto-Uploader
# Watches for SavedVariables changes and uploads automatically
# Runs invisibly - no window, no tray icon

$ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices"
$WatchPath = "C:\turtlewow\WTF\Account"
$WatchFilter = "GuildShopSync.lua"

function Upload-Prices {
    param([string]$FilePath)

    if (-not (Test-Path $FilePath)) { return }

    $content = Get-Content $FilePath -Raw

    # Check for trigger flag
    if ($content -notmatch '\["triggerUpload"\]\s*=\s*true') { return }

    # Extract prices
    $prices = @{}
    if ($content -match '\["prices"\]\s*=\s*\{([^}]+)\}') {
        $pricesSection = $Matches[1]
        $pattern = '\["(\w+)"\]\s*=\s*(\d+)'
        $priceMatches = [regex]::Matches($pricesSection, $pattern)
        foreach ($match in $priceMatches) {
            $prices[$match.Groups[1].Value] = [int]$match.Groups[2].Value
        }
    }

    if ($prices.Count -eq 0) { return }

    # Upload
    $payload = @{
        prices = $prices
        source = "GuildShopSync-addon"
        updatedBy = "GuildShopSync"
    } | ConvertTo-Json -Compress

    try {
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Put -ContentType "application/json" -Body $payload

        if ($response.success) {
            # Clear trigger
            $content = $content -replace '\["triggerUpload"\]\s*=\s*true', '["triggerUpload"] = false'
            $content | Set-Content $FilePath -NoNewline

            # Show notification
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
    } catch {}
}

# Find the actual file
$svFiles = Get-ChildItem -Path $WatchPath -Recurse -Filter $WatchFilter -ErrorAction SilentlyContinue
if ($svFiles.Count -eq 0) { exit }

$watchFolder = $svFiles[0].DirectoryName

# Set up file watcher
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = $watchFolder
$watcher.Filter = $WatchFilter
$watcher.NotifyFilter = [System.IO.NotifyFilters]::LastWrite
$watcher.EnableRaisingEvents = $true

# Event handler
$action = {
    Start-Sleep -Milliseconds 500  # Wait for file to finish writing
    Upload-Prices -FilePath $Event.SourceEventArgs.FullPath
}

Register-ObjectEvent $watcher "Changed" -Action $action | Out-Null

# Keep running
while ($true) { Start-Sleep -Seconds 60 }
