import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { sendMessage } from '@/lib/ghl/client'

export const runtime = 'nodejs'

const sendMessageSchema = z.object({
  conversationId: z.string().trim().min(1, 'conversationId requis').max(200),
  message: z.string().trim().min(1, 'Message vide').max(4000, 'Message trop long (4000 max)'),
  type: z.string().trim().max(50).optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // ── Validation Zod ──
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  const parsed = sendMessageSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Données invalides' },
      { status: 400 }
    )
  }

  const body = parsed.data

  try {
    const result = await sendMessage({
      conversationId: body.conversationId,
      message: body.message,
      type: (body.type as 'Chat') ?? 'Chat',
    })

    return NextResponse.json({ success: true, messageId: result.messageId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[admin/messages/send]', message)
    return NextResponse.json(
      { error: 'Impossible d\'envoyer le message' },
      { status: 500 }
    )
  }
}
