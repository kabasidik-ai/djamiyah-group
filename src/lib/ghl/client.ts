// ============================================================
// GHL API Client — Groupe Djamiyah
// Utilise l'API GHL v2 (services.leadconnectorhq.com)
// ============================================================

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
} from './types'

const GHL_BASE_URL = 'https://services.leadconnectorhq.com'
const LOCATION_ID = process.env.GHL_LOCATION_ID ?? 'a5wcdv6hapHNnLA9xnl4'
const API_VERSION = '2021-07-28'

// ── Fetch helper central ──────────────────────────────────────
async function ghlFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = process.env.GHL_PRIVATE_TOKEN
  if (!token) throw new Error('GHL_PRIVATE_TOKEN manquant')

  const url = `${GHL_BASE_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: API_VERSION,
      ...(options.headers ?? {}),
    },
    signal: options.signal ?? AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown')
    throw new GHLApiError(response.status, path, errorText)
  }

  return response.json() as Promise<T>
}

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

// ── CONTACTS ──────────────────────────────────────────────────

export async function findContact(query: string): Promise<GHLContact | null> {
  const params = new URLSearchParams({ locationId: LOCATION_ID, query, limit: '1' })
  const data = await ghlFetch<GHLContactSearchResponse>(`/contacts/search?${params.toString()}`)
  return data.contacts?.[0] ?? null
}

export async function createContact(
  payload: Omit<GHLContactCreate, 'locationId'>
): Promise<GHLContact> {
  const data = await ghlFetch<{ contact: GHLContact }>('/contacts/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, locationId: LOCATION_ID }),
  })
  return data.contact
}

export async function findOrCreateContact(
  info: Omit<GHLContactCreate, 'locationId'>
): Promise<GHLContact> {
  const query = info.email ?? info.phone ?? ''
  if (query) {
    const existing = await findContact(query).catch(() => null)
    if (existing) return existing
  }
  return createContact(info)
}

export async function getContact(contactId: string): Promise<GHLContact> {
  const data = await ghlFetch<{ contact: GHLContact }>(`/contacts/${contactId}`)
  return data.contact
}

// ── CONVERSATIONS ─────────────────────────────────────────────

export async function findConversationByContact(
  contactId: string
): Promise<GHLConversation | null> {
  const params = new URLSearchParams({ locationId: LOCATION_ID, contactId, limit: '1' })
  const data = await ghlFetch<GHLSearchConversationsResponse>(
    `/conversations/search?${params.toString()}`
  )
  return data.conversations?.[0] ?? null
}

export async function createConversation(
  payload: Omit<GHLConversationCreate, 'locationId'>
): Promise<GHLConversation> {
  const data = await ghlFetch<{ conversation: GHLConversation }>('/conversations/', {
    method: 'POST',
    body: JSON.stringify({ ...payload, locationId: LOCATION_ID }),
  })
  return data.conversation
}

export async function findOrCreateConversation(contactId: string): Promise<GHLConversation> {
  const existing = await findConversationByContact(contactId).catch(() => null)
  if (existing) return existing
  return createConversation({ contactId })
}

// ── MESSAGES ──────────────────────────────────────────────────

export async function sendMessage(payload: GHLSendMessagePayload): Promise<{ messageId: string }> {
  const data = await ghlFetch<{ messageId: string }>('/conversations/messages', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function getMessages(conversationId: string, limit = 10): Promise<GHLMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  const data = await ghlFetch<GHLMessagesResponse>(
    `/conversations/${conversationId}/messages?${params.toString()}`
  )
  return data.messages?.messages ?? []
}

/**
 * Attend la réponse du bot GHL Concierge IA (polling).
 * Retourne le premier message outbound après afterTimestamp.
 * Timeout : 6 secondes max (compatible 3G).
 */
export async function waitForBotReply(
  conversationId: string,
  afterTimestamp: number,
  maxWaitMs = 6000,
  intervalMs = 800
): Promise<string | null> {
  const deadline = Date.now() + maxWaitMs

  while (Date.now() < deadline) {
    await sleep(intervalMs)
    const messages = await getMessages(conversationId, 5).catch(() => [])
    const botReply = messages.find(
      (m) => m.direction === 'outbound' && new Date(m.dateAdded ?? 0).getTime() > afterTimestamp
    )
    if (botReply?.body) return botReply.body
  }

  return null
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
