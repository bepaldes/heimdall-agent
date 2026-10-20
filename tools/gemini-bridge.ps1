<#
.SYNOPSIS
    Bridge helper to invoke Antigravity / Gemini CLI from Claude Code, Codex, or scripts.
.DESCRIPTION
    Invokes Antigravity (agy.exe) by splitting the current Herdr screen to the right, streaming live output,
    and automatically closing the pane when done. Supports Herdr tabs, visible windows, or headless mode.
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet("review", "ask", "validate", "exec", "scan", "interactive")]
    [string]$Action = "review",

    [Parameter()]
    [string]$Model = "",

    [Parameter()]
    [ValidateSet("low", "medium", "high", "xhigh", "max")]
    [string]$Effort = "",

    [Parameter()]
    [string[]]$Path = @(),

    [Parameter()]
    [string]$Prompt = "",

    [Parameter()]
    [switch]$Split,

    [Parameter()]
    [switch]$Tab,

    [Parameter()]
    [switch]$Window,

    [Parameter()]
    [switch]$Headless,

    [Parameter()]
    [switch]$Interactive,

    [Parameter()]
    [switch]$KeepOpen,

    [Parameter()]
    [switch]$NoFocus,

    [Parameter()]
    [int]$Timeout = 300,

    [Parameter(Position = 1, ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$ErrorActionPreference = "Stop"
try {
    [Console]::InputEncoding = [System.Text.Encoding]::UTF8
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
    $OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}

function Check-Agy {
    $agyCmd = Get-Command "agy" -ErrorAction SilentlyContinue
    if (-not $agyCmd) {
        Write-Error "Antigravity CLI ('agy') is not found in PATH."
    }
}

function Test-HerdrActive {
    # Only consider Herdr active for automatic screen split if the current process is running inside an active Herdr pane
    if ($env:HERDR_ENV -eq "1" -and $env:HERDR_PANE_ID) { return $true }
    return $false
}

Check-Agy

$canonicalModel = $null
if ($Model) {
    switch -Regex ($Model.ToLower().Trim()) {
        "^(gemini[- ])?4([- ]?argon)?$" { $canonicalModel = "gemini-4" }
        "^(gemini[- ])?flash([- ]?3(\.8)?)?$" { $canonicalModel = "gemini-3.8-flash" }
        "^(gemini[- ])?pro([- ]?3(\.1)?)?$" { $canonicalModel = "gemini-3.1-pro" }
        "argon" { $canonicalModel = "gemini-4" }
        "flash" { $canonicalModel = "gemini-3.8-flash" }
        "pro" { $canonicalModel = "gemini-3.1-pro" }
        default { $canonicalModel = $Model }
    }
}

if ($Effort -and $canonicalModel) {
    switch ($canonicalModel) {
        "gemini-4" {
            if ($Effort -notin @("low", "medium", "high", "xhigh", "max")) {
                Write-Warning "[Model Registry] Gemini 4 (Argon) allowed effort is low, medium, high, or xhigh (requested: $Effort)."
            }
        }
        "gemini-3.8-flash" {
            if ($Effort -notin @("low", "medium", "high")) {
                Write-Warning "[Model Registry] Gemini 3.8 Flash allowed effort is low, medium, or high (requested: $Effort)."
            }
        }
        "gemini-3.1-pro" {
            if ($Effort -notin @("medium", "high", "xhigh")) {
                Write-Warning "[Model Registry] Gemini 3.1 Pro allowed effort is medium, high, or xhigh (requested: $Effort)."
            }
        }
    }
}

$agyModelFlags = @()
if ($canonicalModel) {
    $agyModelFlags += @("--model", $canonicalModel)
}
if ($Effort) {
    $cliEffort = if ($Effort -eq "xhigh") { "max" } else { $Effort }
    $agyModelFlags += @("--effort", $cliEffort)
}
$agyFlagsStr = if ($agyModelFlags.Count -gt 0) { $agyModelFlags -join " " } else { "" }

# Determine display mode:
# 1. Headless (if -Headless, CI, or env override)
# 2. Standalone OS Window (if -Window)
# 3. Herdr Tab (if -Tab)
# 4. Herdr Split (if -Split or running inside active Herdr pane)
# 5. Default outside Herdr: Headless
$targetMode = "headless"
if ($Headless -or ($env:CI -eq "true") -or ($env:PODIUM_BRIDGE_HEADLESS -eq "1")) {
    $targetMode = "headless"
} elseif ($Window) {
    $targetMode = "window"
} elseif ($Tab) {
    $targetMode = "herdr-tab"
} elseif ($Split -or (Test-HerdrActive)) {
    $targetMode = "herdr-split"
} else {
    $targetMode = "headless"
}

# Resolve action, prompt, and display information
$prompt = ""
$displaySummary = ""
$diffSummary = ""
$sessionLabel = "Gemini: $($Action.ToUpper())"

switch ($Action) {
    "review" {
        $promptInput = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }

        # Check if promptInput or Path points to an existing file (e.g. reviewing a plan file)
        $fileToReview = $null
        if ($promptInput -and (Test-Path $promptInput -PathType Leaf -ErrorAction SilentlyContinue)) {
            $fileToReview = $promptInput
        } elseif ($Path -and $Path.Length -eq 1 -and (Test-Path $Path[0] -PathType Leaf -ErrorAction SilentlyContinue)) {
            $fileToReview = $Path[0]
        }

        if ($fileToReview) {
            $fileContent = Get-Content -Raw $fileToReview
            $displaySummary = "Review file: $fileToReview"
            $prompt = @"
Review this document/file against Podium platform doctrine, requirements, and best practices. Be concise and actionable.
File: $fileToReview

=== CONTENT ===
$fileContent
"@
            $sessionLabel = "Gemini: Review File"
        } else {
            $diff = if ($Path -and $Path.Length -gt 0) { git diff -- $Path } else { git diff -- ":!*dist/*" ":!*pnpm-lock.yaml" }
            $diffStat = if ($Path -and $Path.Length -gt 0) { git diff --stat -- $Path } else { git diff --stat -- ":!*dist/*" ":!*pnpm-lock.yaml" }
            if (-not $diff) {
                $diff = if ($Path -and $Path.Length -gt 0) { git diff --staged -- $Path } else { git diff --staged -- ":!*dist/*" ":!*pnpm-lock.yaml" }
                $diffStat = if ($Path -and $Path.Length -gt 0) { git diff --staged --stat -- $Path } else { git diff --staged --stat -- ":!*dist/*" ":!*pnpm-lock.yaml" }
            }
            if (-not $diff) {
                $diff = if ($Path -and $Path.Length -gt 0) { git diff HEAD -- $Path } else { git diff HEAD -- ":!*dist/*" ":!*pnpm-lock.yaml" }
                $diffStat = if ($Path -and $Path.Length -gt 0) { git diff HEAD --stat -- $Path } else { git diff HEAD --stat -- ":!*dist/*" ":!*pnpm-lock.yaml" }
            }
            if (-not $diff) {
                if ($promptInput) {
                    $displaySummary = $promptInput
                    $prompt = $promptInput
                    $sessionLabel = "Gemini: Review"
                } else {
                    Write-Output "No uncommitted git changes found to review."
                    return
                }
            } else {
                $instructions = if ($promptInput) { $promptInput } else { "Review this git diff against Podium platform rules, monorepo boundaries, and security controls. Be concise and actionable." }
                $displaySummary = $instructions
                $diffSummary = ($diffStat | Out-String).Trim()
                $prompt = @"
$instructions

=== GIT DIFF ===
$diff
"@
                $sessionLabel = "Gemini: Review Diff"
            }
        }
    }

    "ask" {
        $rawQuery = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawQuery) {
            Write-Error "Please provide a question or topic to ask Gemini."
        }
        $query = if ($rawQuery.Length -lt 300 -and (Test-Path $rawQuery -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawQuery
        } else {
            $rawQuery
        }
        $displaySummary = if ($query.Length -gt 200) { $query.Substring(0, 200) + "..." } else { $query }
        $prompt = $query
        $sessionLabel = "Gemini: Ask"
    }

    "validate" {
        $cmd = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $cmd) {
            Write-Error "Please specify the test or build command to validate (e.g. pnpm test)."
        }
        Write-Host "Running command: $cmd..."
        $output = Invoke-Expression $cmd 2>&1 | Out-String
        $exitCode = $LASTEXITCODE

        $displaySummary = "Validate Command: $cmd (Exit code: $exitCode)"
        $prompt = @"
Analyze this test/build command run.
Command: $cmd
Exit Code: $exitCode

=== OUTPUT ===
$output

If there are failures or errors, explain the root cause and propose the exact fix. If it passed, confirm verification.
"@
        $sessionLabel = "Gemini: Validate"
    }

    "exec" {
        $rawTask = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawTask) {
            Write-Error "Please provide a task or instruction for Gemini to execute."
        }
        $task = if ($rawTask.Length -lt 300 -and (Test-Path $rawTask -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawTask
        } else {
            $rawTask
        }
        $displaySummary = if ($task.Length -gt 200) { $task.Substring(0, 200) + "..." } else { $task }
        $prompt = $task
        $sessionLabel = "Gemini: Exec"
    }

    "scan" {
        $topic = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $topic) {
            Write-Error "Please provide what to scan for."
        }
        $displaySummary = "Scan monorepo for: $topic"
        $prompt = "Scan the entire repository for references to '$topic', analyze their consistency with project doctrine, and summarize findings."
        $sessionLabel = "Gemini: Scan"
    }

    "interactive" {
        $task = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        $displaySummary = if ($task) { $task } else { "(Interactive Session)" }
        $prompt = $task
        $Interactive = $true
        $sessionLabel = "Gemini: Interactive"
    }
}

