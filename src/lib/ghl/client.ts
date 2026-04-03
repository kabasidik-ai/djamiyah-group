// ============================================================
// GHL API Client — Groupe Djamiyah
// OAuth prioritaire, fallback GHL_PRIVATE_TOKEN (migration)
// ============================================================

import { resolveAccessToken } from './token-store'
import type {
  GHLContact,
  GHLContactCreate,
  GHLContactSearchResponse,
  GHLConversation,
  GHLConversationCreate,
  GHLMessage,
  GHLMessagesResponse,
  GHLSearchConversationsResponse,
  GHLSendMessagePayload,
  GHLBotsResponse,
  GHLBot,
  GHLLocation,
  GHLLocationsResponse,
  GHLAIResponsePayload,
  GHLAIResponseResult,
} from './types'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const API_VERSION = '2021-07-28'
const AI_API_VERSION = '2021-04-15'

// ── Erreur typée ──────────────────────────────────────────────

export class GHLApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly body: string
  ) {
    super(`GHL API ${statusCode} sur ${endpoint}: ${body}`)
    this.name = 'GHLApiError'
  }
}

// ── Fetch helper central ──────────────────────────────────────

async function ghlFetch<T>(
  path: string,
  options: RequestInit & { version?: string; locationId?: string } = {}
): Promise<T> {
  const { version = API_VERSION, locationId, ...fetchOptions } = options

  const token = await resolveAccessToken(locationId)
  const url = `${GHL_BASE_URL}${path}`

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: version,
      ...(fetchOptions.headers ?? {}),
    },
    signal: fetchOptions.signal ?? AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    throw new GHLApiError(response.status, path, errorText)
  }

  return response.json() as Promise<T>
}

// ── Résolution de locationId ──────────────────────────────────

function resolveLocationId(override?: string): string {
  const id = override ?? process.env.GHL_LOCATION_ID
  if (!id) throw new Error('GHL_LOCATION_ID introuvable. Définissez la variable d\'environnement.')
  return id
}

// ── LOCATIONS ─────────────────────────────────────────────────

export async function listLocations(): Promise<GHLLocation[]> {
  const companyId = process.env.GHL_COMPANY_ID
  if (!companyId) throw new Error('GHL_COMPANY_ID requis pour lister les locations')

  const params = new URLSearchParams({ companyId })
  const data = await ghlFetch<GHLLocationsResponse>(`/locations/search?${params.toString()}`)
  return data.locations ?? []
}

export async function getLocation(locationId?: string): Promise<GHLLocation> {
  const id = resolveLocationId(locationId)
  const data = await ghlFetch<{ location: GHLLocation }>(`/locations/${id}`)
  return data.location
}

// ── CONTACTS ──────────────────────────────────────────────────

export async function findContact(
  query: string,
  locationId?: string
): Promise<GHLContact | null> {
  const lid = resolveLocationId(locationId)
  const params = new URLSearchParams({ locationId: lid, query, limit: '1' })
  const data = await ghlFetch<GHLContactSearchResponse>(
    `/contacts/search?${params.toString()}`,
    { locationId: lid }
  )
  return data.contacts?.[0] ?? null
}

export async function createContact(
  payload: Omit<GHLContactCreate, 'locationId'>,
  locationId?: string
): Promise<GHLContact> {
  const lid = resolveLocationId(locationId)
  const data = await ghlFetch<{ contact: GHLContact }>('/contacts/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, locationId: lid }),
    locationId: lid,
  })
  return data.contact
}

export async function findOrCreateContact(
  info: Omit<GHLContactCreate, 'locationId'>,
  locationId?: string
): Promise<GHLContact> {
  const query = info.email ?? info.phone ?? ''
  if (query) {
    const existing = await findContact(query, locationId).catch(() => null)
    if (existing) return existing
  }
  return createContact(info, locationId)
}

export async function getContact(contactId: string, locationId?: string): Promise<GHLContact> {
  const lid = resolveLocationId(locationId)
  const data = await ghlFetch<{ contact: GHLContact }>(
    `/contacts/${contactId}`,
    { locationId: lid }
  )
  return data.contact
}

// ── CONVERSATIONS ─────────────────────────────────────────────

export async function findConversationByContact(
  contactId: string,
  locationId?: string
): Promise<GHLConversation | null> {
  const lid = resolveLocationId(locationId)
  const params = new URLSearchParams({ locationId: lid, contactId, limit: '1' })
  const data = await ghlFetch<GHLSearchConversationsResponse>(
    `/conversations/search?${params.toString()}`,
    { locationId: lid }
  )
  return data.conversations?.[0] ?? null
}

export async function createConversation(
  payload: Omit<GHLConversationCreate, 'locationId'>,
  locationId?: string
): Promise<GHLConversation> {
  const lid = resolveLocationId(locationId)
  const data = await ghlFetch<{ conversation: GHLConversation }>('/conversations/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, locationId: lid }),
    locationId: lid,
  })
  return data.conversation
}

export async function findOrCreateConversation(
  contactId: string,
  locationId?: string
): Promise<GHLConversation> {
  const existing = await findConversationByContact(contactId, locationId).catch(() => null)
  if (existing) return existing
  return createConversation({ contactId }, locationId)
}

// ── MESSAGES ──────────────────────────────────────────────────

export async function sendMessage(
  payload: GHLSendMessagePayload,
  locationId?: string
): Promise<{ messageId: string }> {
  const lid = resolveLocationId(locationId)
  const data = await ghlFetch<{ messageId: string }>('/conversations/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
    locationId: lid,
  })
  return data
}

export async function getMessages(
  conversationId: string,
  limit = 10,
  locationId?: string
): Promise<GHLMessage[]> {
  const lid = resolveLocationId(locationId)
  const params = new URLSearchParams({ limit: String(limit) })
  const data = await ghlFetch<GHLMessagesResponse>(
    `/conversations/${conversationId}/messages?${params.toString()}`,
    { locationId: lid }
  )
  return data.messages?.messages ?? []
}

// ── CONVERSATION AI (Bots) ────────────────────────────────────

export async function listBots(locationId?: string): Promise<GHLBot[]> {
  const lid = resolveLocationId(locationId)
  const data = await ghlFetch<GHLBotsResponse>(
    `/locations/${lid}/bots`,
    { locationId: lid }
  )
  return data.bots ?? []
}

/**
 * Conversation AI Public API — obtient une réponse directe du bot.
 * Version: 2021-04-15 (Conversation AI endpoint).
 * Retourne null si l'agentId n'est pas configuré ou si l'API échoue.
 */
export async function getAIResponse(
  payload: GHLAIResponsePayload
): Promise<GHLAIResponseResult | null> {
  try {
    const result = await ghlFetch<GHLAIResponseResult>('/conversations/ai-responses', {
      method: 'POST',
      version: AI_API_VERSION,
      body: JSON.stringify(payload),
      locationId: payload.locationId,
    })
    return result
  } catch {
    return null
  }
}

// ── POLLING fallback ──────────────────────────────────────────

export async function waitForBotReply(
  conversationId: string,
  afterTimestamp: number,
  maxWaitMs = 8000,
  intervalMs = 800,
  locationId?: string
): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    await sleep(intervalMs)
    const messages = await getMessages(conversationId, 5, locationId).catch(() => [])
    const botReply = messages.find(
      (m) =>
        m.direction === 'outbound' &&
        new Date(m.dateAdded ?? 0).getTime() > afterTimestamp
    )
    if (botReply?.body) return botReply.body
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
