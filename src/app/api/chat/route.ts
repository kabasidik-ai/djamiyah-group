/**
 * API Route — Chat GHL Conversation AI
 * Groupe Djamiyah · La Maison Blanche de Coyah
 *
 * Flow OPTIMISÉ :
 *  1. Reçoit message + données visiteur
 *  2. Crée/retrouve contact GHL
 *  3. Crée/retrouve conversation Live Chat
 *  4. Envoie message inbound
 *  5. Appelle DIRECTEMENT l'API Conversation AI (/conversations/ai-responses)
 *  6. Fallback : polling Auto-Pilot si l'API directe échoue
 *
 * Variables requises :
 *  GHL_API_TOKEN              — API key privée GHL
 *  GHL_LOCATION_ID            — Location ID
 *  GHL_CONVERSATION_AI_AGENT_ID — Agent ID Salematou
 */

import { NextRequest, NextResponse } from 'next/server'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

function sanitizeReplyForVisitor(text: string): string {
  return text
    .replace(/employee\s*action\s*log\s*created/gi, '')
    .replace(/\b(system|internal|automation|workflow)\b[^\n]*/gi, '')
    .replace(/\uFFFD|�|��/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toTwoSentenceReply(text: string): string {
  const cleaned = sanitizeReplyForVisitor(text)
  if (!cleaned) {
    return 'Parfait, votre demande est prise en compte. Vous pouvez finaliser votre réservation directement en ligne.'
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  return sentences.length > 0
    ? sentences.slice(0, 2).join(' ')
    : 'Parfait, votre demande est prise en compte. Vous pouvez finaliser votre réservation directement en ligne.'
}
const AI_API_VERSION = '2021-04-15'

// ── Guard ───────────────────────────────────────────────────────
function getEnvOrThrow(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

function buildHeaders(version = GHL_API_VERSION): Record<string, string> {
  return {
    Authorization: `Bearer ${getEnvOrThrow('GHL_API_TOKEN')}`,
    'Content-Type': 'application/json',
    Version: version,
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ── Contact ─────────────────────────────────────────────────────
async function getOrCreateContact(
  sessionId: string,
  visitorName?: string,
  visitorEmail?: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')
  const email = visitorEmail?.trim() || `widget-${sessionId}@djamiyah-chatbot.web`

  // Search existing
  try {
    const searchRes = await fetch(
      `${GHL_API_BASE}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`,
      { headers, next: { revalidate: 0 } }
    )
    if (searchRes.ok) {
      const data = await searchRes.json()
      if (data.contact?.id) return data.contact.id as string
    }
  } catch {
    // Continue to create
  }

  // Create new
  const nameParts = (visitorName?.trim() ?? '').split(' ')
  const firstName = nameParts[0] || 'Visiteur'
  const lastName = nameParts.slice(1).join(' ') || 'Web'

  const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId,
      email,
      firstName,
      lastName,
      source: 'djamiyah-widget',
      tags: ['widget-web', 'chatbot', visitorEmail ? 'lead-qualifie' : 'anonyme'],
    }),
  })

  if (!createRes.ok) {
    const errorBody = await createRes.text()
    if (createRes.status === 400 && errorBody.includes('contactId')) {
      try {
        const errorData = JSON.parse(errorBody)
        if (errorData.meta?.contactId) return errorData.meta.contactId as string
      } catch {
        /* continue */
      }
    }
    throw new Error(`Contact creation failed: HTTP ${createRes.status}`)
  }

  const contact = await createRes.json()
  return (contact.contact?.id ?? contact.id) as string
}

// ── Conversation ────────────────────────────────────────────────
async function getOrCreateConversation(contactId: string): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')

  const searchRes = await fetch(
    `${GHL_API_BASE}/conversations/search?locationId=${locationId}&contactId=${contactId}`,
    { headers }
  )

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.conversations?.length > 0) return data.conversations[0].id as string
  }

  const createRes = await fetch(`${GHL_API_BASE}/conversations/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ locationId, contactId, type: 'TYPE_LIVE_CHAT' }),
  })

  if (!createRes.ok) throw new Error(`Conversation creation failed: HTTP ${createRes.status}`)

  const conv = await createRes.json()
  return (conv.conversation?.id ?? conv.id) as string
}

// ── Envoi message inbound ───────────────────────────────────────
async function sendInboundMessage(
  contactId: string,
  conversationId: string,
  message: string
): Promise<void> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')

  const res = await fetch(`${GHL_API_BASE}/conversations/messages/inbound`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'Live_Chat',
      locationId,
      contactId,
      conversationId,
      message,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Inbound message failed: HTTP ${res.status}: ${body}`)
  }
}

