// ============================================================
// POST /api/webhook — Réception des webhooks GHL
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import type { GHLWebhookPayload } from '@/lib/ghl/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Lire le body une seule fois (nécessaire pour la vérification de signature)
  const rawBody = await req.text()

  const signature = req.headers.get('x-ghl-signature')
  const webhookSecret = process.env.GHL_WEBHOOK_SECRET

  if (webhookSecret && signature) {
    const isValid = await verifySignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      logger.warn('Webhook GHL : signature invalide')
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }
  }

  let payload: GHLWebhookPayload
  try {
    payload = JSON.parse(rawBody) as GHLWebhookPayload
  } catch {
    logger.error('Webhook GHL : payload JSON invalide')
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const { type, locationId, contactId, conversationId, message } = payload
  logger.info('Webhook GHL recu', { type, locationId, contactId, conversationId })

  switch (type) {
    case 'InboundMessage':
      logger.info('Message entrant GHL', {
        contactId,
        conversationId,
        messagePreview: message?.slice(0, 80),
      })
      break

    case 'OutboundMessage':
      logger.debug('Reponse Concierge IA', {
        conversationId,
        messagePreview: message?.slice(0, 80),
      })
      break

    case 'ContactCreate':
      logger.info('Nouveau contact GHL', { contactId })
      break

    case 'ConversationUnread':
      logger.info('Conversation non lue', { conversationId, contactId })
      break

    default:
      logger.debug('Evenement GHL non gere', { type })
  }

  return NextResponse.json({ received: true, type })
}

// Vérifie la signature HMAC-SHA256 envoyée par GHL
async function verifySignature(body: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const bodyData = encoder.encode(body)

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    // Calculer la signature attendue et comparer en hex
    const sigBuffer = await crypto.subtle.sign('HMAC', key, bodyData)
    const sigArray = Array.from(new Uint8Array(sigBuffer))
    const expectedSig = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    return expectedSig === signature.toLowerCase()
  } catch {
    return false
  }
}
