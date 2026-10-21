<#
.SYNOPSIS
    Bridge helper for bidirectional coordination between Antigravity (Gemini), Codex, and Claude Code.
.DESCRIPTION
    Invokes Claude Code by splitting the current Herdr screen to the right, streaming live output,
    and automatically closing the pane when done. Supports Herdr tabs, visible windows, or headless mode.
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet("review", "ask", "validate", "exec", "interactive")]
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

function Ensure-ClaudeEnv {
    $localBin = Join-Path $env:USERPROFILE ".local\bin"
    if ((Test-Path $localBin) -and (($env:PATH -split ';') -notcontains $localBin)) {
        $env:PATH = "$localBin;$env:PATH"
    }

    $keys = @("ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_BASE_URL")
    foreach ($k in $keys) {
        $userVal = [System.Environment]::GetEnvironmentVariable($k, "User")
        if (-not $userVal) {
            $userVal = [System.Environment]::GetEnvironmentVariable($k, "Machine")
        }
        if ($userVal) {
            Set-Item -Path "env:$k" -Value $userVal
        }
    }
}

function Check-Claude {
    $claudeCmd = Get-Command "claude" -ErrorAction SilentlyContinue
    if (-not $claudeCmd) {
        Write-Error "Claude CLI ('claude') is not found in PATH."
    }
}

function Test-HerdrActive {
    # Only consider Herdr active for automatic screen split if the current process is running inside an active Herdr pane
    if ($env:HERDR_ENV -eq "1" -and $env:HERDR_PANE_ID) { return $true }
    return $false
}

Ensure-ClaudeEnv

$canonicalModel = $null
if ($Model) {
    switch -Regex ($Model.ToLower().Trim()) {
        "^(claude[- ])?opus([- ]?5(\.5)?)?$" { $canonicalModel = "claude-opus-5-5" }
        "^(claude[- ])?sonnet([- ]?5)?$" { $canonicalModel = "claude-sonnet-5" }
        "^(claude[- ])?fable([- ]?5(\.1)?)?$" { $canonicalModel = "claude-fable-5.1" }
        "^(gpt[- ]?6[- ]?)?astra$" { $canonicalModel = "gpt-6-astra" }
        "^(z[- ]?ai\/)?glm([- ]?5(\.3)?)?$" { $canonicalModel = "z-ai/glm-5.3" }
        "opus" { $canonicalModel = "claude-opus-5-5" }
        "sonnet" { $canonicalModel = "claude-sonnet-5" }
        "fable" { $canonicalModel = "claude-fable-5.1" }
        "astra" { $canonicalModel = "gpt-6-astra" }
        "glm" { $canonicalModel = "z-ai/glm-5.3" }
        default { $canonicalModel = $Model }
    }
    $env:ANTHROPIC_MODEL = $canonicalModel
}

if ($Effort -and $canonicalModel) {
    $customProxyModels = @("claude-opus-5-5", "claude-sonnet-5", "claude-fable-5.1", "gpt-6-astra", "z-ai/glm-5.3")
    if ($customProxyModels -contains $canonicalModel) {
        if ($Effort -notin @("low", "medium", "high", "xhigh")) {
            Write-Warning "[Model Registry] $canonicalModel allowed effort is low, medium, high, or xhigh (requested: $Effort)."
        }
    }
}

$claudeModelFlags = @()
if ($canonicalModel) {
    $claudeModelFlags += @("--model", $canonicalModel)
}
if ($Effort) {
    $claudeModelFlags += @("--effort", $Effort)
}
$claudeFlagsStr = if ($claudeModelFlags.Count -gt 0) { $claudeModelFlags -join " " } else { "" }

Check-Claude

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
$sessionLabel = "Claude: $($Action.ToUpper())"

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
Review this document/file for logic bugs, security risks, type errors, architectural regressions, or plan gaps. Be concise and actionable.
File: $fileToReview

=== CONTENT ===
$fileContent
"@
            $sessionLabel = "Claude: Review File"
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
                    $sessionLabel = "Claude: Review"
                } else {
                    Write-Output "No uncommitted git changes found to review."
                    return
                }
            } else {
                $instructions = if ($promptInput) { $promptInput } else { "Review this git diff for logic bugs, security risks, type errors, or architectural regressions. Be concise and actionable." }
                $displaySummary = $instructions
                $diffSummary = ($diffStat | Out-String).Trim()
                $prompt = @"
$instructions

=== GIT DIFF ===
$diff
"@
                $sessionLabel = "Claude: Review"
            }
        }
    }

    "ask" {
        $rawQuery = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawQuery) {
            Write-Error "Please provide a question or topic to ask Claude."
        }
        $query = if ($rawQuery.Length -lt 300 -and (Test-Path $rawQuery -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawQuery
        } else {
            $rawQuery
        }
        $displaySummary = if ($query.Length -gt 200) { $query.Substring(0, 200) + "..." } else { $query }
        $prompt = $query
        $sessionLabel = "Claude: Ask"
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
        $sessionLabel = "Claude: Validate"
    }

    "exec" {
        $rawTask = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawTask) {
            Write-Error "Please provide a task or instruction for Claude to execute."
        }
        $task = if ($rawTask.Length -lt 300 -and (Test-Path $rawTask -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawTask
        } else {
            $rawTask
        }
        $displaySummary = if ($task.Length -gt 200) { $task.Substring(0, 200) + "..." } else { $task }
        $prompt = $task
        $sessionLabel = "Claude: Exec"
    }

    "interactive" {
        $task = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        $displaySummary = if ($task) { $task } else { "(Interactive Session)" }
        $prompt = $task
        $Interactive = $true
        $sessionLabel = "Claude: Interactive"
    }
}

