// ============================================================
// GHL Types — Groupe Djamiyah — TypeScript strict
// ============================================================

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

export interface GHLConversation {
  id: string
  contactId: string
  locationId: string
  lastMessageBody?: string
  lastMessageDate?: string
  type:
    | 'TYPE_PHONE'
    | 'TYPE_EMAIL'
    | 'TYPE_FACEBOOK'
    | 'TYPE_INSTAGRAM'
    | 'TYPE_LIVE_CHAT'
    | 'TYPE_CUSTOM'
  unreadCount?: number
  fullName?: string
  contactName?: string
}

export interface GHLMessage {
  id: string
  conversationId: string
  contactId?: string
  body: string
  direction: 'inbound' | 'outbound'
  status?: string
  messageType:
    | 'TYPE_CHAT'
    | 'TYPE_SMS'
    | 'TYPE_EMAIL'
    | 'TYPE_FACEBOOK'
    | 'TYPE_INSTAGRAM'
    | 'TYPE_LIVE_CHAT'
  dateAdded?: string
  userId?: string
  source?: string
}

export interface GHLSendMessagePayload {
  type: 'Chat' | 'SMS' | 'Email' | 'Facebook' | 'Instagram' | 'Live_Chat'
  message: string
  conversationId: string
  conversationProviderId?: string
  html?: string
  subject?: string
  emailFrom?: string
  emailTo?: string
}

export interface GHLConversationCreate {
  contactId: string
  locationId: string
}

export interface GHLSearchConversationsResponse {
  conversations: GHLConversation[]
  total: number
}

export interface GHLMessagesResponse {
  messages: {
    messages: GHLMessage[]
    nextPage: boolean
    lastMessageId?: string
  }
}

export interface GHLContactSearchResponse {
  contacts: GHLContact[]
  total: number
  count: number
}

// Webhook payload envoyé par GHL
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

// Réponse du chat (pour le frontend)
export interface ChatResponse {
  success: boolean
  reply: string
  contactId: string
  conversationId: string
  fallback?: boolean
  error?: string
}

export interface ChatRequest {
  message: string
  contactId?: string
  channel?: 'live_chat' | 'facebook' | 'instagram'
  metadata?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
  }
}