// ── MÉTHODE 1 : Appel DIRECT Conversation AI ────────────────────
async function getDirectAIReply(conversationId: string, message: string): Promise<string | null> {
  const headers = buildHeaders(AI_API_VERSION)
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')
  const agentId = getEnvOrThrow('GHL_CONVERSATION_AI_AGENT_ID')

  try {
    const res = await fetch(`${GHL_API_BASE}/conversations/ai-responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        locationId,
        conversationId,
        agentId,
        message,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.warn(`[GHL][ai-responses] HTTP ${res.status}: ${body}`)
      return null
    }

    const data = await res.json()
    const reply = data.reply ?? data.response ?? data.message ?? ''

    if (typeof reply === 'string' && reply.trim()) {
      console.log(`[GHL][ai-responses] Réponse directe reçue (${reply.length} chars)`)
      return reply
    }

    return null
  } catch (error) {
    console.warn('[GHL][ai-responses] Erreur:', error)
    return null
  }
}

// ── MÉTHODE 2 : Polling Auto-Pilot (fallback) ───────────────────
async function pollForBotReply(
  conversationId: string,
  existingMsgCount: number
): Promise<string | null> {
  const headers = buildHeaders()
  const POLL_INTERVAL = 1500
  const MAX_POLLS = 10

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await wait(POLL_INTERVAL)

    try {
      const msgsRes = await fetch(
        `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=20`,
        { headers, next: { revalidate: 0 } }
      )

      if (!msgsRes.ok) continue

      const msgsData = await msgsRes.json()
      const messages: Array<{ direction: string; body?: string; text?: string }> =
        msgsData.messages?.messages ?? msgsData.messages ?? []

      if (messages.length > existingMsgCount) {
        const newMsgs = messages.slice(0, messages.length - existingMsgCount)
        const botMsg = newMsgs.find((m) => m.direction === 'outbound')
        if (botMsg) {
          const reply = botMsg.body ?? botMsg.text ?? ''
          if (reply.trim()) {
            console.log(`[GHL][poll-${attempt}] Réponse Auto-Pilot reçue`)
            return reply
          }
        }
      }
    } catch {
      // continue polling
    }
  }

  return null
}

// ── Handler POST ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Guard sur variables critiques
  if (!process.env.GHL_API_TOKEN) {
    console.error('[Chat API] FATAL: GHL_API_TOKEN manquant')
    return NextResponse.json(
      { reply: 'Service en cours de configuration. Réessayez dans quelques instants.' },
      { status: 200 }
    )
  }
  if (!process.env.GHL_LOCATION_ID || !process.env.GHL_CONVERSATION_AI_AGENT_ID) {
    console.error('[Chat API] FATAL: GHL_LOCATION_ID ou AGENT_ID manquant')
    return NextResponse.json(
      { reply: 'Service en cours de configuration. Réessayez dans quelques instants.' },
      { status: 200 }
    )
  }

  try {
    const body = await req.json()
    const {
      message,
      contactId: existingContactId,
      visitorName,
      visitorEmail,
    } = body as {
      message?: string
      contactId?: string
      visitorName?: string
      visitorEmail?: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    const sessionId =
      req.cookies.get('djamiyah_session')?.value ?? Math.random().toString(36).slice(2, 10)

    // 1. Contact
    const contactId =
      existingContactId ?? (await getOrCreateContact(sessionId, visitorName, visitorEmail))

    // 2. Conversation
    const conversationId = await getOrCreateConversation(contactId)

    // 3. Snapshot message count avant envoi
    let msgCountBefore = 0
    try {
      const headers = buildHeaders()
      const snapRes = await fetch(
        `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=10`,
        { headers, next: { revalidate: 0 } }
      )
      if (snapRes.ok) {
        const snap = await snapRes.json()
        msgCountBefore = snap.messages?.messages?.length ?? snap.messages?.length ?? 0
      }
    } catch {
      /* non critique */
    }

    // 4. Envoyer message inbound
    await sendInboundMessage(contactId, conversationId, message)

    // 5. MÉTHODE 1 : Appel DIRECT Conversation AI (rapide, fiable)
    let reply = await getDirectAIReply(conversationId, message)

    // 6. MÉTHODE 2 : Fallback polling Auto-Pilot
    if (!reply) {
      console.log('[Chat API] AI direct échoué, fallback polling Auto-Pilot...')
      reply = await pollForBotReply(conversationId, msgCountBefore)
    }

    // 7. Dernier fallback
    if (!reply) {
      reply =
        "Je traite votre demande. N'hésitez pas à reformuler ou contactez-nous au +224 610 75 90 90."
    }

    const response = NextResponse.json({ reply: toTwoSentenceReply(reply), contactId })
    response.cookies.set('djamiyah_session', sessionId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Chat API]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        reply: toTwoSentenceReply(
          'Service temporairement indisponible. Contactez-nous au +224 610 75 90 90.'
        ),
      },
      { status: 200 }
    )
  }
}
