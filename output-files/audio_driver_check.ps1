# Audio Driver Information Script
Write-Host "=== Audio Driver Information Report ===" -ForegroundColor Green

# System Information
Write-Host "`n--- System Information ---" -ForegroundColor Yellow
$computerInfo = Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
Write-Host "OS: $($computerInfo.WindowsProductName) Version: $($computerInfo.WindowsVersion)"

# Sound Devices with Driver Info
Write-Host "`n--- Sound Devices ---" -ForegroundColor Yellow
$soundDevices = Get-WmiObject Win32_SoundDevice | Where-Object {$_.Status -eq "OK"}
foreach ($device in $soundDevices) {
    Write-Host "Device: $($device.Name)" -ForegroundColor White
    Write-Host "  Manufacturer: $($device.Manufacturer)"
    Write-Host "  Status: $($device.Status)"
    Write-Host "  Driver Version: $($device.DriverVersion)"
    Write-Host "  Driver Date: $($device.DriverDate)"
    Write-Host ""
}

# Hardware Information
Write-Host "`n--- Hardware Information ---" -ForegroundColor Yellow
$pciDevices = Get-WmiObject Win32_PnPEntity | Where-Object {$_.Name -like "*audio*" -or $_.Name -like "*sound*" -or $_.Name -like "*Realtek*" -or $_.Name -like "*Intel*Audio*" -or $_.Name -like "*NVIDIA*Audio*"}
foreach ($device in $pciDevices) {
    if ($device.Name -and $device.Status -eq "OK") {
        Write-Host "Hardware: $($device.Name)" -ForegroundColor White
        Write-Host "  Device ID: $($device.DeviceID)"
        Write-Host "  Status: $($device.Status)"
        Write-Host ""
    }
}

# Driver Store Information
Write-Host "`n--- Audio Drivers in Windows ---" -ForegroundColor Yellow
try {
    $audioDrivers = Get-WindowsDriver -Online | Where-Object {$_.ClassName -like "*Audio*" -or $_.ClassName -like "*Media*"}
    foreach ($driver in $audioDrivers) {
        Write-Host "Driver: $($driver.OriginalFileName)" -ForegroundColor White
        Write-Host "  Version: $($driver.Version)"
        Write-Host "  Date: $($driver.Date)"
        Write-Host "  Class: $($driver.ClassName)"
        Write-Host ""
    }
} catch {
    Write-Host "Unable to access Windows Driver Store (requires elevation)" -ForegroundColor Red
}

Write-Host "=== Report Complete ===" -ForegroundColor Green