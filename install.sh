#!/usr/bin/env bash
# Install ultime-skill in Claude Code: registers the marketplace, then installs a bundle or packs.
#
#   ./install.sh                         # ultime-profile and guardrails: then ask Claude, in each project, to set up its skills
#   ./install.sh --no-guardrails         # without the guardrails hooks (they can be disabled later too)
#   ./install.sh --no-ponytail           # without ponytail, installed by default for every project
#   ./install.sh ultime-dev security     # chosen bundles or packs, for every project
#   ULTIME_SKILL_SOURCE=. ./install.sh   # from this clone instead of GitHub (per-project setup then needs GitHub)
#   ./install.sh --with-tools ultime-all # also installs the CLIs some skills drive (rea, asc, gplay)
set -euo pipefail

MARKETPLACE="ultime-skill"
REA_VERSION="6.5.0"
ASC_VERSION="5.16.0"
GPLAY_VERSION="1.0.0"
TOOLS_DIR="${ULTIME_SKILL_BIN:-$HOME/.local/bin}"

# Download a pinned release binary and install it only if its SHA-256 matches the one recorded here.
install_binary() {
  local name="$1" url="$2" sum="$3" tmp
  tmp="$(mktemp)"
  curl -fsSL "$url" -o "$tmp"
  if ! { echo "$sum  $tmp" | sha256sum -c --status 2>/dev/null || echo "$sum  $tmp" | shasum -a 256 -c --status 2>/dev/null; }; then
    echo "Checksum mismatch for $name: not installed." >&2
    rm -f "$tmp"
    return 1
  fi
  mkdir -p "$TOOLS_DIR"
  install -m 755 "$tmp" "$TOOLS_DIR/$name"
  rm -f "$tmp"
  echo "Installed $name in $TOOLS_DIR"
}

install_store_clis() {
  local os arch asc_asset gplay_asset asc_sum gplay_sum
  case "$(uname -s)" in Darwin) os=macOS ;; Linux) os=linux ;; *) echo "Unsupported OS for asc/gplay." >&2; return 0 ;; esac
  case "$(uname -m)" in x86_64|amd64) arch=amd64 ;; arm64|aarch64) arch=arm64 ;; *) echo "Unsupported CPU for asc/gplay." >&2; return 0 ;; esac
  asc_asset="asc_${ASC_VERSION}_${os}_${arch}"
  gplay_asset="gplay-$([ "$os" = macOS ] && echo darwin || echo linux)-$arch"
  case "$asc_asset" in
    *linux_amd64) asc_sum=f0be6185b82e300899e2c162bae8975cafb3fcd7c6f990b8e22d637184bcaabc ;;
    *linux_arm64) asc_sum=5c53f93804c59888657b62410036c3c6c08e68abe358944d6cb53f845fa59f1a ;;
    *macOS_amd64) asc_sum=e6c7ff486fff6e52bede69d6a197221c8b765d03c070775d2ae1c38a9a7924f8 ;;
    *macOS_arm64) asc_sum=99bcbf5a7bba3aac59e8d9e36a06bcb8dc15cd7a92db8ecacb42da464dce44c3 ;;
  esac
  case "$gplay_asset" in
    gplay-darwin-amd64) gplay_sum=1baf19abb8b476e0cd56dc2138906a74eca692de68e88b04a3a0786bc902d2e4 ;;
    gplay-darwin-arm64) gplay_sum=ca10f7dee8f48a13e44b7cd19fe7db965df82959b6c74d277b3c85924029a562 ;;
    gplay-linux-amd64) gplay_sum=148e9c60291c39bcaefcf87526edbafac9bbdcabb4017c56b1da05ed3da94f96 ;;
    gplay-linux-arm64) gplay_sum=fe990082403efb4db4259585d192b156c0c682eab2713713d50e3e77bb8b671b ;;
  esac
  install_binary asc "https://github.com/rorkai/App-Store-Connect-CLI/releases/download/$ASC_VERSION/$asc_asset" "$asc_sum" &&
    "$TOOLS_DIR/asc" telemetry disable >/dev/null || true   # asc sends usage telemetry by default
  install_binary gplay "https://github.com/tamtom/play-console-cli/releases/download/v$GPLAY_VERSION/$gplay_asset" "$gplay_sum" || true
}
SOURCE="${ULTIME_SKILL_SOURCE:-Lucas-lux/ultime-skill}"

