'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { ChatRequest, ChatResponse, AvatarConfig } from '@/lib/ghl/types'

// ─── Avatar SVG par défaut (placeholder jusqu'à la vraie photo) ───────────────

const DefaultAvatarSVG = () => (
  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="50" cy="50" r="50" fill="#1a1a2e" />
    <circle cx="50" cy="38" r="18" fill="#f5c6a0" />
    <ellipse cx="50" cy="42" rx="14" ry="12" fill="#f5c6a0" />
    <path d="M30 38 Q32 18 50 16 Q68 18 70 38 Q66 22 50 20 Q34 22 30 38Z" fill="#2d1b00" />
    <path d="M28 42 Q26 28 50 22 Q74 28 72 42" fill="#3d2400" />
    <path d="M32 56 Q36 72 50 76 Q64 72 68 56 Q58 68 50 68 Q42 68 32 56Z" fill="#f5c6a0" />
    <ellipse cx="50" cy="80" rx="24" ry="12" fill="#c9973a" />
    <path d="M26 88 Q30 78 50 80 Q70 78 74 88" fill="#b8832a" />
    <circle cx="42" cy="39" r="2.5" fill="#4a2c0a" />
    <circle cx="58" cy="39" r="2.5" fill="#4a2c0a" />
    <path d="M44 48 Q50 52 56 48" stroke="#b56" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <circle cx="50" cy="50" r="49" fill="none" stroke="#c9973a" strokeWidth="1" opacity="0.5" />
  </svg>
)

// ─── Icônes ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 1L17 17M17 1L1 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M2 10L18 2L10 18L9 11L2 10Z" fill="currentColor" />
  </svg>
)

// ─── Types locaux ──────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

// ─── Composant Avatar (photo ou SVG par défaut) ────────────────────────────────

function Avatar({
  url,
  alt,
  size = 48,
}: {
  url: string
  alt: string
  size?: number
}) {
  const [error, setError] = useState(false)

  if (!url || error) {
    return <DefaultAvatarSVG />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      width={size}
      height={size}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setError(true)}
    />
  )
}

// ─── Composant principal ────────────────────────────────────────────────────────

export function ConciergeWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [avatar, setAvatar] = useState<AvatarConfig>({
    url: '',
    alt: 'Salematou — Concierge Groupe Djamiyah',
    updatedAt: new Date().toISOString(),
  })
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Bonjour ! Je suis Salematou, votre concierge au Groupe Djamiyah. Comment puis-je vous aider ? 🌟",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contactId, setContactId] = useState<string | undefined>()
  const [conversationId, setConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Chargement de l'avatar depuis l'API (sans modification de code)
  useEffect(() => {
    void fetch('/api/config/avatar')
      .then((r) => r.json() as Promise<{ success: boolean; avatar: AvatarConfig }>)
      .then(({ avatar: a }) => {
        if (a?.url) setAvatar(a)
      })
      .catch(() => {
        // Avatar SVG par défaut déjà en place
      })
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages, scrollToBottom])

  // Envoi du message à /api/chat (Conversation AI → polling)
  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const payload: ChatRequest = {
        message: text,
        contactId,
        conversationId,
        channel: 'live_chat',
        metadata: {},
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as ChatResponse

      // Persistance des IDs pour le fil de conversation
      if (data.contactId) setContactId(data.contactId)
      if (data.conversationId) setConversationId(data.conversationId)

      if (!data.success && !data.reply) {
        throw new Error(data.error ?? 'Erreur inconnue')
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            'Je suis momentanément indisponible. Contactez-nous directement — nous vous répondrons très rapidement.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, contactId, conversationId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage()
    }
  }

  return (
    <>
      {/* ── Panneau de chat ─────────────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 z-50 flex flex-col"
          style={{
            width: 'min(380px, calc(100vw - 2rem))',
            height: 'min(560px, calc(100vh - 8rem))',
            boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            borderRadius: '1.25rem',
            overflow: 'hidden',
            background: '#fff',
          }}
        >
          {/* En-tête */}
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', border: '2.5px solid #c9973a', flexShrink: 0 }}>
              <Avatar url={avatar.url} alt={avatar.alt} size={48} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Salematou</div>
              <div style={{ color: '#c9973a', fontSize: '0.75rem', fontWeight: 500 }}>Concierge • Groupe Djamiyah</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <span style={{ color: '#a0aec0', fontSize: '0.7rem' }}>En ligne</span>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Fermer" style={{ color: '#a0aec0', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <CloseIcon />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', background: '#f8f9fc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid #c9973a' }}>
                    <Avatar url={avatar.url} alt={avatar.alt} size={28} />
                  </div>
                )}
                <div style={{ maxWidth: '75%', padding: '0.625rem 0.875rem', borderRadius: msg.role === 'user' ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem', background: msg.role === 'user' ? 'linear-gradient(135deg, #1a1a2e, #0f3460)' : '#ffffff', color: msg.role === 'user' ? '#fff' : '#1a202c', fontSize: '0.875rem', lineHeight: 1.5, boxShadow: msg.role === 'user' ? '0 2px 8px rgba(15,52,96,0.3)' : '0 2px 8px rgba(0,0,0,0.08)' }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', border: '1.5px solid #c9973a' }}>
                  <Avatar url={avatar.url} alt={avatar.alt} size={28} />
                </div>
                <div style={{ background: '#fff', borderRadius: '1rem 1rem 1rem 0.25rem', padding: '0.75rem 1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: '0.3rem' }}>
                  {([0, 1, 2] as const).map((i) => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#c9973a', display: 'inline-block', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Zone de saisie */}
          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid #e2e8f0', background: '#fff', display: 'flex', gap: '0.625rem', alignItems: 'center', flexShrink: 0 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message..."
              disabled={isLoading}
              style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0', borderRadius: '2rem', fontSize: '0.875rem', outline: 'none', background: '#f8f9fc', color: '#1a202c', transition: 'border-color 0.2s' }}
              onFocus={(e) => { e.target.style.borderColor = '#c9973a' }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0' }}
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Envoyer"
              style={{ width: 42, height: 42, borderRadius: '50%', background: !input.trim() || isLoading ? '#e2e8f0' : 'linear-gradient(135deg, #c9973a, #e8b84b)', border: 'none', cursor: !input.trim() || isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: !input.trim() || isLoading ? '#a0aec0' : '#fff', flexShrink: 0, transition: 'background 0.2s', boxShadow: !input.trim() || isLoading ? 'none' : '0 3px 10px rgba(201,151,58,0.4)' }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* ── Bouton flottant ─────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        aria-label={isOpen ? 'Fermer le chat' : 'Parler à Salematou'}
        style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', width: 64, height: 64, borderRadius: '50%', border: '3px solid #c9973a', background: '#1a1a2e', cursor: 'pointer', zIndex: 50, overflow: 'hidden', boxShadow: '0 6px 24px rgba(0,0,0,0.4), 0 0 0 4px rgba(201,151,58,0.2)', transition: 'transform 0.3s ease, box-shadow 0.3s ease', padding: 0 }}
        onMouseEnter={(e) => { const b = e.currentTarget; b.style.transform = 'scale(1.08)'; b.style.boxShadow = '0 8px 32px rgba(0,0,0,0.5), 0 0 0 6px rgba(201,151,58,0.3)' }}
        onMouseLeave={(e) => { const b = e.currentTarget; b.style.transform = 'scale(1)'; b.style.boxShadow = '0 6px 24px rgba(0,0,0,0.4), 0 0 0 4px rgba(201,151,58,0.2)' }}
      >
        <Avatar url={avatar.url} alt={avatar.alt} size={64} />
      </button>

      <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)} }`}</style>
    </>
  )
}
