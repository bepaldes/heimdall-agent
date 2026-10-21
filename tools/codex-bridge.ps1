<#
.SYNOPSIS
    Bridge helper for bidirectional coordination between Antigravity, Claude Code, and OpenAI Codex CLI (Astra).
.DESCRIPTION
    Invokes Codex CLI (defaulting to the Astra model via GhostCLI) by splitting the current Herdr screen to the right,
    streaming live output, and automatically closing the pane when done. Supports Herdr tabs, visible windows, or headless mode.
#>
param(
    [Parameter(Position = 0)]
    [ValidateSet("review", "ask", "validate", "exec", "interactive")]
    [string]$Action = "review",

    [Parameter()]
    [string]$Model = "gpt-6-astra",

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

function Ensure-CodexEnv {
    $codexDirs = @(
        (Join-Path $env:LOCALAPPDATA "Programs\OpenAI\Codex\bin"),
        (Join-Path $env:USERPROFILE ".codex\packages\standalone\current\bin"),
        (Join-Path $env:USERPROFILE ".local\bin")
    )
    foreach ($d in $codexDirs) {
        if ((Test-Path $d) -and (($env:PATH -split ';') -notcontains $d)) {
            $env:PATH = "$d;$env:PATH"
        }
    }

    $keys = @("GHOSTCLI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "CODEX_HOME")
    foreach ($k in $keys) {
        $userVal = [System.Environment]::GetEnvironmentVariable($k, "User")
        if (-not $userVal) {
            $userVal = [System.Environment]::GetEnvironmentVariable($k, "Machine")
        }
        if ($userVal) {
            Set-Item -Path "env:$k" -Value $userVal
        }
    }

    # If GHOSTCLI_API_KEY is not set, fallback to ANTHROPIC_API_KEY (GhostCLI token)
    if (-not $env:GHOSTCLI_API_KEY -and $env:ANTHROPIC_API_KEY) {
        $env:GHOSTCLI_API_KEY = $env:ANTHROPIC_API_KEY
    }
}

function Check-Codex {
    $codexCmd = Get-Command "codex" -ErrorAction SilentlyContinue
    if (-not $codexCmd) {
        Write-Error "Codex CLI ('codex') is not found in PATH or standard installation locations."
    }
}

function Test-HerdrActive {
    # Only consider Herdr active for automatic screen split if the current process is running inside an active Herdr pane
    if ($env:HERDR_ENV -eq "1" -and $env:HERDR_PANE_ID) { return $true }
    return $false
}

Ensure-CodexEnv
Check-Codex

# Resolve canonical model flag
$canonicalModel = "gpt-6-astra"
if ($Model) {
    switch -Regex ($Model.ToLower().Trim()) {
        "^(gpt[- ]?6[- ]?)?astra$" { $canonicalModel = "gpt-6-astra" }
        "astra" { $canonicalModel = "gpt-6-astra" }
        "^(claude[- ])?opus([- ]?5(\.5)?)?$" { $canonicalModel = "claude-opus-5-5" }
        "^(claude[- ])?sonnet([- ]?5)?$" { $canonicalModel = "claude-sonnet-5" }
        "^(claude[- ])?fable([- ]?5(\.1)?)?$" { $canonicalModel = "claude-fable-5.1" }
        "^(z[- ]?ai\/)?glm([- ]?5(\.3)?)?$" { $canonicalModel = "z-ai/glm-5.3" }
        "opus" { $canonicalModel = "claude-opus-5-5" }
        "sonnet" { $canonicalModel = "claude-sonnet-5" }
        "fable" { $canonicalModel = "claude-fable-5.1" }
        "glm" { $canonicalModel = "z-ai/glm-5.3" }
        default { $canonicalModel = $Model }
    }
}

# Resolve effort
$codexEffort = $Effort
if ($Effort -eq "max") { $codexEffort = "xhigh" }
if ($codexEffort -and ($canonicalModel -eq "gpt-6-astra")) {
    if ($codexEffort -notin @("low", "medium", "high", "xhigh")) {
        Write-Warning "[Model Registry] GPT-6 Astra allowed effort is low, medium, high, or xhigh (requested: $Effort)."
    }
}

# Construct flags for codex exec
$codexExecFlags = @("--ephemeral", "--dangerously-bypass-approvals-and-sandbox", "-m", $canonicalModel)
if ($codexEffort) {
    $codexExecFlags += @("-c", "model_reasoning_effort=$codexEffort")
}
$codexExecFlagsStr = $codexExecFlags -join " "

# Construct flags for codex interactive
$codexInteractiveFlags = @("--dangerously-bypass-approvals-and-sandbox", "-m", $canonicalModel)
if ($codexEffort) {
    $codexInteractiveFlags += @("-c", "model_reasoning_effort=$codexEffort")
}
$codexInteractiveFlagsStr = $codexInteractiveFlags -join " "

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
$resolvedPrompt = ""
$displaySummary = ""
$diffSummary = ""
$sessionLabel = "Codex: $($Action.ToUpper())"

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
            $resolvedPrompt = @"
Review this document/file for logic bugs, security risks, type errors, architectural regressions, or plan gaps. Be concise and actionable.
File: $fileToReview

=== CONTENT ===
$fileContent
"@
            $sessionLabel = "Codex: Review File"
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
                    $resolvedPrompt = $promptInput
                    $sessionLabel = "Codex: Review"
                } else {
                    Write-Output "No uncommitted git changes found to review."
                    return
                }
            } else {
                $instructions = if ($promptInput) { $promptInput } else { "Review this git diff for logic bugs, security risks, type errors, or architectural regressions. Be concise and actionable." }
                $displaySummary = $instructions
                $diffSummary = ($diffStat | Out-String).Trim()
                $resolvedPrompt = @"
$instructions

=== GIT DIFF ===
$diff
"@
                $sessionLabel = "Codex: Review"
            }
        }
    }

    "ask" {
        $rawQuery = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawQuery) {
            Write-Error "Please provide a question or topic to ask Codex."
        }
        $query = if ($rawQuery.Length -lt 300 -and (Test-Path $rawQuery -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawQuery
        } else {
            $rawQuery
        }
        $displaySummary = $query
        $resolvedPrompt = $query
        $sessionLabel = "Codex: Ask"
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
        $resolvedPrompt = @"
Analyze this test/build command run.
Command: $cmd
Exit Code: $exitCode

=== OUTPUT ===
$output

If there are failures or errors, explain the root cause and propose the exact fix. If it passed, confirm verification.
"@
        $sessionLabel = "Codex: Validate"
    }

    "exec" {
        $rawTask = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        if (-not $rawTask) {
            Write-Error "Please provide a task or instruction for Codex to execute."
        }
        $task = if ($rawTask.Length -lt 300 -and (Test-Path $rawTask -PathType Leaf -ErrorAction SilentlyContinue)) {
            Get-Content -Raw $rawTask
        } else {
            $rawTask
        }
        $displaySummary = $task
        $resolvedPrompt = $task
        $sessionLabel = "Codex: Exec"
    }

    "interactive" {
        $task = if ($Prompt) { $Prompt } elseif ($Arguments) { $Arguments -join " " } else { "" }
        $displaySummary = if ($task) { $task } else { "(Interactive Session)" }
        $resolvedPrompt = $task
        $Interactive = $true
        $sessionLabel = "Codex: Interactive"
    }
}

