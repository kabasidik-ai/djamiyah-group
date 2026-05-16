/**
 * POST /api/chat/stream
 *
 * SSE endpoint for Salematou chatbot — streams GHL AI responses chunk by chunk.
 *
 * Protocol (text/event-stream):
 *   event: status    → { status: 'thinking' | 'typing' | 'done' | 'error' }
 *   event: chunk     → { text: '...' }
 *   event: meta      → { contactId: '...' }
 *   event: done      → { full: '...' }
 *
 * Variables requises: GHL_API_TOKEN, GHL_LOCATION_ID, GHL_CONVERSATION_AI_AGENT_ID
 */

import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30 // Vercel serverless timeout (seconds) — polling can take up to 12s

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'
const AI_API_VERSION = '2021-04-15'

// ── Simple in-memory cache for identical messages ───────────────
type CacheEntry = { reply: string; ts: number }
const replyCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 min
const CACHE_MAX = 200

function getCachedReply(key: string): string | null {
  const entry = replyCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    replyCache.delete(key)
    return null
  }
  return entry.reply
}

function setCachedReply(key: string, reply: string): void {
  if (replyCache.size >= CACHE_MAX) {
    const oldest = replyCache.keys().next().value
    if (oldest !== undefined) replyCache.delete(oldest)
  }
  replyCache.set(key, { reply, ts: Date.now() })
}

function cacheKey(message: string, contactId?: string): string {
  const normalized = message.trim().toLowerCase().slice(0, 200)
  return `${contactId ?? 'anon'}:${normalized}`
}