# --- Execution based on Target Mode ---

if ($targetMode -eq "headless") {
    $flags = @("--dangerously-skip-permissions")
    if ($agyModelFlags.Count -gt 0) {
        $flags += $agyModelFlags
    }
    $prompt | & agy @flags
    $ec = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } else { 0 }
    exit $ec
}

# Setup temporary coordination files for visible Herdr split pane / tab / OS window
$guid = [guid]::NewGuid().ToString("N")
$tempBase = Join-Path $env:TEMP "podium-gemini-$guid"
$promptFile = "$tempBase.prompt.txt"
$scriptFile = "$tempBase.ps1"
$outputFile = "$tempBase.out"
$summaryFile = "$tempBase.summary.txt"
$diffSummaryFile = "$tempBase.diffstat.txt"
$doneFile = "$tempBase.done"
$projectRoot = (Get-Location).Path

Set-Content -Path $promptFile -Value $prompt -Encoding utf8

$displayBannerText = if ($displaySummary.Length -gt 500) { $displaySummary.Substring(0, 500) + "... [truncated in banner; full content sent to Gemini]" } else { $displaySummary }
Set-Content -Path $summaryFile -Value $displayBannerText -Encoding utf8

if ($diffSummary) {
    Set-Content -Path $diffSummaryFile -Value $diffSummary -Encoding utf8
}

