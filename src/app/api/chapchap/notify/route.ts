/**
 * POST /api/chapchap/notify
 *
 * Webhook entrant ChapChap — déclenché par le gateway après chaque événement paiement.
 * Vérifie la signature HMAC SHA-256, met à jour le statut de réservation dans Supabase.
 *
 * Sécurité :
 * - HMAC vérification avant tout traitement (verifyChapchapHmac)
 * - Rate limiting par IP (checkRateLimit)
 * - Pas de corps de réponse détaillé en cas d'erreur (pas d'info-fuite)
 */

import { NextResponse } from 'next/server'
import { verifyChapchapHmac, checkRateLimit, getClientIp, secureJson } from '@/lib/chapchap'
import { createServiceRoleClient } from '@/lib/supabase'

type ChapChapPaymentStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'

type ChapChapNotifyPayload = {
  transaction_id: string
  order_id: string // reservation ID dans notre système
  status: ChapChapPaymentStatus
  amount: number
  currency: string
  payment_method?: string
  timestamp?: string
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://djamiyahgroup.com'

export async function POST(request: Request) {
  // 1. Rate limiting par IP
  const ip = getClientIp(request)
  const { allowed } = checkRateLimit('chapchap-notify', ip, 60, 60 * 1000) // 60 req/min
  if (!allowed) {
    return secureJson({ message: 'Too many requests' }, SITE_URL, { status: 429 })
  }

  // 2. Récupérer le body brut pour la vérification HMAC
  let rawBody: string
  try {
    rawBody = await request.text()
  } catch {
    return secureJson({ message: 'Invalid request body' }, SITE_URL, { status: 400 })
  }

  // 3. Vérifier la signature HMAC
  const secret = process.env.CHAPCHAP_HMAC_SECRET
  if (!secret) {
    console.error('[chapchap/notify] CHAPCHAP_HMAC_SECRET manquant')
    return secureJson({ message: 'Configuration error' }, SITE_URL, { status: 500 })
  }

  const signature =
    request.headers.get('X-CCP-Signature') ??
    request.headers.get('CCP-Signature') ??
    request.headers.get('X-Signature') ??
    ''

  if (!verifyChapchapHmac(rawBody, signature, secret)) {
    console.warn('[chapchap/notify] Signature HMAC invalide — IP:', ip)
    return secureJson({ message: 'Unauthorized' }, SITE_URL, { status: 401 })
  }

  // 4. Parser le payload
  let payload: ChapChapNotifyPayload
  try {
    payload = JSON.parse(rawBody) as ChapChapNotifyPayload
  } catch {
    return secureJson({ message: 'Invalid JSON payload' }, SITE_URL, { status: 400 })
  }

  const { transaction_id, order_id, status, payment_method } = payload

  if (!transaction_id || !order_id || !status) {
    return secureJson({ message: 'Missing required fields' }, SITE_URL, { status: 400 })
  }

  // 5. Mapper le statut ChapChap vers notre enum Supabase
  const paymentStatusMap: Record<
    ChapChapPaymentStatus,
    'pending' | 'paid' | 'failed' | 'refunded'
  > = {
    SUCCESS: 'paid',
    FAILED: 'failed',
    PENDING: 'pending',
    CANCELLED: 'failed',
  }

  const newPaymentStatus = paymentStatusMap[status] ?? 'pending'

  // 6. Mettre à jour la réservation dans Supabase
  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('reservations')
    .update({
      payment_status: newPaymentStatus,
      chapchap_transaction_id: transaction_id,
      ...(payment_method
        ? { payment_method: payment_method as 'orange_money' | 'mtn_momo' | 'card' | 'cash' }
        : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  if (error) {
    console.error('[chapchap/notify] Erreur Supabase update:', error.message, 'order_id:', order_id)
    return secureJson({ message: 'Database error' }, SITE_URL, { status: 500 })
  }

  console.info(
    `[chapchap/notify] Paiement ${status} — reservation: ${order_id} — tx: ${transaction_id}`
  )

  return secureJson({ received: true }, SITE_URL, { status: 200 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-CCP-Signature, CCP-Signature, X-Signature',
    },
  })
}
