/**
 * API Route — Proxy sécurisé vers GHL Conversation AI
 * Groupe Djamiyah · La Maison Blanche de Coyah
 *
 * IDs système :
 *  Location ID      : a5wcdv6hapHNnLA9xnl4
 *  Knowledge Base   : LHkyfNrjcvoKktQrLGZU  (configuré dans GHL agent)
 *  Chat Widget GHL  : 69d1e67a34c0446b134002e2
 *  Client App ID    : 69d037aab560ab3c98ea5ccd
 *
 * Flow :
 *  1. Reçoit le message + données visiteur (nom, email) du widget React
 *  2. Crée/retrouve un contact GHL (nommé si nom+email fournis)
 *  3. Crée/retrouve une conversation GHL Live Chat
 *  4. Envoie le message inbound à GHL
 *  5. Attend la réponse Auto-pilot de l'IA (polling, max 7,5s)
 *  6. Retourne la réponse au widget
 *
 * Variables requises (Vercel → Settings → Environment Variables) :
 *  GHL_API_TOKEN                            — API key privée GHL (jamais NEXT_PUBLIC_)
 *  NEXT_PUBLIC_GHL_LOCATION_ID              — Location ID du sous-compte Maison Blanche
 *  NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID — Agent ID Salematou
 */

import { NextRequest, NextResponse } from 'next/server'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-07-28' // Version correcte pour GHL API v2

// ── Guard : variables obligatoires ───────────────────────────────
function getEnvOrThrow(key: string): string {
  const val = process.env[key]
  if (!val) throw new Error(`Missing env var: ${key}`)
  return val
}

// Construit les headers GHL à la demande (ne pas évaluer au module-level
// pour éviter un crash au build si les vars ne sont pas encore injectées)
function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getEnvOrThrow('GHL_API_TOKEN')}`,
    'Content-Type': 'application/json',
    Version: GHL_API_VERSION,
  }
}

// Helper : retry avec délai exponentiel
async function retryRequest<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = baseDelay * Math.pow(2, attempt - 1)
        await wait(delay)
      }
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`[Retry ${attempt + 1}/${maxRetries}] ${lastError.message}`)
    }
  }

  throw lastError ?? new Error('Retry failed')
}

// Helper : log l'erreur GHL avec le body complet pour faciliter le debug
async function logGhlError(label: string, res: Response): Promise<void> {
  let body = '<empty>'
  try {
    body = await res.clone().text()
  } catch {
    // ignorer
  }
  console.error(`[GHL][${label}] HTTP ${res.status} — ${body}`)
}

// ── Délai ─────────────────────────────────────────────────────
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Crée ou retrouve un contact GHL - OPTIMISÉ
 * Flow : Chercher existant → Créer si absent → Pas de re-search
 */
async function getOrCreateContact(
  sessionId: string,
  visitorName?: string,
  visitorEmail?: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('NEXT_PUBLIC_GHL_LOCATION_ID')

  // Validation : email requis (réel ou anonyme de session)
  const email = visitorEmail?.trim() || `widget-${sessionId}@djamiyah-chatbot.web`

  if (!email || email.length < 3) {
    throw new Error('Email requis pour créer un contact')
  }

  // 1. Chercher contact existant par email avec retry
  try {
    const searchFn = async () => {
      const searchRes = await fetch(
        `${GHL_API_BASE}/contacts/search/duplicate?locationId=${locationId}&email=${encodeURIComponent(email)}`,
        { headers, next: { revalidate: 0 } }
      )

      if (!searchRes.ok) {
        const errorBody = await searchRes.text()
        throw new Error(`Search failed HTTP ${searchRes.status}: ${errorBody}`)
      }

      const data = await searchRes.json()
      if (data.contact?.id) {
        console.log(`[GHL][contact-search] Found existing: ${data.contact.id}`)
        return data.contact.id as string
      }

      return null
    }

    const existingContactId = await retryRequest(searchFn, 2, 800)
    if (existingContactId) return existingContactId
  } catch (error) {
    console.warn('[GHL][contact-search] Failed, proceeding to create:', error)
  }

  // 2. Parser nom si fourni
  const nameParts = (visitorName?.trim() ?? '').split(' ')
  const firstName = nameParts[0] || 'Visiteur'
  const lastName = nameParts.slice(1).join(' ') || 'Web'

  // 3. Créer nouveau contact
  const createFn = async () => {
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

      // Si duplicata détecté, extraire l'ID de l'erreur
      if (createRes.status === 400 && errorBody.includes('contactId')) {
        try {
          const errorData = JSON.parse(errorBody)
          if (errorData.meta?.contactId) {
            console.log(`[GHL][contact-create] Duplicate found: ${errorData.meta.contactId}`)
            return errorData.meta.contactId as string
          }
        } catch {
          // Continuer avec l'erreur normale
        }
      }

      throw new Error(`Contact creation failed HTTP ${createRes.status}: ${errorBody}`)
    }

    const contact = await createRes.json()
    const id = contact.contact?.id ?? contact.id
    if (!id) throw new Error('Contact creation returned no ID')

    console.log(`[GHL][contact-create] New contact: ${id}`)
    return id as string
  }

  return await retryRequest(createFn, 2, 800)
}

/**
 * Crée ou retrouve une conversation GHL pour le contact
 */
async function getOrCreateConversation(contactId: string): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('NEXT_PUBLIC_GHL_LOCATION_ID')

  const searchRes = await fetch(
    `${GHL_API_BASE}/conversations/search?locationId=${locationId}&contactId=${contactId}`,
    { headers }
  )

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.conversations?.length > 0) return data.conversations[0].id as string
  } else {
    await logGhlError('conversation-search', searchRes)
  }

  // Créer une nouvelle conversation
  const createRes = await fetch(`${GHL_API_BASE}/conversations/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId,
      contactId,
      type: 'TYPE_LIVE_CHAT',
    }),
  })

  if (!createRes.ok) {
    await logGhlError('conversation-create', createRes)
    throw new Error(`GHL conversation creation failed: HTTP ${createRes.status}`)
  }

  const conv = await createRes.json()
  const id = conv.conversation?.id ?? conv.id
  if (!id) throw new Error('GHL conversation creation returned no ID')
  return id as string
}

