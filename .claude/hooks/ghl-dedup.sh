#!/bin/bash
# ghl-dedup.sh — Hook PreToolUse anti-doublon GHL
# Intercepte les créations de contact GHL avant exécution
# Vérifie l'existence via le bridge → n8n → GHL API

set -uo pipefail

BRIDGE_URL="http://localhost:3099"
LOG="/Users/sidikkaba/Documents/djamiyah-group/.claude/edit-log.txt"

# Lire l'input JSON depuis stdin
INPUT=$(cat)

# Extraire la commande bash si c'est un appel curl vers /trigger
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('command', ''))
except:
    print('')
" 2>/dev/null)

# Ne traiter que si c'est une création de contact GHL
if ! echo "$CMD" | grep -qE "(ghl-create-contact|ghl_create_contact|/contacts/)"; then
  exit 0  # Pas concerné — laisser passer
fi

# Extraire email et téléphone de la commande
EMAIL=$(echo "$CMD" | python3 -c "
import sys, re, json
cmd = sys.stdin.read()
# Chercher email dans le JSON de la commande
match = re.search(r'\"email\":\s*\"([^\"]+)\"', cmd)
print(match.group(1) if match else '')
" 2>/dev/null)

PHONE=$(echo "$CMD" | python3 -c "
import sys, re
cmd = sys.stdin.read()
match = re.search(r'\"phone\":\s*\"([^\"]+)\"', cmd)
print(match.group(1) if match else '')
" 2>/dev/null)

if [ -z "$EMAIL" ] && [ -z "$PHONE" ]; then
  exit 0  # Pas assez d'info pour vérifier — laisser passer
fi

# Appeler le bridge pour vérifier l'existence dans GHL
RESPONSE=$(curl -s -X POST "$BRIDGE_URL/trigger" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"ghl-check-contact\",
    \"source\": \"hookify-dedup\",
    \"data\": {
      \"email\": \"$EMAIL\",
      \"phone\": \"$PHONE\"
    }
  }" 2>/dev/null)

if [ -z "$RESPONSE" ]; then
  # Bridge non joignable — laisser passer avec warning
  echo "[$(date)] WARN: Bridge non joignable, vérification GHL ignorée" >> "$LOG"
  exit 0
fi

EXISTS=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    r = d.get('n8n_response', {}).get('body', {})
    print('true' if r.get('exists', False) else 'false')
except:
    print('false')
" 2>/dev/null)

if [ "$EXISTS" = "true" ]; then
  # Contact existe — bloquer et proposer update
  CONTACT_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    r = d.get('n8n_response', {}).get('body', {})
    print(r.get('contactId', ''))
except:
    print('')
  " 2>/dev/null)

  echo "[$(date)] BLOCKED: Doublon GHL détecté — email=$EMAIL contactId=$CONTACT_ID" >> "$LOG"

  # Retourner décision de blocage
  python3 -c "
import json
print(json.dumps({
    'decision': 'block',
    'reason': f'Contact GHL déjà existant (email: $EMAIL, ID: $CONTACT_ID). Utilise ghl-update-stage ou update contact à la place.'
}))
  " >&2
  exit 2
fi

# Contact n'existe pas — laisser passer
echo "[$(date)] OK: Nouveau contact GHL autorisé — email=$EMAIL" >> "$LOG"
exit 0
