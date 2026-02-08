# GuildShopScanner Price Upload Script (PowerShell)
# Reads SavedVariables and uploads to TBC Guild API

param(
    [string]$SavedVariablesPath
)

$ApiUrl = "https://tbcguild.duckdns.org/api/consumes/prices"

# Default paths to check
$DefaultPaths = @(
    "$env:USERPROFILE\Games\Turtle-WoW\WTF\Account\*\SavedVariables\GuildShopScanner.lua",
    "C:\Games\Turtle-WoW\WTF\Account\*\SavedVariables\GuildShopScanner.lua",
    "D:\Games\Turtle-WoW\WTF\Account\*\SavedVariables\GuildShopScanner.lua",
    "C:\Program Files\Turtle-WoW\WTF\Account\*\SavedVariables\GuildShopScanner.lua"
)

# Find SavedVariables file
$SvPath = $null

if ($SavedVariablesPath) {
    if (Test-Path $SavedVariablesPath) {
        $SvPath = $SavedVariablesPath
    } else {
        Write-Host "Error: File not found: $SavedVariablesPath" -ForegroundColor Red
        exit 1
    }
} else {
    # Try default paths
    foreach ($path in $DefaultPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $SvPath = $found.FullName
            break
        }
    }
}

if (-not $SvPath) {
    Write-Host "Error: Could not find GuildShopScanner.lua SavedVariables file." -ForegroundColor Red
    Write-Host ""
    Write-Host "Usage: .\Upload-Prices.ps1 [-SavedVariablesPath <path>]"
    Write-Host ""
    Write-Host "Example:"
    Write-Host "  .\Upload-Prices.ps1 -SavedVariablesPath 'C:\Games\Turtle-WoW\WTF\Account\MYACCOUNT\SavedVariables\GuildShopScanner.lua'"
    Write-Host ""
    Write-Host "Checked paths:"
    foreach ($path in $DefaultPaths) {
        Write-Host "  $path"
    }
    exit 1
}

Write-Host "Reading prices from: $SvPath" -ForegroundColor Cyan

# Read file content
$content = Get-Content $SvPath -Raw

# Extract prices using regex
# Pattern matches: ["ShopId"] = { ["price"] = 12345,
$pattern = '\["([A-Za-z]+)"\]\s*=\s*\{\s*\["price"\]\s*=\s*(\d+)'
$matches = [regex]::Matches($content, $pattern)

if ($matches.Count -eq 0) {
    Write-Host "Error: No prices found in SavedVariables file." -ForegroundColor Red
    Write-Host "Make sure you've run /gss scan in-game first!" -ForegroundColor Yellow
    exit 1
}

# Build prices hashtable
$prices = @{}
foreach ($match in $matches) {
    $shopId = $match.Groups[1].Value
    $price = [int]$match.Groups[2].Value
    $prices[$shopId] = $price

    # Format as gold for display
    $gold = [math]::Floor($price / 10000)
    $silver = [math]::Floor(($price % 10000) / 100)
    $copper = $price % 100
    $formatted = ""
    if ($gold -gt 0) { $formatted += "${gold}g " }
    if ($silver -gt 0) { $formatted += "${silver}s " }
    if ($copper -gt 0 -or $formatted -eq "") { $formatted += "${copper}c" }

    Write-Host "  $shopId : $formatted" -ForegroundColor Green
}

Write-Host ""
Write-Host "Found $($prices.Count) prices." -ForegroundColor Cyan
Write-Host "Uploading to API..." -ForegroundColor Cyan

# Build JSON payload
$payload = @{
    prices = $prices
    source = "addon"
    updatedBy = "GuildShopScanner"
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod -Uri $ApiUrl -Method Put -ContentType "application/json" -Body $payload

    if ($response.success) {
        Write-Host ""
        Write-Host "Prices uploaded successfully!" -ForegroundColor Green
        Write-Host "Updated $($response.updatedCount) items at $($response.updatedAt)" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Upload failed: $($response | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "Error uploading prices: $_" -ForegroundColor Red
    exit 1
}
