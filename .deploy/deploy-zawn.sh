#!/bin/bash
# ZAWN Technologies auto-deploy: copies the latest site from GitHub into public_html.
# Runs from cPanel cron every 15 minutes. Does nothing when there is no new commit.
REPO="AwaisChaudhary/zawntechnologies-site"
BRANCH="main"
DEST="$HOME/public_html"
STATE="$HOME/.zawn-deploy-sha"
TOKEN_FILE="$HOME/.zawn-deploy-token"   # only needed if the repository is private
LOG="$HOME/zawn-deploy.log"

AUTH=()
[ -s "$TOKEN_FILE" ] && AUTH=(-H "Authorization: Bearer $(tr -d '[:space:]' < "$TOKEN_FILE")")

SHA=$(curl -fsSL "${AUTH[@]}" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/commits/$BRANCH" | grep -m1 '"sha"' | sed -E 's/.*"sha": *"([0-9a-f]+)".*/\1/')
[ -z "$SHA" ] && { echo "$(date -u +%F' '%T) could not read latest commit" >> "$LOG"; exit 1; }
[ "$SHA" = "$(cat "$STATE" 2>/dev/null)" ] && exit 0

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
curl -fsSL "${AUTH[@]}" -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/$REPO/tarball/$SHA" -o "$TMP/site.tgz" || { echo "$(date -u +%F' '%T) download failed" >> "$LOG"; exit 1; }
mkdir "$TMP/x" && tar -xzf "$TMP/site.tgz" -C "$TMP/x" --strip-components=1 || exit 1
# never ship repo tooling, never touch the mail handler or its config
rm -rf "$TMP/x/.deploy" "$TMP/x/.github" "$TMP/x/README.md" "$TMP/x/.gitignore" "$TMP/x/send.php"
[ -f "$TMP/x/index.html" ] || { echo "$(date -u +%F' '%T) no index.html in $SHA, skipped" >> "$LOG"; exit 1; }
cp -R "$TMP/x/." "$DEST/" && echo "$SHA" > "$STATE" && echo "$(date -u +%F' '%T) deployed $SHA" >> "$LOG"
