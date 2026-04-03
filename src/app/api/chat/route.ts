// ============================================================
// POST /api/chat — Pont principal vers le Concierge IA GHL
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import {
  findOrCreateContact,
  findOrCreateConversation,
  sendMessage,
  waitForBotReply,
} from '@/lib/ghl/client'
import { logger } from '@/lib/utils/logger'
import type { ChatRequest, ChatResponse } from '@/lib/ghl/types'

const FALLBACK_MESSAGE =
  'Notre Concierge IA est momentanément indisponible. Contactez-nous directement sur WhatsApp pour une réponse immédiate.'

export const runtime = 'nodejs'
export const maxDuration = 10

export async function POST(req: NextRequest): Promise<NextResponse<ChatResponse>> {
  const startTime = Date.now()

  let body: ChatRequest
  try {
    body = (await req.json()) as ChatRequest
  } catch {
    return NextResponse.json(
      { success: false, reply: 'Requête invalide.', contactId: '', conversationId: '' },
      { status: 400 }
    )
  }

  const { message, contactId: existingContactId, channel = 'live_chat', metadata = {} } = body

  if (!message?.trim()) {
    return NextResponse.json(
      {
        success: false,
        reply: 'Le message ne peut pas être vide.',
        contactId: '',
        conversationId: '',
      },
      { status: 400 }
    )
  }

  logger.info('Nouveau message entrant', { channel, messageLength: message.length })

  try {
    // Contact GHL
    const contact = existingContactId
      ? { id: existingContactId }
      : await findOrCreateContact({
          firstName: metadata.firstName,
          lastName: metadata.lastName,
          email: metadata.email,
          phone: metadata.phone,
          source: `Concierge IA — ${channel}`,
          tags: ['concierge-ia', channel],
        })

    logger.debug('Contact GHL résolu', { contactId: contact.id })

    // Conversation GHL
    const conversation = await findOrCreateConversation(contact.id)
    logger.debug('Conversation GHL résolue', { conversationId: conversation.id })

    // Envoi du message utilisateur
    const sentAt = Date.now()
    await sendMessage({
      type: channelToGHLType(channel),
      message: message.trim(),
      conversationId: conversation.id,
    })

    logger.info('Message envoyé à GHL', { conversationId: conversation.id })

    // Attente de la réponse du Concierge IA
    const botReply = await waitForBotReply(conversation.id, sentAt, 6000, 700)

    logger.info('Réponse obtenue', { elapsed: Date.now() - startTime, fallback: !botReply })

    if (botReply) {
      return NextResponse.json({
        success: true,
        reply: botReply,
        contactId: contact.id,
        conversationId: conversation.id,
      })
    }

    return NextResponse.json({
      success: true,
      reply: FALLBACK_MESSAGE,
      contactId: contact.id,
      conversationId: conversation.id,
      fallback: true,
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur interne'
    logger.error('Erreur dans /api/chat', { error: msg })

    return NextResponse.json(
      {
        success: false,
        reply: FALLBACK_MESSAGE,
        contactId: '',
        conversationId: '',
        fallback: true,
        error: process.env.NODE_ENV === 'development' ? msg : undefined,
      },
      { status: 500 }
    )
  }
}

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
