#!/bin/bash
# Hookify — PreToolUse:Bash
# Bloque les commandes destructives non autorisées
INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('command',''))" 2>/dev/null)

# Bloquer rm -rf sur dossiers critiques
if echo "$CMD" | grep -qE "rm -rf.*(node_modules|src|public|\.git)"; then
  echo '{"decision":"block","reason":"Commande destructive bloquée par hookify. Confirme manuellement."}' >&2
  exit 2
fi
exit 0