# --- Execution based on Target Mode ---

if ($targetMode -eq "headless") {
    $tmp = Join-Path $env:TEMP "codex-request-$([guid]::NewGuid().ToString('N')).txt"
    Set-Content -Path $tmp -Value $resolvedPrompt -Encoding utf8
    try {
        Get-Content -Raw $tmp | codex exec $codexExecFlags
        $ec = if ($LASTEXITCODE -ne $null) { $LASTEXITCODE } else { 0 }
        exit $ec
    } finally {
        Remove-Item -Path $tmp -Force -ErrorAction SilentlyContinue
    }
}

# Setup temporary coordination files for visible Herdr split pane / tab / OS window
$guid = [guid]::NewGuid().ToString("N")
$tempBase = Join-Path $env:TEMP "podium-codex-$guid"
$promptFile = "$tempBase.prompt.txt"
$scriptFile = "$tempBase.ps1"
$outputFile = "$tempBase.out"
$lastMsgFile = "$tempBase.lastmsg.txt"
$summaryFile = "$tempBase.summary.txt"
$diffSummaryFile = "$tempBase.diffstat.txt"
$doneFile = "$tempBase.done"
$projectRoot = (Get-Location).Path

Set-Content -Path $promptFile -Value $resolvedPrompt -Encoding utf8

