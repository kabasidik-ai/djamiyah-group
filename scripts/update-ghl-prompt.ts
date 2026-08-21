#!/usr/bin/env tsx
/**
 * update-ghl-prompt.ts
 *
 * Met à jour automatiquement le prompt Djami dans GHL via l'API.
 * Exécuté automatiquement après chaque déploiement pour garantir la cohérence.
 *
 * Usage: GHL_API_TOKEN=... GHL_CONVERSATION_AI_AGENT_ID=... npx tsx scripts/update-ghl-prompt.ts
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

async function updateGHLPrompt() {
  const token = process.env.GHL_API_TOKEN
  const agentId = process.env.GHL_CONVERSATION_AI_AGENT_ID

  if (!token || !agentId) {
    console.error('❌ Missing GHL_API_TOKEN or GHL_CONVERSATION_AI_AGENT_ID')
    process.exit(1)
  }

  // Lire le prompt depuis GHL-PROMPT-SALEMATOU.md
  const promptPath = join(process.cwd(), 'GHL-PROMPT-SALEMATOU.md')
  let promptContent: string
  try {
    promptContent = readFileSync(promptPath, 'utf-8')
  } catch (e) {
    console.error('❌ Cannot read GHL-PROMPT-SALEMATOU.md:', e)
    process.exit(1)
  }

  console.log('📤 Updating Djami prompt in GHL...')

  const url = `${GHL_API_BASE}/conversations/ai-agents/${agentId}`
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: GHL_API_VERSION,
    },
    body: JSON.stringify({
      systemPrompt: promptContent,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`❌ Failed to update GHL prompt: HTTP ${response.status}`)
    console.error(errorText)
    process.exit(1)
  }

  console.log('✅ Djami prompt updated successfully in GHL')
  console.log(`📋 Prompt length: ${promptContent.length} characters`)
}

updateGHLPrompt().catch((err) => {
  console.error('❌ Unexpected error:', err)
  process.exit(1)
})
