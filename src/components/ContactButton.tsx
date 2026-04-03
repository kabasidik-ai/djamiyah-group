'use client'
import { MessageCircle } from 'lucide-react'
import { useGHLChat } from '@/hooks/useGHLChat'
// NOTE : ghl.d.ts est une déclaration TypeScript globale, elle ne doit PAS être importée
// Elle est automatiquement chargée par le compilateur via tsconfig "include"

export function ContactButton() {
  const { isGHLReady, isLoading, openChat } = useGHLChat()

  // Couleurs dynamiques selon l'état
  const buttonColor = isGHLReady ? 'bg-[#0D3B3E]' : 'bg-[#25D366]'
  const buttonHoverColor = isGHLReady ? 'hover:bg-[#0a2b2d]' : 'hover:bg-[#20ba5a]'
  const statusColor = isGHLReady ? 'bg-green-500' : 'bg-orange-500'

  return (
    <div
      className="fixed bottom-6 right-6 z-50 group"
      style={{ bottom: 'max(24px, calc(env(safe-area-inset-bottom) + 16px))' }}
    >
      {/* Bouton Contact flottant */}
      <button
        onClick={openChat}
        disabled={isLoading}
        className={`
          relative flex items-center justify-center
          ${buttonColor} ${buttonHoverColor}
          text-white rounded-full shadow-lg hover:shadow-2xl
          transition-all duration-300 ease-out
          min-w-[56px] min-h-[56px] p-4
          active:scale-95 disabled:opacity-60
          ${isGHLReady ? 'animate-pulse-subtle' : ''}
          hover:scale-110
        `}
        title={isGHLReady ? 'Chat en direct - Agent IA Concierge' : 'Contacter sur WhatsApp'}
        aria-label="Contactez-nous"
      >
        {/* Icône MessageCircle (lucide-react) */}
        <MessageCircle className="w-6 h-6 flex-shrink-0" aria-hidden="true" strokeWidth={2} />

        {/* Pastille d'état (vert GHL / orange WhatsApp) */}
        {!isLoading && (
          <span
            className={`
              absolute -top-1 -right-1 w-4 h-4 rounded-full
              ${statusColor} border-2 border-white
              ${isGHLReady ? 'animate-pulse' : ''}
            `}
            aria-hidden="true"
          />
        )}

        {/* Texte visible au hover (desktop only) */}
        <span className="hidden lg:group-hover:inline ml-2 text-sm font-semibold whitespace-nowrap pr-1 animate-fade-in">
          {isGHLReady ? 'Chat IA' : 'WhatsApp'}
        </span>
      </button>

      {/* Tooltip informatif */}
      <div
        className="
          absolute bottom-20 right-0
          bg-gray-900/95 backdrop-blur-sm text-white text-xs
          rounded-lg px-3 py-2
          pointer-events-none opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          whitespace-nowrap font-medium shadow-xl
        "
        role="tooltip"
      >
        {isGHLReady
          ? '💬 Agent IA Concierge - Réponse instantanée'
          : '📱 Contactez-nous par WhatsApp'}
      </div>
    </div>
  )
}
