/**
 * API Route — Proxy sécurisé vers GHL Conversation AI
 * Groupe Djamiyah · La Maison Blanche de Coyah
 *
 * Cette route :
 *  1. Reçoit le message du widget React
 *  2. Crée/retrouve un contact GHL anonyme (session-based)
 *  3. Envoie le message à l'agent IA Salematou (connecté à la base de connaissances GHL)
 *  4. Retourne la réponse au widget
 *
 * Configuration requise dans GHL :
 *  - Agent AI configuré avec base de connaissances (Knowledge Base)
 *  - Documents importés dans la base de connaissances
 *  - Agent ID : process.env.NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID
 */

import { NextRequest, NextResponse } from 'next/server'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-04-15'
const GHL_API_TOKEN = process.env.GHL_API_TOKEN!
const GHL_LOCATION_ID = process.env.NEXT_PUBLIC_GHL_LOCATION_ID!
const GHL_AGENT_ID = process.env.NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID!

const ghlHeaders = {
  Authorization: `Bearer ${GHL_API_TOKEN}`,
  'Content-Type': 'application/json',
  Version: GHL_API_VERSION,
}

/**
 * Crée un contact anonyme dans GHL pour la session web
 */
async function getOrCreateContact(sessionId: string): Promise<string> {
  // Chercher contact existant par email de session
  const email = `widget-${sessionId}@djamiyah-chatbot.web`

  const searchRes = await fetch(
    `${GHL_API_BASE}/contacts/search?locationId=${GHL_LOCATION_ID}&query=${encodeURIComponent(email)}`,
    { headers: ghlHeaders }
  )

  if (searchRes.ok) {
    const data = await searchRes.json()
    if (data.contacts?.length > 0) return data.contacts[0].id
  }

  // Créer nouveau contact
  const createRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers: ghlHeaders,
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      email,
      firstName: 'Visiteur',
      lastName: 'Web',
      source: 'djamiyah-widget',
      tags: ['widget-web', 'chatbot'],
    }),
  })

  const contact = await createRes.json()
  return contact.contact?.id || contact.id
}

/**
 * Envoie un message à l'agent Conversation AI GHL
 */
async function sendToConversationAI(contactId: string, message: string): Promise<string> {
  // 1. Obtenir ou créer une conversation
  const convRes = await fetch(
    `${GHL_API_BASE}/conversations/search?locationId=${GHL_LOCATION_ID}&contactId=${contactId}`,
    { headers: ghlHeaders }
  )

  let conversationId: string

  if (convRes.ok) {
    const convData = await convRes.json()
    if (convData.conversations?.length > 0) {
      conversationId = convData.conversations[0].id
    } else {
      // Créer une conversation
      const newConv = await fetch(`${GHL_API_BASE}/conversations/`, {
        method: 'POST',
        headers: ghlHeaders,
        body: JSON.stringify({
          locationId: GHL_LOCATION_ID,
          contactId,
          type: 'TYPE_LIVE_CHAT',
        }),
      })
      const convJson = await newConv.json()
      conversationId = convJson.conversation?.id || convJson.id
    }
  } else {
    throw new Error('Cannot create conversation')
  }

  // 2. Envoyer le message entrant (inbound = du visiteur)
  await fetch(`${GHL_API_BASE}/conversations/messages/inbound`, {
    method: 'POST',
    headers: ghlHeaders,
    body: JSON.stringify({
      type: 'Live_Chat',
      locationId: GHL_LOCATION_ID,
      contactId,
      conversationId,
      message,
    }),
  })

  // 3. Déclencher la réponse du bot via l'agent IA
  const botRes = await fetch(`${GHL_API_BASE}/conversations/ai/generate-reply`, {
    method: 'POST',
    headers: ghlHeaders,
    body: JSON.stringify({
      locationId: GHL_LOCATION_ID,
      contactId,
      conversationId,
      agentId: GHL_AGENT_ID,
      message,
    }),
  })

  if (!botRes.ok) {
    // Fallback: lire le dernier message sortant
    const msgsRes = await fetch(
      `${GHL_API_BASE}/conversations/${conversationId}/messages?limit=5`,
      { headers: ghlHeaders }
    )
    const msgsData = await msgsRes.json()
    const outbound = msgsData.messages?.filter(
      (m: { direction: string }) => m.direction === 'outbound'
    )
    return outbound?.[0]?.body || 'Je traite votre demande, veuillez patienter.'
  }

  const botData = await botRes.json()
  return botData.reply || botData.message || botData.body || 'Merci pour votre message.'
}

// ── Handler POST ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { message, contactId: existingContactId } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message vide' }, { status: 400 })
    }

    // Identifiant de session (cookie ou généré)
    const sessionId =
      req.cookies.get('djamiyah_session')?.value || Math.random().toString(36).slice(2, 10)

    // Obtenir/créer le contact GHL
    const contactId = existingContactId || (await getOrCreateContact(sessionId))

    // Envoyer à l'IA et obtenir la réponse
    const reply = await sendToConversationAI(contactId, message)

    const response = NextResponse.json({ reply, contactId })

    // Persister la session
    response.cookies.set('djamiyah_session', sessionId, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      sameSite: 'lax',
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[Djamiyah Chat API]', error)
    return NextResponse.json(
      { reply: 'Service temporairement indisponible. Contactez-nous au +224 xxx xxx xxx.' },
      { status: 200 } // 200 pour que le widget affiche l'erreur gracieusement
    )
  }
}