# --- Execution based on Target Mode ---

if ($targetMode -eq "headless") {
    $tmp = Join-Path $env:TEMP "claude-request-$([guid]::NewGuid().ToString('N')).txt"
    Set-Content -Path $tmp -Value $prompt -Encoding utf8
    try {
        $headlessCmd = if ($claudeFlagsStr) { "claude -p --dangerously-skip-permissions $claudeFlagsStr < `"$tmp`"" } else { "claude -p --dangerously-skip-permissions < `"$tmp`"" }
        cmd.exe /c $headlessCmd
        $ec = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } else { 0 }
        exit $ec
    } finally {
        Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
    }
}

# Setup temporary coordination files for visible Herdr split pane / tab / OS window
$guid = [guid]::NewGuid().ToString("N")
$tempBase = Join-Path $env:TEMP "podium-claude-$guid"
$promptFile = "$tempBase.prompt.txt"
$scriptFile = "$tempBase.ps1"
$outputFile = "$tempBase.out"
$summaryFile = "$tempBase.summary.txt"
$diffSummaryFile = "$tempBase.diffstat.txt"
$doneFile = "$tempBase.done"
$projectRoot = (Get-Location).Path

Set-Content -Path $promptFile -Value $prompt -Encoding utf8

# Prepare environment export block for child shell
$envKeys = @("ANTHROPIC_BASE_URL", "ANTHROPIC_API_KEY", "ANTHROPIC_MODEL", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_BASE_URL")
$envBlock = ""
foreach ($k in $envKeys) {
    $v = [System.Environment]::GetEnvironmentVariable($k, "User")
    if (-not $v) { $v = [System.Environment]::GetEnvironmentVariable($k, "Machine") }
    if (-not $v) { $v = [System.Environment]::GetEnvironmentVariable($k, "Process") }
    if ($v) {
        $envBlock += "`$env:$k = '$v'`n"
    }
}

$displayBannerText = if ($displaySummary.Length -gt 500) { $displaySummary.Substring(0, 500) + "... [truncated in banner; full content sent to Claude]" } else { $displaySummary }
Set-Content -Path $summaryFile -Value $displayBannerText -Encoding utf8

if ($diffSummary) {
    Set-Content -Path $diffSummaryFile -Value $diffSummary -Encoding utf8
}

# Build inner runner script
if ($Interactive) {
    $innerScript = @"
$envBlock
Set-Location '$projectRoot'
Clear-Host
`$host.UI.RawUI.WindowTitle = '$sessionLabel'
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " [Podium Multi-Model Bridge] Interactive Claude Code Session" -ForegroundColor Yellow
Write-Host (" Target Model: {0}" -f `$env:ANTHROPIC_MODEL) -ForegroundColor Green
Write-Host (" Working Dir:  {0}" -f `$pwd.Path) -ForegroundColor DarkGray
Write-Host (" Timestamp:    {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n>> TASK / PROMPT:" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkMagenta
Get-Content '$summaryFile' | Write-Host -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkMagenta
Write-Host ">>> Starting interactive Claude session below...`n" -ForegroundColor DarkCyan

`$initPrompt = Get-Content -Raw '$summaryFile'
if (`$initPrompt -and `$initPrompt.Trim() -and (`$initPrompt.Trim() -ne "(Interactive Session)")) {
    claude $claudeFlagsStr `$initPrompt --dangerously-skip-permissions
} else {
    claude $claudeFlagsStr --dangerously-skip-permissions
}
Set-Content -Path '$doneFile' -Value "0"
"@
} else {
    $innerScript = @"
$envBlock
Set-Location '$projectRoot'
Clear-Host
`$host.UI.RawUI.WindowTitle = '$sessionLabel'
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host " [Podium Multi-Model Bridge] External Caller -> Claude Code" -ForegroundColor Yellow
Write-Host (" Action:       {0}" -f "$($Action.ToUpper())") -ForegroundColor Green
Write-Host (" Target Model: {0}" -f $(if ('$canonicalModel') { '$canonicalModel' } elseif (`$env:ANTHROPIC_MODEL) { `$env:ANTHROPIC_MODEL } else { "Default" })) -ForegroundColor Green
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
    $innerScript += "`nWrite-Host `"Running Claude Code CLI (streaming live output)...`n`" -ForegroundColor DarkCyan`n"
    $innerScript += @"
`$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Get-Content -Raw '$promptFile' | claude -p --dangerously-skip-permissions $claudeFlagsStr | Tee-Object -FilePath '$outputFile'
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
            Write-Host "Launched interactive Claude session in right split pane ($createdPaneId)."
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
            Write-Host "Launched interactive Claude session in Herdr tab '$sessionLabel' (Tab ID: $tabId, Pane ID: $createdPaneId)."
            return
        }
    } else {
        # Standalone OS window fallback
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "`"$scriptFile`""
        if ($Interactive) {
            Write-Host "Launched interactive Claude session in a new window."
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
        Write-Error "[Podium Bridge] Timed out waiting for Claude response after $Timeout seconds."
        exit 1
    }
} finally {
    # Auto-close the split pane in Herdr unless KeepOpen is requested
    if ($createdPaneId -and $targetMode -eq "herdr-split" -and -not $KeepOpen) {
        Start-Sleep -Milliseconds 500
        & herdr pane close $createdPaneId 2>$null | Out-Null
    }
    Remove-Item $promptFile, $scriptFile, $summaryFile, $diffSummaryFile, $doneFile, $outputFile -Force -ErrorAction SilentlyContinue
}
