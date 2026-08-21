/**
 * POST /api/chat/stream
 *
 * SSE endpoint for Djami chatbot — streams GHL AI responses chunk by chunk.
 *
 * Protocol (text/event-stream):
 *   event: status    → { status: 'thinking' | 'typing' | 'done' | 'error' }
 *   event: chunk     → { text: '...' }
 *   event: meta      → { contactId: '...' }
 *   event: done      → { full: '...' }
 *
 * Variables requises: GHL_API_TOKEN, GHL_LOCATION_ID, GHL_CONVERSATION_AI_AGENT_ID
 */

import { createHash } from 'node:crypto'
import { NextRequest } from 'next/server'
import { detectIntent, prependIntentHint } from '@/lib/intent-detector'

export const runtime = 'nodejs'
export const maxDuration = 30 // Vercel serverless timeout (seconds) — polling can take up to 12s

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28'

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
  const msgHash = createHash('sha1').update(message.trim().toLowerCase()).digest('hex').slice(0, 12)
  return `${contactId ?? 'anon'}:${msgHash}`
}

// ── Helpers ─────────────────────────────────────────────────────
function sanitizeReply(text: string): string {
  return text
    .replace(/employee\s*action\s*log\s*created[^\n]*/gi, '')
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
    ? sentences.slice(0, 3).join(' ')
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
    const searchUrl = `${GHL_API_BASE}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`
    console.log('[DEBUG] Appel GHL vers:', searchUrl)
    const searchRes = await fetch(searchUrl, { headers, next: { revalidate: 0 } })
    console.log('[DEBUG] Contact search status:', searchRes.status)
    if (searchRes.ok) {
      const data = await searchRes.json()
      console.log('[DEBUG] Contact search result:', JSON.stringify(data).slice(0, 300))
      if (data.contact?.id) return data.contact.id as string
    }
  } catch (e) {
    console.log('[DEBUG] Contact search error:', e instanceof Error ? e.message : e)
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
// Crée TOUJOURS une nouvelle conversation pour chaque session widget.
// Réutiliser une vieille conversation contamine le contexte GHL AI.
async function createOrReuseConversation(
  contactId: string,
  existingConversationId?: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')

  // Si déjà dans une session active, réutiliser cette conversation
  if (existingConversationId) {
    console.log('[DEBUG] Réutilisation conversation session:', existingConversationId)
    return existingConversationId
  }

  // Nouvelle session → nouvelle conversation (contexte GHL frais)
  console.log('[DEBUG] Création nouvelle conversation pour contact:', contactId)
  const createRes = await fetch(`${GHL_API_BASE}/conversations/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ locationId, contactId, type: 'TYPE_LIVE_CHAT' }),
  })
  console.log('[DEBUG] Conversation create status:', createRes.status)

  if (!createRes.ok) {
    // Fallback : chercher une conversation existante
    const searchRes = await fetch(
      `${GHL_API_BASE}/conversations/search?locationId=${locationId}&contactId=${contactId}`,
      { headers }
    )
    if (searchRes.ok) {
      const data = await searchRes.json()
      if (data.conversations?.length > 0) return data.conversations[0].id as string
    }
    throw new Error(`Conversation creation failed: HTTP ${createRes.status}`)
  }

  const conv = await createRes.json()
  const convId = (conv.conversation?.id ?? conv.id) as string
  console.log('[DEBUG] Nouvelle conversation créée:', convId)
  return convId
}

// ── GHL Inbound Message ─────────────────────────────────────────
async function sendInboundMessage(
  contactId: string,
  conversationId: string,
  message: string
): Promise<void> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('GHL_LOCATION_ID')

  const inboundUrl = `${GHL_API_BASE}/conversations/messages/inbound`
  console.log('[DEBUG] Appel GHL vers:', inboundUrl, '| convId:', conversationId)
  const res = await fetch(inboundUrl, {
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
  console.log('[DEBUG] Inbound message status:', res.status)

  if (!res.ok) {
    const body = await res.text()
    console.error('[DEBUG] Inbound message error body:', body)
    throw new Error(`Inbound message failed: HTTP ${res.status}: ${body}`)
  }

  const resBody = await res.clone().text()
  console.log('[DEBUG] Inbound message response:', resBody.slice(0, 300))
}

// ── GHL Direct AI Response ──────────────────────────────────────
// NOTE: /conversations/ai-responses endpoint returns 404 on GHL API v2.
// The Conversation AI agent auto-responds via Auto-Pilot when inbound
// messages are sent. We rely on polling to catch the outbound reply.
// This function is kept as a stub for future GHL API updates.
async function getDirectAIReply(_conversationId: string, _message: string): Promise<string | null> {
  // Skipped — GHL Auto-Pilot triggers automatically on inbound message.
  // Polling will catch the outbound response.
  console.log('[DEBUG] AI direct: skipped (Auto-Pilot mode), going straight to polling')
  return null
}

// ── GHL Polling Fallback ────────────────────────────────────────
// Détection par TIMESTAMP (sentAt) — fonctionne pour toute taille de conversation.
// Le comptage de messages échoue dès que le nombre ≥ limit (bug pour contacts existants).
async function pollForBotReply(
  conversationId: string,
  sentAt: string, // ISO timestamp juste avant envoi du message utilisateur
  existingMsgCount: number, // Gardé comme fallback si dateAdded absent
  onKeepAlive?: () => void
): Promise<string | null> {
  const headers = buildHeaders()
  const POLL_INTERVAL = 800
  const MAX_POLLS = 20
  const KEEPALIVE_AFTER = 6

  type GHLMessage = {
    id?: string
    direction: string
    body?: string
    text?: string
    dateAdded?: string
  }

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await wait(POLL_INTERVAL)

    if (attempt === KEEPALIVE_AFTER && onKeepAlive) {
      onKeepAlive()
    }

    try {
      const pollUrl = `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=50`
      console.log(`[DEBUG] Poll #${attempt + 1}/${MAX_POLLS}`)
      const msgsRes = await fetch(pollUrl, { headers, next: { revalidate: 0 } })
      if (!msgsRes.ok) continue

      const msgsData = await msgsRes.json()
      const messages: GHLMessage[] = msgsData.messages?.messages ?? msgsData.messages ?? []

      console.log(`[DEBUG] Poll #${attempt + 1}: ${messages.length} msgs, sentAt=${sentAt}`)

      // Méthode 1 (prioritaire) : filtre par timestamp
      const botMsgByTime = messages.find((m) => {
        const body = (m.body ?? m.text ?? '').trim()
        const isAfterSent = m.dateAdded ? m.dateAdded >= sentAt : false
        return (
          m.direction === 'outbound' &&
          body.length > 0 &&
          isAfterSent &&
          !/^employee\s*action\s*log/i.test(body) &&
          !/^action\s*log/i.test(body)
        )
      })
      if (botMsgByTime) {
        const reply = botMsgByTime.body ?? botMsgByTime.text ?? ''
        console.log(`[DEBUG] Poll #${attempt + 1} reply (timestamp):`, reply.slice(0, 100))
        if (reply.trim()) return reply
      }

      // Méthode 2 (fallback) : filtre par comptage si dateAdded absent
      if (messages.length > existingMsgCount) {
        const newMsgs = messages.slice(0, messages.length - existingMsgCount)
        const botMsgByCount = newMsgs.find((m) => {
          const body = (m.body ?? m.text ?? '').trim()
          return (
            m.direction === 'outbound' &&
            body.length > 0 &&
            !/^employee\s*action\s*log/i.test(body) &&
            !/^action\s*log/i.test(body)
          )
        })
        if (botMsgByCount) {
          const reply = botMsgByCount.body ?? botMsgByCount.text ?? ''
          console.log(`[DEBUG] Poll #${attempt + 1} reply (count):`, reply.slice(0, 100))
          if (reply.trim()) return reply
        }
      }
    } catch (e) {
      console.log(`[DEBUG] Poll #${attempt + 1} error:`, e instanceof Error ? e.message : e)
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
    conversationId?: string
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

  console.log('[DEBUG] Payload reçu:', JSON.stringify(body))

  const {
    message,
    contactId: existingContactId,
    conversationId: existingConversationId,
    visitorName,
    visitorEmail,
  } = body
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

        // Conversation (nouvelle par session widget pour contexte GHL frais)
        const conversationId = await createOrReuseConversation(contactId, existingConversationId)

        push('meta', { contactId, conversationId })

        // Snapshot message count
        let msgCountBefore = 0
        try {
          const headers = buildHeaders()
          const snapRes = await fetch(
            `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=20`,
            { headers, next: { revalidate: 0 } }
          )
          if (snapRes.ok) {
            const snap = await snapRes.json()
            msgCountBefore = snap.messages?.messages?.length ?? snap.messages?.length ?? 0
          }
        } catch {
          /* non-critical */
        }

        // Detect intent and inject routing hint for GHL — invisible to user
        const intent = detectIntent(message)
        const ghlMessage = prependIntentHint(message, intent)
        console.log('[DEBUG] Intent détecté:', intent)

        // Timestamp juste avant envoi — utilisé pour filtrer les nouveaux messages
        const sentAt = new Date().toISOString()
        await sendInboundMessage(contactId, conversationId, ghlMessage)

        // ── Phase 2: Get AI reply ──
        push('status', { status: 'typing' })

        // Method 1: Direct AI
        let rawReply = await getDirectAIReply(conversationId, message)

        // Method 2: Polling fallback (timestamp-based — robust pour tous contacts)
        if (!rawReply) {
          console.debug('[chat/stream] AI direct failed, falling back to polling...')
          rawReply = await pollForBotReply(conversationId, sentAt, msgCountBefore, () => {
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
