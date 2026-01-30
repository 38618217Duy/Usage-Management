# ============================================
# CDP Integration Test Script
# Version: 1.0
# Usage: .\test-cdp.ps1
# ============================================

param(
    [switch]$SkipChromeCheck,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "  → $Message" -ForegroundColor Cyan
}

# ============================================
# HEADER
# ============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           CDP INTEGRATION TEST SCRIPT                      ║" -ForegroundColor Cyan
Write-Host "║           Cursor Usage Automation                          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$testResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
}

# ============================================
# TEST 1: Check CDP Port
# ============================================
Write-Step "TEST 1: Checking if CDP is available on port 9222..."

try {
    $cdpVersion = Invoke-RestMethod -Uri "http://localhost:9222/json/version" -TimeoutSec 5
    Write-Success "CDP is running"
    Write-Info "Browser: $($cdpVersion.Browser)"
    Write-Info "Protocol: $($cdpVersion.'Protocol-Version')"
    $testResults.Passed++
} catch {
    Write-Fail "CDP is NOT running on port 9222"
    Write-Host ""
    Write-Host "  Please launch Chrome with CDP:" -ForegroundColor Yellow
    Write-Host '  "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\chrome-cdp"' -ForegroundColor White
    Write-Host ""
    $testResults.Failed++
    
    if (-not $SkipChromeCheck) {
        Write-Host "Exiting... (use -SkipChromeCheck to continue anyway)" -ForegroundColor Red
        exit 1
    }
}

# ============================================
# TEST 2: Check Backend Server
# ============================================
Write-Step "TEST 2: Checking if backend server is running..."

try {
    $health = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 5
    Write-Success "Backend is running"
    Write-Info "Status: $($health.status)"
    Write-Info "Timestamp: $($health.timestamp)"
    $testResults.Passed++
} catch {
    Write-Fail "Backend is NOT running"
    Write-Host ""
    Write-Host "  Please start the backend:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host ""
    $testResults.Failed++
    Write-Host "Exiting..." -ForegroundColor Red
    exit 1
}

# ============================================
# TEST 3: CDP Status API (Before Connect)
# ============================================
Write-Step "TEST 3: Testing CDP Status API..."

try {
    $statusBefore = Invoke-RestMethod -Uri "http://localhost:3000/api/automation/cdp/status"
    Write-Success "Status API responded"
    Write-Info "Connected: $($statusBefore.data.connected)"
    Write-Info "Endpoint: $($statusBefore.data.endpoint)"
    
    if ($Verbose) {
        Write-Host "  Response: $($statusBefore | ConvertTo-Json -Compress)" -ForegroundColor Gray
    }
    $testResults.Passed++
} catch {
    Write-Fail "Status API failed: $_"
    $testResults.Failed++
}

# ============================================
# TEST 4: CDP Connect API
# ============================================
Write-Step "TEST 4: Testing CDP Connect API..."

try {
    $connectResult = Invoke-RestMethod -Uri "http://localhost:3000/api/automation/cdp/connect" -Method POST
    Write-Success "Connected to Chrome via CDP"
    Write-Info "Message: $($connectResult.message)"
    $testResults.Passed++
} catch {
    $errorBody = $_.ErrorDetails.Message
    if ($errorBody) {
        $errorResponse = $errorBody | ConvertFrom-Json
        Write-Fail "Connection failed"
        Write-Info "Error: $($errorResponse.error.message)"
        Write-Info "Hint: $($errorResponse.error.hint)"
    } else {
        Write-Fail "Connection failed: $_"
    }
    $testResults.Failed++
}

# ============================================
# TEST 5: CDP Status API (After Connect)
# ============================================
Write-Step "TEST 5: Verifying CDP connection status..."

try {
    $statusAfter = Invoke-RestMethod -Uri "http://localhost:3000/api/automation/cdp/status"
    
    if ($statusAfter.data.connected -eq $true) {
        Write-Success "CDP is now connected"
        $testResults.Passed++
    } else {
        Write-Fail "CDP still shows disconnected"
        $testResults.Failed++
    }
} catch {
    Write-Fail "Status check failed: $_"
    $testResults.Failed++
}

# ============================================
# TEST 6: Get Accounts
# ============================================
Write-Step "TEST 6: Getting accounts list..."

try {
    $accounts = Invoke-RestMethod -Uri "http://localhost:3000/api/accounts"
    $loggedInAccounts = $accounts.data | Where-Object { $_.status -eq "LOGGED_IN" }
    
    Write-Success "Accounts retrieved"
    Write-Info "Total accounts: $($accounts.data.Count)"
    Write-Info "Logged in: $($loggedInAccounts.Count)"
    
    foreach ($acc in $accounts.data) {
        $statusIcon = if ($acc.status -eq "LOGGED_IN") { "✓" } else { "○" }
        Write-Host "    $statusIcon $($acc.email) [$($acc.status)]" -ForegroundColor $(if ($acc.status -eq "LOGGED_IN") { "Green" } else { "Gray" })
    }
    $testResults.Passed++
} catch {
    Write-Fail "Failed to get accounts: $_"
    $testResults.Failed++
}

# ============================================
# TEST 7: Download CSV (Optional)
# ============================================
Write-Step "TEST 7: Testing CSV Download via CDP..."

if ($loggedInAccounts -and $loggedInAccounts.Count -gt 0) {
    $testAccount = $loggedInAccounts[0]
    Write-Info "Testing with: $($testAccount.email)"
    Write-Host "  This may take 30-60 seconds..." -ForegroundColor Gray
    
    try {
        $downloadResult = Invoke-RestMethod -Uri "http://localhost:3000/api/accounts/$($testAccount.id)/download" -Method POST -TimeoutSec 120
        Write-Success "Download successful!"
        Write-Info "File: $($downloadResult.data.fileName)"
        Write-Info "Path: $($downloadResult.data.filePath)"
        $testResults.Passed++
    } catch {
        $errorBody = $_.ErrorDetails.Message
        if ($errorBody) {
            $errorResponse = $errorBody | ConvertFrom-Json
            Write-Fail "Download failed: $($errorResponse.error.message)"
        } else {
            Write-Fail "Download failed: $_"
        }
        $testResults.Failed++
    }
} else {
    Write-Host "  ○ Skipped - No logged-in accounts" -ForegroundColor Gray
    $testResults.Skipped++
}

# ============================================
# SUMMARY
# ============================================
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    TEST SUMMARY                            ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:  $($testResults.Passed)" -ForegroundColor Green
Write-Host "  Failed:  $($testResults.Failed)" -ForegroundColor $(if ($testResults.Failed -gt 0) { "Red" } else { "Green" })
Write-Host "  Skipped: $($testResults.Skipped)" -ForegroundColor Yellow
Write-Host ""

if ($testResults.Failed -eq 0) {
    Write-Host "  ✓ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "  ✗ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}