# Build inner runner script
if ($Interactive) {
    $innerScript = @"
Set-Location '$projectRoot'
Clear-Host
`$host.UI.RawUI.WindowTitle = '$sessionLabel'
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " [Podium Multi-Model Bridge] Interactive Antigravity (Gemini) Session" -ForegroundColor Yellow
Write-Host (" Target Model: {0}" -f $(if ('$canonicalModel') { '$canonicalModel' } else { "Default" })) -ForegroundColor Green
Write-Host (" Effort Level: {0}" -f $(if ('$Effort') { '$Effort' } else { "Default" })) -ForegroundColor Green
Write-Host (" Working Dir:  {0}" -f `$pwd.Path) -ForegroundColor DarkGray
Write-Host (" Timestamp:    {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n>> TASK / PROMPT:" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkMagenta
Get-Content '$summaryFile' | Write-Host -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkMagenta
Write-Host ">>> Starting interactive Antigravity CLI session below...`n" -ForegroundColor DarkCyan

`$initPrompt = Get-Content -Raw '$summaryFile'
if (`$initPrompt -and `$initPrompt.Trim() -and (`$initPrompt.Trim() -ne "(Interactive Session)")) {
    agy $agyFlagsStr -i `$initPrompt --dangerously-skip-permissions
} else {
    agy $agyFlagsStr --dangerously-skip-permissions
}
Set-Content -Path '$doneFile' -Value "0"
"@
} else {
    $innerScript = @"
Set-Location '$projectRoot'
Clear-Host
`$host.UI.RawUI.WindowTitle = '$sessionLabel'
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " [Podium Multi-Model Bridge] External Caller -> Antigravity (Gemini)" -ForegroundColor Yellow
Write-Host (" Action:       {0}" -f "$($Action.ToUpper())") -ForegroundColor Green
Write-Host (" Target Model: {0}" -f $(if ('$canonicalModel') { '$canonicalModel' } else { "Default" })) -ForegroundColor Green
Write-Host (" Effort Level: {0}" -f $(if ('$Effort') { '$Effort' } else { "Default" })) -ForegroundColor Green
Write-Host (" Working Dir:  {0}" -f `$pwd.Path) -ForegroundColor DarkGray
Write-Host (" Timestamp:    {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n>> WHAT IS BEING REQUESTED:" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkMagenta
Get-Content '$summaryFile' | Write-Host -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkMagenta
"@
    if ($diffSummary) {
        $innerScript += "`nWrite-Host `"MODIFIED FILES UNDER REVIEW:`" -ForegroundColor Yellow`n"
        $innerScript += "Get-Content '$diffSummaryFile' | Write-Host -ForegroundColor DarkYellow`n"
        $innerScript += "Write-Host `"--------------------------------------------------------------------------------`n`" -ForegroundColor DarkMagenta`n"
    }
    $innerScript += "`nWrite-Host `"Running Antigravity (agy) CLI (streaming live output)...`n`" -ForegroundColor DarkCyan`n"
    $innerScript += @"
`$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Get-Content -Raw '$promptFile' | agy $agyFlagsStr --dangerously-skip-permissions | Tee-Object -FilePath '$outputFile'
    `$ec = if (`$LASTEXITCODE -ne `$null) { `$LASTEXITCODE } else { 0 }
} catch {
    `$ec = 1
    Write-Error `$_
}
`$sw.Stop()
Set-Content -Path '$doneFile' -Value `$ec

Write-Host "`n================================================================================" -ForegroundColor Cyan
if (`$ec -eq 0) {
    Write-Host (" [Podium Bridge] Completed successfully in {0:N1}s (Exit code: 0)" -f `$sw.Elapsed.TotalSeconds) -ForegroundColor Green
} else {
    Write-Host (" [Podium Bridge] Exited with code {0} in {1:N1}s" -f `$ec, `$sw.Elapsed.TotalSeconds) -ForegroundColor Red
}
"@
    if ($targetMode -eq "herdr-split" -and -not $KeepOpen) {
        $innerScript += @"
Write-Host " Closing split pane in 2 seconds..." -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Start-Sleep -Seconds 2
"@
    } else {
        $innerScript += @"
Write-Host " Caller agent has received the output and resumed." -ForegroundColor DarkGray
Write-Host " This pane/window remains open for your inspection." -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
"@
    }
}

