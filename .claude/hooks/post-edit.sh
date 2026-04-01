#!/bin/bash
# Hookify — PostToolUse:Edit|Write
# Log les fichiers modifiés pour traçabilité
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null)
if [ -n "$FILE" ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] MODIFIED: $FILE" >> /Users/sidikkaba/Documents/djamiyah-group/.claude/edit-log.txt
fi
exit 0
