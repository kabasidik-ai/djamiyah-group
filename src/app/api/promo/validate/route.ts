import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ valid: false, error: 'Code promo requis' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('promo_codes')
      .select('code, discount_percent, is_active, expires_at')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !data) {
      return NextResponse.json({ valid: false, error: 'Code promo invalide' }, { status: 404 })
    }

    if (!data.is_active) {
      return NextResponse.json(
        { valid: false, error: 'Ce code promo est désactivé' },
        { status: 400 }
      )
    }

    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Ce code promo a expiré' }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      discount_percent: data.discount_percent,
      code: data.code,
    })
  } catch (err) {
    console.error('Promo validation error:', err)
    return NextResponse.json(
      { valid: false, error: 'Erreur lors de la validation' },
      { status: 500 }
    )
  }
}