# Prepare environment export block for child shell
$envKeys = @("GHOSTCLI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "CODEX_HOME")
$envBlock = ""
foreach ($k in $envKeys) {
    $v = (Get-Item -Path "env:$k" -ErrorAction SilentlyContinue).Value
    if (-not $v) { $v = [System.Environment]::GetEnvironmentVariable($k, "User") }
    if (-not $v) { $v = [System.Environment]::GetEnvironmentVariable($k, "Machine") }
    if ($v) {
        $envBlock += "`$env:$k = '$v'`n"
    }
}
$codexDirs = @(
    (Join-Path $env:LOCALAPPDATA "Programs\OpenAI\Codex\bin"),
    (Join-Path $env:USERPROFILE ".codex\packages\standalone\current\bin"),
    (Join-Path $env:USERPROFILE ".local\bin")
)
foreach ($d in $codexDirs) {
    if (Test-Path $d) {
        $envBlock += "if ((`$env:PATH -split ';') -notcontains '$d') { `$env:PATH = '$d;' + `$env:PATH }`n"
    }
}

$displayBannerText = if ($displaySummary.Length -gt 500) { $displaySummary.Substring(0, 500) + "... [truncated in banner; full content sent to Codex]" } else { $displaySummary }
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
Write-Host " [Podium Multi-Model Bridge] Interactive OpenAI Codex Session" -ForegroundColor Yellow
Write-Host (" Target Model: {0}" -f $(if ('$canonicalModel') { '$canonicalModel' } else { "gpt-6-astra" })) -ForegroundColor Green
Write-Host (" Working Dir:  {0}" -f `$pwd.Path) -ForegroundColor DarkGray
Write-Host (" Timestamp:    {0}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -ForegroundColor DarkGray
Write-Host "================================================================================" -ForegroundColor Cyan
Write-Host "`n>> TASK / PROMPT:" -ForegroundColor Magenta
Write-Host "--------------------------------------------------------------------------------" -ForegroundColor DarkMagenta
Get-Content '$summaryFile' | Write-Host -ForegroundColor White
Write-Host "--------------------------------------------------------------------------------`n" -ForegroundColor DarkMagenta
Write-Host ">>> Starting interactive Codex session below...`n" -ForegroundColor DarkCyan

`$initPrompt = Get-Content -Raw '$summaryFile'
if (`$initPrompt -and `$initPrompt.Trim() -and (`$initPrompt.Trim() -ne "(Interactive Session)")) {
    codex $codexInteractiveFlagsStr `$initPrompt
} else {
    codex $codexInteractiveFlagsStr
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
Write-Host " [Podium Multi-Model Bridge] External Caller -> OpenAI Codex (Astra)" -ForegroundColor Yellow
Write-Host (" Action:       {0}" -f "$($Action.ToUpper())") -ForegroundColor Green
Write-Host (" Target Model: {0}" -f $(if ('$canonicalModel') { '$canonicalModel' } else { "gpt-6-astra" })) -ForegroundColor Green
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
    $innerScript += "`nWrite-Host `"Running Codex CLI (streaming live output)...`n`" -ForegroundColor DarkCyan`n"
    $innerScript += @"
`$sw = [System.Diagnostics.Stopwatch]::StartNew()
try {
    Get-Content -Raw '$promptFile' | codex exec $codexExecFlagsStr -o '$lastMsgFile' | Tee-Object -FilePath '$outputFile'
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
            Write-Host "Launched interactive Codex session in right split pane ($createdPaneId)."
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
            Write-Host "Launched interactive Codex session in Herdr tab '$sessionLabel' (Tab ID: $tabId, Pane ID: $createdPaneId)."
            return
        }
    } else {
        # Standalone OS window fallback
        Start-Process powershell.exe -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "`"$scriptFile`""
        if ($Interactive) {
            Write-Host "Launched interactive Codex session in a new window."
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
        if ((Test-Path $lastMsgFile) -and (Get-Item $lastMsgFile).Length -gt 0) {
            $captured = Get-Content -Raw $lastMsgFile
            Write-Output $captured
        } elseif (Test-Path $outputFile) {
            $captured = Get-Content -Raw $outputFile
            Write-Output $captured
        }
        exit $exitCode
    } else {
        Write-Error "[Podium Bridge] Timed out waiting for Codex response after $Timeout seconds."
        exit 1
    }
} finally {
    # Auto-close the split pane in Herdr unless KeepOpen is requested
    if ($createdPaneId -and $targetMode -eq "herdr-split" -and -not $KeepOpen) {
        Start-Sleep -Milliseconds 500
        & herdr pane close $createdPaneId 2>$null | Out-Null
    }
    Remove-Item $promptFile, $scriptFile, $summaryFile, $diffSummaryFile, $doneFile, $outputFile, $lastMsgFile -Force -ErrorAction SilentlyContinue
}
