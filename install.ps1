# Install ultime-skill in Claude Code: registers the marketplace, then installs a bundle or packs.
#
#   .\install.ps1                          # ultime-profile and guardrails: then ask Claude, in each project, to set up its skills
#   .\install.ps1 -NoGuardrails            # without the guardrails hooks (they can be disabled later too)
#   .\install.ps1 -NoPonytail              # without ponytail, installed by default for every project
#   .\install.ps1 ultime-dev security      # chosen bundles or packs, for every project
#   $env:ULTIME_SKILL_SOURCE = "."; .\install.ps1   # from this clone instead of GitHub (per-project setup then needs GitHub)
#   .\install.ps1 -WithTools ultime-all    # also installs the CLIs some skills drive (graphify, rea, asc, gplay)
param(
    [switch]$WithTools,
    [switch]$NoGuardrails,
    [switch]$NoPonytail,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Targets
)
$ErrorActionPreference = "Stop"
# Windows PowerShell 5.1 draws a progress bar per chunk, which makes Invoke-WebRequest many times slower.
$ProgressPreference = "SilentlyContinue"

$Marketplace = "ultime-skill"
$GraphifyVersion = "0.9.90"
$ReaVersion = "6.5.0"
$AscVersion = "5.16.0"
$GplayVersion = "1.0.0"
$ToolsDir = if ($env:ULTIME_SKILL_BIN) { $env:ULTIME_SKILL_BIN } else { Join-Path $env:USERPROFILE ".local\bin" }

# Download a pinned release binary and install it only if its SHA-256 matches the one recorded here.
# A failed download or install warns and returns $false, like install.sh: the other tools still install.
function Install-Binary([string]$Name, [string]$Url, [string]$Sha256) {
    $temp = $null
    try {
        $temp = New-TemporaryFile
        Invoke-WebRequest -Uri $Url -OutFile $temp -UseBasicParsing
        if ((Get-FileHash $temp -Algorithm SHA256).Hash -ne $Sha256.ToUpper()) {
            Write-Warning "Checksum mismatch for ${Name}: not installed."
            return $false
        }
        New-Item -ItemType Directory -Force $ToolsDir | Out-Null
        Move-Item -Force $temp (Join-Path $ToolsDir "$Name.exe")
        Write-Host "Installed $Name in $ToolsDir"
        return $true
    } catch {
        Write-Warning "Download or install of $Name failed: $($_.Exception.Message)"
        return $false
    } finally {
        if ($temp -and (Test-Path $temp)) { Remove-Item -Force $temp -ErrorAction SilentlyContinue }
    }
}

# Comparable form of a marketplace source: GitHub repo or absolute path, lower case, forward slashes.
function ConvertTo-SourceKey([string]$Value) {
    $key = $Value -replace '\\', '/' -replace '^https://github\.com/', '' -replace '\.git$', '' -replace '/$', ''
    return $key.ToLowerInvariant()
}
$Source = if ($env:ULTIME_SKILL_SOURCE) { $env:ULTIME_SKILL_SOURCE } else { "Lucas-lux/ultime-skill" }
if (-not $Targets) { $Targets = @("ultime-profile") }
if (-not $NoGuardrails -and $Targets -notcontains "guardrails") { $Targets += "guardrails" }
if (-not $NoPonytail -and $Targets -notcontains "ponytail") { $Targets += "ponytail" }

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    throw "Claude Code CLI 'claude' not found on PATH."
}

$Requested = if (Test-Path $Source -PathType Container) { (Resolve-Path $Source).Path } else { $Source }
$listing = $null
try { $listing = (claude plugin marketplace list --json 2>$null | Out-String) | ConvertFrom-Json } catch { $listing = $null }
if ($LASTEXITCODE -eq 0 -and $null -ne $listing) {
    $entry = @($listing) | Where-Object { $_.name -eq $Marketplace } | Select-Object -First 1
    $current = if ($entry) { @($entry.repo, $entry.path, $entry.url) | Where-Object { $_ } | Select-Object -First 1 } else { $null }
    if (-not $current) {
        claude plugin marketplace add $Source
        if ($LASTEXITCODE -ne 0) { throw "Cannot add the marketplace from $Source." }
    } elseif ((ConvertTo-SourceKey $current) -eq (ConvertTo-SourceKey $Requested)) {
        claude plugin marketplace update $Marketplace
    } else {
        # Never refresh another copy silently: the packs would come from a source the user did not ask for.
        throw ("Marketplace '$Marketplace' is already registered from '$current', not from '$Requested'. " +
               "To switch, remove it first, then rerun this script (it reinstalls the requested packs): " +
               "claude plugin marketplace remove $Marketplace")
    }
} else {
    # Older CLI without --json: previous behavior.
    claude plugin marketplace add $Source
    if ($LASTEXITCODE -ne 0) { claude plugin marketplace update $Marketplace }
}
foreach ($target in $Targets) {
    claude plugin install "$target@$Marketplace"
    if ($LASTEXITCODE -ne 0) { throw "Install of $target failed." }
}

if ($WithTools) {
    if (Get-Command uv -ErrorAction SilentlyContinue) {
        uv tool install "graphifyy==$GraphifyVersion"
    } else {
        Write-Warning "uv not found: skipping graphify (pip install graphifyy==$GraphifyVersion)."
    }
    if (Get-Command npx -ErrorAction SilentlyContinue) {
        npx -y "rea-agents@$ReaVersion" setup --client claude_code --dry-run --json
        if ($LASTEXITCODE -eq 0) { npx -y "rea-agents@$ReaVersion" setup --client claude_code }
    } else {
        Write-Warning "npx not found: skipping the REA MCP server."
    }
    $asc = "https://github.com/rorkai/App-Store-Connect-CLI/releases/download/$AscVersion/asc_${AscVersion}_windows_amd64.exe"
    if (Install-Binary "asc" $asc "06d20453a527ebf12d3fb5433a0a503c155d6d3c0c4cd958c00556151e4ca30c") {
        & (Join-Path $ToolsDir "asc.exe") telemetry disable | Out-Null   # asc sends usage telemetry by default
    }
    $gplay = "https://github.com/tamtom/play-console-cli/releases/download/v$GplayVersion/gplay-windows-amd64.exe"
    Install-Binary "gplay" $gplay "ce9ec9784e32eafcfbb96ee4c4869c56af1b151464ff3e675307bb58591c3556" | Out-Null
}

Write-Host "Done. Restart Claude Code or run /reload-plugins in an open session."
