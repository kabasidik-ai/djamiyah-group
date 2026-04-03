// ============================================================
// POST /api/webhook — Réception des webhooks GHL
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/utils/logger'
import type { GHLWebhookPayload } from '@/lib/ghl/types'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get('x-ghl-signature')
  const webhookSecret = process.env.GHL_WEBHOOK_SECRET

  if (webhookSecret && signature) {
    const isValid = await verifySignature(req.clone(), signature, webhookSecret)
    if (!isValid) {
      logger.warn('Webhook GHL : signature invalide')
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }
  }

  let payload: GHLWebhookPayload
  try {
    payload = (await req.json()) as GHLWebhookPayload
  } catch {
    logger.error('Webhook GHL : payload JSON invalide')
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const { type, locationId, contactId, conversationId, message } = payload
  logger.info('Webhook GHL reçu', { type, locationId, contactId, conversationId })

  switch (type) {
    case 'InboundMessage':
      logger.info('Message entrant GHL', {
        contactId,
        conversationId,
        messagePreview: message?.slice(0, 80),
      })
      break

    case 'OutboundMessage':
      logger.debug('Réponse Concierge IA', {
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
      logger.debug('Événement GHL non géré', { type })
  }

  return NextResponse.json({ received: true, type })
}

async function verifySignature(
  req: NextRequest,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const body = await req.text()
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigBytes = hexToBytes(signature)
    return crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(body))
  } catch {
    return false
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}
