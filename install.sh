#!/usr/bin/env bash
# Install ultime-skill in Claude Code: registers the marketplace, then installs a bundle or packs.
#
#   ./install.sh                         # bundle ultime-all from this clone
#   ./install.sh ultime-dev security     # chosen bundles or packs
#   ULTIME_SKILL_SOURCE=owner/repo ./install.sh   # from GitHub instead of this clone
#   ./install.sh --with-tools ultime-all # also installs the CLIs some skills drive (graphify, rea)
set -euo pipefail

MARKETPLACE="ultime-skill"
GRAPHIFY_VERSION="0.9.90"
REA_VERSION="6.5.0"
SOURCE="${ULTIME_SKILL_SOURCE:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"

with_tools=false
targets=()
for argument in "$@"; do
  case "$argument" in
    --with-tools) with_tools=true ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) targets+=("$argument") ;;
  esac
done
[ ${#targets[@]} -eq 0 ] && targets=(ultime-all)

command -v claude >/dev/null || { echo "Claude Code CLI 'claude' not found on PATH." >&2; exit 1; }

claude plugin marketplace add "$SOURCE" ||
  claude plugin marketplace update "$MARKETPLACE"
for target in "${targets[@]}"; do
  claude plugin install "$target@$MARKETPLACE"
done

if $with_tools; then
  if command -v uv >/dev/null; then
    uv tool install "graphifyy==$GRAPHIFY_VERSION"
  else
    echo "uv not found: skipping graphify (pip install graphifyy==$GRAPHIFY_VERSION)." >&2
  fi
  if command -v npx >/dev/null; then
    npx -y "rea-agents@$REA_VERSION" setup --client claude_code --dry-run --json &&
      npx -y "rea-agents@$REA_VERSION" setup --client claude_code
  else
    echo "npx not found: skipping the REA MCP server." >&2
  fi
fi

echo "Done. Restart Claude Code or run /reload-plugins in an open session."
