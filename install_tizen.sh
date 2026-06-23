#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
USER_NAME="${USER:-bekabonsa}"
TIZEN="${TIZEN:-/Users/$USER_NAME/tizen-studio/tools/ide/bin/tizen}"
TARGET="${TARGET:-UE55NU7475}"
PROFILE="${PROFILE:-bex}"
APP_ID="${APP_ID:-VtffsKLoty.NuvioTizen}"
SKIP_INSTALL="${SKIP_INSTALL:-0}"

EXCLUDES=(
    ".git/*" ".git"
    ".cache/*" ".cache"
    ".metadata/*" ".metadata"
    ".vscode/*" ".vscode"
    ".venv/*" ".venv"
    "venv/*" "venv"
    "node_modules/*" "node_modules"
    "package-lock.json"
    "npm-debug.log"
    ".gitignore"
    "tests/*" "tests"
    "scripts/*" "scripts"
    "README.md"
    "install_commands.txt"
    "install_tizen.sh"
)

EXCLUDE_ARGS=()
for pattern in "${EXCLUDES[@]}"; do
    EXCLUDE_ARGS+=("-e" "$pattern")
done

cd "$ROOT_DIR"
rm -rf .buildResult

"$TIZEN" build-web "${EXCLUDE_ARGS[@]}" -- "$ROOT_DIR"
"$TIZEN" package -t wgt -s "$PROFILE" -- ./.buildResult

WGT="$(ls -t .buildResult/*.wgt | head -1)"

unzip -p "$WGT" index.html | grep -q "downloadedLibraryPanel"
unzip -p "$WGT" index.html | grep -q "detailTrailerStage"
if unzip -l "$WGT" | grep -E '(^|[[:space:]])(\.git|\.cache)(/|$)'; then
    echo "Refusing to install: WGT still contains .git or .cache files." >&2
    exit 1
fi

ls -lh "$WGT"

if [ "$SKIP_INSTALL" = "1" ]; then
    echo "SKIP_INSTALL=1 set; package verified but not installed."
    exit 0
fi

"$TIZEN" install -n "$(basename "$WGT")" -t "$TARGET" -- "$(dirname "$WGT")"
"$TIZEN" run -p "$APP_ID" -t "$TARGET"
