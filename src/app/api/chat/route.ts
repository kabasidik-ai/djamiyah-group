// ============================================================
// POST /api/chat — Concierge IA Salematou — Groupe Djamiyah
// Priorité : Conversation AI Public API → polling fallback
// Zéro `any` | TypeScript strict | Compatible Vercel Node
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  findOrCreateContact,
  findOrCreateConversation,
  sendMessage,
  getAIResponse,
  waitForBotReply,
} from '@/lib/ghl/client'
import { logger } from '@/lib/utils/logger'
import type { ChatRequest, ChatResponse } from '@/lib/ghl/types'

export const runtime = 'nodejs'
export const maxDuration = 15

// ── Persona Salematou ─────────────────────────────────────────

const PERSONA = {
  name: 'Salematou',
  role: 'Concierge — Groupe Djamiyah',
  hotel: 'Hôtel Maison Blanche, Coyah',
} as const

// Message de service — jamais un "fallback IA hardcodé"

const SERVICE_MESSAGE =
  `Bonjour, je suis ${PERSONA.name}, concierge du ${PERSONA.hotel}. ` +
  `Un conseiller prendra contact avec vous très prochainement. Merci de votre confiance.`

// ── Résolution de la config GHL ───────────────────────────────

function resolveGHLConfig(): { locationId: string; agentId: string | null } {
  const locationId = process.env.GHL_LOCATION_ID
  if (!locationId) {
    throw new Error(
      'GHL_LOCATION_ID non défini. ' +
      'Exécutez GET /api/ghl/locations pour identifier votre ID.'
    )
  }
  const agentId = process.env.GHL_CONVERSATION_AI_AGENT_ID ?? null
  return { locationId, agentId }
}

// ── Handler POST ──────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  const startTime = Date.now()

  // Validation du body
  let body: ChatRequest
  try {
    body = (await req.json()) as ChatRequest
  } catch {
    return NextResponse.json(
      { success: false, reply: 'Requête invalide.', contactId: '', conversationId: '' },
      { status: 400 }
    )
  }

  const {
    message,
    contactId: existingContactId,
    conversationId: existingConversationId,
    channel = 'live_chat',
    metadata = {},
  } = body

  if (!message?.trim()) {
    return NextResponse.json(
      { success: false, reply: 'Le message ne peut pas être vide.', contactId: '', conversationId: '' },
      { status: 400 }
    )
  }

  logger.info('Nouveau message Concierge IA', {
    channel,
    messageLength: message.trim().length,
    hasContactId: Boolean(existingContactId),
  })

  try {
    const { locationId, agentId } = resolveGHLConfig()

    // ── 1. Résolution du contact ─────────────────────────────
    const contact = existingContactId
      ? { id: existingContactId }
      : await findOrCreateContact(
          {
            firstName: metadata.firstName,
            lastName: metadata.lastName,
            email: metadata.email,
            phone: metadata.phone,
            source: `${PERSONA.name} — Widget ${channel}`,
            tags: ['concierge-ia', `channel:${channel}`],
          },
          locationId
        )

    logger.debug('Contact résolu', { contactId: contact.id })

    // ── 2. Résolution de la conversation ─────────────────────
    const conversation = existingConversationId
      ? { id: existingConversationId }
      : await findOrCreateConversation(contact.id, locationId)

    logger.debug('Conversation résolue', { conversationId: conversation.id })

    // ── 3. Tentative Conversation AI Public API ───────────────
    if (agentId) {
      logger.info('Tentative Conversation AI API', { agentId })

      const aiResult = await getAIResponse({
        locationId,
        conversationId: conversation.id,
        agentId,
        message: message.trim(),
      })

      if (aiResult?.success && aiResult.reply) {
        logger.info('Réponse Conversation AI reçue', {
          elapsed: Date.now() - startTime,
          source: 'conversation-ai-api',
        })

        return NextResponse.json({
          success: true,
          reply: aiResult.reply,
          contactId: contact.id,
          conversationId: conversation.id,
          sessionId: aiResult.sessionId,
        })
      }

      logger.info('Conversation AI sans réponse directe, passage en polling')
    } else {
      logger.info('GHL_CONVERSATION_AI_AGENT_ID non défini, mode polling seul', {
        hint: 'Exécutez GET /api/ghl/agents pour obtenir votre agentId',
      })
    }

    // ── 4. Envoi du message dans la conversation GHL ──────────
    const sentAt = Date.now()
    await sendMessage(
      {
        type: channelToGHLType(channel),
        message: message.trim(),
        conversationId: conversation.id,
      },
      locationId
    )

    logger.info('Message envoyé, attente réponse bot (polling)')

    // ── 5. Polling pour la réponse du bot GHL ────────────────
    const botReply = await waitForBotReply(
      conversation.id,
      sentAt,
      8000,
      800,
      locationId
    )

    logger.info('Polling terminé', {
      elapsed: Date.now() - startTime,
      hasReply: Boolean(botReply),
    })

    if (botReply) {
      return NextResponse.json({
        success: true,
        reply: botReply,
        contactId: contact.id,
        conversationId: conversation.id,
      })
    }

    // ── 6. Message de service (bot configuré côté GHL — pas de réponse dans les délais)
    return NextResponse.json({
      success: true,
      reply: SERVICE_MESSAGE,
      contactId: contact.id,
      conversationId: conversation.id,
      fallback: true,
    })
  } catch (err) {
    const message_ = err instanceof Error ? err.message : 'Erreur interne'
    logger.error('Erreur /api/chat', { error: message_ })

    return NextResponse.json(
      {
        success: false,
        reply: SERVICE_MESSAGE,
        contactId: '',
        conversationId: '',
        fallback: true,
        error: process.env.NODE_ENV === 'development' ? message_ : undefined,
      },
      { status: 500 }
    )
  }
}

// ── Helpers ───────────────────────────────────────────────────

function channelToGHLType(
  channel: ChatRequest['channel']
): 'Chat' | 'Facebook' | 'Instagram' | 'Live_Chat' {
  switch (channel) {
    case 'facebook':
      return 'Facebook'
    case 'instagram':
      return 'Instagram'
    case 'live_chat':
    default:
      return 'Live_Chat'
  }
}
