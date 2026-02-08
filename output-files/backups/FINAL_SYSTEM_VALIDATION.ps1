# Final Claude Flow System Validation Script
# Comprehensive testing of the complete system

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    CLAUDE FLOW SYSTEM VALIDATION                            ║" -ForegroundColor Cyan
Write-Host "║                         Complete System Test                                ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

$script:testsPassed = 0
$script:testsFailed = 0
$script:warnings = 0

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [string]$SuccessMessage,
        [string]$FailureMessage
    )
    
    Write-Host "`n[TEST] $Name..." -ForegroundColor Yellow
    
    try {
        $result = & $Test
        if ($result) {
            Write-Host "✅ PASS: $SuccessMessage" -ForegroundColor Green
            $script:testsPassed++
            return $true
        } else {
            Write-Host "❌ FAIL: $FailureMessage" -ForegroundColor Red
            $script:testsFailed++
            return $false
        }
    } catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

function Test-Warning {
    param([string]$Message)
    Write-Host "⚠️  WARNING: $Message" -ForegroundColor Yellow
    $script:warnings++
}

# Test 1: Directory Structure
Test-Component "Directory Structure" {
    $dirs = @(
        "C:\claude-flow",
        "C:\Claude-Flow\output-files",
        "C:\Claude-Flow\output-files\generated-code",
        "C:\Claude-Flow\output-files\reports",
        "C:\Claude-Flow\output-files\data",
        "C:\Claude-Flow\output-files\temp"
    )
    
    $allExist = $true
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            Write-Host "   Missing: $dir" -ForegroundColor Red
            $allExist = $false
        }
    }
    return $allExist
} "All required directories exist" "Some directories are missing"

# Test 2: Core Files
Test-Component "Core Files" {
    $files = @(
        "C:\claude-flow\hive_prompt.txt",
        "C:\claude-flow\hive-mind.ps1",
        "C:\claude-flow\hive-swarm.ps1",
        "C:\claude-flow\hive-mind.bat",
        "C:\claude-flow\hive-swarm.bat"
    )
    
    $allExist = $true
    foreach ($file in $files) {
        if (-not (Test-Path $file)) {
            Write-Host "   Missing: $file" -ForegroundColor Red
            $allExist = $false
        }
    }
    return $allExist
} "All core files present" "Some core files are missing"

# Test 3: PATH Configuration
Test-Component "PATH Configuration" {
    $pathEntries = $env:Path -split ';'
    $claudeFlowInPath = $pathEntries | Where-Object { $_ -like "*claude-flow*" }
    return ($claudeFlowInPath -ne $null)
} "C:\claude-flow is in PATH" "C:\claude-flow not found in PATH"

# Test 4: Command Availability - CMD Context
Test-Component "CMD Command Availability" {
    try {
        $hiveMindTest = & cmd /c "where hive-mind 2>nul"
        $hiveSwarmTest = & cmd /c "where hive-swarm 2>nul"
        return ($hiveMindTest -and $hiveSwarmTest)
    } catch {
        return $false
    }
} "Both commands accessible from CMD" "Commands not accessible from CMD"

# Test 5: PowerShell Command Availability
Test-Component "PowerShell Command Availability" {
    $hiveMindCmd = Get-Command hive-mind -ErrorAction SilentlyContinue
    $hiveSwarmCmd = Get-Command hive-swarm -ErrorAction SilentlyContinue
    return ($hiveMindCmd -and $hiveSwarmCmd)
} "Both commands accessible from PowerShell" "Commands not accessible from PowerShell"

# Test 6: Hive-Mind Script Quality
Test-Component "Hive-Mind Script Validation" {
    if (-not (Test-Path "C:\claude-flow\hive-mind.ps1")) { return $false }
    
    $content = Get-Content "C:\claude-flow\hive-mind.ps1" -Raw
    
    # Check for the broken "mind" command
    if ($content -match "npx.*claude-flow.*mind") {
        Write-Host "   CRITICAL: Script still contains broken 'mind' command!" -ForegroundColor Red
        Write-Host "   ACTION REQUIRED: Replace with fixed version" -ForegroundColor Yellow
        return $false
    }
    
    # Check for proper Claude Code interface
    if ($content -match "claude --file" -or $content -match "claude.*--print") {
        return $true
    }
    
    return $false
} "Hive-Mind script uses correct interface" "Hive-Mind script needs fixing"

# Test 7: Documentation
Test-Component "Documentation Complete" {
    $docs = @(
        "C:\Claude-Flow\output-files\SYSTEM_ARCHITECTURE.md",
        "C:\Claude-Flow\output-files\CLAUDE-FLOW-PATH-ANALYSIS.md",
        "C:\Claude-Flow\output-files\HIVE_MIND_FIX_IMPLEMENTATION.md",
        "C:\Claude-Flow\output-files\DEPLOYMENT_GUIDE.md"
    )
    
    $allExist = $true
    foreach ($doc in $docs) {
        if (-not (Test-Path $doc)) {
            $allExist = $false
        }
    }
    return $allExist
} "All documentation files present" "Some documentation missing"

