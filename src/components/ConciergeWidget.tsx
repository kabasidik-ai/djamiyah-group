'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================
// CONFIGURATION — Groupe Djamiyah / Maison Blanche de Coyah
// ============================================================
const GHL_AGENT_ID = process.env.NEXT_PUBLIC_GHL_CONVERSATION_AI_AGENT_ID || 'ryIJEDRGuVTfu5x6uHVE';
const GHL_LOCATION_ID = process.env.NEXT_PUBLIC_GHL_LOCATION_ID || 'a5wcdv6hapHNnLA9xnl4';

// ============================================================
// AVATAR SVG — Salematou, réceptionniste Djamiyah
// Portrait professionnel africain, fond marine, accents or
// ============================================================
const SalematouAvatarSVG = () => (
  <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
    {/* Fond marine */}
    <circle cx="100" cy="100" r="100" fill="#1a2a4a"/>
    {/* Uniforme professionnel */}
    <ellipse cx="100" cy="175" rx="55" ry="40" fill="#C8A84B"/>
    <rect x="70" y="135" width="60" height="45" rx="8" fill="#1a3a6a"/>
    {/* Cou */}
    <rect x="88" y="118" width="24" height="22" rx="4" fill="#8B6347"/>
    {/* Visage */}
    <ellipse cx="100" cy="105" rx="34" ry="38" fill="#8B6347"/>
    {/* Cheveux */}
    <ellipse cx="100" cy="74" rx="34" ry="22" fill="#1a0a00"/>
    <rect x="66" y="74" width="10" height="28" rx="5" fill="#1a0a00"/>
    <rect x="124" y="74" width="10" height="28" rx="5" fill="#1a0a00"/>
    {/* Yeux */}
    <ellipse cx="88" cy="102" rx="6" ry="7" fill="#fff"/>
    <ellipse cx="112" cy="102" rx="6" ry="7" fill="#fff"/>
    <ellipse cx="89" cy="103" rx="4" ry="5" fill="#3a2010"/>
    <ellipse cx="113" cy="103" rx="4" ry="5" fill="#3a2010"/>
    <circle cx="90" cy="101" r="1.5" fill="#fff"/>
    <circle cx="114" cy="101" r="1.5" fill="#fff"/>
    {/* Sourcils */}
    <path d="M82 94 Q88 91 94 94" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <path d="M106 94 Q112 91 118 94" stroke="#1a0a00" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    {/* Nez */}
    <ellipse cx="100" cy="112" rx="5" ry="4" fill="#7a5438"/>
    {/* Sourire */}
    <path d="M88 120 Q100 130 112 120" stroke="#5a3020" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M90 121 Q100 128 110 121" fill="#c07060" opacity="0.6"/>
    {/* Col chemisier blanc */}
    <path d="M80 138 L100 148 L120 138 L115 135 L100 143 L85 135Z" fill="#fff"/>
    {/* Badge or */}
    <rect x="105" y="148" width="18" height="10" rx="2" fill="#C8A84B"/>
    <text x="114" y="156" textAnchor="middle" fontSize="4" fill="#1a2a4a" fontFamily="Arial" fontWeight="bold">DJ</text>
  </svg>
);

// ============================================================
// TYPES
// ============================================================
interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface ConciergeWidgetProps {
  /** Remplacer le SVG par défaut par une URL d'image (Supabase, CDN...) */
  avatarUrl?: string;
  /** Position du widget */
  position?: 'bottom-right' | 'bottom-left';
  /** Message d'accueil personnalisé */
  welcomeMessage?: string;
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function ConciergeWidget({
  avatarUrl,
  position = 'bottom-right',
  welcomeMessage = 'Bonjour ! Je suis Salematou, votre concierge virtuelle. Comment puis-je vous aider pour votre séjour ou événement à La Maison Blanche ?',
}: ConciergeWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contactId, setContactId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Message d'accueil initial
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        content: welcomeMessage,
        timestamp: new Date(),
      }]);
    }
  }, [isOpen, messages.length, welcomeMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const typingMsg: Message = {
      id: 'typing',
      role: 'bot',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Appel à l'API route Next.js (proxy sécurisé vers GHL)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          agentId: GHL_AGENT_ID,
          locationId: GHL_LOCATION_ID,
          contactId,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();

      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          role: 'bot',
          content: data.reply || "Je n'ai pas pu traiter votre demande. Veuillez réessayer.",
          timestamp: new Date(),
        }];
      });

      if (data.contactId) setContactId(data.contactId);

    } catch {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        return [...withoutTyping, {
          id: Date.now().toString(),
          role: 'bot',
          content: 'Une erreur est survenue. Veuillez nous contacter directement au +224 xxx xxx xxx.',
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, contactId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const positionClass = position === 'bottom-right'
    ? 'right-4 md:right-6'
    : 'left-4 md:left-6';

  return (
    <>
      {/* ── Bulle bouton flottant ── */}
      <div className={`fixed bottom-4 md:bottom-6 ${positionClass} z-50`}>

        {/* Badge non-lu */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse z-10">
            1
          </span>
        )}

        <button
          onClick={() => setIsOpen(o => !o)}
          className="w-14 h-14 rounded-full shadow-2xl overflow-hidden border-2 border-amber-400 hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
          aria-label="Ouvrir le chat Salematou"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Salematou" className="w-full h-full object-cover" />
          ) : (
            <SalematouAvatarSVG />
          )}
        </button>
      </div>

      {/* ── Fenêtre de chat ── */}
      {isOpen && (
        <div
          className={`fixed bottom-24 md:bottom-28 ${positionClass} z-50 w-[340px] md:w-[380px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100`}
          style={{ maxHeight: '520px', height: '520px' }}
        >
          {/* En-tête */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#1a2a4a] to-[#1a3a6a]">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Salematou" className="w-full h-full object-cover" />
              ) : (
                <SalematouAvatarSVG />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">Salematou</p>
              <p className="text-amber-300 text-xs">Concierge · Maison Blanche</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-green-400 text-xs">En ligne</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white ml-2 flex-shrink-0 transition-colors"
              aria-label="Fermer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mt-1">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Bot" className="w-full h-full object-cover" />
                    ) : (
                      <SalematouAvatarSVG />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1a3a6a] text-white rounded-br-sm'
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {msg.isTyping ? (
                    <div className="flex gap-1 items-center py-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length <= 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar">
              {['Tarifs séjour', 'Séminaire', 'Disponibilités', 'Réserver'].map(s => (
                <button
                  key={s}
                  onClick={() => { setInputValue(s); inputRef.current?.focus(); }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-amber-300 text-[#1a2a4a] rounded-full hover:bg-amber-50 transition-colors font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              disabled={isLoading}
              className="flex-1 text-sm px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 bg-gray-50"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
              className="w-9 h-9 rounded-full bg-[#1a3a6a] text-white flex items-center justify-center hover:bg-[#C8A84B] transition-colors disabled:opacity-40 flex-shrink-0"
              aria-label="Envoyer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>

          {/* Footer branding */}
          <div className="text-center py-1.5 bg-white border-t border-gray-50">
            <span className="text-[10px] text-gray-400">Powered by </span>
            <span className="text-[10px] text-[#C8A84B] font-semibold">Groupe Djamiyah</span>
          </div>
        </div>
      )}
    </>
  );
}