// ── Helpers ─────────────────────────────────────────────────────
function sanitizeReply(text: string): string {
  return text
    .replace(/employee\s*action\s*log\s*created/gi, '')
    .replace(/\b(system|internal|automation|workflow)\b[^\n]*/gi, '')
    .replace(/\uFFFD|�|��/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toTwoSentenceReply(text: string): string {
  const cleaned = sanitizeReply(text)
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

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// ── GHL Contact ─────────────────────────────────────────────────
async function getOrCreateContact(
  sessionId: string,
  visitorName?: string,
  visitorEmail?: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')
  const email = visitorEmail?.trim() || `widget-${sessionId}@djamiyah-chatbot.web`

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

// ── GHL Conversation ────────────────────────────────────────────
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

// ── GHL Inbound Message ─────────────────────────────────────────
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

// ── GHL Direct AI Response ──────────────────────────────────────
async function getDirectAIReply(conversationId: string, message: string): Promise<string | null> {
  const headers = buildHeaders(AI_API_VERSION)
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')
  const agentId = getEnvOrThrow('GHL_CONVERSATION_AI_AGENT_ID')

  try {
    const res = await fetch(`${GHL_API_BASE}/conversations/ai-responses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ locationId, conversationId, agentId, message }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.warn(`[GHL][ai-responses] HTTP ${res.status}: ${body}`)
      return null
    }

    const data = await res.json()
    const reply = data.reply ?? data.response ?? data.message ?? ''
    if (typeof reply === 'string' && reply.trim()) return reply
    return null
  } catch (error) {
    console.warn('[GHL][ai-responses] Erreur:', error)
    return null
  }
}

// ── GHL Polling Fallback ────────────────────────────────────────
async function pollForBotReply(
  conversationId: string,
  existingMsgCount: number,
  onKeepAlive?: () => void
): Promise<string | null> {
  const headers = buildHeaders()
  const POLL_INTERVAL = 1500
  const MAX_POLLS = 8 // max 12s total
  const KEEPALIVE_AFTER = 5 // Send keepalive typing after attempt 5 (~8s)

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await wait(POLL_INTERVAL)

    // Keep SSE connection alive after 8s so Vercel/proxies don't close it
    if (attempt === KEEPALIVE_AFTER && onKeepAlive) {
      onKeepAlive()
    }

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
          if (reply.trim()) return reply
        }
      }
    } catch {
      // continue polling
    }
  }
  return null
}

// ── SSE Encoder ─────────────────────────────────────────────────
function sseEvent(event: string, data: Record<string, unknown>): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`
}

// ── POST Handler — SSE Stream ───────────────────────────────────
export async function POST(req: NextRequest) {
  // Guard env vars
  if (
    !process.env.GHL_API_TOKEN ||
    !process.env.GHL_LOCATION_ID ||
    !process.env.GHL_CONVERSATION_AI_AGENT_ID
  ) {
    return new Response(
      sseEvent('error', {
        message: 'Service en cours de configuration. Réessayez dans quelques instants.',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      }
    )
  }

  let body: {
    message?: string
    contactId?: string
    visitorName?: string
    visitorEmail?: string
  }

  try {
    body = await req.json()
  } catch {
    return new Response(sseEvent('error', { message: 'Requête invalide.' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const { message, contactId: existingContactId, visitorName, visitorEmail } = body
  if (!message?.trim()) {
    return new Response(sseEvent('error', { message: 'Message vide.' }), {
      status: 400,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const sessionId =
    req.cookies.get('djamiyah_session')?.value ?? Math.random().toString(36).slice(2, 10)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const push = (event: string, data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(event, data)))
        } catch {
          // Stream already closed
        }
      }

      const startTime = Date.now()

      try {
        // ── Phase 1: Setup (contact + conversation) ──
        push('status', { status: 'thinking' })

        // Check cache first
        const ck = cacheKey(message, existingContactId)
        const cached = getCachedReply(ck)
        if (cached) {
          const latency = Date.now() - startTime
          console.debug(`[chat/stream] Cache hit (${latency}ms)`)
          push('meta', { contactId: existingContactId ?? null, cached: true })

          // Stream cached reply word by word
          const words = cached.split(' ')
          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : ' ' + words[i]
            push('chunk', { text: chunk })
            if (i < words.length - 1) await wait(30)
          }

          push('done', { full: cached })
          push('status', { status: 'done', latencyMs: latency })
          controller.close()
          return
        }

        // Contact
        const contactId =
          existingContactId ?? (await getOrCreateContact(sessionId, visitorName, visitorEmail))
        push('meta', { contactId })

        // Conversation
        const conversationId = await getOrCreateConversation(contactId)

        // Snapshot message count
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
          /* non-critical */
        }

        // Send inbound message
        await sendInboundMessage(contactId, conversationId, message)

        // ── Phase 2: Get AI reply ──
        push('status', { status: 'typing' })

        // Method 1: Direct AI
        let rawReply = await getDirectAIReply(conversationId, message)

        // Method 2: Polling fallback
        if (!rawReply) {
          console.debug('[chat/stream] AI direct failed, falling back to polling...')
          rawReply = await pollForBotReply(conversationId, msgCountBefore, () => {
            // Keepalive: push typing status after ~8s to prevent proxy/Vercel timeout
            push('status', { status: 'typing', keepalive: true })
          })
        }

        // Final fallback
        if (!rawReply) {
          rawReply =
            "Je traite votre demande. N'hésitez pas à reformuler ou contactez-nous au +224 610 75 90 90."
        }

        const reply = toTwoSentenceReply(rawReply)
        const latency = Date.now() - startTime
        console.debug(`[chat/stream] Reply ready (${latency}ms, ${reply.length} chars)`)

        // Cache for next identical question
        setCachedReply(ck, reply)

        // ── Phase 3: Stream reply word by word ──
        const words = reply.split(' ')
        for (let i = 0; i < words.length; i++) {
          const chunk = i === 0 ? words[i] : ' ' + words[i]
          push('chunk', { text: chunk })
          // Progressive delay: faster for short replies
          if (i < words.length - 1) {
            await wait(words.length > 20 ? 25 : 40)
          }
        }

        push('done', { full: reply })
        push('status', { status: 'done', latencyMs: latency })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Erreur interne'
        console.error('[chat/stream]', msg)
        push('error', {
          message: 'Service temporairement indisponible. Contactez-nous au +224 610 75 90 90.',
        })
      } finally {
        try {
          controller.close()
        } catch {
          // Already closed
        }
      }
    },
  })

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })

  // Set session cookie via Set-Cookie header
  response.headers.append(
    'Set-Cookie',
    `djamiyah_session=${sessionId}; HttpOnly; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax; Path=/`
  )

  return response
}
