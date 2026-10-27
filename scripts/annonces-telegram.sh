#!/usr/bin/env bash
# Envoie sur Telegram le tweet de chaque mise à jour majeure, une fois en ligne.
# Lancé par cron toutes les 5 minutes (voir AGENTS.md, « Annoncer une mise à jour »).
# Une annonce = un fichier annonces/AAAA-MM-JJ-sujet.md sur la branche main.
# Elle n'est envoyée qu'une fois, quand speechsynthe.si sert exactement ce fichier.

set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SITE="https://speechsynthe.si"
STATE="$REPO/logs/annonces-envoyees.txt"
LOG="$REPO/logs/annonces-telegram.log"
ENV_FILE="$HOME/.claude/.env"

mkdir -p "$REPO/logs"
touch "$STATE"
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"; }

[[ -f "$ENV_FILE" ]] || { log "pas de $ENV_FILE"; exit 0; }
# shellcheck disable=SC1090
source "$ENV_FILE"
[[ -n "${TELEGRAM_BOT_TOKEN:-}" && -n "${TELEGRAM_CHAT_ID:-}" ]] || { log "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant"; exit 0; }

send() {
  local response
  response=$(curl -sS --max-time 20 "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" --data-urlencode "text=$1" \
    --data-urlencode "disable_web_page_preview=true") || return 1
  [[ "$response" == *'"ok":true'* ]]
}

git -C "$REPO" fetch --quiet origin main 2>>"$LOG" || { log "git fetch impossible"; exit 0; }

while IFS= read -r file; do
  [[ "$file" =~ ^annonces/[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9-]+\.md$ ]] || continue
  grep -qxF "$file" "$STATE" && continue
  tweet=$(git -C "$REPO" show "origin/main:$file") || continue
  # Pas encore en ligne (GitHub Pages publie en une à deux minutes) : on réessaiera.
  live=$(curl -fsS --max-time 20 "$SITE/$file?t=$(date +%s)") || continue
  [[ "$live" == "$tweet" ]] || continue
  count=$(printf '%s' "$tweet" | node --input-type=module -e "import { tweetLength } from '$REPO/scripts/annonces.mjs'; import { readFileSync } from 'node:fs'; console.log(tweetLength(readFileSync(0, 'utf8')))" 2>/dev/null || echo "?")
  topic=$(basename "$file" .md | cut -c12- | tr '-' ' ')
  if send "📣 Mise à jour en ligne sur speechsynthe.si : ${topic}
Le tweet à poster suit (${count}/280 caractères)." && send "$tweet"; then
    echo "$file" >> "$STATE"
    log "envoyé : $file"
  else
    log "échec d'envoi Telegram : $file (nouvel essai au prochain passage)"
  fi
done < <(git -C "$REPO" ls-tree --name-only origin/main annonces/ 2>/dev/null)