Set-Content -Path $scriptFile -Value $innerScript -Encoding utf8

$createdPaneId = $null

try {
    if ($targetMode -eq "herdr-split") {
        # Split current caller pane to the right
        $callerPane = if ($env:HERDR_PANE_ID) { $env:HERDR_PANE_ID } else { "--current" }
        $splitArgs = @("pane", "split", "--direction", "right", "--cwd", $projectRoot)
        if ($callerPane -eq "--current") {
            $splitArgs += "--current"
        } else {
            $splitArgs += @("--pane", $callerPane)
        }
        if ($NoFocus) {
            $splitArgs += "--no-focus"
        }
        $splitJson = & herdr @splitArgs | Out-String
        $splitObj = $splitJson | ConvertFrom-Json
        $createdPaneId = $splitObj.result.pane.pane_id

        Start-Sleep -Milliseconds 400
        & herdr pane run $createdPaneId "powershell -ExecutionPolicy Bypass -File `"$scriptFile`""

        if ($Interactive) {
            Write-Host "Launched interactive Antigravity session in right split pane ($createdPaneId)."
            return
        }
    } elseif ($targetMode -eq "herdr-tab") {
        $tabArgs = @("tab", "create", "--label", $sessionLabel, "--cwd", $projectRoot)
        if (-not $NoFocus) {
            $tabArgs += "--focus"
        } else {
            $tabArgs += "--no-focus"
        }
        $tabJson = & herdr @tabArgs | Out-String
        $tabObj = $tabJson | ConvertFrom-Json
        $createdPaneId = $tabObj.result.root_pane.pane_id
        $tabId = $tabObj.result.tab.tab_id

        Start-Sleep -Milliseconds 400
        & herdr pane run $createdPaneId "powershell -ExecutionPolicy Bypass -File `"$scriptFile`""

        if ($Interactive) {
            Write-Host "Launched interactive Antigravity session in Herdr tab '$sessionLabel' (Tab ID: $tabId, Pane ID: $createdPaneId)."
            return
        }
    } else {
        # Standalone OS window fallback
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "`"$scriptFile`""
        if ($Interactive) {
            Write-Host "Launched interactive Antigravity session in a new window."
            return
        }
    }

    # Wait for completion and capture output back to caller
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while (-not (Test-Path $doneFile) -and $sw.Elapsed.TotalSeconds -lt $Timeout) {
        Start-Sleep -Milliseconds 300
    }

    if (Test-Path $doneFile) {
        $exitCode = [int](Get-Content -Raw $doneFile)
        if (Test-Path $outputFile) {
            $captured = Get-Content -Raw $outputFile
            Write-Output $captured
        }
        exit $exitCode
    } else {
        Write-Error "[Podium Bridge] Timed out waiting for Gemini response after $Timeout seconds."
        exit 1
    }
} finally {
    # Auto-close the split pane in Herdr unless KeepOpen is requested
    if ($createdPaneId -and $targetMode -eq "herdr-split" -and -not $KeepOpen) {
        Start-Sleep -Milliseconds 500
        & herdr pane close $createdPaneId 2>$null | Out-Null
    }
    Remove-Item $promptFile, $scriptFile, $outputFile, $summaryFile, $diffSummaryFile, $doneFile -Force -ErrorAction SilentlyContinue
}
