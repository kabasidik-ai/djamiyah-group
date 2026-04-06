/**
 * API Route — Proxy sécurisé vers GHL Conversation AI
 * Groupe Djamiyah · La Maison Blanche de Coyah
 *
 * Flow :
 *  1. Reçoit le message du widget React
 *  2. Crée/retrouve un contact GHL anonyme (session-based)
 *  3. Crée/retrouve une conversation GHL
 *  4. Envoie le message inbound à GHL
 *  5. Attend la réponse Auto-pilot de l'IA (polling 3s max)
 *  6. Retourne la réponse au widget
 *
 * Variables requises (Vercel → Settings → Environment Variables) :
 *  GHL_API_TOKEN                          — API key privée GHL (jamais NEXT_PUBLIC_)
 *  NEXT_PUBLIC_GHL_LOCATION_ID            — Location ID du sous-compte Maison Blanche
 *  NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID — Agent ID Salematou
 */

import { NextRequest, NextResponse } from 'next/server'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-04-15'

// ── Guard : variables obligatoires ───────────────────────────
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
 * Crée ou retrouve un contact anonyme GHL pour la session web
 */
async function getOrCreateContact(sessionId: string): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('NEXT_PUBLIC_GHL_LOCATION_ID')
  const email = `widget-${sessionId}@djamiyah-chatbot.web`

  // 1. Chercher contact existant
  const searchRes = await fetch(
    `${GHL_API_BASE}/contacts/search?locationId=${locationId}&query=${encodeURIComponent(email)}`,
    { headers }
  )

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.contacts?.length > 0) return data.contacts[0].id as string
  } else {
    await logGhlError('contact-search', searchRes)
  }

  // 2. Créer un nouveau contact
  const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      locationId,
      email,
      firstName: 'Visiteur',
      lastName: 'Web',
      source: 'djamiyah-widget',
      tags: ['widget-web', 'chatbot'],
    }),
  })

  if (!createRes.ok) {
    await logGhlError('contact-create', createRes)
    throw new Error(`GHL contact creation failed: HTTP ${createRes.status}`)
  }

  const contact = await createRes.json()
  const id = contact.contact?.id ?? contact.id
  if (!id) throw new Error('GHL contact creation returned no ID')
  return id as string
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
 * Envoie un message inbound et attend la réponse Auto-pilot de l'IA.
 *
 * GHL Conversation AI en mode Auto-pilot répond automatiquement aux
 * messages inbound — il n'existe pas d'endpoint public "generate-reply".
 * On poll les messages sortants pendant 8s max.
 */
async function sendAndAwaitReply(
  contactId: string,
  conversationId: string,
  message: string
): Promise<string> {
  const headers = buildHeaders()
  const locationId = getEnvOrThrow('NEXT_PUBLIC_GHL_LOCATION_ID')

  // 1. Snapshot des messages avant envoi (pour ne lire que les nouveaux)
  let lastMsgCount = 0
  try {
    const snapRes = await fetch(
      `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=10`,
      { headers }
    )
    if (snapRes.ok) {
      const snap = await snapRes.json()
      lastMsgCount = snap.messages?.length ?? 0
    }
  } catch {
    // snapshot non critique
  }

  // 2. Envoyer le message inbound (du visiteur vers GHL)
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
    await logGhlError('message-inbound', inboundRes)
    throw new Error(`GHL inbound message failed: HTTP ${inboundRes.status}`)
  }

  // 3. Polling — attendre la réponse Auto-pilot (max 8s, intervalles 1.5s)
  const POLL_INTERVAL_MS = 1500
  const MAX_POLLS = 5

  for (let attempt = 0; attempt < MAX_POLLS; attempt++) {
    await wait(POLL_INTERVAL_MS)

    const msgsRes = await fetch(
      `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=15`,
      { headers }
    )

    if (!msgsRes.ok) {
      await logGhlError(`poll-messages-${attempt}`, msgsRes)
      continue
    }

    const msgsData = await msgsRes.json()
    const messages: Array<{ direction: string; body?: string; text?: string }> =
      msgsData.messages ?? []

    // Chercher un nouveau message outbound (réponse du bot)
    if (messages.length > lastMsgCount) {
      const newMessages = messages.slice(0, messages.length - lastMsgCount)
      const botMsg = newMessages.find((m) => m.direction === 'outbound')
      if (botMsg) {
        const reply = botMsg.body ?? botMsg.text ?? ''
        if (reply.trim()) return reply
      }
    }
  }

  // 4. Timeout — retourner un message de patience
  return "Je traite votre demande. Si vous n'obtenez pas de réponse rapidement, contactez-nous directement."
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
    const { message, contactId: existingContactId } = body as {
      message?: string
      contactId?: string
    }

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    // Identifiant de session persisté via cookie HttpOnly
    const sessionId =
      req.cookies.get('djamiyah_session')?.value ?? Math.random().toString(36).slice(2, 10)

    // Contact GHL (réutilisé entre messages de la même session)
    const contactId = existingContactId ?? (await getOrCreateContact(sessionId))

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
