# Install ultime-skill in Claude Code: registers the marketplace, then installs a bundle or packs.
#
#   .\install.ps1                          # bundle ultime-all from this clone
#   .\install.ps1 ultime-dev security      # chosen bundles or packs
#   $env:ULTIME_SKILL_SOURCE = "owner/repo"; .\install.ps1   # from GitHub instead of this clone
#   .\install.ps1 -WithTools ultime-all    # also installs the CLIs some skills drive (graphify, rea)
param(
    [switch]$WithTools,
    [Parameter(ValueFromRemainingArguments = $true)][string[]]$Targets
)
$ErrorActionPreference = "Stop"

$Marketplace = "ultime-skill"
$GraphifyVersion = "0.9.90"
$ReaVersion = "6.5.0"
$Source = if ($env:ULTIME_SKILL_SOURCE) { $env:ULTIME_SKILL_SOURCE } else { $PSScriptRoot }
if (-not $Targets) { $Targets = @("ultime-all") }

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    throw "Claude Code CLI 'claude' not found on PATH."
}

claude plugin marketplace add $Source
if ($LASTEXITCODE -ne 0) { claude plugin marketplace update $Marketplace }
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
}

Write-Host "Done. Restart Claude Code or run /reload-plugins in an open session."