with_tools=false
with_guardrails=true
with_ponytail=true
targets=()
for argument in "$@"; do
  case "$argument" in
    --with-tools) with_tools=true ;;
    --no-guardrails) with_guardrails=false ;;
    --no-ponytail) with_ponytail=false ;;
    -h|--help) sed -n '2,9p' "$0"; exit 0 ;;
    *) targets+=("$argument") ;;
  esac
done
[ ${#targets[@]} -eq 0 ] && targets=(ultime-profile)
if $with_guardrails && [[ ! " ${targets[*]} " =~ " guardrails " ]]; then targets+=(guardrails); fi
if $with_ponytail && [[ ! " ${targets[*]} " =~ " ponytail " ]]; then targets+=(ponytail); fi

command -v claude >/dev/null || { echo "Claude Code CLI 'claude' not found on PATH." >&2; exit 1; }

# Comparable form of a marketplace source: GitHub repo or absolute path, lower case, forward slashes.
normalize_source() {
  printf '%s' "$1" | sed -e 's#\\\\#/#g' -e 's#\\#/#g' -e 's#^https://github\.com/##' -e 's#\.git$##' -e 's#/$##' \
    -e 's#^/\([a-zA-Z]\)/#\1:/#' | tr '[:upper:]' '[:lower:]'
}

# Source (repo, path or url) the marketplace is registered from, empty if it is not registered.
registered_source() {
  printf '%s\n' "$1" | awk -v name="$MARKETPLACE" '
    /"name":/ { inside = index($0, "\"" name "\"") > 0 }
    inside && /"(repo|path|url)":/ { sub(/^[^:]*:[ ]*"/, ""); sub(/",?[ ]*$/, ""); print; exit }'
}

requested="$SOURCE"
if [ -d "$SOURCE" ]; then requested="$(cd "$SOURCE" && { pwd -W 2>/dev/null || pwd -P; })"; fi
if listing="$(claude plugin marketplace list --json 2>/dev/null)"; then
  current="$(registered_source "$listing")"
  if [ -z "$current" ]; then
    claude plugin marketplace add "$SOURCE" || claude plugin marketplace update "$MARKETPLACE"
  elif [ "$(normalize_source "$current")" = "$(normalize_source "$requested")" ]; then
    claude plugin marketplace update "$MARKETPLACE"
  else
    # Never refresh another copy silently: the packs would come from a source the user did not ask for.
    echo "Marketplace '$MARKETPLACE' is already registered from '$current', not from '$requested'." >&2
    echo "To switch, remove it first, then rerun this script (it reinstalls the requested packs):" >&2
    echo "  claude plugin marketplace remove $MARKETPLACE" >&2
    exit 1
  fi
else
  # Older CLI without --json: previous behavior.
  claude plugin marketplace add "$SOURCE" ||
    claude plugin marketplace update "$MARKETPLACE"
fi
for target in "${targets[@]}"; do
  claude plugin install "$target@$MARKETPLACE"
done

if $with_tools; then
  if command -v npx >/dev/null; then
    npx -y "rea-agents@$REA_VERSION" setup --client claude_code --dry-run --json &&
      npx -y "rea-agents@$REA_VERSION" setup --client claude_code
  else
    echo "npx not found: skipping the REA MCP server." >&2
  fi
  install_store_clis
fi

echo "Done. Restart Claude Code or run /reload-plugins in an open session."
