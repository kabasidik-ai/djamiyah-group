// ============================================================
// GET /api/ghl/agents
// Liste les Conversation AI Agents (Bots) pour la location
// Usage : récupérer GHL_CONVERSATION_AI_AGENT_ID
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { listBots } from '@/lib/ghl/client'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

interface AgentsApiResponse {
  success: boolean
  agents: Array<{
    id: string
    name: string
    status?: string
    model?: string
    locationId: string
  }>
  configured?: {
    agentId: string
    locationId: string
  }
  hint: string
  error?: string
}

export async function GET(req: NextRequest): Promise<NextResponse<AgentsApiResponse>> {
  const { searchParams } = req.nextUrl
  const locationId = searchParams.get('locationId') ?? process.env.GHL_LOCATION_ID

  if (!locationId) {
    return NextResponse.json(
      {
        success: false,
        agents: [],
        hint: 'Fournissez ?locationId= ou définissez GHL_LOCATION_ID dans Vercel',
        error: 'locationId manquant',
      },
      { status: 400 }
    )
  }

  try {
    const bots = await listBots(locationId)

    const agents = bots.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      model: b.model,
      locationId: b.locationId,
    }))

    const configuredAgentId = process.env.GHL_CONVERSATION_AI_AGENT_ID
    const configured = configuredAgentId
      ? { agentId: configuredAgentId, locationId }
      : undefined

    logger.info('Agents GHL listés', { locationId, count: agents.length })

    return NextResponse.json({
      success: true,
      agents,
      configured,
      hint:
        agents.length > 0
          ? `Copiez l'ID du bot souhaité → ajoutez GHL_CONVERSATION_AI_AGENT_ID dans Vercel`
          : 'Aucun bot trouvé. Créez un Conversation AI Bot dans GHL > Settings > Bots',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    logger.error('Erreur listing agents GHL', { error: message })

    return NextResponse.json(
      {
        success: false,
        agents: [],
        hint: 'Vérifiez GHL_LOCATION_ID et la configuration OAuth',
        error: process.env.NODE_ENV === 'development' ? message : 'Erreur serveur',
      },
      { status: 500 }
    )
  }
}
