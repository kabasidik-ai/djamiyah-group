// ============================================================
// GHL Types — Groupe Djamiyah — TypeScript strict, zéro `any`
// ============================================================

// ── Contacts ─────────────────────────────────────────────────

export interface GHLContact {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  locationId: string
  source?: string
  tags?: string[]
  customFields?: Array<{ id: string; value: string }>
  createdAt?: string
  updatedAt?: string
}

export interface GHLContactCreate {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  locationId: string
  source?: string
  tags?: string[]
}

export interface GHLContactSearchResponse {
  contacts: GHLContact[]
  total: number
  count: number
}

// ── Conversations ─────────────────────────────────────────────

export type GHLConversationType =
  | 'TYPE_PHONE'
  | 'TYPE_EMAIL'
  | 'TYPE_FACEBOOK'
  | 'TYPE_INSTAGRAM'
  | 'TYPE_LIVE_CHAT'
  | 'TYPE_CUSTOM'

export interface GHLConversation {
  id: string
  contactId: string
  locationId: string
  lastMessageBody?: string
  lastMessageDate?: string
  type: GHLConversationType
  unreadCount?: number
  fullName?: string
  contactName?: string
}

export interface GHLConversationCreate {
  contactId: string
  locationId: string
}

export interface GHLSearchConversationsResponse {
  conversations: GHLConversation[]
  total: number
}

// ── Messages ──────────────────────────────────────────────────

export type GHLMessageType =
  | 'TYPE_CHAT'
  | 'TYPE_SMS'
  | 'TYPE_EMAIL'
  | 'TYPE_FACEBOOK'
  | 'TYPE_INSTAGRAM'
  | 'TYPE_LIVE_CHAT'

export type GHLSendType =
  | 'Chat'
  | 'SMS'
  | 'Email'
  | 'Facebook'
  | 'Instagram'
  | 'Live_Chat'

export interface GHLMessage {
  id: string
  conversationId: string
  contactId?: string
  body: string
  direction: 'inbound' | 'outbound'
  status?: string
  messageType: GHLMessageType
  dateAdded?: string
  userId?: string
  source?: string
}

export interface GHLSendMessagePayload {
  type: GHLSendType
  message: string
  conversationId: string
  conversationProviderId?: string
  html?: string
  subject?: string
  emailFrom?: string
  emailTo?: string
}

export interface GHLMessagesResponse {
  messages: {
    messages: GHLMessage[]
    nextPage: boolean
    lastMessageId?: string
  }
}

// ── Conversation AI (Bots) ────────────────────────────────────

export interface GHLBot {
  id: string
  name: string
  locationId: string
  type?: string
  status?: 'active' | 'inactive'
  model?: string
  createdAt?: string
  updatedAt?: string
}

export interface GHLBotsResponse {
  bots: GHLBot[]
}

export interface GHLAIResponsePayload {
  locationId: string
  conversationId: string
  agentId: string
  message: string
}

export interface GHLAIResponseResult {
  success: boolean
  reply: string
  sessionId?: string
}

// ── Locations ─────────────────────────────────────────────────

export interface GHLLocation {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  country?: string
  phone?: string
  email?: string
  website?: string
  logoUrl?: string
  timezone?: string
}

export interface GHLLocationsResponse {
  locations: GHLLocation[]
}

// ── OAuth ─────────────────────────────────────────────────────

export interface GHLOAuthTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  locationId?: string
  userId?: string
  companyId?: string
}

export interface GHLTokenInfo {
  locationId: string
  accessToken: string
  refreshToken: string
  expiresAt: Date
  scope: string
  tokenType: string
}

// ── Webhook ───────────────────────────────────────────────────

export interface GHLWebhookPayload {
  type: string
  locationId: string
  id: string
  contactId?: string
  conversationId?: string
  messageId?: string
  message?: string
  direction?: string
  dateAdded?: string
  attachments?: string[]
  contentType?: string
  userId?: string
  phone?: string
  email?: string
}

// ── Chat (frontend ↔ API) ─────────────────────────────────────

export interface ChatRequest {
  message: string
  contactId?: string
  conversationId?: string
  channel?: 'live_chat' | 'facebook' | 'instagram'
  metadata?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}

export interface ChatResponse {
  success: boolean
  reply: string
  contactId: string
  conversationId: string
  sessionId?: string
  fallback?: boolean
  error?: string
}

// ── Config Avatar ─────────────────────────────────────────────

export interface AvatarConfig {
  url: string
  alt: string
  updatedAt: string
}