/**
 * Envoie un message inbound et attend la réponse Auto-pilot de l'IA - OPTIMISÉ
 * Timeout augmenté à 10s avec intervalles de 1.2s
 */
async function sendAndAwaitReply(
  contactId: string,
  conversationId: string,
  message: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('NEXT_PUBLIC_GHL_LOCATION_ID')

  // 1. Snapshot des messages avant envoi
  let lastMsgCount = 0
  try {
    const snapRes = await fetch(
      `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=10`,
      { headers, next: { revalidate: 0 } }
    )
    if (snapRes.ok) {
      const snap = await snapRes.json()
      lastMsgCount = snap.messages?.length ?? 0
    }
  } catch {
    // snapshot non critique
  }

  // 2. Envoyer le message inbound avec retry
  const sendMessageFn = async () => {
    const inboundRes = await fetch(`${GHL_API_BASE}/conversations/messages/inbound`, {
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

    if (!inboundRes.ok) {
      const errorBody = await inboundRes.text()
      throw new Error(`Inbound message failed HTTP ${inboundRes.status}: ${errorBody}`)
    }

    return inboundRes
  }

  await retryRequest(sendMessageFn, 2, 800)
  console.log('[GHL][message-inbound] Message envoyé, attente réponse AI...')

  // 3. Polling optimisé — max 10s avec intervalles de 1.2s (8-9 tentatives)
  const POLL_INTERVAL_MS = 1200
  const MAX_POLLS = 8

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await wait(POLL_INTERVAL_MS)

    try {
      const msgsRes = await fetch(
        `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=20`,
        { headers, next: { revalidate: 0 } }
      )

      if (!msgsRes.ok) {
        console.warn(`[GHL][poll-${attempt}] HTTP ${msgsRes.status}, retry...`)
        continue
      }

      const msgsData = await msgsRes.json()
      const messages: Array<{
        direction: string
        body?: string
        text?: string
        dateAdded?: string
      }> = msgsData.messages ?? []

      // Chercher nouveau message outbound (le plus récent)
      if (messages.length > lastMsgCount) {
        const newMessages = messages.slice(0, messages.length - lastMsgCount)
        const botMsg = newMessages.find((m) => m.direction === 'outbound')

        if (botMsg) {
          const reply = botMsg.body ?? botMsg.text ?? ''
          if (reply.trim()) {
            console.log(`[GHL][poll-${attempt}] Réponse AI reçue (${reply.length} chars)`)
            return reply
          }
        }
      }
    } catch (error) {
      console.warn(`[GHL][poll-${attempt}] Error:`, error)
    }
  }

  // 4. Timeout gracieux
  console.warn('[GHL][timeout] Pas de réponse AI après 10s')
  return "Je traite votre demande. N'hésitez pas à reformuler si besoin, ou contactez-nous directement."
}

// ── Handler POST ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Guard rapide sur les variables critiques
  if (!process.env.GHL_API_TOKEN) {
    console.error(
      '[Djamiyah Chat API] FATAL: GHL_API_TOKEN is not set in Vercel environment variables'
    )
    return NextResponse.json(
      {
        reply:
          'Le service de chat est en cours de configuration. Réessayez dans quelques instants.',
      },
      { status: 200 }
    )
  }
  if (
    !process.env.NEXT_PUBLIC_GHL_LOCATION_ID ||
    !process.env.NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID
  ) {
    console.error('[Djamiyah Chat API] FATAL: GHL Location ID or Agent ID missing')
    return NextResponse.json(
      {
        reply:
          'Le service de chat est en cours de configuration. Réessayez dans quelques instants.',
      },
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

    // Identifiant de session persisté via cookie HttpOnly
    const sessionId =
      req.cookies.get('djamiyah_session')?.value ?? Math.random().toString(36).slice(2, 10)

    // Contact GHL — nommé si nom+email fournis (lead qualifié), anonyme sinon
    const contactId =
      existingContactId ?? (await getOrCreateContact(sessionId, visitorName, visitorEmail))

    // Conversation GHL (réutilisée pour le fil de discussion)
    const conversationId = await getOrCreateConversation(contactId)

    // Envoyer le message et attendre la réponse Auto-pilot
    const reply = await sendAndAwaitReply(contactId, conversationId, message)

    const response = NextResponse.json({ reply, contactId })

    // Persistance de session (7 jours)
    response.cookies.set('djamiyah_session', sessionId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Djamiyah Chat API]', error instanceof Error ? error.message : error)
    return NextResponse.json(
      {
        reply:
          'Service temporairement indisponible. Contactez-nous directement au +224 xxx xxx xxx.',
      },
      { status: 200 } // 200 : le widget affiche le message d'erreur sans crash
    )
  }
}