# Test 8: PATH Manager Tools
Test-Component "PATH Management Tools" {
    $tools = @(
        "C:\Claude-Flow\output-files\claude-flow-path-manager.py",
        "C:\Claude-Flow\output-files\path-diagnostic.ps1",
        "C:\Claude-Flow\output-files\path-cleanup.ps1",
        "C:\Claude-Flow\output-files\add-claude-flow-to-path.ps1"
    )
    
    $allExist = $true
    foreach ($tool in $tools) {
        if (-not (Test-Path $tool)) {
            $allExist = $false
        }
    }
    return $allExist
} "All PATH management tools available" "Some PATH tools missing"

# Test 9: Hive Prompt File
Test-Component "Hive Prompt File" {
    if (-not (Test-Path "C:\claude-flow\hive_prompt.txt")) { return $false }
    
    $content = Get-Content "C:\claude-flow\hive_prompt.txt" -Raw
    return ($content.Length -gt 0)
} "Hive prompt file exists and has content" "Hive prompt file missing or empty"

# Test 10: Fixed Script Availability
Test-Component "Fixed Hive-Mind Script" {
    return (Test-Path "C:\Claude-Flow\output-files\hive-mind-fixed.ps1")
} "Fixed hive-mind script available for deployment" "Fixed script not found"

# Final Results
Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                              TEST RESULTS                                   ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📊 SUMMARY:" -ForegroundColor Cyan
Write-Host "   ✅ Tests Passed: $script:testsPassed" -ForegroundColor Green
Write-Host "   ❌ Tests Failed: $script:testsFailed" -ForegroundColor Red
Write-Host "   ⚠️  Warnings: $script:warnings" -ForegroundColor Yellow

$totalTests = $script:testsPassed + $script:testsFailed
$passRate = if ($totalTests -gt 0) { [math]::Round(($script:testsPassed / $totalTests) * 100, 1) } else { 0 }
Write-Host "   📈 Pass Rate: $passRate%" -ForegroundColor Cyan

if ($script:testsFailed -eq 0) {
    Write-Host "`n🎉 SYSTEM VALIDATION SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Claude Flow system is ready for production use." -ForegroundColor White
} elseif ($script:testsFailed -le 2) {
    Write-Host "`n⚠️  SYSTEM MOSTLY READY" -ForegroundColor Yellow
    Write-Host "   Minor issues need attention before full deployment." -ForegroundColor White
} else {
    Write-Host "`n🚨 SYSTEM NEEDS ATTENTION" -ForegroundColor Red
    Write-Host "   Multiple issues require resolution before deployment." -ForegroundColor White
}

Write-Host "`n🔧 IMMEDIATE ACTIONS REQUIRED:" -ForegroundColor Cyan

if ($script:testsFailed -gt 0) {
    Write-Host "   1. Fix failed tests listed above" -ForegroundColor Yellow
    
    # Check if hive-mind needs fixing
    if (Test-Path "C:\claude-flow\hive-mind.ps1") {
        $content = Get-Content "C:\claude-flow\hive-mind.ps1" -Raw
        if ($content -match "npx.*claude-flow.*mind") {
            Write-Host "   2. CRITICAL: Replace broken hive-mind.ps1:" -ForegroundColor Red
            Write-Host "      Copy-Item 'C:\Claude-Flow\output-files\hive-mind-fixed.ps1' 'C:\claude-flow\hive-mind.ps1' -Force" -ForegroundColor White
        }
    }
}

if ($script:warnings -gt 0) {
    Write-Host "   3. Address warnings for optimal performance" -ForegroundColor Yellow
}

Write-Host "   4. Test commands manually:" -ForegroundColor White
Write-Host "      hive-mind" -ForegroundColor Gray
Write-Host "      hive-swarm" -ForegroundColor Gray

Write-Host "`n📚 DOCUMENTATION AVAILABLE:" -ForegroundColor Cyan
Write-Host "   • System Architecture: C:\Claude-Flow\output-files\SYSTEM_ARCHITECTURE.md" -ForegroundColor White
Write-Host "   • Deployment Guide: C:\Claude-Flow\output-files\DEPLOYMENT_GUIDE.md" -ForegroundColor White
Write-Host "   • Fix Implementation: C:\Claude-Flow\output-files\HIVE_MIND_FIX_IMPLEMENTATION.md" -ForegroundColor White
Write-Host "   • PATH Analysis: C:\Claude-Flow\output-files\CLAUDE-FLOW-PATH-ANALYSIS.md" -ForegroundColor White

Write-Host "`n" -NoNewline
Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VALIDATION COMPLETE                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan