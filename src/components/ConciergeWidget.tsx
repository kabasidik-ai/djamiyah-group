'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ============================================================
// CONFIGURATION — Groupe Djamiyah / Maison Blanche de Coyah
// ============================================================
// Location ID : a5wcdv6hapHNnLA9xnl4
// Knowledge Base ID : LHkyfNrjcvoKktQrLGZU  (configuré côté GHL agent)
// Chat Widget GHL  : 69d1e67a34c0446b134002e2
// Client App ID    : 69d037aab560ab3c98ea5ccd
// Lien de réservation vers la page locale du site web
const RESERVATION_URL = '/fr/reservation'

// Avatar — deux niveaux de fallback
const AVATAR_PRIMARY = '/images/receptionniste-avatar.webp'
const AVATAR_FALLBACK = '/images/corporate/receptionniste-avatar.webp'

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string
  role: 'user' | 'bot'
  content: string
  timestamp: Date
  isTyping?: boolean
  showReservationCTA?: boolean
}

interface ConciergeWidgetProps {
  /** URL de l'avatar (par défaut: receptionniste-avatar.webp) */
  avatarUrl?: string
  /** Position du widget */
  position?: 'bottom-right' | 'bottom-left'
  /** Message d'accueil personnalisé */
  welcomeMessage?: string
}

// Étapes du widget : bouton flottant → formulaire lead → chat
type WidgetStep = 'closed' | 'lead-form' | 'chat'

// Mots-clés déclenchant le CTA de réservation
const RESERVATION_KEYWORDS =
  /réserv|booking|chambre|suite|dispon|tarif|prix|nuit|séjour|check.in|arrivée/i

// Mots-clés déclenchant la suggestion du code promo FLASH
const BOOKING_KEYWORDS = ['réserver', 'chambre', 'disponible', 'prix', 'booking', 'nuit']

// Message de suggestion promo FLASH
const FLASH_PROMO_MESSAGE = 'Profitez de 10% de réduction avec le code FLASH.'

const PROMO_DELAY_MS = 2300

function sanitizeBotReply(text: string): string {
  return text
    .replace(/employee\s*action\s*log\s*created/gi, '')
    .replace(/\uFFFD|�|��/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function toConciseReply(text: string): string {
  const cleaned = sanitizeBotReply(text)
  if (!cleaned) {
    return 'Parfait, votre demande est prise en compte. Vous pouvez finaliser votre réservation directement en ligne.'
  }

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (sentences.length === 0) {
    return 'Parfait, votre demande est prise en compte. Vous pouvez finaliser votre réservation directement en ligne.'
  }

  return sentences.slice(0, 2).join(' ')
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ConciergeWidget({
  avatarUrl,
  position = 'bottom-right',
  welcomeMessage,
}: ConciergeWidgetProps) {
  const [step, setStep] = useState<WidgetStep>('closed')

  // Formulaire lead capture
  const [visitorName, setVisitorName] = useState('')
  const [visitorEmail, setVisitorEmail] = useState('')
  const [formError, setFormError] = useState('')

  // Chat
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [contactId, setContactId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const promoSuggested = useRef(false)
  const promoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const effectiveAvatar = avatarUrl?.trim() || AVATAR_PRIMARY

  const positionClass = position === 'bottom-right' ? 'right-4 md:right-6' : 'left-4 md:left-6'

  // ── Auto-scroll ────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus input à l'ouverture du chat ──────────────────────
  useEffect(() => {
    if (step === 'chat') {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [step])

  useEffect(() => {
    return () => {
      if (promoTimeoutRef.current) {
        clearTimeout(promoTimeoutRef.current)
      }
    }
  }, [])

  // ── Message d'accueil personnalisé avec le prénom ──────────
  useEffect(() => {
    if (step === 'chat' && messages.length === 0) {
      const greeting = visitorName.trim()
        ? `Bonjour ${visitorName.trim()} ! Je suis Salematou. Comment puis-je vous aider aujourd’hui ?`
        : welcomeMessage || 'Bonjour ! Je suis Salematou. Comment puis-je vous aider aujourd’hui ?'

      setMessages([
        {
          id: 'welcome',
          role: 'bot',
          content: greeting,
          timestamp: new Date(),
        },
      ])
    }
  }, [step, messages.length, welcomeMessage, visitorName])

  // ── Ouverture du widget ────────────────────────────────────
  const handleToggle = () => {
    if (step === 'closed') {
      setStep('lead-form')
    } else {
      setStep('closed')
    }
  }

  // ── Soumission formulaire lead ─────────────────────────────
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = visitorName.trim()
    const email = visitorEmail.trim()

    if (!name) {
      setFormError('Veuillez entrer votre prénom.')
      return
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Veuillez entrer un email valide.')
      return
    }
    setFormError('')
    setStep('chat')
  }

  // ── Envoi de message ───────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    const typingMsg: Message = {
      id: 'typing',
      role: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }

    setMessages((prev) => [...prev, userMsg, typingMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          contactId,
          visitorName: visitorName.trim() || undefined,
          visitorEmail: visitorEmail.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { reply?: string; contactId?: string }

      if (data.contactId) setContactId(data.contactId)

      const rawReply = data.reply || "Je n'ai pas pu traiter votre demande. Veuillez réessayer."
      const reply = toConciseReply(rawReply)

      // Déclencher le CTA de réservation si la question porte sur un séjour
      const showCTA = RESERVATION_KEYWORDS.test(text)

      const shouldSuggestPromo =
        !promoSuggested.current && BOOKING_KEYWORDS.some((kw) => text.toLowerCase().includes(kw))

      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== 'typing')
        return [
          ...withoutTyping,
          {
            id: `bot-${Date.now()}`,
            role: 'bot',
            content: reply,
            timestamp: new Date(),
            showReservationCTA: showCTA,
          },
        ]
      })

      if (shouldSuggestPromo) {
        promoSuggested.current = true
        if (promoTimeoutRef.current) {
          clearTimeout(promoTimeoutRef.current)
        }
        promoTimeoutRef.current = setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `promo-${Date.now()}`,
              role: 'bot',
              content: FLASH_PROMO_MESSAGE,
              timestamp: new Date(),
            },
          ])
        }, PROMO_DELAY_MS)
      }
    } catch {
      setMessages((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== 'typing')
        return [
          ...withoutTyping,
          {
            id: `err-${Date.now()}`,
            role: 'bot',
            content: 'Une erreur est survenue. Contactez-nous directement au +224 xxx xxx xxx.',
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, contactId, visitorName, visitorEmail])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Composant avatar réutilisable ──────────────────────────
  const AvatarImg = ({ size }: { size: 'sm' | 'md' | 'lg' }) => {
    const cls = size === 'sm' ? 'w-7 h-7' : size === 'md' ? 'w-10 h-10' : 'w-12 h-12'
    return (
      <img
        src={effectiveAvatar}
        alt="Salematou"
        className={`${cls} rounded-full object-cover`}
        onError={(e) => {
          const t = e.currentTarget
          if (!t.src.endsWith(AVATAR_FALLBACK)) t.src = AVATAR_FALLBACK
        }}
      />
    )
  }

  // ── Header réutilisable ────────────────────────────────────
  const ChatHeader = ({ onClose }: { onClose: () => void }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1a2a4a] to-[#1a3a6a] flex-shrink-0">
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
        <AvatarImg size="lg" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">Salematou</p>
        <p className="text-amber-300 text-xs">Réceptionniste · Groupe Djamiyah</p>
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-green-400 text-xs">En ligne</span>
      </div>
      <button
        onClick={onClose}
        className="text-white/60 hover:text-white ml-2 flex-shrink-0 transition-colors"
        aria-label="Fermer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )

  return (
    <>
      {/* ──────────────────────────────────────────────────────
          BOUTON FLOTTANT
      ────────────────────────────────────────────────────── */}
      <div className={`fixed bottom-6 md:bottom-6 ${positionClass} z-50`}>
        {step === 'closed' && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse z-10">
            1
          </span>
        )}
        <button
          onClick={handleToggle}
          className="w-16 h-16 rounded-full shadow-2xl overflow-hidden border-2 border-amber-400 hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          aria-label={step === 'closed' ? 'Ouvrir le chat Réceptionniste' : 'Fermer le chat'}
        >
          <img
            src={effectiveAvatar}
            alt="Salematou"
            className="w-full h-full object-cover"
            onError={(e) => {
              const t = e.currentTarget
              if (!t.src.endsWith(AVATAR_FALLBACK)) t.src = AVATAR_FALLBACK
            }}
          />
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────
          FORMULAIRE LEAD CAPTURE
          (Bot Goal : capturer nom + email avant de chatter)
      ────────────────────────────────────────────────────── */}
      {step === 'lead-form' && (
        <div
          className={`fixed bottom-24 md:bottom-28 ${positionClass} z-50 w-[320px] md:w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100`}
        >
          <ChatHeader onClose={() => setStep('closed')} />

          <form onSubmit={handleFormSubmit} className="px-5 py-5 space-y-4">
            <p className="text-[#1a2a4a] text-sm font-medium leading-snug">
              Bonjour ! Pour vous offrir un service de réception personnalisé, pourriez-vous vous
              présenter ?
            </p>

            <div>
              <label htmlFor="cw-name" className="block text-xs font-semibold text-gray-600 mb-1">
                Prénom *
              </label>
              <input
                id="cw-name"
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    emailInputRef.current?.focus()
                  }
                }}
                placeholder="Votre prénom"
                autoFocus
                autoComplete="given-name"
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-gray-50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="cw-email" className="block text-xs font-semibold text-gray-600 mb-1">
                Email *
              </label>
              <input
                id="cw-email"
                ref={emailInputRef}
                type="email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                placeholder="votre@email.com"
                autoComplete="email"
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 bg-gray-50 transition-colors"
              />
            </div>

            {formError && <p className="text-red-500 text-xs font-medium">{formError}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-[#1a3a6a] text-white rounded-xl font-semibold text-sm hover:bg-[#C8A84B] hover:text-[#1a2a4a] transition-colors"
            >
              Commencer la conversation →
            </button>

            <p className="text-center text-[10px] text-gray-400 leading-relaxed">
              Vos données sont utilisées uniquement pour personnaliser votre expérience. Aucun
              démarchage.
            </p>
          </form>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          FENÊTRE DE CHAT
      ────────────────────────────────────────────────────── */}
      {step === 'chat' && (
        <div
          className={`fixed bottom-24 md:bottom-28 ${positionClass} z-50 w-[340px] md:w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100`}
          style={{ maxHeight: '540px', height: '540px' }}
        >
          <ChatHeader onClose={() => setStep('closed')} />

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}
              >
                {msg.role === 'bot' && (
                  <div className="flex-shrink-0 mt-1">
                    <AvatarImg size="sm" />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 max-w-[75%]">
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-[#1a3a6a] text-white rounded-br-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.isTyping ? (
                      <div className="flex gap-1 items-center py-1">
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* CTA réservation */}
                  {msg.showReservationCTA && msg.role === 'bot' && !msg.isTyping && (
                    <a
                      href={RESERVATION_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#C8A84B] text-[#1a2a4a] text-xs font-bold rounded-xl hover:bg-amber-400 transition-colors w-fit shadow-sm"
                    >
                      Réserver ma chambre
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0">
              {['Tarifs séjour', 'Salle conférence', 'Restaurant', 'Réserver'].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInputValue(s)
                    inputRef.current?.focus()
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-amber-300 text-[#1a2a4a] rounded-full hover:bg-amber-50 transition-colors font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Saisie */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              disabled={isLoading}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 bg-gray-50 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 rounded-full bg-[#1a3a6a] text-white flex items-center justify-center hover:bg-[#C8A84B] transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Envoyer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>

          {/* Branding */}
          <div className="text-center py-1.5 bg-white border-t border-gray-50 flex-shrink-0">
            <span className="text-[10px] text-gray-400">Powered by </span>
            <span className="text-[10px] text-[#C8A84B] font-semibold">Groupe Djamiyah</span>
          </div>
        </div>
      )}
    </>
  )
}
